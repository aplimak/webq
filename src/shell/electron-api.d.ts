// renderer.d.ts (or add to a global types file)
export interface ElectronAPI {
  mainWindow: {
    close: () => Promise<void>;
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    isMaximized: () => Promise<boolean | undefined>;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
