// ─────────────────────────────────────────────────────────────────────────────
//  preload.js  —  Context bridge (main process ↔ renderer)
//
//  This file runs before the renderer HTML loads, in a privileged Node.js
//  context. It uses contextBridge to safely expose a small, controlled API
//  to the renderer (window.dualDesk). The renderer cannot access Node or
//  Electron APIs directly — it can only call what we expose here.
// ─────────────────────────────────────────────────────────────────────────────

'use strict';

const { contextBridge, ipcRenderer } = require('electron');
const path = require('path');
const { pathToFileURL } = require('url');

contextBridge.exposeInMainWorld('dualDesk', {

  // ── Webview preload URL ──────────────────────────────────────────────────
  //
  //  Each <webview> element needs its own preload script to intercept the
  //  Web Notification API. We expose the absolute file:// URL here so the
  //  renderer can set it as the webview's "preload" attribute.
  //
  //  We compute this in preload.js (not renderer.js) because __dirname is
  //  only available in Node.js contexts.

  webviewPreloadUrl: pathToFileURL(
    path.join(__dirname, 'webview-preload.js')
  ).toString(),

  // ── Session management ───────────────────────────────────────────────────

  /**
   * Clear all stored data (cookies, localStorage, IndexedDB, cache) for
   * one account partition. After calling this, the webview will show the
   * login/QR screen again.
   *
   * @param {string} partition  e.g. "persist:whatsapp-1"
   * @returns {Promise<{ok: boolean, error?: string}>}
   */
  clearSession: (partition) =>
    ipcRenderer.invoke('session:clear', partition),

  /**
   * Check whether an account slot already has session cookies.
   * Returns true if the user is (likely) already logged in.
   *
   * @param {string} partition  e.g. "persist:whatsapp-2"
   * @returns {Promise<boolean>}
   */
  hasCookies: (partition) =>
    ipcRenderer.invoke('session:has-cookies', partition),

  // ── Notifications ────────────────────────────────────────────────────────

  /**
   * Forward a web notification (intercepted inside a webview) to the main
   * process, which shows it as a native OS notification.
   *
   * @param {{ title: string, body: string, icon: string, partition: string }} data
   */
  sendNotification: (data) =>
    ipcRenderer.send('webview:notification', data),

  /**
   * Register a callback that fires when the user clicks a native notification.
   * The main process sends the partition of the webview that triggered the
   * notification so the renderer can highlight the right pane.
   *
   * @param {(partition: string) => void} callback
   */
  onNotificationFocus: (callback) => {
    ipcRenderer.on('notification:focus', (_event, partition) =>
      callback(partition)
    );
  },

  // ── Window controls ──────────────────────────────────────────────────────
  //
  //  Used by the custom title bar. On macOS the native traffic-light buttons
  //  handle this automatically; on Windows we render our own buttons.

  minimize:     () => ipcRenderer.send('window:minimize'),
  maximize:     () => ipcRenderer.send('window:maximize'),
  close:        () => ipcRenderer.send('window:close'),
  openDevTools: () => ipcRenderer.send('devtools:open'),

  // ── Platform detection ───────────────────────────────────────────────────
  //
  //  The renderer uses this to decide whether to show Windows-style title-
  //  bar buttons or rely on the macOS traffic lights.

  platform: process.platform,

});
