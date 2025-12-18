// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

import { contextBridge, ipcRenderer } from "electron";

// gán cờ vào window.__electron để nhận biết đây là gọi từ electron app chứ không phải web app
contextBridge.exposeInMainWorld("__electron", {
  isElectron: true,
});

// expose hàm để exect tương tự tool_api_agent.go
contextBridge.exposeInMainWorld("agent", {
  exec: (request, signalId) =>
    ipcRenderer.invoke("agent:exec", request, signalId),

  cancel: (signalId) => ipcRenderer.send("agent:cancel", signalId),
});
