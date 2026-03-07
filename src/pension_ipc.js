const fs = require("fs");
const path = require("path");
const { app } = require("electron");
const {
  getRecords, PensionStats,
  getPensionRecommendations, getPensionTop5,
  getRecentRecords,
  EMBEDDED_DATA,
} = require("./pension_analyzer");

let stats = null;
let extraData = [];

const UPDATES_PATH = path.join(app.getPath("userData"), "pension_updates.json");

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
  stats = new PensionStats(records);
  return stats.getSummary();
}

function setupPensionIpc(ipcMain, getWindow) {
  ipcMain.handle("pension-init-data", async () => {
    try {
      extraData = loadUpdates();
      const summary = rebuildStats();
      return { summary };
    } catch (e) {
      return { error: `연금복권 데이터 초기화 실패: ${e.message}` };
    }
  });

  ipcMain.handle("pension-get-recommendations", async (_event, count) => {
    if (!stats) return { error: "연금복권 데이터가 로드되지 않았습니다." };
    try {
      return { recommendations: getPensionRecommendations(stats, count || 1) };
    } catch (e) {
      return { error: `추천 생성 실패: ${e.message}` };
    }
  });

  ipcMain.handle("pension-get-history", async (_event, count) => {
    if (!stats) return { error: "연금복권 데이터가 로드되지 않았습니다." };
    try {
      return { records: getRecentRecords(stats.records, count || 50) };
    } catch (e) {
      return { error: `이력 조회 실패: ${e.message}` };
    }
  });

  ipcMain.handle("pension-get-top5", async () => {
    if (!stats) return { error: "연금복권 데이터가 로드되지 않았습니다." };
    try {
      return { games: getPensionTop5(stats) };
    } catch (e) {
      return { error: `TOP 5 생성 실패: ${e.message}` };
    }
  });

  ipcMain.handle("pension-update-data", async () => {
    if (!stats) return { error: "연금복권 데이터가 로드되지 않았습니다." };

    const mainWindow = getWindow();
    const lastRound = stats.records[stats.records.length - 1].round;
    const newRecords = [];

    const sendProgress = (msg) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send("pension-update-progress", msg);
      }
    };

    sendProgress(`${lastRound}회 이후 데이터 확인 중...`);

    // 최신 회차에서 데이터 가져오기
    let targetRound = lastRound + 6; // API가 주변 6회차 반환
    let consecutive404 = 0;

    while (consecutive404 < 3) {
      try {
        const url = `https://www.dhlottery.co.kr/pt720/selectPstPt720Info.do?srchPsltEpsd=${targetRound}`;
        const resp = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            "Referer": "https://www.dhlottery.co.kr/pt720/result",
          },
          signal: AbortSignal.timeout(10000),
        });
        const text = await resp.text();
        if (text.includes("<!DOCTYPE") || text.includes("<html")) {
          consecutive404++;
          targetRound += 6;
          continue;
        }
        const json = JSON.parse(text);

        if (!json.data || !json.data.result || json.data.result.length === 0) {
          consecutive404++;
          targetRound += 6;
          continue;
        }

        consecutive404 = 0;
        const results = json.data.result;

        // 1등 + 보너스만 파싱
        const roundMap = new Map();
        for (const r of results) {
          const round = r.psltEpsd;
          if (round <= lastRound) continue; // 이미 있는 데이터 스킵

          if (!roundMap.has(round)) {
            roundMap.set(round, { round, date: r.psltRflYmd });
          }
          const entry = roundMap.get(round);

          if (r.wnSqNo === 1) {
            entry.group = parseInt(r.wnBndNo);
            entry.number = r.wnRnkVl.padStart(6, "0");
          } else if (r.wnSqNo === 21) {
            entry.bonus = r.wnRnkVl.padStart(6, "0");
          }
        }

        for (const [, entry] of roundMap) {
          if (entry.group != null && entry.number && entry.bonus) {
            const digits = entry.number.split("").map(Number);
            newRecords.push([entry.round, entry.date, entry.group, ...digits, entry.bonus]);
            sendProgress(`${entry.round}회 데이터 수신 완료 (${newRecords.length}건)`);
          }
        }

        // 다음 배치
        const maxRound = Math.max(...results.map(r => r.psltEpsd));
        if (maxRound >= targetRound) {
          targetRound = maxRound + 6;
        } else {
          break;
        }
      } catch (e) {
        if (e.name === "TimeoutError") {
          sendProgress("서버 응답 시간 초과, 재시도...");
          continue;
        }
        break;
      }
    }

    if (newRecords.length === 0) {
      return { updated: 0, message: "이미 최신 데이터입니다." };
    }

    extraData = deduplicateExtra([...extraData, ...newRecords]);
    saveUpdates(extraData);
    const summary = rebuildStats();

    return {
      updated: newRecords.length,
      message: `${newRecords.length}회차 업데이트 완료`,
      summary,
    };
  });
}

module.exports = { setupPensionIpc };
