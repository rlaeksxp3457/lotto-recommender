const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // 데이터
  initData:           ()      => ipcRenderer.invoke("init-data"),
  getRecommendations: (count) => ipcRenderer.invoke("get-recommendations", count),
  getTop5:            ()      => ipcRenderer.invoke("get-top5"),
  getNeverDrawn:      (count) => ipcRenderer.invoke("get-never-drawn", count),
  getHistory:         (count) => ipcRenderer.invoke("get-history", count),
  updateData:         ()      => ipcRenderer.invoke("update-data"),
  uploadCsv:          ()      => ipcRenderer.invoke("upload-csv"),
  getAdvancedAnalysis: (n)    => ipcRenderer.invoke("get-advanced-analysis", n),
  getAppVersion:      ()      => ipcRenderer.invoke("get-app-version"),
  onUpdateProgress:   (cb)    => ipcRenderer.on("update-progress", (_e, msg) => cb(msg)),

  // 연금복권720+
  pensionInitData:           ()      => ipcRenderer.invoke("pension-init-data"),
  pensionGetRecommendations: (count) => ipcRenderer.invoke("pension-get-recommendations", count),
  pensionGetTop5:            ()      => ipcRenderer.invoke("pension-get-top5"),
  pensionGetHistory:         (count) => ipcRenderer.invoke("pension-get-history", count),
  pensionUpdateData:         ()      => ipcRenderer.invoke("pension-update-data"),
  pensionGetAdvancedAnalysis: (n)    => ipcRenderer.invoke("pension-get-advanced-analysis", n),
  onPensionUpdateProgress:   (cb)    => ipcRenderer.on("pension-update-progress", (_e, msg) => cb(msg)),

  // 내 번호 관리
  myNumbersLoad:         ()          => ipcRenderer.invoke("my-numbers-load"),
  myNumbersSave:         (ticket)    => ipcRenderer.invoke("my-numbers-save", ticket),
  myNumbersDelete:       (id)        => ipcRenderer.invoke("my-numbers-delete", id),
  myNumbersCheckLotto:   (id)        => ipcRenderer.invoke("my-numbers-check-lotto", id),
  myNumbersCheckPension: (id)        => ipcRenderer.invoke("my-numbers-check-pension", id),
  myNumbersUpdateBatch:  (payload)   => ipcRenderer.invoke("my-numbers-update-batch", payload),
  myNumbersExport:       ()          => ipcRenderer.invoke("my-numbers-export"),
  myNumbersImport:       ()          => ipcRenderer.invoke("my-numbers-import"),

  // 백테스트
  startBacktest:         ()   => ipcRenderer.invoke("start-backtest"),
  getBacktest:           ()   => ipcRenderer.invoke("get-backtest"),
  pensionGetBacktest:    ()   => ipcRenderer.invoke("pension-get-backtest"),
  onBacktestProgress:    (cb) => ipcRenderer.on("backtest-progress", (_e, d) => cb(d)),
  onBacktestDone:        (cb) => ipcRenderer.on("backtest-done", (_e, d) => cb(d)),

  // 윈도우 컨트롤
  windowMinimize:    () => ipcRenderer.invoke("window-minimize"),
  windowMaximize:    () => ipcRenderer.invoke("window-maximize"),
  windowClose:       () => ipcRenderer.invoke("window-close"),
  windowHide:        () => ipcRenderer.invoke("window-hide"),
  windowIsMaximized: () => ipcRenderer.invoke("window-is-maximized"),
  toggleDevTools:    () => ipcRenderer.invoke("toggle-devtools"),

  // 앱 업데이트
  checkForUpdate:    () => ipcRenderer.invoke("check-for-update"),
  downloadUpdate:    () => ipcRenderer.invoke("download-update"),
  installUpdate:     () => ipcRenderer.invoke("install-update"),
  onAppUpdate:       (cb) => ipcRenderer.on("app-update", (_e, data) => cb(data)),
});
