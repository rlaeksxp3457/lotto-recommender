const { app, BrowserWindow, ipcMain, Tray, Menu, nativeImage } = require("electron");
const path = require("path");
const { setupIpc } = require("./src/ipc");

// ── 단일 인스턴스 ──
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); }

let mainWindow = null;
let tray = null;

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
ipcMain.handle("window-close", () => { app.isQuitting = true; app.quit(); });
ipcMain.handle("window-hide", () => mainWindow?.hide());
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

// ── 트레이 생성 ──
function createTray() {
  const iconPath = app.isPackaged
    ? path.join(process.resourcesPath, "assets", "tray-icon.png")
    : path.join(__dirname, "assets", "tray-icon.png");
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon);
  tray.setToolTip("로또 추천기");
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "열기", click: () => { mainWindow?.show(); mainWindow?.focus(); } },
    { type: "separator" },
    { label: "종료", click: () => { app.isQuitting = true; app.quit(); } },
  ]));
  tray.on("double-click", () => { mainWindow?.show(); mainWindow?.focus(); });
}

// ── 앱 시작 ──
app.whenReady().then(() => {
  createWindow();
  createTray();

  // 창 닫기 시 트레이 모드이면 숨기기만 함
  mainWindow.on("close", (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });

  // 시작 3초 후 업데이트 확인
  if (updater) {
    setTimeout(() => updater.checkForUpdates().catch(() => {}), 3000);
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "win32") app.quit();
});
