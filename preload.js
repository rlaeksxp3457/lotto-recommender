const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("api", {
  initData:           ()      => ipcRenderer.invoke("init-data"),
  getRecommendations: (count) => ipcRenderer.invoke("get-recommendations", count),
  getTop5:            ()      => ipcRenderer.invoke("get-top5"),
  getNeverDrawn:      (count) => ipcRenderer.invoke("get-never-drawn", count),
  updateData:         ()      => ipcRenderer.invoke("update-data"),
  uploadCsv:          ()      => ipcRenderer.invoke("upload-csv"),
  getAppVersion:      ()      => ipcRenderer.invoke("get-app-version"),
  onUpdateProgress:   (cb)    => ipcRenderer.on("update-progress", (_e, msg) => cb(msg)),
});
