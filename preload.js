const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  // 데이터
  initData:           ()      => ipcRenderer.invoke("init-data"),
  getRecommendations: (count) => ipcRenderer.invoke("get-recommendations", count),
  getTop5:            ()      => ipcRenderer.invoke("get-top5"),
  getNeverDrawn:      (count) => ipcRenderer.invoke("get-never-drawn", count),
  updateData:         ()      => ipcRenderer.invoke("update-data"),
  uploadCsv:          ()      => ipcRenderer.invoke("upload-csv"),
  getAppVersion:      ()      => ipcRenderer.invoke("get-app-version"),
  onUpdateProgress:   (cb)    => ipcRenderer.on("update-progress", (_e, msg) => cb(msg)),

  // 윈도우 컨트롤
  windowMinimize:    () => ipcRenderer.invoke("window-minimize"),
  windowMaximize:    () => ipcRenderer.invoke("window-maximize"),
  windowClose:       () => ipcRenderer.invoke("window-close"),
  windowIsMaximized: () => ipcRenderer.invoke("window-is-maximized"),

  // 앱 업데이트
  checkForUpdate:    () => ipcRenderer.invoke("check-for-update"),
  downloadUpdate:    () => ipcRenderer.invoke("download-update"),
  installUpdate:     () => ipcRenderer.invoke("install-update"),
  onAppUpdate:       (cb) => ipcRenderer.on("app-update", (_e, data) => cb(data)),
});
