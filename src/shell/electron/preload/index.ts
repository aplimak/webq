import { ElectronAPI } from '@/shell/electron-api';
import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer to use
// the ipcRenderer without exposing the entire object.
contextBridge.exposeInMainWorld('electron', {
  mainWindow: {
    close: () => ipcRenderer.invoke('window:close'),
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    isMaximized: () => ipcRenderer.invoke('window:maximized'),
  },
} as ElectronAPI);
