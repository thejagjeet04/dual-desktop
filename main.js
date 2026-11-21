// ─────────────────────────────────────────────────────────────────────────────
//  DualDesk — main.js  (Electron main process)
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const {
  app, BrowserWindow, ipcMain, session,
  Notification, nativeImage, shell, Menu,
} = require('electron');

const path = require('path');
const os   = require('os');

const IS_MAC = os.platform() === 'darwin';
const IS_WIN = os.platform() === 'win32';
const IS_DEV = process.env.NODE_ENV === 'development';

// ─── ALWAYS use macOS Chrome UA ──────────────────────────────────────────────
//  WhatsApp Web shows "Download WhatsApp for Windows" to any Windows
//  Chrome UA. A macOS UA gets the full web interface + QR code.
const MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

// Configure ANY session (default or partition) automatically
const activeSessions = new Set();

function setupSessionHandlers(ses) {
  try {
    activeSessions.add(ses);
    ses.webRequest.onBeforeSendHeaders((details, callback) => {
      details.requestHeaders['User-Agent'] = MAC_UA;
      delete details.requestHeaders['sec-ch-ua'];
      delete details.requestHeaders['sec-ch-ua-mobile'];
      delete details.requestHeaders['sec-ch-ua-platform'];
      callback({ requestHeaders: details.requestHeaders });
    });

    ses.setPermissionRequestHandler((_wc, permission, callback) => {
      const GRANTED = ['notifications', 'media', 'clipboard-read',
                       'clipboard-sanitized-write', 'fullscreen', 'pointerLock'];
      callback(GRANTED.includes(permission));
    });

    ses.setPermissionCheckHandler((_wc, permission) => {
      return ['notifications', 'media', 'clipboard-read'].includes(permission);
    });
  } catch(e) { console.error('[main] setupSessionHandlers error', e); }
}

// Global handler whenever any session partition is created
app.on('session-created', (ses) => {
  setupSessionHandlers(ses);
});

async function flushAllCookies() {
  for (const ses of activeSessions) {
    try {
      if (ses.cookies && typeof ses.cookies.flushStore === 'function') {
        await ses.cookies.flushStore();
      }
    } catch(e) {}
  }
}

// ─── Window creation ──────────────────────────────────────────────────────────
let mainWindow = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width:     1440,
    height:    900,
    minWidth:  960,
    minHeight: 620,
    titleBarStyle: IS_MAC ? 'hiddenInset' : 'default',
    frame: true,
    icon: path.join(__dirname, IS_WIN ? 'assets/icon.ico' : 'assets/icon.png'),
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      sandbox:          false,
      preload:          path.join(__dirname, 'preload.js'),
      webviewTag:       true,
      spellcheck:       true,
    },
    backgroundColor: '#0A0D13',
    show: false,
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
    if (mainWindow.isMinimized()) mainWindow.restore();
    if (IS_DEV) mainWindow.webContents.openDevTools({ mode: 'detach' });
  });

  if (!IS_MAC) {
    mainWindow.setMenuBarVisibility(false);
    Menu.setApplicationMenu(null);
  }

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) event.preventDefault();
  });

  mainWindow.on('close', () => {
    flushAllCookies();
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── IPC: Session management ──────────────────────────────────────────────────
ipcMain.handle('session:clear', async (_event, partitionName) => {
  try {
    const ses = session.fromPartition(partitionName);
    await ses.clearStorageData({
      storages: ['cookies','localstorage','indexdb','cachestorage','serviceworkers','filesystems'],
    });
    console.log('[session:clear]', partitionName);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('session:has-cookies', async (_event, partitionName) => {
  try {
    const ses = session.fromPartition(partitionName);
    const cookies = await ses.cookies.get({});
    return cookies.length > 0;
  } catch { return false; }
});

// ─── IPC: Notifications ───────────────────────────────────────────────────────
ipcMain.on('webview:notification', (_event, { title, body, icon, partition }) => {
  if (!Notification.isSupported()) return;
  const opts = { title: title || 'DualDesk', body: body || '', urgency: 'normal' };
  if (icon && icon.startsWith('data:')) {
    try { opts.icon = nativeImage.createFromDataURL(icon); } catch {}
  }
  const notif = new Notification(opts);
  notif.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('notification:focus', partition);
    }
  });
  notif.show();
});

// ─── IPC: Window controls ─────────────────────────────────────────────────────
ipcMain.on('window:minimize',  () => mainWindow?.minimize());
ipcMain.on('window:maximize',  () => mainWindow?.isMaximized() ? mainWindow.unmaximize() : mainWindow?.maximize());
ipcMain.on('window:close',     () => mainWindow?.close());
ipcMain.on('devtools:open',    () => mainWindow?.webContents.openDevTools({ mode: 'detach' }));

// ─── Security: handle new windows ────────────────────────────────────────────
app.on('web-contents-created', (_event, webContents) => {
  webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://') || url.startsWith('http://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  webContents.on('will-navigate', (_navEvent, url) => {
    if (url.startsWith('javascript:')) _navEvent.preventDefault();
  });
});

// ─── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  setupSessionHandlers(session.defaultSession);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  flushAllCookies();
});

app.on('window-all-closed', () => { if (!IS_MAC) app.quit(); });

process.on('uncaughtException',  (err) => console.error('[main] Uncaught:', err));
process.on('unhandledRejection', (r)   => console.error('[main] Unhandled rejection:', r));