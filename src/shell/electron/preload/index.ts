import { contextBridge, ipcRenderer } from 'electron';
import { ElectronAPI } from '..';

function embedEvent(event: string, callback: () => void): () => void {
  ipcRenderer.on(event, callback);
  return (): void => {
    ipcRenderer.removeListener('escape-pressed', callback);
  };
}

// Expose protected methods that allow the renderer to use
// the ipcRenderer without exposing the entire object.
contextBridge.exposeInMainWorld('electron', {
  mainWindow: {
    close: () => ipcRenderer.invoke('window:close'),
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    isMaximized: () => ipcRenderer.invoke('window:maximized'),
  },
  events: {
    onEscape: (callback: () => void) => embedEvent('escape-pressed', callback),
    onResize: (callback: () => void) => embedEvent('window-resized', callback),
  },
} as ElectronAPI);
