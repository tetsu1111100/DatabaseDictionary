const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const http = require('node:http');
const { spawn } = require('node:child_process');

const BACKEND_URL = 'http://localhost:5230';
const isDev = !app.isPackaged;

let backendProcess = null;
let mainWindow = null;

function startBackend() {
  // Dev: run the API project straight from source with `dotnet run`.
  // Packaged builds should ship a self-contained publish output under `resources/backend`
  // and switch this to launch that .exe directly — not wired up yet, MVP scope is dev-mode only.
  const backendProjectDir = path.join(__dirname, '..', '..', 'backend', 'src', 'DatabaseDictionary.Api');

  backendProcess = spawn('dotnet', ['run', '--urls', BACKEND_URL], {
    cwd: backendProjectDir,
    shell: true,
    stdio: isDev ? 'inherit' : 'ignore',
  });

  backendProcess.on('error', (err) => {
    console.error('[backend] failed to start:', err);
  });
}

function waitForBackendReady(maxAttempts = 60) {
  return new Promise((resolve, reject) => {
    const attempt = (remaining) => {
      const req = http.get(`${BACKEND_URL}/health`, (res) => {
        res.resume();
        if (res.statusCode === 200) {
          resolve();
        } else {
          scheduleRetry(remaining);
        }
      });
      req.on('error', () => scheduleRetry(remaining));
    };

    const scheduleRetry = (remaining) => {
      if (remaining <= 0) {
        reject(new Error('Backend did not become ready in time'));
        return;
      }
      setTimeout(() => attempt(remaining - 1), 1000);
    };

    attempt(maxAttempts);
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  startBackend();

  try {
    await waitForBackendReady();
  } catch (err) {
    console.error('[backend] not ready:', err);
  }

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

function killBackend() {
  if (!backendProcess) return;
  if (process.platform === 'win32') {
    // `dotnet run` spawns a child host process; taskkill /T ensures that child is reaped too.
    spawn('taskkill', ['/pid', String(backendProcess.pid), '/T', '/F']);
  } else {
    backendProcess.kill();
  }
  backendProcess = null;
}

app.on('window-all-closed', () => {
  killBackend();
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', killBackend);
