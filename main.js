const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs   = require("fs");
const { getRecords, LottoStats, getRecommendations, getTop5, getNeverDrawn, EMBEDDED_DATA } = require("./src/analyzer");

// ── 단일 인스턴스 ──
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }

let mainWindow = null;
let stats = null;
let extraData = [];

const UPDATES_PATH = path.join(app.getPath("userData"), "updates.json");

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
  stats = new LottoStats(records);
  return stats.getSummary();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width:  1280,
    height: 900,
    minWidth: 960,
    minHeight: 700,
    title: "로또 추천기",
    backgroundColor: "#1e1f22",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadFile(path.join(__dirname, "src", "renderer", "index.html"));

  // 준비되면 표시 (깜빡임 방지)
  mainWindow.once("ready-to-show", () => mainWindow.show());
}

// 단일 인스턴스: 두 번째 실행 시 기존 창 포커스
app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// ── IPC 핸들러 ──

ipcMain.handle("init-data", async () => {
  try {
    extraData = loadUpdates();
    const summary = rebuildStats();
    return { summary };
  } catch (e) {
    return { error: `데이터 초기화 실패: ${e.message}` };
  }
});

ipcMain.handle("get-recommendations", async (_event, count) => {
  if (!stats) return { error: "데이터가 로드되지 않았습니다." };
  try {
    return { recommendations: getRecommendations(stats, count || 1) };
  } catch (e) {
    return { error: `추천 생성 실패: ${e.message}` };
  }
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

ipcMain.handle("update-data", async (event) => {
  if (!stats) return { error: "데이터가 로드되지 않았습니다." };

  const lastRound = stats.records[stats.records.length - 1].round;
  const newRecords = [];
  let round = lastRound + 1;
  let consecutive404 = 0;

  // 진행률 전송 함수
  const sendProgress = (msg) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send("update-progress", msg);
    }
  };

  sendProgress(`${lastRound}회 이후 데이터 확인 중...`);

  while (consecutive404 < 3) {
    try {
      const url = `https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=${round}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
      const json = await resp.json();

      if (json.returnValue !== "success") {
        consecutive404++;
        round++;
        continue;
      }

      consecutive404 = 0;
      const nums = [
        json.drwtNo1, json.drwtNo2, json.drwtNo3,
        json.drwtNo4, json.drwtNo5, json.drwtNo6,
      ].sort((a, b) => a - b);

      newRecords.push([
        json.drwNo, json.drwNoDate, ...nums, json.bnusNo,
      ]);

      sendProgress(`${json.drwNo}회 데이터 수신 완료 (${newRecords.length}건)`);
      round++;
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
    message: `${newRecords.length}회차 업데이트 완료 (${newRecords[0][0]}회 ~ ${newRecords[newRecords.length-1][0]}회)`,
    summary,
  };
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
    const iDate  = idx("추첨일");
    const iNums  = [idx("번호1"), idx("번호2"), idx("번호3"),
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

// ── 앱 버전 조회 ──
ipcMain.handle("get-app-version", () => app.getVersion());

// ── 앱 시작 ──

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
