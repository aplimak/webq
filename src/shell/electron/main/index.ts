import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    frame: process.env.NODE_ENV === 'development',
    hasShadow: true,
    webPreferences: {
      preload: path.join(__dirname, './electron-preload.js'), // Webpack output
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadFile(path.join(__dirname, './index.html'));

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.webContents.on('before-input-event', (event, input) => {
      // Ctrl+Q to quit the app
      if (input.control && input.key === 'q') {
        event.preventDefault();
        app.quit();
      }
    });
  }
}

app.whenReady().then(() => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Close: destroys the window
ipcMain.handle('window:close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    win.close();
  }
});

// Minimize: hides to taskbar/dock
ipcMain.handle('window:minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    win.minimize();
  }
});

// Maximize: toggles between maximized and normal
ipcMain.handle('window:maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.handle('window:maximized', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) {
    return win.isMaximized();
  }
  return undefined;
});
