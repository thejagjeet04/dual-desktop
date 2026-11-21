// ─────────────────────────────────────────────────────────────────────────────
//  webview-preload.js
//  Runs inside every webview BEFORE the page's own JS.
//  Key jobs:
//    1. Spoof navigator to look like macOS Chrome (not Electron on Windows)
//    2. Hide Electron-specific globals that WhatsApp fingerprints
//    3. Intercept Notification API and relay to host page
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { ipcRenderer } = require('electron');

// ─── CRITICAL: Use macOS Chrome UA ───────────────────────────────────────────
//
//  WhatsApp Web shows "Download WhatsApp for Windows" when it detects
//  Windows Chrome. Spoofing macOS makes it show the QR code web interface.
//  This must be set in JS (not just the HTTP header) because WhatsApp reads
//  navigator.userAgent directly in its JavaScript code.

const MAC_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

try {
  Object.defineProperty(navigator, 'userAgent', {
    get: () => MAC_UA,
    configurable: true,
  });
  Object.defineProperty(navigator, 'platform', {
    get: () => 'MacIntel',
    configurable: true,
  });
  Object.defineProperty(navigator, 'appVersion', {
    get: () => '5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    configurable: true,
  });
  Object.defineProperty(navigator, 'vendor', {
    get: () => 'Google Inc.',
    configurable: true,
  });
} catch (e) {
  console.warn('[DualDesk] Could not override navigator:', e.message);
}

// ─── Hide Electron fingerprints ───────────────────────────────────────────────
//
//  WhatsApp and other apps check for window.process and window.require
//  to detect Electron. We delete them so the app thinks it's a normal browser.

try {
  // These are only present if nodeIntegration:true (which we don't use),
  // but clean them up defensively
  if (typeof window !== 'undefined') {
    delete window.process;
    delete window.require;
    delete window.module;
    delete window.__electron_preload__;
  }
} catch (_) {}

// ─── Override chrome.app to look like a normal Chrome install ─────────────────
try {
  if (window.chrome) {
    Object.defineProperty(window.chrome, 'app', {
      get: () => undefined,
      configurable: true,
    });
  }
} catch (_) {}

// ─── Notification API interception ───────────────────────────────────────────

const _OriginalNotification = window.Notification;

function DualDeskNotification(title, options = {}) {
  ipcRenderer.sendToHost('webview:notification', {
    title: String(title || ''),
    body:  String(options.body  || ''),
    icon:  options.icon  || '',
    tag:   options.tag   || '',
  });
  return new _OriginalNotification(title, options);
}

Object.defineProperty(DualDeskNotification, 'permission', {
  get: () => 'granted',
  configurable: true,
});
DualDeskNotification.requestPermission = () => Promise.resolve('granted');
Object.setPrototypeOf(DualDeskNotification, _OriginalNotification);
Object.setPrototypeOf(DualDeskNotification.prototype, _OriginalNotification.prototype);

try {
  Object.defineProperty(window, 'Notification', {
    value: DualDeskNotification,
    writable: true,
    configurable: true,
    enumerable: false,
  });
} catch (_) {
  window.Notification = DualDeskNotification;
}

// ─── Service Worker notification interception ─────────────────────────────────
if ('serviceWorker' in navigator) {
  const _swProto  = ServiceWorkerRegistration.prototype;
  const _origShow = _swProto.showNotification;
  _swProto.showNotification = function (title, options = {}) {
    ipcRenderer.sendToHost('webview:notification', {
      title: String(title || ''),
      body:  String(options.body  || ''),
      icon:  options.icon  || '',
      tag:   options.tag   || '',
    });
    return _origShow.call(this, title, options);
  };
}

console.log('[DualDesk] webview-preload loaded — macOS UA spoofed, Electron fingerprints hidden');