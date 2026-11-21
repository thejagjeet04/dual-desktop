'use strict';

const IS_MAC = window.dualDesk?.platform === 'darwin';

// ALWAYS macOS UA — WhatsApp shows "Download for Windows" to any Windows UA
const CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';

// ─── Categories Config & State ───────────────────────────────────────────────
const DEFAULT_CATEGORIES = [
  { id: 'socials', name: 'Socials', icon: '💬', isDefault: true },
  { id: 'entertainment', name: 'Entertainment', icon: '🎬', isDefault: true },
  { id: 'ai_tools', name: 'AI Tools Suite', icon: '🧠', isDefault: true },
  { id: 'custom', name: 'Custom Sites', icon: '🌐', isDefault: true }
];

let CATEGORIES = [];

function loadSavedCategories() {
  let deletedCats = [];
  try {
    deletedCats = JSON.parse(localStorage.getItem('dualdesk_deleted_categories') || '[]');
  } catch(e){}

  try {
    const saved = localStorage.getItem('dualdesk_categories');
    if (saved) {
      CATEGORIES = JSON.parse(saved);
    }
  } catch (e) {
    console.error('Error loading categories', e);
  }
  if (!CATEGORIES || !Array.isArray(CATEGORIES) || (CATEGORIES.length === 0 && deletedCats.length === 0)) {
    CATEGORIES = DEFAULT_CATEGORIES.filter(function(c) { return !deletedCats.includes(c.id); }).map(function(c) { return Object.assign({}, c); });
  } else {
    CATEGORIES = CATEGORIES.filter(function(c) { return !deletedCats.includes(c.id); });
  }
}

function saveCategories() {
  try {
    localStorage.setItem('dualdesk_categories', JSON.stringify(CATEGORIES));
  } catch (e) {
    console.error('Error saving categories', e);
  }
}

function renameCategory(id, newName, newIcon) {
  const cat = CATEGORIES.find(c => c.id === id);
  if (!cat) return;
  cat.name = newName.trim();
  if (newIcon) cat.icon = newIcon.trim();
  saveCategories();
  buildSidebar();
}

function addCategory(name, icon) {
  const id = 'cat_' + Date.now();
  CATEGORIES.push({
    id: id,
    name: name.trim(),
    icon: (icon || '📁').trim(),
    isDefault: false
  });
  saveCategories();
  buildSidebar();
  return id;
}

function deleteCategory(id) {
  const cat = CATEGORIES.find(c => c.id === id);
  if (!cat) return;

  const catApps = APP_ORDER.filter(function(appId) {
    return APPS[appId] && APPS[appId].category === id;
  });

  let confirmMsg = '';
  if (catApps.length > 0) {
    confirmMsg = `Are you sure you want to delete category "${cat.name}" and all ${catApps.length} site(s) inside it?\n\nThis will remove them and free up memory.`;
  } else {
    confirmMsg = `Are you sure you want to delete category "${cat.name}"?`;
  }

  if (!confirm(confirmMsg)) return;

  // 1. Delete all contained apps to release memory, webviews, and session partitions
  catApps.forEach(function(appId) {
    deleteApp(appId, true);
  });

  // 2. Remove category
  CATEGORIES = CATEGORIES.filter(c => c.id !== id);

  // 3. Persist deleted category ID so it never returns on reload
  try {
    let deletedCats = JSON.parse(localStorage.getItem('dualdesk_deleted_categories') || '[]');
    if (!deletedCats.includes(id)) {
      deletedCats.push(id);
      localStorage.setItem('dualdesk_deleted_categories', JSON.stringify(deletedCats));
    }
  } catch(e){}

  saveCategories();
  buildSidebar();
}

const collapsedCategories = {};

// ─── Default Apps Config ───────────────────────────────────────────────────────
const APPS = {
  whatsapp: {
    name:'WhatsApp', url:'https://web.whatsapp.com', color:'#25D366', category:'socials',
    badge1Color:'#25D366', badge2Color:'#00B4D8', labels:['Personal','Business'],
    loadMsg:'WhatsApp is loading…<br>A QR code will appear shortly.',
    icon32:`<svg width="32" height="32" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#25D366"/><path fill="white" d="M50 17C31.8 17 17 31.8 17 50c0 6.4 1.8 12.4 5 17.5L17.5 83 34 78.2c4.9 2.8 10.3 4.3 16 4.3C68.2 82.5 83 67.7 83 49.5 83 31.3 68.2 17 50 17zm.3 60c-5.5 0-10.7-1.5-15-4.2L34 73.5 24 76l2.7-10-1-1.7C23.1 60.5 21.5 55 21.5 50 21.5 34.3 34.3 21.5 50 21.5S78.5 34.3 78.5 50 65.7 77 50.3 77z"/><path fill="white" d="M68 59.1c-.8-.4-4.8-2.4-5.6-2.7-.8-.3-1.3-.4-1.9.5-.6.8-2.2 2.6-2.7 3.2-.5.5-1 .6-1.8.2-.8-.4-3.4-1.3-6.5-4-2.4-2.1-4-4.9-4.5-5.7-.5-.8.1-1.3.4-1.6.3-.3.8-.9 1.2-1.4.4-.5.5-.8.8-1.3.3-.5.1-1-.1-1.4-.2-.4-1.9-4.6-2.6-6.2-.7-1.6-1.4-1.4-1.9-1.4l-1.6-.03c-.5 0-1.4.2-2.2.9-.8.8-3 2.9-3 7s3 7.8 3.4 8.3c.4.5 5.9 9 14.3 12.6 2 .9 3.5 1.4 4.7 1.8 2 .6 3.8.5 5.2.3 1.6-.2 4.8-2 5.5-3.9.7-1.9.7-3.5.5-3.8-.2-.3-.7-.5-1.5-.9z"/></svg>`,
    icon108:`<svg width="108" height="108" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="#25D366"/><path fill="white" d="M50 17C31.8 17 17 31.8 17 50c0 6.4 1.8 12.4 5 17.5L17.5 83 34 78.2c4.9 2.8 10.3 4.3 16 4.3C68.2 82.5 83 67.7 83 49.5 83 31.3 68.2 17 50 17zm.3 60c-5.5 0-10.7-1.5-15-4.2L34 73.5 24 76l2.7-10-1-1.7C23.1 60.5 21.5 55 21.5 50 21.5S78.5 34.3 78.5 50 65.7 77 50.3 77z"/><path fill="white" d="M68 59.1c-.8-.4-4.8-2.4-5.6-2.7-.8-.3-1.3-.4-1.9.5-.6.8-2.2 2.6-2.7 3.2-.5.5-1 .6-1.8.2-.8-.4-3.4-1.3-6.5-4-2.4-2.1-4-4.9-4.5-5.7-.5-.8.1-1.3.4-1.6.3-.3.8-.9 1.2-1.4.4-.5.5-.8.8-1.3.3-.5.1-1-.1-1.4-.2-.4-1.9-4.6-2.6-6.2-.7-1.6-1.4-1.4-1.9-1.4l-1.6-.03c-.5 0-1.4.2-2.2.9-.8.8-3 2.9-3 7s3 7.8 3.4 8.3c.4.5 5.9 9 14.3 12.6 2 .9 3.5 1.4 4.7 1.8 2 .6 3.8.5 5.2.3 1.6-.2 4.8-2 5.5-3.9.7-1.9.7-3.5.5-3.8-.2-.3-.7-.5-1.5-.9z"/></svg>`,
  },
  instagram: {
    name:'Instagram', url:'https://www.instagram.com', color:'#E1306C', category:'socials',
    badge1Color:'#E1306C', badge2Color:'#833AB4', labels:['Main','Creator'],
    loadMsg:'Instagram is loading…',
    icon32:`<svg width="32" height="32" viewBox="0 0 100 100"><defs><linearGradient id="ig32" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#FFDB2C"/><stop offset="50%" stop-color="#F2335B"/><stop offset="100%" stop-color="#6C56F2"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(#ig32)"/><rect x="14" y="14" width="72" height="72" rx="19" fill="none" stroke="white" stroke-width="7"/><circle cx="50" cy="50" r="19" fill="none" stroke="white" stroke-width="7"/><circle cx="74" cy="26" r="6" fill="white"/></svg>`,
    icon108:`<svg width="108" height="108" viewBox="0 0 100 100"><defs><linearGradient id="ig108" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stop-color="#FFDB2C"/><stop offset="50%" stop-color="#F2335B"/><stop offset="100%" stop-color="#6C56F2"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(#ig108)"/><rect x="14" y="14" width="72" height="72" rx="19" fill="none" stroke="white" stroke-width="7"/><circle cx="50" cy="50" r="19" fill="none" stroke="white" stroke-width="7"/><circle cx="74" cy="26" r="6" fill="white"/></svg>`,
  },
  snapchat: {
    name:'Snapchat', url:'https://web.snapchat.com', color:'#FFFC00', category:'socials',
    badge1Color:'#FFFC00', badge2Color:'#FF6900', labels:['Personal','Public'],
    loadMsg:'Snapchat is loading…',
    icon32:`<svg width="32" height="32" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#FFFC00"/><path fill="#000" d="M50 20c-5 0-15 2.5-15 18v4c-1 .6-2.2.9-3.5.9-1.3 0-2.5-.8-2.5-.8s-.3 4.5 3.5 5.9c0 0-.5 5.5 6 9.5 0 0-2 1.2-2 3.5s4.5 3.5 8 3.5c0 0 2.5 4.5 5.5 4.5s5.5-4.5 5.5-4.5c3.5 0 8-1.2 8-3.5s-2-3.5-2-3.5c6.5-4 6-9.5 6-9.5 3.8-1.4 3.5-5.9 3.5-5.9s-1.2.8-2.5.8c-1.3 0-2.5-.3-3.5-.9v-4c0-15.5-10-18-15-18z"/></svg>`,
    icon108:`<svg width="108" height="108" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#FFFC00"/><path fill="#000" d="M50 20c-5 0-15 2.5-15 18v4c-1 .6-2.2.9-3.5.9-1.3 0-2.5-.8-2.5-.8s-.3 4.5 3.5 5.9c0 0-.5 5.5 6 9.5 0 0-2 1.2-2 3.5s4.5 3.5 8 3.5c0 0 2.5 4.5 5.5 4.5s5.5-4.5 5.5-4.5c3.5 0 8-1.2 8-3.5s-2-3.5-2-3.5c6.5-4 6-9.5 6-9.5 3.8-1.4 3.5-5.9 3.5-5.9s-1.2.8-2.5.8c-1.3 0-2.5-.3-3.5-.9v-4c0-15.5-10-18-15-18z"/></svg>`,
  },
  netflix: {
    name:'Netflix', url:'https://www.netflix.com', color:'#E50914', category:'entertainment',
    badge1Color:'#E50914', badge2Color:'#B20710', labels:['Home','Work'],
    loadMsg:'Netflix is loading…',
    icon32:`<svg width="32" height="32" viewBox="0 0 100 100"><rect width="100" height="100" rx="12" fill="#141414"/><path fill="#E50914" d="M24 18h17l17 54V18h18v64h-17L42 28v54H24z"/></svg>`,
    icon108:`<svg width="108" height="108" viewBox="0 0 100 100"><rect width="100" height="100" rx="12" fill="#141414"/><path fill="#E50914" d="M24 18h17l17 54V18h18v64h-17L42 28v54H24z"/></svg>`,
  },
  prime: {
    name:'Prime Video', url:'https://www.primevideo.com', color:'#00A8E0', category:'entertainment',
    badge1Color:'#00A8E0', badge2Color:'#0077A8', labels:['Account 1','Account 2'],
    loadMsg:'Prime Video is loading…',
    icon32:`<svg width="32" height="32" viewBox="0 0 100 100"><rect width="100" height="100" rx="12" fill="#232F3E"/><text x="8" y="56" font-size="25" font-weight="700" font-family="Arial,sans-serif" fill="#fff">prime</text><path d="M8 75 Q50 88 92 75" stroke="#00A8E0" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`,
    icon108:`<svg width="108" height="108" viewBox="0 0 100 100"><rect width="100" height="100" rx="12" fill="#232F3E"/><text x="6" y="52" font-size="24" font-weight="700" font-family="Arial,sans-serif" fill="#fff">prime</text><text x="6" y="70" font-size="16" font-family="Arial,sans-serif" fill="#00A8E0">video</text><path d="M6 80 Q50 93 94 80" stroke="#00A8E0" stroke-width="3.5" fill="none" stroke-linecap="round"/></svg>`,
  },
  claude: {
    name:'Claude AI', url:'https://claude.ai', color:'#D97706', category:'ai_tools',
    badge1Color:'#D97706', badge2Color:'#B45309', labels:['Account 1','Account 2'],
    loadMsg:'Claude AI is loading…',
    icon32:`<svg width="32" height="32" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#D97706"/><text x="50%" y="68%" font-size="52" font-weight="900" font-family="sans-serif" fill="#fff" text-anchor="middle">C</text></svg>`,
    icon108:`<svg width="108" height="108" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#D97706"/><text x="50%" y="68%" font-size="52" font-weight="900" font-family="sans-serif" fill="#fff" text-anchor="middle">C</text></svg>`,
  },
  chatgpt: {
    name:'ChatGPT', url:'https://chatgpt.com', color:'#10A37F', category:'ai_tools',
    badge1Color:'#10A37F', badge2Color:'#059669', labels:['Account 1','Account 2'],
    loadMsg:'ChatGPT is loading…',
    icon32:`<svg width="32" height="32" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#10A37F"/><circle cx="50" cy="50" r="24" fill="none" stroke="white" stroke-width="6"/><path fill="white" d="M50 30 L50 70 M30 50 L70 50"/></svg>`,
    icon108:`<svg width="108" height="108" viewBox="0 0 100 100"><rect width="100" height="100" rx="22" fill="#10A37F"/><circle cx="50" cy="50" r="24" fill="none" stroke="white" stroke-width="6"/><path fill="white" d="M50 30 L50 70 M30 50 L70 50"/></svg>`,
  },
  gemini: {
    name:'Google Gemini', url:'https://gemini.google.com', color:'#10B981', category:'ai_tools',
    badge1Color:'#10B981', badge2Color:'#059669', labels:['Account 1','Account 2'],
    loadMsg:'Google Gemini is loading…',
    icon32:`<svg width="32" height="32" viewBox="0 0 100 100"><defs><linearGradient id="gem32" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1A73E8"/><stop offset="100%" stop-color="#D93025"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(#gem32)"/><path fill="#fff" d="M50 20 L58 42 L80 50 L58 58 L50 80 L42 58 L20 50 L42 42 Z"/></svg>`,
    icon108:`<svg width="108" height="108" viewBox="0 0 100 100"><defs><linearGradient id="gem108" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#1A73E8"/><stop offset="100%" stop-color="#D93025"/></linearGradient></defs><rect width="100" height="100" rx="22" fill="url(#gem108)"/><path fill="#fff" d="M50 20 L58 42 L80 50 L58 58 L50 80 L42 58 L20 50 L42 42 Z"/></svg>`,
  },
};

let APP_ORDER = ['whatsapp','instagram','snapchat','netflix','prime','claude','chatgpt','gemini'];

function createCustomIcon(name, is108, customColor) {
  var sz = is108 ? 108 : 32;
  var letter = (name.trim().charAt(0) || 'W').toUpperCase();
  var colors = ['#3B82F6', '#8B5CF6', '#EC4899', '#10B981', '#F59E0B', '#6366F1'];
  var bg = customColor || colors[letter.charCodeAt(0) % colors.length];
  var fontSize = is108 ? 54 : 18;
  var yPos = is108 ? 72 : 23;
  return `<svg width="${sz}" height="${sz}" viewBox="0 0 ${sz} ${sz}"><rect width="${sz}" height="${sz}" rx="${is108?24:8}" fill="${bg}"/><text x="50%" y="${yPos}" font-size="${fontSize}" font-weight="800" font-family="-apple-system,BlinkMacSystemFont,sans-serif" fill="#fff" text-anchor="middle">${letter}</text></svg>`;
}

function loadSavedCustomApps() {
  try {
    var saved = localStorage.getItem('dualdesk_custom_apps');
    if (saved) {
      var list = JSON.parse(saved);
      var uniqueList = [];
      var seen = new Set();

      list.forEach(function(item) {
        var key = ((item.name || '') + '_' + (item.url || '')).toLowerCase();
        if (key && !seen.has(key)) {
          seen.add(key);
          uniqueList.push(item);
        }
      });

      localStorage.setItem('dualdesk_custom_apps', JSON.stringify(uniqueList));

      uniqueList.forEach(function(item) {
        if (!APPS[item.id]) {
          var catId = item.category || 'custom';
          var color = item.color || '#3B82F6';
          APPS[item.id] = {
            name: item.name,
            url: item.url,
            color: color,
            category: catId,
            badge1Color: color,
            badge2Color: '#8B5CF6',
            labels: ['Account 1', 'Account 2'],
            loadMsg: item.name + ' is loading…',
            icon32: item.icon32 || createCustomIcon(item.name, false, color),
            icon108: item.icon108 || createCustomIcon(item.name, true, color)
          };
          if (!APP_ORDER.includes(item.id)) APP_ORDER.push(item.id);
        }
      });
    }
  } catch(e) { console.error('Error loading custom apps', e); }
}

function saveCustomApp(name, url, category, customColor) {
  var id = 'custom_' + Date.now();
  var catId = category || 'custom';
  var color = customColor || '#3B82F6';
  var icon32 = createCustomIcon(name, false, color);
  var icon108 = createCustomIcon(name, true, color);

  var appObj = {
    id: id,
    name: name,
    url: url,
    category: catId,
    color: color
  };

  APPS[id] = {
    name: name,
    url: url,
    color: color,
    category: catId,
    badge1Color: color,
    badge2Color: '#8B5CF6',
    labels: ['Account 1', 'Account 2'],
    loadMsg: name + ' is loading…',
    icon32: icon32,
    icon108: icon108
  };

  APP_ORDER.push(id);

  try {
    var currentSaved = JSON.parse(localStorage.getItem('dualdesk_custom_apps') || '[]');
    currentSaved.push(appObj);
    localStorage.setItem('dualdesk_custom_apps', JSON.stringify(currentSaved));
  } catch(e){}

  buildSidebar();
  selectApp(id);
}

function getFirstAvailableApp() {
  return APP_ORDER[0] || null;
}

function filterDeletedApps() {
  try {
    const deletedApps = JSON.parse(localStorage.getItem('dualdesk_deleted_apps') || '[]');
    if (Array.isArray(deletedApps) && deletedApps.length > 0) {
      deletedApps.forEach(function(delId) {
        delete APPS[delId];
        APP_ORDER = APP_ORDER.filter(function(id) { return id !== delId; });
      });
    }
  } catch(e) {
    console.error('Error filtering deleted apps', e);
  }
}

function deleteApp(id, skipConfirm) {
  if (!APPS[id]) return;

  const appName = APPS[id].name;
  if (!skipConfirm) {
    if (!confirm(`Are you sure you want to delete "${appName}"? This will close any active sessions and free up memory.`)) {
      return;
    }
  }

  // 1. Purge all cached and active webviews for this app
  Object.keys(webviewCache).forEach(function(key) {
    if (key.startsWith(id + '-') || key.startsWith(id + '_') || key === id) {
      try {
        const wv = webviewCache[key];
        if (wv && wv.remove) wv.remove();
      } catch(x){}
      delete webviewCache[key];
    }
  });

  // 2. Clear partition sessions via Electron IPC to release disk and RAM
  if (window.dualDesk && typeof window.dualDesk.clearSession === 'function') {
    for (let col = 0; col < 4; col++) {
      for (let tab = 1; tab <= 10; tab++) {
        window.dualDesk.clearSession(`persist:${id}-col${col}-tab${tab}`).catch(function(){});
      }
    }
    window.dualDesk.clearSession(`persist:${id}-1`).catch(function(){});
    window.dualDesk.clearSession(`persist:${id}-2`).catch(function(){});
    window.dualDesk.clearSession(`persist:${id}`).catch(function(){});
  }

  // 3. Persist deleted app ID so default or custom apps stay deleted across restarts
  try {
    let deletedApps = JSON.parse(localStorage.getItem('dualdesk_deleted_apps') || '[]');
    if (!deletedApps.includes(id)) {
      deletedApps.push(id);
      localStorage.setItem('dualdesk_deleted_apps', JSON.stringify(deletedApps));
    }
  } catch(e){}

  // 4. Also clean up custom app localStorage if applicable
  try {
    let saved = JSON.parse(localStorage.getItem('dualdesk_custom_apps') || '[]');
    saved = saved.filter(function(item) { return item.id !== id; });
    localStorage.setItem('dualdesk_custom_apps', JSON.stringify(saved));
  } catch(e){}

  // 5. Remove from in-memory state
  delete APPS[id];
  APP_ORDER = APP_ORDER.filter(function(itemId) { return itemId !== id; });

  // 6. Handle active panes
  const fallbackApp = getFirstAvailableApp();
  paneColumns.forEach(function(p) {
    if (p.appId === id) {
      p.appId = fallbackApp || 'custom';
    }
  });

  if (paneColumns.length < 2 && fallbackApp) {
    paneColumns = [
      { id: 'pane-1', appId: fallbackApp, tabId: 1, label: 'Account 1' },
      { id: 'pane-2', appId: fallbackApp, tabId: 1, label: 'Account 2' }
    ];
  }

  if (currentApp === id) {
    if (fallbackApp) {
      selectApp(fallbackApp);
    } else {
      currentApp = null;
      setPhase('idle');
    }
  } else if (currentPhase === 'active') {
    activatePanes();
  }

  buildSidebar();
  try { saveCurrentWorkspaceState(); } catch(e){}
}

const deleteCustomApp = deleteApp;

function restoreDefaultAppsAndCategories() {
  if (!confirm('Reset all default sites and categories back to factory settings? (Your custom websites will be kept)')) return;
  try {
    localStorage.removeItem('dualdesk_deleted_apps');
    localStorage.removeItem('dualdesk_deleted_categories');
    localStorage.removeItem('dualdesk_categories');
  } catch(e){}
  location.reload();
}

// ─── Dynamic Side-by-Side Screen Columns State ────────────────────────────────
let currentApp   = null;
let currentPhase = 'idle';
let pickerTargetIndex = null;
let isMutedMap   = {};

let paneColumns = [
  { id: 'pane-1', appId: 'whatsapp', tabId: 1, label: 'Account 1' },
  { id: 'pane-2', appId: 'whatsapp', tabId: 1, label: 'Account 2' }
];

// Tabs per pane index
const paneTabsMap = {
  0: { activeTabId: 1, nextId: 2, items: [{ id: 1, label: 'Account 1' }] },
  1: { activeTabId: 1, nextId: 2, items: [{ id: 1, label: 'Account 2' }] },
  2: { activeTabId: 1, nextId: 2, items: [{ id: 1, label: 'Account 3' }] },
  3: { activeTabId: 1, nextId: 2, items: [{ id: 1, label: 'Account 4' }] }
};

const webviewCache = {};            // key: `${appId}-col${colIndex}-tab${tabId}`

// ─── DOM refs ──────────────────────────────────────────────────────────────────
const $welcome  = document.getElementById('welcome');
const $overlay  = document.getElementById('anim-overlay');
const $panes    = document.getElementById('panes');

function toggleSidebar(forceExpand) {
  const sidebar = document.getElementById('sidebar');
  const toggleBtn = document.getElementById('toggle-sidebar-btn');
  const brand = document.getElementById('brand');
  const floatD2Btn = document.getElementById('floating-d2-btn');
  if (!sidebar) return;

  sidebar.classList.remove('sidebar-hidden');
  if (floatD2Btn) floatD2Btn.style.display = 'none';

  let shouldExpand;
  if (forceExpand !== undefined) {
    shouldExpand = !!forceExpand;
  } else {
    shouldExpand = sidebar.classList.contains('sidebar-collapsed');
  }

  if (shouldExpand) {
    sidebar.classList.remove('sidebar-collapsed');
    if (toggleBtn) {
      toggleBtn.title = 'Collapse Sidebar (≪)';
      toggleBtn.setAttribute('aria-label', 'Collapse Sidebar');
      toggleBtn.textContent = '≪';
    }
    if (brand) brand.title = 'DualDesk Home';
    try { localStorage.setItem('dualdesk_sidebar_state', 'expanded'); } catch(e){}
  } else {
    sidebar.classList.add('sidebar-collapsed');
    if (toggleBtn) {
      toggleBtn.title = 'Expand Sidebar (≫)';
      toggleBtn.setAttribute('aria-label', 'Expand Sidebar');
      toggleBtn.textContent = '≫';
    }
    if (brand) brand.title = 'Click to Expand Sidebar';
    try { localStorage.setItem('dualdesk_sidebar_state', 'collapsed'); } catch(e){}
  }
}

// ─── Sidebar Collapsible Categories & Welcome Dashboard ─────────────────────
function buildSidebar() {
  const container = document.getElementById('app-icons');
  if (container) container.innerHTML = '';

  const toggleBtn = document.getElementById('toggle-sidebar-btn');
  if (toggleBtn) {
    toggleBtn.onclick = function(e) {
      e.stopPropagation();
      toggleSidebar();
    };
  }

  CATEGORIES.forEach(function(cat) {
    const catApps = APP_ORDER.filter(function(id) {
      const app = APPS[id];
      if (!app) return false;
      if (app.category) return app.category === cat.id;
      if (cat.id === 'custom') return id.startsWith('custom_');
      return false;
    });

    const group = document.createElement('div');
    group.className = 'cat-group';
    group.dataset.catId = cat.id;

    const header = document.createElement('div');
    header.className = 'cat-header' + (collapsedCategories[cat.id] ? ' collapsed' : '');
    header.title = 'Click to expand/collapse ' + cat.name + ' (double click to rename, right-click for menu)';

    const leftPart = document.createElement('div');
    leftPart.className = 'cat-header-left';
    leftPart.innerHTML = '<span class="cat-arrow">▼</span><span class="cat-title">' + (cat.icon ? cat.icon + ' ' : '') + cat.name + ' <span class="cat-count">(' + catApps.length + ')</span></span>';

    // Double-click inline rename
    leftPart.addEventListener('dblclick', function(e) {
      e.stopPropagation();
      const currentName = cat.name;
      leftPart.innerHTML = '<span class="cat-arrow">▼</span><input class="cat-inline-input" type="text" value="' + currentName + '" style="background:rgba(0,0,0,0.7); border:1px solid #00f0ff; color:#fff; font-size:10.5px; font-weight:700; border-radius:4px; padding:2px 4px; width:75px; outline:none; font-family:inherit;">';
      const input = leftPart.querySelector('input');
      if (input) {
        input.focus();
        input.select();
        let finished = false;
        function finishRename() {
          if (finished) return;
          finished = true;
          const val = input.value.trim();
          if (val && val !== currentName) {
            renameCategory(cat.id, val, cat.icon);
          } else {
            buildSidebar();
          }
        }
        input.onkeydown = function(ke) {
          if (ke.key === 'Enter') finishRename();
          if (ke.key === 'Escape') buildSidebar();
        };
        input.onblur = finishRename;
      }
    });

    header.oncontextmenu = function(e) {
      if (window.openCategoryContextMenu) window.openCategoryContextMenu(e, cat.id);
    };

    const actionsPart = document.createElement('div');
    actionsPart.className = 'cat-header-actions';

    const addAppBtn = document.createElement('button');
    addAppBtn.className = 'cat-action-btn btn-cat-add';
    addAppBtn.innerHTML = '+';
    addAppBtn.title = 'Add website to ' + cat.name;
    addAppBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (window.openCustomAppModal) window.openCustomAppModal(cat.id);
    });

    const editCatBtn = document.createElement('button');
    editCatBtn.className = 'cat-action-btn btn-cat-edit';
    editCatBtn.innerHTML = '✎';
    editCatBtn.title = 'Edit ' + cat.name + ' (name & icon)';
    editCatBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      if (window.openCategoryModal) window.openCategoryModal(cat.id);
    });

    actionsPart.appendChild(addAppBtn);
    actionsPart.appendChild(editCatBtn);

    const delCatBtn = document.createElement('button');
    delCatBtn.className = 'cat-action-btn btn-cat-del';
    delCatBtn.innerHTML = '✕';
    delCatBtn.title = 'Delete category ' + cat.name;
    delCatBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      deleteCategory(cat.id);
    });
    actionsPart.appendChild(delCatBtn);

    header.appendChild(leftPart);
    header.appendChild(actionsPart);

    const appsWrap = document.createElement('div');
    appsWrap.className = 'cat-apps' + (collapsedCategories[cat.id] ? ' hidden' : '');

    leftPart.onclick = function() {
      collapsedCategories[cat.id] = !collapsedCategories[cat.id];
      header.classList.toggle('collapsed', collapsedCategories[cat.id]);
      appsWrap.classList.toggle('hidden', collapsedCategories[cat.id]);
    };

    if (catApps.length === 0) {
      const emptyBtn = document.createElement('button');
      emptyBtn.className = 'cat-empty-btn';
      emptyBtn.innerHTML = '+ Add Website';
      emptyBtn.title = 'Add website to ' + cat.name;
      emptyBtn.addEventListener('click', function() {
        if (window.openCustomAppModal) window.openCustomAppModal(cat.id);
      });
      appsWrap.appendChild(emptyBtn);
    } else {
      catApps.forEach(function(id) {
        const app = APPS[id];
        const btn = document.createElement('button');
        btn.className = 'app-btn';
        btn.id        = 'btn-' + id;
        btn.title     = app.name + ' (Right click for screen options)';
        btn.innerHTML = app.icon32 +
          '<span class="app-btn-label">' + app.name.replace(' Video','') + '</span>' +
          '<div class="active-dot" id="dot-' + id + '" style="display:none"></div>';

        const delBtn = document.createElement('span');
        delBtn.className = 'delete-app-btn';
        delBtn.innerHTML = '✕';
        delBtn.title = 'Delete ' + app.name + ' (frees memory)';
        delBtn.addEventListener('click', function(e) {
          e.stopPropagation();
          deleteApp(id);
        });
        btn.appendChild(delBtn);

        btn.oncontextmenu = function(e) {
          if (window.openAppContextMenu) window.openAppContextMenu(e, id);
        };

        btn.addEventListener('click', function() { selectApp(id); });
        appsWrap.appendChild(btn);
      });

      // Quick "+ Add to Category" button at bottom of list
      const addMoreBtn = document.createElement('button');
      addMoreBtn.className = 'cat-add-more-btn';
      addMoreBtn.innerHTML = '+ Add to ' + cat.name;
      addMoreBtn.title = 'Add another website to ' + cat.name;
      addMoreBtn.addEventListener('click', function() {
        if (window.openCustomAppModal) window.openCustomAppModal(cat.id);
      });
      appsWrap.appendChild(addMoreBtn);
    }

    group.appendChild(header);
    group.appendChild(appsWrap);
    if (container) container.appendChild(group);
  });

  const wi = document.getElementById('welcome-icons');
  if (wi) {
    wi.innerHTML = '';
    APP_ORDER.slice(0, 6).forEach(function(id) {
      if (APPS[id]) {
        const d = document.createElement('div');
        d.innerHTML = APPS[id].icon32;
        wi.appendChild(d);
      }
    });
  }

  const qg = document.getElementById('quick-launch-grid');
  if (qg) {
    qg.innerHTML = '';
    APP_ORDER.forEach(function(id) {
      const app = APPS[id];
      if (app) {
        const qCard = document.createElement('button');
        qCard.className = 'quick-launch-card';
        qCard.innerHTML = app.icon32 + '<span>Launch ' + app.name + '</span>';
        qCard.addEventListener('click', function() { selectApp(id); });
        qg.appendChild(qCard);
      }
    });
  }

  setupPresets();
  buildAppPicker();
  setupColumnEvents();
}

function updateSidebar(appId) {
  APP_ORDER.forEach(function(id) {
    const btn = document.getElementById('btn-' + id);
    const dot = document.getElementById('dot-' + id);
    if (btn) btn.classList.toggle('active', id === appId);
    if (dot) {
      var allSame = paneColumns.every(p => p.appId === appId);
      dot.style.display = (allSame && currentPhase === 'active') ? 'block' : 'none';
      if (dot.style.display === 'block') dot.style.background = APPS[id].color;
    }
  });
}

function setupColumnEvents() {
  var addColBtn = document.getElementById('add-column-btn');
  if (addColBtn) {
    addColBtn.onclick = function() { addPaneColumn(); };
  }
  [1, 2, 3, 4].forEach(function(num) {
    var lBtn = document.getElementById('layout-btn-' + num);
    if (lBtn) {
      lBtn.onclick = function() { setColumnLayout(num); };
    }
  });
}

function setColumnLayout(count) {
  var fallback = getFirstAvailableApp() || 'whatsapp';
  var appToUse = (currentApp && APPS[currentApp]) ? currentApp : ((paneColumns[0] && paneColumns[0].appId && APPS[paneColumns[0].appId]) ? paneColumns[0].appId : fallback);
  var newCols = [];
  for (var i = 0; i < count; i++) {
    newCols.push({
      id: 'pane-' + (i + 1),
      appId: (paneColumns[i] && paneColumns[i].appId && APPS[paneColumns[i].appId]) ? paneColumns[i].appId : appToUse,
      tabId: 1,
      label: 'Account ' + (i + 1)
    });
    if (!paneTabsMap[i]) {
      paneTabsMap[i] = { activeTabId: 1, nextId: 2, items: [{ id: 1, label: 'Account ' + (i + 1) }] };
    }
  }
  paneColumns = newCols;
  setPhase('active');
}

function addPaneColumn() {
  if (paneColumns.length >= 4) return;
  var idx = paneColumns.length;
  var fallback = getFirstAvailableApp() || 'whatsapp';
  var appToUse = (currentApp && APPS[currentApp]) ? currentApp : ((paneColumns[0] && paneColumns[0].appId && APPS[paneColumns[0].appId]) ? paneColumns[0].appId : fallback);

  paneColumns.push({
    id: 'pane-' + (idx + 1),
    appId: appToUse,
    tabId: 1,
    label: 'Account ' + (idx + 1)
  });

  if (!paneTabsMap[idx]) {
    paneTabsMap[idx] = { activeTabId: 1, nextId: 2, items: [{ id: 1, label: 'Account ' + (idx + 1) }] };
  }

  setPhase('active');
}

function removePaneColumn(index) {
  if (paneColumns.length <= 1) return;
  paneColumns.splice(index, 1);
  activatePanes();
}

// ─── Workspace Presets ─────────────────────────────────────────────────────────
function setupPresets() {
  var pSocial = document.getElementById('preset-social');
  var pMedia  = document.getElementById('preset-media');
  var pWork   = document.getElementById('preset-work');

  if (pSocial) {
    pSocial.onclick = function() { launchPresetPair('whatsapp', 'instagram'); };
  }
  if (pMedia) {
    pMedia.onclick = function() { launchPresetPair('netflix', 'prime'); };
  }
  if (pWork) {
    pWork.onclick = function() { launchPresetPair('claude', 'chatgpt'); };
  }
}

function launchPresetPair(leftId, rightId) {
  hideAppPicker();
  const validLeft = APPS[leftId] ? leftId : getFirstAvailableApp();
  const validRight = APPS[rightId] ? rightId : (getFirstAvailableApp() || validLeft);
  if (!validLeft || !validRight) return;
  paneColumns = [
    { id: 'pane-1', appId: validLeft, tabId: 1, label: 'Account 1' },
    { id: 'pane-2', appId: validRight, tabId: 1, label: 'Account 2' }
  ];
  currentApp = (validLeft === validRight) ? validLeft : null;
  setPhase('active');
}

// ─── App Picker Dropdown ───────────────────────────────────────────────────────
function buildAppPicker() {
  const picker = document.getElementById('app-picker');
  if (!picker) return;
  picker.innerHTML = '';
  APP_ORDER.forEach(function(id) {
    const app = APPS[id];
    const row = document.createElement('button');
    row.className = 'picker-row';
    row.dataset.appId = id;
    row.innerHTML = app.icon32 + '<span>' + app.name + '</span>';

    const delRowBtn = document.createElement('span');
    delRowBtn.style.cssText = 'margin-left:auto;font-size:11px;color:#ff7b72;padding:2px 6px;border-radius:4px;background:rgba(248,81,73,0.15);';
    delRowBtn.innerHTML = '✕';
    delRowBtn.title = 'Delete ' + app.name;
    delRowBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      hideAppPicker();
      deleteApp(id);
    });
    row.appendChild(delRowBtn);

    row.addEventListener('click', function(e) {
      e.stopPropagation();
      swapPaneApp(pickerTargetIndex, id);
    });
    picker.appendChild(row);
  });
}

function showAppPicker(colIndex, anchor) {
  if (currentPhase !== 'active') return;
  pickerTargetIndex = colIndex;
  const picker = document.getElementById('app-picker');
  if (!anchor || !picker) return;

  const rect = anchor.getBoundingClientRect();
  picker.style.left = rect.left + 'px';
  picker.style.top  = (rect.bottom + 6) + 'px';

  picker.querySelectorAll('.picker-row').forEach(function(row) {
    row.classList.toggle('picker-active', row.dataset.appId === paneColumns[colIndex].appId);
  });

  picker.hidden = false;
}

function hideAppPicker() {
  var picker = document.getElementById('app-picker');
  if (picker) picker.hidden = true;
  pickerTargetIndex = null;
}

function swapPaneApp(colIndex, appId) {
  if (colIndex === null || colIndex === undefined || !appId) return;
  hideAppPicker();

  paneColumns[colIndex].appId = appId;
  activatePanes();
}

// ─── Dynamic Side-by-Side Screen Column Rendering ─────────────────────────────
function setPhase(phase) {
  currentPhase = phase;

  $welcome.hidden = (phase !== 'idle');
  $overlay.hidden = true;
  $panes.hidden   = (phase !== 'active');

  var topBar = document.getElementById('panes-top-bar');
  if (topBar) {
    topBar.style.display = (phase === 'active') ? 'flex' : 'none';
  }

  $welcome.style.display = (phase === 'idle') ? 'flex' : 'none';
  $overlay.style.display = 'none';
  $panes.style.display   = (phase === 'active') ? 'flex' : 'none';

  if (phase === 'active') activatePanes();
  updateSidebar(paneColumns.every(p => p.appId === paneColumns[0].appId) ? paneColumns[0].appId : null);
}

function selectApp(id) {
  hideAppPicker();
  currentApp = id;

  paneColumns = [
    { id: 'pane-1', appId: id, tabId: 1, label: 'Account 1' },
    { id: 'pane-2', appId: id, tabId: 1, label: 'Account 2' }
  ];

  setPhase('active');
}

function saveCurrentWorkspaceState() {
  try {
    const state = {
      appId: currentApp,
      columns: paneColumns.map(c => ({ appId: c.appId, tabId: c.tabId || 1, label: c.label }))
    };
    localStorage.setItem('dualdesk_active_workspace', JSON.stringify(state));
  } catch(e) {}
}

function restoreLastWorkspaceOrSelect(defaultApp) {
  const fallback = defaultApp || getFirstAvailableApp() || 'whatsapp';
  try {
    var saved = localStorage.getItem('dualdesk_active_workspace');
    if (saved) {
      var parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.columns) && parsed.columns.length > 0) {
        paneColumns = parsed.columns.map((c, i) => ({
          id: 'pane-' + (i + 1),
          appId: (c.appId && APPS[c.appId]) ? c.appId : fallback,
          tabId: c.tabId || 1,
          label: c.label || ('Account ' + (i + 1))
        }));
        currentApp = (parsed.appId && APPS[parsed.appId]) ? parsed.appId : null;
        setPhase('active');
        return;
      }
    }
  } catch(e) {}
  selectApp(fallback);
}

function activatePanes() {
  saveCurrentWorkspaceState();
  var container = document.getElementById('panes-columns');
  if (!container) return;
  container.innerHTML = '';
  var count = paneColumns.length;

  var countTitle = document.getElementById('panes-count-title');
  if (countTitle) {
    if (count === 1) countTitle.textContent = '1 Screen (Single Display)';
    else countTitle.textContent = count + ' Screens Side-by-Side on your Display';
  }

  for (var i = 1; i <= 4; i++) {
    var lBtn = document.getElementById('layout-btn-' + i);
    if (lBtn) lBtn.classList.toggle('active', i === count);
  }

  var addColBtn = document.getElementById('add-column-btn');
  if (addColBtn) {
    if (count >= 4) {
      addColBtn.style.display = 'none';
    } else {
      addColBtn.style.display = 'block';
      addColBtn.textContent = '+ Add ' + (count + 1) + (count === 1 ? 'nd' : (count === 2 ? 'rd' : 'th')) + ' Screen Column';
    }
  }

  paneColumns.forEach(function(col, idx) {
    var pane = document.createElement('div');
    pane.className = 'pane';
    pane.id = 'pane-col-' + idx;

    var nav = document.createElement('div');
    nav.className = 'pane-nav';

    var appBtn = document.createElement('button');
    appBtn.className = 'pane-app-btn';
    appBtn.innerHTML = APPS[col.appId] ? APPS[col.appId].icon32 : '';
    appBtn.title = 'Change app for screen ' + (idx + 1);
    appBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      showAppPicker(idx, appBtn);
    });
    nav.appendChild(appBtn);

    var sep1 = document.createElement('div');
    sep1.className = 'nav-sep';
    nav.appendChild(sep1);

    var tabsStrip = document.createElement('div');
    tabsStrip.className = 'tab-strip';
    renderColTabs(idx, tabsStrip);
    nav.appendChild(tabsStrip);

    var addTabBtn = document.createElement('button');
    addTabBtn.className = 'add-tab-btn';
    addTabBtn.textContent = '+';
    addTabBtn.title = 'Add another account tab';
    addTabBtn.addEventListener('click', function() { addColTab(idx, tabsStrip); });
    nav.appendChild(addTabBtn);

    var sep2 = document.createElement('div');
    sep2.className = 'nav-sep';
    nav.appendChild(sep2);

    var reloadBtn = document.createElement('button');
    reloadBtn.className = 'nav-btn';
    reloadBtn.textContent = '↻';
    reloadBtn.title = 'Reload this screen';
    reloadBtn.addEventListener('click', function() {
      var wv = getOrCreateColWebview(col.appId, idx, paneTabsMap[idx].activeTabId, wrap);
      if (wv) { if (wv.reload) wv.reload(); else wv.src = wv.src; }
    });
    nav.appendChild(reloadBtn);

    var urlDisp = document.createElement('div');
    urlDisp.className = 'url-display';
    try { urlDisp.textContent = new URL(APPS[col.appId].url).hostname; } catch(x){}
    nav.appendChild(urlDisp);

    var popBtn = document.createElement('button');
    popBtn.className = 'nav-btn';
    popBtn.innerHTML = '⧉';
    popBtn.title = 'Open website in external window / tab';
    popBtn.addEventListener('click', function() {
      window.open(APPS[col.appId].url, '_blank');
    });
    nav.appendChild(popBtn);

    var muteBtn = document.createElement('button');
    muteBtn.className = 'nav-btn';
    muteBtn.textContent = isMutedMap[idx] ? '🔇' : '🔊';
    muteBtn.title = 'Toggle mute audio';
    muteBtn.addEventListener('click', function() {
      isMutedMap[idx] = !isMutedMap[idx];
      muteBtn.textContent = isMutedMap[idx] ? '🔇' : '🔊';
      var wv = getOrCreateColWebview(col.appId, idx, paneTabsMap[idx].activeTabId, wrap);
      if (wv) { try { if (wv.setAudioMuted) wv.setAudioMuted(isMutedMap[idx]); else wv.muted = isMutedMap[idx]; } catch(x){} }
    });
    nav.appendChild(muteBtn);

    var badge = document.createElement('span');
    badge.className = 'acct-badge';
    badge.textContent = 'Screen ' + (idx + 1);
    badge.style.background = APPS[col.appId] ? APPS[col.appId].color : '#3B82F6';
    badge.style.color = (APPS[col.appId] && APPS[col.appId].color === '#FFFC00') ? '#000' : '#fff';
    nav.appendChild(badge);

    if (count > 1) {
      var closeColBtn = document.createElement('button');
      closeColBtn.className = 'nav-btn';
      closeColBtn.style.color = '#ff7b72';
      closeColBtn.textContent = '✕';
      closeColBtn.title = 'Close this screen column';
      closeColBtn.addEventListener('click', function() { removePaneColumn(idx); });
      nav.appendChild(closeColBtn);
    }

    pane.appendChild(nav);

    var wrap = document.createElement('div');
    wrap.className = 'wv-wrap';
    pane.appendChild(wrap);

    container.appendChild(pane);

    var activeTabId = paneTabsMap[idx] ? paneTabsMap[idx].activeTabId : 1;
    getOrCreateColWebview(col.appId, idx, activeTabId, wrap);
    showColWebviews(idx, col.appId, activeTabId, wrap);
  });
}

function renderColTabs(colIdx, container) {
  if (!paneTabsMap[colIdx]) {
    paneTabsMap[colIdx] = { activeTabId: 1, nextId: 2, items: [{ id: 1, label: 'Account ' + (colIdx + 1) }] };
  }
  const state = paneTabsMap[colIdx];
  container.innerHTML = '';

  state.items.forEach(function(tab) {
    const btn = document.createElement('button');
    btn.className = 'pane-tab' + (tab.id === state.activeTabId ? ' active-tab' : '');

    var titleSpan = document.createElement('span');
    titleSpan.textContent = tab.label;
    btn.appendChild(titleSpan);

    if (state.items.length > 1) {
      var closeBtn = document.createElement('span');
      closeBtn.className = 'tab-close';
      closeBtn.innerHTML = '✕';
      closeBtn.title = 'Close account tab';
      closeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        closeColTab(colIdx, tab.id, container);
      });
      btn.appendChild(closeBtn);
    }

    btn.addEventListener('click', function() {
      switchColTab(colIdx, tab.id, container);
    });

    container.appendChild(btn);
  });
}

function addColTab(colIdx, container) {
  const state = paneTabsMap[colIdx];
  const newId = state.nextId++;
  const count = state.items.length + 1;
  state.items.push({ id: newId, label: 'Account ' + count });
  switchColTab(colIdx, newId, container);
}

function closeColTab(colIdx, tabId, container) {
  const state = paneTabsMap[colIdx];
  if (state.items.length <= 1) return;

  const idx = state.items.findIndex(t => t.id === tabId);
  if (idx === -1) return;

  state.items.splice(idx, 1);
  if (state.activeTabId === tabId) {
    state.activeTabId = state.items[Math.max(0, idx - 1)].id;
  }

  const appId = paneColumns[colIdx].appId;
  const cacheKey = appId + '-col' + colIdx + '-tab' + tabId;
  if (webviewCache[cacheKey]) {
    try { webviewCache[cacheKey].remove(); } catch(x){}
    delete webviewCache[cacheKey];
  }

  renderColTabs(colIdx, container);
  var wrap = document.querySelector('#pane-col-' + colIdx + ' .wv-wrap');
  if (wrap) showColWebviews(colIdx, appId, state.activeTabId, wrap);
}

function switchColTab(colIdx, tabId, container) {
  const state = paneTabsMap[colIdx];
  state.activeTabId = tabId;
  renderColTabs(colIdx, container);

  const appId = paneColumns[colIdx].appId;
  var wrap = document.querySelector('#pane-col-' + colIdx + ' .wv-wrap');
  if (wrap) {
    getOrCreateColWebview(appId, colIdx, tabId, wrap);
    showColWebviews(colIdx, appId, tabId, wrap);
  }
}

// ─── Webview management ────────────────────────────────────────────────────────
function getOrCreateColWebview(appId, colIdx, tabId, container) {
  var key = appId + '-col' + colIdx + '-tab' + tabId;
  if (webviewCache[key]) {
    if (webviewCache[key].parentNode !== container) {
      container.appendChild(webviewCache[key]);
    }
    return webviewCache[key];
  }
  var wv = makeColWebview(appId, colIdx, tabId, container);
  webviewCache[key] = wv;
  return wv;
}

function makeColWebview(appId, colIdx, tabId, container) {
  var partition = 'persist:' + appId + '-col' + colIdx + '-tab' + tabId;
  var app = APPS[appId];
  var phId = 'ph-' + appId + '-col' + colIdx + '-tab' + tabId;
  var wvId = 'wv-' + appId + '-col' + colIdx + '-tab' + tabId;

  var ph = document.createElement('div');
  ph.id = phId;
  ph.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;background:#0D1117;color:#333;';
  ph.innerHTML =
    '<div style="line-height:0;opacity:.5">' + app.icon108 + '</div>' +
    '<div style="font-size:13px;color:#444;text-align:center;max-width:240px;line-height:1.7">' + app.loadMsg + '</div>' +
    '<div style="width:28px;height:28px;border:2.5px solid #1a1a1a;border-top-color:' + app.color + ';border-radius:50%;animation:spin .8s linear infinite"></div>';
  container.appendChild(ph);

  var isElectron = !!(window.dualDesk || (window.process && window.process.versions && window.process.versions.electron));
  var wv = document.createElement(isElectron ? 'webview' : 'iframe');
  wv.id = wvId;

  if (isElectron) {
    wv.setAttribute('partition', partition);
    wv.setAttribute('useragent', CHROME_UA);
    wv.setAttribute('allowpopups', '');
    if (window.dualDesk && window.dualDesk.webviewPreloadUrl) {
      wv.setAttribute('preload', window.dualDesk.webviewPreloadUrl);
    }
  } else {
    wv.setAttribute('allow', 'camera; microphone; geolocation; clipboard-read; clipboard-write');
  }
  wv.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;border:none;visibility:hidden;pointer-events:none;';

  container.appendChild(wv);

  if (isElectron) {
    wv.addEventListener('dom-ready', function() {
      hideColPh(appId, colIdx, tabId);
      setTimeout(function() {
        try { wv.executeJavaScript('window.dispatchEvent(new Event("resize"))'); } catch(x){}
      }, 100);
    });
    wv.addEventListener('did-navigate', function() { hideColPh(appId, colIdx, tabId); });
    wv.addEventListener('did-stop-loading', function() { hideColPh(appId, colIdx, tabId); });
    wv.addEventListener('crashed', function() {
      setTimeout(function() { try { wv.reload(); } catch(x){} }, 1000);
    });
  } else {
    wv.addEventListener('load', function() {
      hideColPh(appId, colIdx, tabId);
    });
  }

  wv.setAttribute('src', app.url);
  return wv;
}

function hideColPh(appId, colIdx, tabId) {
  var ph = document.getElementById('ph-' + appId + '-col' + colIdx + '-tab' + tabId);
  if (ph) ph.style.display = 'none';
}

function showColWebviews(colIdx, appId, tabId, container) {
  if (!appId || !tabId || !container) return;

  container.querySelectorAll('webview, iframe').forEach(function(wv) {
    wv.style.visibility   = 'hidden';
    wv.style.pointerEvents = 'none';
  });

  var key = appId + '-col' + colIdx + '-tab' + tabId;
  var wv = webviewCache[key];
  if (wv) {
    wv.style.visibility   = 'visible';
    wv.style.pointerEvents = '';
    setTimeout(function() {
      try { if(wv.executeJavaScript) wv.executeJavaScript('window.dispatchEvent(new Event("resize"))'); } catch(x){}
    }, 150);
  }
}

// ─── Live Animated Wallpaper Canvas Loop ─────────────────────────────────────
let canvasAnimId = null;

function initWelcomeCanvas() {
  const canvas = document.getElementById('welcome-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    var welcomeElem = document.getElementById('welcome');
    if (!welcomeElem) return;
    canvas.width = Math.max(welcomeElem.clientWidth, window.innerWidth);
    canvas.height = Math.max(welcomeElem.scrollHeight, window.innerHeight);
  }
  window.addEventListener('resize', resize);
  setTimeout(resize, 100);
  resize();

  const particles = [];
  for (let i = 0; i < 70; i++) {
    particles.push({
      x: Math.random() * (canvas.width || 1400),
      y: Math.random() * (canvas.height || 1000),
      radius: Math.random() * 2.5 + 1,
      speedY: Math.random() * 0.5 + 0.15,
      speedX: (Math.random() - 0.5) * 0.3,
      opacity: Math.random() * 0.7 + 0.3,
      color: Math.random() > 0.4 ? '#00f0ff' : (Math.random() > 0.5 ? '#3b82f6' : '#a855f7')
    });
  }

  const nodes = [];
  for (let i = 0; i < 20; i++) {
    nodes.push({
      x: Math.random() * (canvas.width || 1400),
      y: Math.random() * (canvas.height || 1000),
      pulse: Math.random() * Math.PI * 2
    });
  }

  let angle = 0;

  function render() {
    if (currentPhase !== 'idle') {
      canvasAnimId = requestAnimationFrame(render);
      return;
    }

    if (canvas.width !== (canvas.parentElement?.clientWidth || window.innerWidth)) {
      resize();
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Deep sci-fi radial space gradient background
    const bgGrad = ctx.createRadialGradient(
      canvas.width / 2, canvas.height * 0.35, 10,
      canvas.width / 2, canvas.height * 0.35, canvas.width * 0.85
    );
    bgGrad.addColorStop(0, '#0f233d');
    bgGrad.addColorStop(0.4, '#091527');
    bgGrad.addColorStop(0.8, '#040914');
    bgGrad.addColorStop(1, '#020408');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    angle += 0.008;

    // Glowing Cyber Circuit Grid Lines
    ctx.lineWidth = 1.2;
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.12)';

    const step = 80;
    for (let x = 0; x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      var offsetX = Math.sin(angle + x * 0.02) * 25;
      ctx.lineTo(x + offsetX, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      var offsetY = Math.cos(angle + y * 0.02) * 25;
      ctx.lineTo(canvas.width, y + offsetY);
      ctx.stroke();
    }

    // Glowing Circuit Intersections (Nodes)
    nodes.forEach(n => {
      n.pulse += 0.03;
      var r = 3 + Math.sin(n.pulse) * 2;
      var alpha = 0.3 + Math.sin(n.pulse) * 0.3;
      ctx.beginPath();
      ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
      ctx.fillStyle = '#00f0ff';
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = 12;
      ctx.shadowColor = '#00f0ff';
      ctx.fill();
    });

    // Floating Energy Particles
    particles.forEach(p => {
      p.y -= p.speedY;
      p.x += p.speedX;
      if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width; }
      if (p.x < -10 || p.x > canvas.width + 10) p.x = Math.random() * canvas.width;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.opacity * (0.8 + Math.sin(angle * 2 + p.x) * 0.2);
      ctx.shadowBlur = 10;
      ctx.shadowColor = p.color;
      ctx.fill();
    });

    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    canvasAnimId = requestAnimationFrame(render);
  }

  render();
}



// ─── Modal Handlers for Custom App & Help ──────────────────────────────────────
// ─── Modal Handlers for Custom App, Categories & Help ─────────────────────────
function setupModal() {
  const modal = document.getElementById('custom-app-modal');
  const addBtn = document.getElementById('add-custom-btn');
  const addCatBtn = document.getElementById('add-category-btn');
  const closeBtn = document.getElementById('close-modal-btn');
  const cancelBtn = document.getElementById('cancel-modal-btn');
  const form = document.getElementById('custom-app-form');
  const nameInput = document.getElementById('custom-name');
  const urlInput = document.getElementById('custom-url');
  const catSelect = document.getElementById('custom-category-select');
  const colorPicker = document.getElementById('custom-color-picker');
  const iconPreview = document.getElementById('custom-icon-preview');
  const quickCreateCatBtn = document.getElementById('quick-create-cat-btn');

  // Category modal elements
  const catModal = document.getElementById('category-modal');
  const closeCatBtn = document.getElementById('close-cat-modal-btn');
  const cancelCatBtn = document.getElementById('cancel-cat-modal-btn');
  const catForm = document.getElementById('category-form');
  const catEditId = document.getElementById('cat-edit-id');
  const catNameInput = document.getElementById('cat-name-input');
  const catIconInput = document.getElementById('cat-icon-input');
  const deleteCatBtn = document.getElementById('delete-cat-btn');

  // Help modal elements
  const helpModal = document.getElementById('help-modal');
  const helpBtn = document.getElementById('help-btn');
  const closeHelpBtn = document.getElementById('close-help-btn');
  const okHelpBtn = document.getElementById('ok-help-btn');

  const popularChipsContainer = document.getElementById('popular-sites-chips');

  const POPULAR_PRESETS = [
    { name: 'YouTube', url: 'https://www.youtube.com', category: 'entertainment', color: '#FF0000', icon: '▶️' },
    { name: 'Twitch', url: 'https://www.twitch.tv', category: 'entertainment', color: '#9146FF', icon: '📺' },
    { name: 'Spotify', url: 'https://open.spotify.com', category: 'entertainment', color: '#1DB954', icon: '🎵' },
    { name: 'Disney+', url: 'https://www.disneyplus.com', category: 'entertainment', color: '#113CCF', icon: '✨' },
    { name: 'Hulu', url: 'https://www.hulu.com', category: 'entertainment', color: '#1CE783', icon: '🟢' },
    { name: 'Discord', url: 'https://discord.com/app', category: 'socials', color: '#5865F2', icon: '💬' },
    { name: 'Telegram', url: 'https://web.telegram.org', category: 'socials', color: '#229ED9', icon: '✈️' },
    { name: 'X / Twitter', url: 'https://x.com', category: 'socials', color: '#000000', icon: '✖️' },
    { name: 'Reddit', url: 'https://www.reddit.com', category: 'socials', color: '#FF4500', icon: '🤖' },
    { name: 'LinkedIn', url: 'https://www.linkedin.com', category: 'socials', color: '#0A66C2', icon: '💼' },
    { name: 'Perplexity', url: 'https://www.perplexity.ai', category: 'ai_tools', color: '#20B2AA', icon: '🧠' },
    { name: 'DeepSeek', url: 'https://chat.deepseek.com', category: 'ai_tools', color: '#4D6BFE', icon: '🐋' },
    { name: 'Copilot', url: 'https://copilot.microsoft.com', category: 'ai_tools', color: '#0078D4', icon: '⚡' },
    { name: 'Gmail', url: 'https://mail.google.com', category: 'custom', color: '#EA4335', icon: '✉️' },
    { name: 'Slack', url: 'https://app.slack.com', category: 'custom', color: '#4A154B', icon: '💬' },
    { name: 'GitHub', url: 'https://github.com', category: 'custom', color: '#24292F', icon: '🐙' },
    { name: 'Notion', url: 'https://www.notion.so', category: 'custom', color: '#000000', icon: '📝' }
  ];

  function openCustomAppModal(targetCatId) {
    if (!modal) return;
    if (catSelect) {
      catSelect.innerHTML = '';
      CATEGORIES.forEach(function(cat) {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = (cat.icon ? cat.icon + ' ' : '') + cat.name;
        if (targetCatId && cat.id === targetCatId) opt.selected = true;
        catSelect.appendChild(opt);
      });
    }

    const currentCatId = targetCatId || (catSelect ? catSelect.value : 'custom');
    const targetCat = CATEGORIES.find(c => c.id === currentCatId);
    const modalTitle = document.getElementById('custom-app-modal-title');
    if (modalTitle) {
      modalTitle.textContent = targetCat ? 'Add Website to ' + targetCat.name : 'Add Custom Website';
    }

    nameInput.value = '';
    urlInput.value = '';
    if (colorPicker) colorPicker.value = '#3B82F6';
    if (iconPreview) {
      iconPreview.style.background = '#3B82F6';
      iconPreview.textContent = 'W';
    }

    if (popularChipsContainer) {
      popularChipsContainer.innerHTML = '';
      POPULAR_PRESETS.forEach(function(preset) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'quick-preset-chip';
        chip.innerHTML = preset.icon + ' ' + preset.name;
        chip.title = '1-click fill ' + preset.name;
        chip.addEventListener('click', function() {
          nameInput.value = preset.name;
          urlInput.value = preset.url;
          if (colorPicker) colorPicker.value = preset.color;
          if (iconPreview) {
            iconPreview.style.background = preset.color;
            iconPreview.textContent = preset.name.charAt(0);
          }
          if (catSelect && !targetCatId && CATEGORIES.some(c => c.id === preset.category)) {
            catSelect.value = preset.category;
            const chosen = CATEGORIES.find(c => c.id === preset.category);
            if (modalTitle && chosen) modalTitle.textContent = 'Add Website to ' + chosen.name;
          }
          popularChipsContainer.querySelectorAll('.quick-preset-chip').forEach(c => c.classList.remove('active-preset'));
          chip.classList.add('active-preset');
        });
        popularChipsContainer.appendChild(chip);
      });
    }

    modal.style.display = 'flex';
    modal.hidden = false;
    setTimeout(function() { nameInput.focus(); }, 50);
  }

  function closeCustomAppModal() {
    if (!modal) return;
    modal.style.display = 'none';
    modal.hidden = true;
  }

  window.openCustomAppModal = openCustomAppModal;

  if (catSelect) {
    catSelect.addEventListener('change', function() {
      const targetCat = CATEGORIES.find(c => c.id === catSelect.value);
      const modalTitle = document.getElementById('custom-app-modal-title');
      if (modalTitle && targetCat) {
        modalTitle.textContent = 'Add Website to ' + targetCat.name;
      }
    });
  }

  if (nameInput && iconPreview) {
    nameInput.addEventListener('input', function() {
      const letter = (nameInput.value.trim().charAt(0) || 'W').toUpperCase();
      iconPreview.textContent = letter;
    });
  }

  if (colorPicker && iconPreview) {
    colorPicker.addEventListener('input', function() {
      iconPreview.style.background = colorPicker.value;
    });
  }

  if (quickCreateCatBtn) {
    quickCreateCatBtn.addEventListener('click', function() {
      closeCustomAppModal();
      openCategoryModal(null);
    });
  }

  if (addBtn) addBtn.addEventListener('click', () => openCustomAppModal(null));
  if (closeBtn) closeBtn.addEventListener('click', closeCustomAppModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeCustomAppModal);

  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeCustomAppModal();
  });

  if (form) {
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      var name = nameInput.value.trim();
      var url = urlInput.value.trim();
      var category = catSelect ? catSelect.value : 'custom';
      var color = colorPicker ? colorPicker.value : '#3B82F6';
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + (url.includes('.') ? url : url + '.com');
      }
      if (name && url) {
        saveCustomApp(name, url, category, color);
        closeCustomAppModal();
      }
    });
  }

  // ── Category Modal ──
  function openCategoryModal(catId) {
    if (!catModal) return;
    const title = document.getElementById('category-modal-title');
    const desc = document.getElementById('category-modal-desc');

    if (catId) {
      const cat = CATEGORIES.find(c => c.id === catId);
      if (!cat) return;
      if (title) title.textContent = 'Edit Category: ' + cat.name;
      if (desc) desc.textContent = 'Change the category name and icon to your preference.';
      catEditId.value = cat.id;
      catNameInput.value = cat.name;
      catIconInput.value = cat.icon || '📁';
      if (deleteCatBtn) deleteCatBtn.style.display = 'inline-block';
    } else {
      if (title) title.textContent = 'Create New Category';
      if (desc) desc.textContent = 'Add a custom category section to organize your apps in DualDesk.';
      catEditId.value = '';
      catNameInput.value = '';
      catIconInput.value = '🎬';
      if (deleteCatBtn) deleteCatBtn.style.display = 'none';
    }

    highlightEmojiChip(catIconInput.value);

    catModal.style.display = 'flex';
    catModal.hidden = false;
    setTimeout(function() { catNameInput.focus(); }, 50);
  }

  function closeCategoryModal() {
    if (!catModal) return;
    catModal.style.display = 'none';
    catModal.hidden = true;
  }

  function highlightEmojiChip(emoji) {
    document.querySelectorAll('.emoji-chip').forEach(function(chip) {
      chip.classList.toggle('active-chip', chip.dataset.emoji === emoji);
    });
  }

  window.openCategoryModal = openCategoryModal;

  document.querySelectorAll('.emoji-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      catIconInput.value = chip.dataset.emoji;
      highlightEmojiChip(chip.dataset.emoji);
    });
  });

  if (catIconInput) {
    catIconInput.addEventListener('input', function() {
      highlightEmojiChip(catIconInput.value.trim());
    });
  }

  if (addCatBtn) addCatBtn.addEventListener('click', () => openCategoryModal(null));
  if (closeCatBtn) closeCatBtn.addEventListener('click', closeCategoryModal);
  if (cancelCatBtn) cancelCatBtn.addEventListener('click', closeCategoryModal);

  if (deleteCatBtn) {
    deleteCatBtn.addEventListener('click', function() {
      const id = catEditId.value;
      if (id) {
        closeCategoryModal();
        deleteCategory(id);
      }
    });
  }

  catModal.addEventListener('click', function(e) {
    if (e.target === catModal) closeCategoryModal();
  });

  if (catForm) {
    catForm.addEventListener('submit', function(e) {
      e.preventDefault();
      const id = catEditId.value;
      const name = catNameInput.value.trim();
      const icon = catIconInput.value.trim() || '📁';
      if (!name) return;

      if (id) {
        renameCategory(id, name, icon);
      } else {
        addCategory(name, icon);
      }
      closeCategoryModal();
    });
  }

  // ── Help Modal ──
  function openHelpModal() {
    if (!helpModal) return;
    helpModal.style.display = 'flex';
    helpModal.hidden = false;
  }

  function closeHelpModal() {
    if (!helpModal) return;
    helpModal.style.display = 'none';
    helpModal.hidden = true;
  }

  if (helpBtn) helpBtn.addEventListener('click', openHelpModal);
  if (closeHelpBtn) closeHelpBtn.addEventListener('click', closeHelpModal);
  if (okHelpBtn) okHelpBtn.addEventListener('click', closeHelpModal);

  if (helpModal) {
    helpModal.addEventListener('click', function(e) {
      if (e.target === helpModal) closeHelpModal();
    });
  }
}

// ─── Global Focus Mode & Audio Control ───────────────────────────────────────
let isGlobalFocusMuted = false;

function setupFocusMode() {
  const btn = document.getElementById('focus-mode-toggle');
  if (!btn) return;
  btn.addEventListener('click', function() {
    isGlobalFocusMuted = !isGlobalFocusMuted;
    btn.textContent = isGlobalFocusMuted ? '🔊 Unmute All' : '🔕 Focus Mode';
    btn.style.background = isGlobalFocusMuted ? 'rgba(239,68,68,0.25)' : '';

    paneColumns.forEach((_, idx) => {
      isMutedMap[idx] = isGlobalFocusMuted;
      const muteNavBtn = document.querySelector('#pane-col-' + idx + ' .nav-btn:nth-of-type(2)');
      if (muteNavBtn) muteNavBtn.textContent = isGlobalFocusMuted ? '🔇' : '🔊';
      const wrap = document.querySelector('#pane-col-' + idx + ' .wv-wrap');
      const activeTabId = paneTabsMap[idx] ? paneTabsMap[idx].activeTabId : 1;
      const wv = getOrCreateColWebview(paneColumns[idx].appId, idx, activeTabId, wrap);
      if (wv) {
        try { if (wv.setAudioMuted) wv.setAudioMuted(isGlobalFocusMuted); else wv.muted = isGlobalFocusMuted; } catch(x){}
      }
    });
  });
}

// ─── Split Ratio Controls (50/50 vs 70/30 Focus) ─────────────────────────────
function setupSplitRatios() {
  const btn50 = document.getElementById('ratio-btn-50');
  const btn70 = document.getElementById('ratio-btn-70');
  const container = document.getElementById('panes-columns');
  if (!btn50 || !btn70 || !container) return;

  btn50.addEventListener('click', function() {
    btn50.classList.add('active');
    btn70.classList.remove('active');
    container.classList.remove('pane-ratio-70-30');
  });

  btn70.addEventListener('click', function() {
    btn70.classList.add('active');
    btn50.classList.remove('active');
    container.classList.add('pane-ratio-70-30');
  });
}

// ─── Save Custom Workspace Profile ───────────────────────────────────────────
function setupSaveWorkspace() {
  const btn = document.getElementById('save-workspace-btn');
  if (!btn) return;
  btn.addEventListener('click', function() {
    const name = prompt('Enter a name for your custom workspace setup profile:', 'My Daily Setup');
    if (!name || !name.trim()) return;

    const savedSetup = {
      name: name.trim(),
      columns: paneColumns.map(col => ({ appId: col.appId }))
    };

    let userPresets = [];
    try {
      userPresets = JSON.parse(localStorage.getItem('dualdesk_user_presets') || '[]');
    } catch(x){}
    userPresets.push(savedSetup);
    localStorage.setItem('dualdesk_user_presets', JSON.stringify(userPresets));

    renderUserPresets();
    alert('Workspace setup "' + name.trim() + '" saved! You can relaunch it anytime from Preset Profiles.');
  });

  renderUserPresets();
}

function renderUserPresets() {
  const grid = document.getElementById('workspace-presets-grid');
  if (!grid) return;
  let userPresets = [];
  try {
    userPresets = JSON.parse(localStorage.getItem('dualdesk_user_presets') || '[]');
  } catch(x){}

  userPresets.forEach(function(preset, idx) {
    const existing = document.getElementById('user-preset-' + idx);
    if (existing) return;
    const btn = document.createElement('button');
    btn.className = 'preset-card';
    btn.id = 'user-preset-' + idx;
    btn.style.borderColor = 'rgba(245,158,11,0.6)';
    btn.innerHTML = '⭐ ' + preset.name + ' (' + preset.columns.length + ' Screens)';
    btn.addEventListener('click', function() {
      paneColumns = preset.columns.map((c, i) => ({
        id: 'pane-' + (i + 1),
        appId: c.appId,
        tabId: 1,
        label: 'Account ' + (i + 1)
      }));
      setPhase('active');
    });
    grid.appendChild(btn);
  });
}

// ─── macOS Download Modal Handlers ───────────────────────────────────────────
function setupMacModal() {
  const modal = document.getElementById('mac-download-modal');
  const trigger = document.getElementById('welcome-mac-btn');
  const closeBtn = document.getElementById('close-mac-modal-btn');
  const actionBtn = document.getElementById('close-mac-modal-action-btn');

  if (!modal) return;
  function open() { modal.style.display = 'flex'; modal.hidden = false; }
  function close() { modal.style.display = 'none'; modal.hidden = true; }

  if (trigger) trigger.addEventListener('click', open);
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (actionBtn) actionBtn.addEventListener('click', close);
  modal.addEventListener('click', function(e) { if (e.target === modal) close(); });
}

// ─── Command Palette Modal (Ctrl + K / Cmd + K) ──────────────────────────────
function setupCommandPalette() {
  const modal = document.getElementById('cmd-palette-modal');
  const input = document.getElementById('cmd-search-input');
  const list = document.getElementById('cmd-results-list');
  const trigger = document.getElementById('cmd-palette-trigger');

  if (!modal || !input || !list) return;

  function open() {
    modal.style.display = 'flex';
    modal.hidden = false;
    input.value = '';
    renderCommands('');
    setTimeout(() => input.focus(), 50);
  }

  function close() {
    modal.style.display = 'none';
    modal.hidden = true;
  }

  if (trigger) trigger.addEventListener('click', open);
  modal.addEventListener('click', function(e) { if (e.target === modal) close(); });

  const ALL_COMMANDS = [
    { title: 'Add Custom Website', icon: '➕', badge: 'Action', action: () => openCustomAppModal(null) },
    { title: 'Create New Category', icon: '📁', badge: 'Action', action: () => openCategoryModal(null) },
    { title: 'Reset Default Sites & Categories', icon: '🔄', badge: 'Settings', action: () => restoreDefaultAppsAndCategories() },
    { title: '1 Screen Mode (Single Display)', icon: '📱', badge: 'Layout', action: () => setColumnLayout(1) },
    { title: '2 Screens Side-by-Side (Dual)', icon: '🔲', badge: 'Layout', action: () => setColumnLayout(2) },
    { title: '3 Screens Triple Split', icon: '📐', badge: 'Layout', action: () => setColumnLayout(3) },
    { title: '4 Screens Quad Split', icon: '🖥️', badge: 'Layout', action: () => setColumnLayout(4) },
    { title: 'Focus Mode (Mute All)', icon: '🔕', badge: 'Audio', action: () => document.getElementById('focus-mode-toggle')?.click() },
    { title: '70 / 30 Focus Split Ratio', icon: '⚖️', badge: 'Ratio', action: () => document.getElementById('ratio-btn-70')?.click() },
    { title: 'Download DualDesk for macOS', icon: '', badge: 'MacBook', action: () => document.getElementById('welcome-mac-btn')?.click() }
  ];

  function renderCommands(query) {
    list.innerHTML = '';
    const q = query.toLowerCase().trim();

    const appCommands = APP_ORDER.filter(id => APPS[id]).map(id => ({
      title: 'Launch ' + APPS[id].name,
      icon: '🚀',
      badge: 'Site',
      action: () => selectApp(id)
    }));

    const combinedCommands = appCommands.concat(ALL_COMMANDS);
    const filtered = combinedCommands.filter(c => !q || c.title.toLowerCase().includes(q) || c.badge.toLowerCase().includes(q));

    filtered.forEach((cmd, idx) => {
      const item = document.createElement('div');
      item.className = 'cmd-item' + (idx === 0 ? ' active-cmd' : '');
      item.innerHTML = '<span class="cmd-icon">' + cmd.icon + '</span><span>' + cmd.title + '</span><span class="cmd-badge">' + cmd.badge + '</span>';
      item.addEventListener('click', function() {
        close();
        cmd.action();
      });
      list.appendChild(item);
    });
  }

  input.addEventListener('input', () => renderCommands(input.value));
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Enter') {
      const first = list.querySelector('.cmd-item');
      if (first) first.click();
    }
  });

  window.openCommandPalette = open;
}

// ─── Right-Click Context Menu ──────────────────────────────────────────────────
function setupContextMenu() {
  const menu = document.getElementById('context-menu');
  const header = document.getElementById('ctx-menu-header');
  const items = document.getElementById('ctx-menu-items');
  if (!menu || !header || !items) return;

  function closeMenu() {
    menu.style.display = 'none';
  }

  function positionMenu(x, y) {
    menu.style.display = 'block';
    const menuWidth = menu.offsetWidth || 190;
    const menuHeight = menu.offsetHeight || 180;
    const pad = 10;
    let finalX = x;
    let finalY = y;

    if (x + menuWidth > window.innerWidth - pad) {
      finalX = window.innerWidth - menuWidth - pad;
    }
    if (y + menuHeight > window.innerHeight - pad) {
      finalY = window.innerHeight - menuHeight - pad;
    }
    menu.style.left = Math.max(pad, finalX) + 'px';
    menu.style.top = Math.max(pad, finalY) + 'px';
  }

  window.openAppContextMenu = function(e, appId) {
    e.preventDefault();
    e.stopPropagation();
    const app = APPS[appId];
    if (!app) return;

    header.innerHTML = (app.icon32 || '🌐') + '<span style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis; font-weight:700;">' + app.name + '</span>';
    items.innerHTML = '';

    // Action 1: Open in Screen 1
    const s1 = document.createElement('div');
    s1.className = 'ctx-item';
    s1.innerHTML = '<span>🖥️ Open in Screen 1</span>';
    s1.onclick = function() {
      closeMenu();
      if (currentPhase !== 'active') {
        selectApp(appId);
      } else {
        paneColumns[0].appId = appId;
        activatePanes();
        updateSidebar(appId);
      }
    };
    items.appendChild(s1);

    // Action 2: Open in Screen 2
    const s2 = document.createElement('div');
    s2.className = 'ctx-item';
    s2.innerHTML = '<span>🖥️ Open in Screen 2</span>';
    s2.onclick = function() {
      closeMenu();
      if (paneColumns.length < 2) {
        paneColumns.push({ id: 'pane-2', appId: appId, tabId: 1, label: 'Account 2' });
      } else {
        paneColumns[1].appId = appId;
      }
      if (currentPhase !== 'active') {
        setPhase('active');
      } else {
        activatePanes();
      }
    };
    items.appendChild(s2);

    // Action 3: Add as New Screen
    if (paneColumns.length < 4) {
      const addScreen = document.createElement('div');
      addScreen.className = 'ctx-item';
      addScreen.innerHTML = '<span>➕ Add as New Screen (' + (paneColumns.length + 1) + ')</span>';
      addScreen.onclick = function() {
        closeMenu();
        const nextIdx = paneColumns.length;
        paneColumns.push({
          id: 'pane-' + (nextIdx + 1),
          appId: appId,
          tabId: 1,
          label: 'Account ' + (nextIdx + 1)
        });
        if (!paneTabsMap[nextIdx]) {
          paneTabsMap[nextIdx] = { activeTabId: 1, nextId: 2, items: [{ id: 1, label: 'Account ' + (nextIdx + 1) }] };
        }
        setPhase('active');
      };
      items.appendChild(addScreen);
    }

    // Action 4: Launch Dual View (Both screens)
    const dual = document.createElement('div');
    dual.className = 'ctx-item';
    dual.innerHTML = '<span>⚡ Open Dual View (Both)</span>';
    dual.onclick = function() {
      closeMenu();
      selectApp(appId);
    };
    items.appendChild(dual);

    // Action 5: Delete Site (works for ALL apps, frees memory)
    const divSep = document.createElement('div');
    divSep.className = 'ctx-divider';
    items.appendChild(divSep);

    const del = document.createElement('div');
    del.className = 'ctx-item ctx-item-danger';
    del.innerHTML = '<span>🗑️ Delete ' + app.name + '</span>';
    del.onclick = function() {
      closeMenu();
      deleteApp(appId);
    };
    items.appendChild(del);

    positionMenu(e.clientX, e.clientY);
  };

  window.openCategoryContextMenu = function(e, catId) {
    e.preventDefault();
    e.stopPropagation();
    const cat = CATEGORIES.find(c => c.id === catId);
    if (!cat) return;

    header.innerHTML = '<span style="font-size: 16px;">' + (cat.icon || '📁') + '</span><span style="font-weight:700;">' + cat.name + '</span>';
    items.innerHTML = '';

    // Action 1: Add Website to this category
    const addApp = document.createElement('div');
    addApp.className = 'ctx-item';
    addApp.innerHTML = '<span>➕ Add Website to ' + cat.name + '</span>';
    addApp.onclick = function() {
      closeMenu();
      if (window.openCustomAppModal) window.openCustomAppModal(catId);
    };
    items.appendChild(addApp);

    // Action 2: Rename / Edit Category
    const editCat = document.createElement('div');
    editCat.className = 'ctx-item';
    editCat.innerHTML = '<span>✎ Rename / Edit Category</span>';
    editCat.onclick = function() {
      closeMenu();
      if (window.openCategoryModal) window.openCategoryModal(catId);
    };
    items.appendChild(editCat);

    // Action 3: Toggle collapse
    const toggleCollapse = document.createElement('div');
    toggleCollapse.className = 'ctx-item';
    const isCollapsed = !!collapsedCategories[catId];
    toggleCollapse.innerHTML = '<span>' + (isCollapsed ? '📂 Expand Category' : '📁 Collapse Category') + '</span>';
    toggleCollapse.onclick = function() {
      closeMenu();
      collapsedCategories[catId] = !isCollapsed;
      buildSidebar();
    };
    items.appendChild(toggleCollapse);

    // Action 4: Delete Category
    const divSep = document.createElement('div');
    divSep.className = 'ctx-divider';
    items.appendChild(divSep);

    const delCat = document.createElement('div');
    delCat.className = 'ctx-item ctx-item-danger';
    delCat.innerHTML = '<span>🗑️ Delete Category</span>';
    delCat.onclick = function() {
      closeMenu();
      deleteCategory(catId);
    };
    items.appendChild(delCat);

    positionMenu(e.clientX, e.clientY);
  };

  document.addEventListener('click', function(e) {
    if (!menu.contains(e.target)) closeMenu();
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', closeMenu);
}

// ─── Sidebar Real-Time Filter ─────────────────────────────────────────────────
function setupSidebarFilter() {
  const filterInput = document.getElementById('sidebar-filter-input');
  if (!filterInput) return;

  filterInput.addEventListener('input', function() {
    const q = filterInput.value.toLowerCase().trim();
    const groups = document.querySelectorAll('.cat-group');

    groups.forEach(function(group) {
      const catApps = group.querySelectorAll('.app-btn');
      const catAppsContainer = group.querySelector('.cat-apps');
      const emptyBtn = group.querySelector('.cat-empty-btn');
      const addMoreBtn = group.querySelector('.cat-add-more-btn');
      let visibleCount = 0;

      catApps.forEach(function(btn) {
        const text = btn.innerText.toLowerCase();
        const matches = !q || text.includes(q);
        btn.style.display = matches ? 'flex' : 'none';
        if (matches) visibleCount++;
      });

      if (!q) {
        group.style.display = '';
        if (catAppsContainer) {
          const catId = group.dataset.catId;
          const isCollapsed = catId ? collapsedCategories[catId] : false;
          catAppsContainer.classList.toggle('hidden', !!isCollapsed);
        }
        if (emptyBtn) emptyBtn.style.display = '';
        if (addMoreBtn) addMoreBtn.style.display = '';
      } else {
        if (visibleCount > 0) {
          group.style.display = '';
          if (catAppsContainer) catAppsContainer.classList.remove('hidden');
          if (emptyBtn) emptyBtn.style.display = 'none';
          if (addMoreBtn) addMoreBtn.style.display = 'none';
        } else {
          group.style.display = 'none';
        }
      }
    });
  });

  filterInput.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      filterInput.value = '';
      filterInput.dispatchEvent(new Event('input'));
      filterInput.blur();
    }
  });
}

// ─── Keyboard shortcuts ────────────────────────────────────────────────────────
function setupKeys() {
  document.addEventListener('keydown', function(e) {
    var mod = IS_MAC ? e.metaKey : e.ctrlKey;
    if (mod && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (window.openCommandPalette) window.openCommandPalette();
    }
    if (mod && e.key >= '1' && e.key <= '5') {
      selectApp(APP_ORDER[parseInt(e.key,10)-1]);
    }
    if (mod && (e.key === 'n' || e.key === 'N')) {
      var addBtn = document.getElementById('add-custom-btn');
      if (addBtn) addBtn.click();
      e.preventDefault();
    }
    if (mod && (e.key === '?' || e.key === '/')) {
      var helpBtn = document.getElementById('help-btn');
      if (helpBtn) helpBtn.click();
      e.preventDefault();
    }
  });
}

// ─── Init ──────────────────────────────────────────────────────────────────────
function init() {
  $welcome.style.display = 'flex';
  $overlay.style.display = 'none';
  $panes.style.display   = 'none';

  document.body.dataset.platform = (window.dualDesk && window.dualDesk.platform) || '';

  loadSavedCategories();
  filterDeletedApps();
  loadSavedCustomApps();
  filterDeletedApps();
  buildSidebar();
  setupModal();
  setupKeys();
  setupFocusMode();
  setupSplitRatios();
  setupSaveWorkspace();
  setupMacModal();
  setupCommandPalette();
  setupContextMenu();
  setupSidebarFilter();
  initWelcomeCanvas();
  var letsGoBtn = document.getElementById('welcome-lets-go-btn');
  if (letsGoBtn) {
    letsGoBtn.onclick = function() { restoreLastWorkspaceOrSelect(getFirstAvailableApp() || 'whatsapp'); };
  }

  var toggleBtn = document.getElementById('toggle-sidebar-btn');
  if (toggleBtn) {
    toggleBtn.onclick = function(e) {
      e.stopPropagation();
      toggleSidebar();
    };
  }

  var brandBtn = document.getElementById('brand');
  if (brandBtn) {
    brandBtn.addEventListener('click', function(e) {
      var sidebar = document.getElementById('sidebar');
      if (sidebar && sidebar.classList.contains('sidebar-collapsed')) {
        // If sidebar is collapsed, clicking the DD logo cleanly expands it!
        e.stopPropagation();
        toggleSidebar(true);
      } else {
        currentApp = null;
        setPhase('idle');
      }
    });
  }

  var floatD2Btn = document.getElementById('floating-d2-btn');
  if (floatD2Btn) {
    floatD2Btn.onclick = function() {
      toggleSidebar(true);
    };
  }

  try {
    var savedSidebar = localStorage.getItem('dualdesk_sidebar_state');
    if (savedSidebar === 'collapsed') {
      toggleSidebar(false);
    }
  } catch(e){}

  document.addEventListener('click', function() { hideAppPicker(); });

  console.log('[DualDesk] ready — 1/2/3/4 screen modes & clean sidebar active');
}

init();