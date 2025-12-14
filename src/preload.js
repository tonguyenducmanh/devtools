// See the Electron documentation for details on how to use preload scripts:
// https://www.electronjs.org/docs/latest/tutorial/process-model#preload-scripts

// gán cờ vào window.__electron để nhận biết đây là gọi từ electron app chứ không phải web app
import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("__electron", {
  isElectron: true,
});