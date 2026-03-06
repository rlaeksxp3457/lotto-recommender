const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const { setupIpc } = require("./src/ipc");

// ── 단일 인스턴스 ──
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }

let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 960,
    minHeight: 700,
    title: "로또 추천기",
    backgroundColor: "#1e1f22",
    show: false,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "src", "renderer", "index.html"));
  mainWindow.once("ready-to-show", () => mainWindow.show());
}

// 단일 인스턴스: 두 번째 실행 시 기존 창 포커스
app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// ── 윈도우 컨트롤 IPC ──
ipcMain.handle("window-minimize", () => mainWindow?.minimize());
ipcMain.handle("window-maximize", () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize();
  else mainWindow?.maximize();
});
ipcMain.handle("window-close", () => mainWindow?.close());
ipcMain.handle("window-is-maximized", () => mainWindow?.isMaximized() ?? false);

// ── 앱 버전 ──
ipcMain.handle("get-app-version", () => app.getVersion());

// ── 자동 업데이트 (electron-updater) ──
function setupAutoUpdater() {
  try {
    const { autoUpdater } = require("electron-updater");
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on("update-available", (info) => {
      mainWindow?.webContents.send("app-update", { type: "available", version: info.version });
    });

    autoUpdater.on("update-not-available", () => {
      mainWindow?.webContents.send("app-update", { type: "not-available" });
    });

    autoUpdater.on("download-progress", (progress) => {
      mainWindow?.webContents.send("app-update", { type: "progress", percent: Math.round(progress.percent) });
    });

    autoUpdater.on("update-downloaded", () => {
      mainWindow?.webContents.send("app-update", { type: "downloaded" });
    });

    autoUpdater.on("error", () => {});

    ipcMain.handle("check-for-update", async () => {
      try {
        await autoUpdater.checkForUpdates();
        return { ok: true };
      } catch (e) {
        return { error: e.message };
      }
    });

    ipcMain.handle("download-update", async () => {
      try {
        await autoUpdater.downloadUpdate();
        return { ok: true };
      } catch (e) {
        return { error: e.message };
      }
    });

    ipcMain.handle("install-update", () => {
      autoUpdater.quitAndInstall();
    });

    return autoUpdater;
  } catch {
    // electron-updater 미설치 시 (개발 모드)
    ipcMain.handle("check-for-update", () => ({ error: "개발 모드" }));
    ipcMain.handle("download-update", () => ({ error: "개발 모드" }));
    ipcMain.handle("install-update", () => {});
    return null;
  }
}

const updater = setupAutoUpdater();

// ── IPC 핸들러 등록 ──
setupIpc(ipcMain, () => mainWindow);

// ── 앱 시작 ──
app.whenReady().then(() => {
  createWindow();
  // 시작 3초 후 업데이트 확인
  if (updater) {
    setTimeout(() => updater.checkForUpdates().catch(() => {}), 3000);
  }
});

app.on("window-all-closed", () => app.quit());
