export interface ElectronAPI {
  mainWindow: {
    close: () => Promise<void>;
    minimize: () => Promise<void>;
    maximize: () => Promise<void>;
    isMaximized: () => Promise<boolean | undefined>;
  };
  events: {
    onEscape: (callback: () => void) => () => void;
    onResize: (callback: () => void) => () => void;
  };
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
