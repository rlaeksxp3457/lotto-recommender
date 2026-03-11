const fs = require("fs");
const path = require("path");
const { Worker } = require("worker_threads");
const { app, dialog } = require("electron");
const { getRecords, LottoStats, getRecommendations, getTop5, getNeverDrawn, getRecentRecords, EMBEDDED_DATA, getAlgoNames } = require("./analyzer");
const EMBEDDED_PRIZE = require("./prize_data");

let stats = null;
let extraData = [];

// ── 백테스트 캐시 ──
let cachedLottoBacktest = null;
let cachedPensionBacktest = null;

const UPDATES_PATH = path.join(app.getPath("userData"), "updates.json");
const PRIZE_PATH = path.join(app.getPath("userData"), "prize_data.json");

function loadUpdates() {
  try {
    if (fs.existsSync(UPDATES_PATH)) {
      return JSON.parse(fs.readFileSync(UPDATES_PATH, "utf-8"));
    }
  } catch { /* ignore */ }
  return [];
}

function saveUpdates(data) {
  fs.mkdirSync(path.dirname(UPDATES_PATH), { recursive: true });
  fs.writeFileSync(UPDATES_PATH, JSON.stringify(data), "utf-8");
}

function loadPrizeData() {
  try {
    if (fs.existsSync(PRIZE_PATH)) {
      return { data: JSON.parse(fs.readFileSync(PRIZE_PATH, "utf-8")), source: "local", path: PRIZE_PATH };
    }
  } catch { /* ignore */ }
  // 로컬 파일 없으면 임베디드 데이터 반환
  return { data: { ...EMBEDDED_PRIZE }, source: "embedded", path: null };
}

function savePrizeData(data) {
  fs.mkdirSync(path.dirname(PRIZE_PATH), { recursive: true });
  fs.writeFileSync(PRIZE_PATH, JSON.stringify(data), "utf-8");
}

function parsePrizeItem(item) {
  return {
    prizes: [
      { rank: 1, amount: item.rnk1WnAmt, winners: item.rnk1WnNope, totalAmount: item.rnk1SumWnAmt },
      { rank: 2, amount: item.rnk2WnAmt, winners: item.rnk2WnNope, totalAmount: item.rnk2SumWnAmt },
      { rank: 3, amount: item.rnk3WnAmt, winners: item.rnk3WnNope, totalAmount: item.rnk3SumWnAmt },
      { rank: 4, amount: item.rnk4WnAmt, winners: item.rnk4WnNope, totalAmount: item.rnk4SumWnAmt },
      { rank: 5, amount: item.rnk5WnAmt, winners: item.rnk5WnNope, totalAmount: item.rnk5SumWnAmt },
    ],
    totalSales: item.wholEpsdSumNtslAmt,
    totalWinners: item.sumWnNope,
    winTypes: { auto: item.winType1 || 0, semiAuto: item.winType2 || 0, manual: item.winType3 || 0 },
  };
}

async function fetchPrizeInfo(round) {
  try {
    const url = `https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do?srchDir=center&srchLtEpsd=${round}`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    const text = await resp.text();
    if (text.includes("<!DOCTYPE") || text.includes("<html")) return {};
    const json = JSON.parse(text);
    const list = (json.data && json.data.list) ? json.data.list : [];
    const prizeMap = {};
    for (const item of list) {
      prizeMap[item.ltEpsd] = parsePrizeItem(item);
    }
    return prizeMap;
  } catch { return {}; }
}

function deduplicateExtra(extra) {
  const seen = new Set();
  const unique = extra.filter(r => {
    if (seen.has(r[0])) return false;
    seen.add(r[0]);
    return true;
  });
  const embeddedRounds = new Set(EMBEDDED_DATA.map(r => r[0]));
  return unique.filter(r => !embeddedRounds.has(r[0]));
}

function rebuildStats() {
  const records = getRecords(extraData);
  stats = new LottoStats(records);
  return stats.getSummary();
}

function setupIpc(ipcMain, getWindow) {
  ipcMain.handle("init-data", async () => {
    try {
      extraData = loadUpdates();
      const summary = rebuildStats();
      return { summary };
    } catch (e) {
      return { error: `데이터 초기화 실패: ${e.message}` };
    }
  });

  ipcMain.handle("get-recommendations", async (_event, count, selectedAlgos) => {
    if (!stats) return { error: "데이터가 로드되지 않았습니다." };
    try {
      return { recommendations: getRecommendations(stats, count || 1, selectedAlgos || null) };
    } catch (e) {
      return { error: `추천 생성 실패: ${e.message}` };
    }
  });

  ipcMain.handle("get-algo-names", async () => {
    return { lotto: getAlgoNames() };
  });

  ipcMain.handle("get-top5", async () => {
    if (!stats) return { error: "데이터가 로드되지 않았습니다." };
    try {
      return { games: getTop5(stats) };
    } catch (e) {
      return { error: `TOP 5 생성 실패: ${e.message}` };
    }
  });

  ipcMain.handle("get-never-drawn", async (_event, count) => {
    if (!stats) return { error: "데이터가 로드되지 않았습니다." };
    try {
      return { combinations: getNeverDrawn(stats, count || 5) };
    } catch (e) {
      return { error: `미출현 조합 추출 실패: ${e.message}` };
    }
  });

  ipcMain.handle("get-history", async (_event, count) => {
    if (!stats) return { error: "데이터가 로드되지 않았습니다." };
    try {
      const records = getRecentRecords(stats.records, count || 50);
      const { data: prizeData } = loadPrizeData();
      for (const rec of records) {
        rec.prizeInfo = prizeData[rec.round] || null;
      }
      return { records };
    } catch (e) {
      return { error: `이력 조회 실패: ${e.message}` };
    }
  });

  ipcMain.handle("update-data", async () => {
    if (!stats) return { error: "데이터가 로드되지 않았습니다." };

    const mainWindow = getWindow();
    const lastRound = stats.records[stats.records.length - 1].round;
    const newRecords = [];

    const sendProgress = (msg) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("update-progress", msg);
      }
    };

    // ── 1단계: 새 회차 데이터 가져오기 ──
    const { data: prizeData, source: prizeSource, path: prizePath } = loadPrizeData();
    const sourceLabel = prizeSource === "local" ? `로컬 (${prizePath})` : "임베디드 (내장 데이터)";
    sendProgress(`상세 정보 소스: ${sourceLabel}`);

    // 짧은 대기 후 다음 단계 (소스 정보를 사용자가 볼 수 있도록)
    await new Promise(resolve => setTimeout(resolve, 800));
    sendProgress(`${lastRound}회 이후 새 회차 확인 중...`);

    try {
      const url = `https://www.dhlottery.co.kr/lt645/selectPstLt645InfoNew.do?srchDir=center&srchLtEpsd=${lastRound + 1}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const text = await resp.text();
      if (!text.includes("<!DOCTYPE") && !text.includes("<html")) {
        const json = JSON.parse(text);
        const list = (json.data && json.data.list) ? json.data.list : [];

        for (const item of list) {
          prizeData[item.ltEpsd] = parsePrizeItem(item);

          if (item.ltEpsd <= lastRound) continue;
          const nums = [
            item.tm1WnNo, item.tm2WnNo, item.tm3WnNo,
            item.tm4WnNo, item.tm5WnNo, item.tm6WnNo,
          ].sort((a, b) => a - b);
          const date = item.ltRflYmd.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
          newRecords.push([item.ltEpsd, date, ...nums, item.bnsWnNo]);
          sendProgress(`${item.ltEpsd}회 데이터 수신 완료 (${newRecords.length}건)`);
        }
      }
    } catch (e) {
      if (e.name === "TimeoutError") {
        sendProgress("서버 응답 시간 초과");
      }
    }

    // 새 회차가 있으면 저장
    if (newRecords.length > 0) {
      extraData = deduplicateExtra([...extraData, ...newRecords]);
      saveUpdates(extraData);
      rebuildStats();
    }

    // ── 2단계: 당첨 상세 정보 병합 (누락분 보충) ──
    const allRounds = stats.records.map(r => r.round);
    const missingRounds = allRounds.filter(r => !prizeData[r]).sort((a, b) => b - a); // 최신순

    if (missingRounds.length > 0) {
      sendProgress(`당첨 상세 정보 병합 중... (${missingRounds.length}개 회차 누락)`);

      let fetched = 0;
      const totalMissing = missingRounds.length;
      // API는 요청 회차 기준 ~10회차 반환 → 최신 누락 회차부터 반복 조회
      let remaining = [...missingRounds];
      let attempts = 0;
      const maxAttempts = Math.ceil(totalMissing / 8) + 2; // 안전 마진

      while (remaining.length > 0 && attempts < maxAttempts) {
        const targetRound = remaining[0];
        sendProgress(`당첨 상세 정보 조회 중... ${targetRound}회 (${totalMissing - remaining.length}/${totalMissing})`);

        try {
          const fetchedMap = await fetchPrizeInfo(targetRound);
          if (Object.keys(fetchedMap).length === 0) break; // API 응답 실패 시 중단
          Object.assign(prizeData, fetchedMap);
        } catch {
          break;
        }

        remaining = remaining.filter(r => !prizeData[r]);
        attempts++;

        // API 부하 방지: 요청 간 짧은 대기
        if (remaining.length > 0) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      fetched = totalMissing - remaining.length;
      if (fetched > 0) {
        sendProgress(`당첨 상세 정보 ${fetched}개 회차 병합 완료`);
      }
    }

    savePrizeData(prizeData);

    const summary = rebuildStats();

    if (newRecords.length === 0 && missingRounds.length === 0) {
      return { updated: 0, message: "이미 최신 데이터입니다.", summary };
    }

    const parts = [];
    if (newRecords.length > 0) {
      parts.push(`${newRecords.length}회차 업데이트 (${newRecords[0][0]}회 ~ ${newRecords[newRecords.length - 1][0]}회)`);
    }
    if (missingRounds.length > 0) {
      const merged = missingRounds.length - (missingRounds.filter(r => !prizeData[r])).length;
      if (merged > 0) parts.push(`상세 정보 ${merged}건 병합`);
    }

    return {
      updated: newRecords.length,
      message: parts.join(", ") + " 완료",
      summary,
    };
  });

  ipcMain.handle("get-advanced-analysis", async (_event, recentN) => {
    if (!stats) return { error: "데이터가 로드되지 않았습니다." };
    try {
      return { analysis: stats.getAdvancedAnalysis(recentN || 20) };
    } catch (e) {
      return { error: `고급 분석 실패: ${e.message}` };
    }
  });

  // ── 백테스트 ──

  function startBacktest(getWindow, gamesCount = 100) {
    const workerPath = path.join(__dirname, "backtest_worker.js");
    const sendToRenderer = (channel, data) => {
      const win = getWindow();
      if (win && !win.isDestroyed()) win.webContents.send(channel, data);
    };

    // 로또 Worker
    const lottoWorker = new Worker(workerPath, { workerData: { type: "lotto", gamesCount } });
    lottoWorker.on("message", (msg) => {
      if (msg.event === "progress") {
        sendToRenderer("backtest-progress", { type: "lotto", pct: msg.pct });
      } else if (msg.event === "done") {
        cachedLottoBacktest = msg.results;
        sendToRenderer("backtest-done", { type: "lotto", results: msg.results, gamesCount: msg.gamesCount });
      }
    });
    lottoWorker.on("error", (err) => {
      console.error("Lotto backtest worker error:", err);
      sendToRenderer("backtest-done", { type: "lotto", results: null, error: err.message });
    });

    // 연금복권 Worker (병렬)
    const pensionWorker = new Worker(workerPath, { workerData: { type: "pension", gamesCount } });
    pensionWorker.on("message", (msg) => {
      if (msg.event === "progress") {
        sendToRenderer("backtest-progress", { type: "pension", pct: msg.pct });
      } else if (msg.event === "done") {
        cachedPensionBacktest = msg.results;
        sendToRenderer("backtest-done", { type: "pension", results: msg.results, gamesCount: msg.gamesCount });
      }
    });
    pensionWorker.on("error", (err) => {
      console.error("Pension backtest worker error:", err);
      sendToRenderer("backtest-done", { type: "pension", results: null, error: err.message });
    });
  }

  ipcMain.handle("get-backtest", async () => {
    return { results: cachedLottoBacktest };
  });

  ipcMain.handle("pension-get-backtest", async () => {
    return { results: cachedPensionBacktest };
  });

  ipcMain.handle("start-backtest", async (_event, gamesCount) => {
    cachedLottoBacktest = null;
    cachedPensionBacktest = null;
    startBacktest(getWindow, gamesCount || 100);
    return { started: true };
  });

  ipcMain.handle("upload-csv", async () => {
    const result = await dialog.showOpenDialog({
      title: "로또 CSV 파일 선택",
      filters: [{ name: "CSV", extensions: ["csv"] }],
      properties: ["openFile"],
    });
    if (result.canceled) return { canceled: true };

    const filepath = result.filePaths[0];
    try {
      const text = fs.readFileSync(filepath, "utf-8").replace(/\r/g, "");
      const lines = text.trim().split("\n");
      const headers = lines[0].split(",");

      const idx = (name) => headers.findIndex(h => h === name);
      const iRound = idx("회차");
      const iDate = idx("추첨일");
      const iNums = [idx("번호1"), idx("번호2"), idx("번호3"),
                     idx("번호4"), idx("번호5"), idx("번호6")];
      const iBonus = idx("보너스번호");

      if (iRound < 0 || iDate < 0 || iNums.some(i => i < 0) || iBonus < 0) {
        return { error: "CSV 형식이 올바르지 않습니다. (회차, 추첨일, 번호1~6, 보너스번호 컬럼 필요)" };
      }

      const newRecords = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(",");
        if (cols.length < 7) continue;
        const nums = iNums.map(j => parseInt(cols[j])).sort((a, b) => a - b);
        if (nums.some(isNaN)) continue;
        const roundNum = parseInt(cols[iRound]);
        if (isNaN(roundNum)) continue;
        newRecords.push([roundNum, cols[iDate], ...nums, parseInt(cols[iBonus])]);
      }

      if (newRecords.length === 0) {
        return { error: "유효한 데이터가 없습니다." };
      }

      extraData = deduplicateExtra([...extraData, ...newRecords]);
      saveUpdates(extraData);
      const summary = rebuildStats();

      return {
        uploaded: newRecords.length,
        message: `CSV에서 ${newRecords.length}회차 로드 완료`,
        summary,
      };
    } catch (e) {
      return { error: `파일 읽기 실패: ${e.message}` };
    }
  });
}

module.exports = { setupIpc };
