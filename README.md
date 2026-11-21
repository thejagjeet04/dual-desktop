# DualDesk

Run **two accounts** of WhatsApp, Instagram, Snapchat, Netflix, or Prime Video side by side in a single window — each in a fully isolated session so they never interfere with each other.

---

## How it works

DualDesk is an [Electron](https://electronjs.org) desktop app. It opens two `<webview>` elements side by side, each with its own `persist:` session partition. This gives each account slot its own cookie jar, localStorage, and IndexedDB — identical to opening two separate Chrome profiles. Sessions are saved to disk so you stay logged in between launches.

The app also injects a Chrome User-Agent so WhatsApp Web and other apps don't complain about an "unsupported browser".

---

## Prerequisites

| Tool | Version | Download |
|------|---------|----------|
| Node.js | 18 or 20 LTS | https://nodejs.org |
| npm | comes with Node | — |
| Git | any recent | https://git-scm.com (optional) |

---

## Quick start (run in development)

```bash
# 1. Enter the project folder
cd dualdesk

# 2. Install dependencies (only needed once)
npm install

# 3. Run the app
npm start

# Or run in dev mode (opens DevTools automatically)
npm run dev          # macOS / Linux
npm run dev:win      # Windows
```

---

## First launch — WhatsApp

1. Click the **WhatsApp** icon in the left sidebar.
2. The split-logo animation plays, then two WhatsApp Web panes open.
3. Each pane shows a **QR code**. Open WhatsApp on your phone:
   - **iOS / Android**: Settings → Linked Devices → Link a Device
4. Scan the left QR with your **personal** phone, the right QR with your **business** phone.
5. Done. Both accounts load instantly. They stay logged in on every relaunch.

> **If the QR code expires** before you scan it, click the **↻ Reload** button above that pane.

---

## File structure

```
dualdesk/
├── main.js              ← Electron main process (Node.js backend)
├── preload.js           ← Secure bridge: main ↔ renderer
├── webview-preload.js   ← Injected into every webview (notification interception)
├── index.html           ← App window HTML
├── renderer.js          ← All UI logic (animation, webview management, navigation)
├── styles.css           ← Dark theme styles + animation keyframes
├── package.json         ← Dependencies and build config
└── assets/
    ├── icon.icns        ← macOS app icon (add your own)
    ├── icon.ico         ← Windows app icon (add your own)
    └── icon.png         ← Linux app icon (add your own)
```

---

## Building a distributable installer

> You need icons in `assets/` before building. See "App icons" below.

```bash
# macOS .dmg (Intel + Apple Silicon)
npm run build:mac

# Windows .exe installer
npm run build:win

# Linux .AppImage + .deb
npm run build:linux

# All three platforms at once (requires macOS host for Mac builds)
npm run build:all
```

Output goes to `dist/`.

---

## App icons (required for building)

electron-builder needs icons in specific formats:

- **macOS**: `assets/icon.icns` — use [iconutil](https://developer.apple.com/library/archive/documentation/GraphicsImaging/Conceptual/OpenWithURLs/OpenWithURLs.html) or [Image2icon](https://img2icnsapp.com)
- **Windows**: `assets/icon.ico` — 256×256 minimum; use [IcoFX](https://icofx.ro) or online converters
- **Linux**: `assets/icon.png` — 512×512 PNG

For testing without icons, remove the `"icon"` keys from `package.json`'s `build` section.

---

## Adding more apps

Open `renderer.js` and add an entry to the `APPS` object:

```js
youtube: {
  name:   'YouTube',
  url:    'https://www.youtube.com',
  color:  '#FF0000',
  badge1Color: '#FF0000',
  badge2Color: '#CC0000',
  labels: ['Personal', 'Work'],
  icon32:  `<svg ...32px icon SVG...>`,
  icon108: `<svg ...108px icon SVG...>`,
},
```

Then add `'youtube'` to the `APP_ORDER` array. The sidebar button and animation are generated automatically.

---

## Keyboard shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + 1` | Switch to WhatsApp |
| `Cmd/Ctrl + 2` | Switch to Instagram |
| `Cmd/Ctrl + 3` | Switch to Snapchat |
| `Cmd/Ctrl + 4` | Switch to Netflix |
| `Cmd/Ctrl + 5` | Switch to Prime Video |
| `Cmd/Ctrl + R` | Reload both panes |
| Double-click divider | Reset to 50/50 split |

---

## Logging out of an account

Click **✕ Log out** in the nav bar above the pane. This clears all cookies and local data for that account slot. The webview reloads and shows the login/QR screen again.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Unsupported browser" on WhatsApp | Restart the app — the Chrome UA should be injected. Check `main.js` `configureSession()`. |
| QR code won't scan | Make sure your phone and computer are connected to the internet. Click ↻ Reload if the QR expires. |
| App shows a white flash on startup | Normal on first cold boot; `show: false` + `ready-to-show` in `main.js` minimises this. |
| Notifications not appearing | macOS: grant notification permission in System Settings → Notifications → DualDesk. |
| Webview crashes | The app auto-reloads crashed webviews after 1 second. Check the DevTools console for errors. |

---

## Legal notice

DualDesk is an independent tool that wraps the official web versions of third-party apps. It is **not** affiliated with, endorsed by, or sponsored by WhatsApp, Meta, Instagram, Snap Inc., Netflix, or Amazon. Use it in accordance with each platform's Terms of Service. The app does not automate messages, scrape data, or modify the web apps in any way.

---

## License

MIT — do whatever you want with it.
