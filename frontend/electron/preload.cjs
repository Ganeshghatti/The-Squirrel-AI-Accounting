const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("appAuth", {
  getPublicConfig: () => ipcRenderer.invoke("app:getPublicConfig"),
  get: () => ipcRenderer.invoke("auth:get"),
  set: (payload) => ipcRenderer.invoke("auth:set", payload),
  clear: () => ipcRenderer.invoke("auth:clear"),
  validate: (payload) => ipcRenderer.invoke("api:validate", payload),
  apiRequest: (opts) => ipcRenderer.invoke("api:request", opts),
  tallyListCompanies: () => ipcRenderer.invoke("tally:listCompanies"),
  tallyReadLedgers: (p) => ipcRenderer.invoke("tally:readLedgers", p),
  tallyReadStockItems: (p) => ipcRenderer.invoke("tally:readStockItems", p),
  tallyReadUnits: (p) => ipcRenderer.invoke("tally:readUnits", p),
  tallyReadDayBook: (p) => ipcRenderer.invoke("tally:readDayBook", p),
});
