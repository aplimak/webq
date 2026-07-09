import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';

let mainWindow: BrowserWindow | null = null;
const useServer = process.argv.includes('--webq-use-server');
const preloadPath = path.join(__dirname, '../preload/index.js');

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 700,
    icon: path.join(__dirname, 'icon.png'),
    frame: __WEBQ_NODE_ENV__ === 'development',
    hasShadow: true,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (useServer) {
    mainWindow.loadURL('http://localhost:8090');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  // Open DevTools in development
  if (__WEBQ_NODE_ENV__ === 'development') {
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

  mainWindow.on('resize', () => {
    mainWindow?.webContents.send('window-resized');
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.type !== 'keyDown') return;
    // Escape to send a custom event to the renderer
    if (input.key === 'Escape') {
      event.preventDefault();
      // Send an IPC message to the renderer
      mainWindow?.webContents.send('escape-pressed');
    }
  });
}

app.whenReady().then(() => {
  createWindow();

  if (__WEBQ_NODE_ENV__ === 'development') {
    fs.watch(path.dirname(preloadPath), () => {
      console.log('Preload updated, reloading window...');
      mainWindow?.webContents.reload();
    });
  }
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
