const { app, BrowserWindow, Menu, ipcMain, session, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');
const fsPromises = require('fs').promises;

let mainWindow;
let extensions = [];
const activeDownloads = new Map();
let deeplinkingUrl = null;
let historyEnabled = true;
let browsingHistory = [];
let keybindsFile;
let blocklistFile;

function addToHistory(url, title) {
  if (!historyEnabled || !url || url.startsWith('javascript:') || url.startsWith('about:') || url.startsWith('data:')) return;
  const entry = { url, title: title || url, time: Date.now() };
  browsingHistory = browsingHistory.filter(h => h.url !== url);
  browsingHistory.unshift(entry);
  if (browsingHistory.length > 500) browsingHistory = browsingHistory.slice(0, 500);
  if (mainWindow && mainWindow.webContents) mainWindow.webContents.send('history-updated', browsingHistory);
}

// Обработка single-instance и deep links (Windows): если приложение уже запущено,
// вторичный инстанс передаёт URL в основной процесс через событие 'second-instance'.
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', (event, argv) => {
    // На Windows protocol URL обычно приходит в argv при запуске второго инстанса
    if (process.platform === 'win32') {
      const url = argv.find(a => /^https?:\/\//i.test(a) || /^baffynet:\/\//i.test(a));
      if (url) {
        if (mainWindow) {
          if (mainWindow.isMinimized()) mainWindow.restore();
          mainWindow.focus();
          mainWindow.webContents.send('create-new-tab', url);
        } else {
          deeplinkingUrl = url;
        }
      }
    }
  });
}

// На Windows первый инстанс может получить URL в process.argv при запуске через протокол
if (process.platform === 'win32') {
  const urlArg = process.argv.find(a => /^https?:\/\//i.test(a) || /^baffynet:\/\//i.test(a));
  if (urlArg) deeplinkingUrl = urlArg;
}

// Регистрация приложения как обработчика http/https-протоколов.
function registerHttpProtocolHandlers() {
  try {
    // На Windows при запуске из IDE нужно передать argv[1]
    if (process.platform === 'win32' && process.defaultApp) {
      if (process.argv.length >= 2) {
        const appArg = path.resolve(process.argv[1]);
        app.setAsDefaultProtocolClient('http', process.execPath, [appArg]);
        app.setAsDefaultProtocolClient('https', process.execPath, [appArg]);
      }
    } else {
      // Обычная регистрация (работает в установленных приложениях)
      app.setAsDefaultProtocolClient('http');
      app.setAsDefaultProtocolClient('https');
    }
  } catch (err) {
    console.error('Cannot regester url:', err);
  }
}

// Перехватываем попытки Open новое окно из любого webContents (включая webview)
// и перенаправляем их в основное окно как создание новой вкладки.
// Это предотвращает создание отдельного BrowserWindow для target="_blank" из webview.
const setupGlobalWindowOpenHandler = () => {
  const { app } = require('electron')
  app.on('web-contents-created', (event, contents) => {
    try {
      // Применяем обработчик для всех типов webContents — мы будем перенаправлять
      // запросы на открытие окон в `mainWindow`.
      contents.setWindowOpenHandler(({ url }) => {
        try {
          if (mainWindow && url && !url.startsWith('javascript:') && !url.startsWith('about:')) {
            mainWindow.webContents.send('create-new-tab', url)
            return { action: 'deny' }
          }
        } catch (err) {
          console.error('error:(', err)
        }
        return { action: 'deny' }
      })
      
      // Track page navigation for history
      contents.on('did-finish-load', () => {
        const url = contents.getURL();
        const title = contents.getTitle();
        addToHistory(url, title);
      });
    } catch (err) {
      // В некоторых старых/специальных webContents метод может отсутствовать
    }
  })
}


function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'public', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webviewTag: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  mainWindow.loadFile('public/index.html');
  loadExtensions();

  // Если приложение было запущено с URL (deep link), откроем его в новой вкладке
  if (deeplinkingUrl) {
    mainWindow.webContents.once('did-finish-load', () => {
      mainWindow.webContents.send('create-new-tab', deeplinkingUrl);
      deeplinkingUrl = null;
    });
  }

  app.whenReady().then(() => {
    globalShortcut.register('CommandOrControl+K', () => {
      mainWindow.webContents.send('con');
      mainWindow.focus();
    });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    mainWindow.webContents.send('create-new-tab', url);
    return { action: 'deny' };
  });

  mainWindow.webContents.session.on('will-download', (event, item) => {
    const downloadId = Date.now().toString();
    const filePath = path.join(app.getPath('downloads'), item.getFilename());
    
    item.setSavePath(filePath);
    activeDownloads.set(downloadId, {
      item,
      startTime: Date.now(),
      filePath: filePath,
      receivedBytes: 0,
      totalBytes: 0
    });

    item.on('updated', (event, state) => {
      if (state === 'progressing') {
        const progress = item.getReceivedBytes() / item.getTotalBytes();
        const percent = Math.round(progress * 100);
        
        mainWindow.webContents.send('download-progress', {
          id: downloadId,
          progress: percent,
          received: item.getReceivedBytes(),
          total: item.getTotalBytes(),
          filename: item.getFilename()
        });
      }
    });

    item.on('done', (event, state) => {
      if (state === 'completed') {
        mainWindow.webContents.send('download-complete', {
          id: downloadId,
          path: item.getSavePath(),
          filename: item.getFilename()
        });
      } else {
        mainWindow.webContents.send('download-error', {
          id: downloadId,
          error: 'Загрузка прервана',
          filename: item.getFilename()
        });
      }
      activeDownloads.delete(downloadId);
    });
  });

  // Permission handling: prompt UI for geolocation / media (camera/microphone)
  const permissionsStore = new Map(); // key: `${origin}|${permission}` -> boolean
  const permissionsFile = path.join(app.getPath('userData'), 'permissions.json');

  async function loadPermissions() {
    try {
      const content = await fsPromises.readFile(permissionsFile, 'utf8');
      const obj = JSON.parse(content || '{}');
      for (const k of Object.keys(obj)) permissionsStore.set(k, obj[k]);
    } catch (e) {
      // ignore missing file or parse errors
    }
  }

  async function savePermissions() {
    try {
      const obj = {};
      for (const [k, v] of permissionsStore) obj[k] = v;
      await fsPromises.writeFile(permissionsFile, JSON.stringify(obj, null, 2), 'utf8');
    } catch (err) {
      console.error('savePermissions error', err);
    }
  }

  // load previously saved permissions (don't block startup)
  loadPermissions().catch(() => {});

  const permissionRequestHandler = (webContents, permission, callback, details) => {
    const origin = details && details.requestingUrl ? new URL(details.requestingUrl).origin : (webContents.getURL && webContents.getURL()) || 'unknown';
    const key = `${origin}|${permission}`;

    if (permissionsStore.has(key)) {
      return callback(permissionsStore.get(key));
    }

    // Only prompt for geolocation and media (camera/microphone)
    const allowedTypes = ['media', 'geolocation'];
    if (!allowedTypes.includes(permission)) {
      return callback(false);
    }

    const requestId = `${Date.now()}-${Math.random()}`;
    mainWindow.webContents.send('permission-request', { requestId, permission, origin, mediaTypes: details.mediaTypes || [] });

    const timeout = setTimeout(() => {
      callback(false);
      ipcMain.removeListener('permission-response', responseHandler);
    }, 30000);

    const responseHandler = (event, resp) => {
      if (resp && resp.requestId === requestId) {
        clearTimeout(timeout);
        permissionsStore.set(key, !!resp.allow);
        savePermissions().catch(err => console.error('savePermissions error', err));
        callback(!!resp.allow);
        ipcMain.removeListener('permission-response', responseHandler);
      }
    };

    ipcMain.on('permission-response', responseHandler);
  };

  session.defaultSession.setPermissionRequestHandler(permissionRequestHandler);

  // Exposed helpers for renderer to check or request permission programmatically
  ipcMain.handle('check-permission', (event, tabId, permissionType, origin) => {
    const key = `${origin}|${permissionType}`;
    return permissionsStore.has(key) ? permissionsStore.get(key) : false;
  });

  ipcMain.handle('request-permission', (event, tabId, permissionType, origin, force = false) => {
    return new Promise((resolve) => {
      const originHost = origin || 'unknown';
      const key = `${originHost}|${permissionType}`;
      if (permissionsStore.has(key) && !force) return resolve(permissionsStore.get(key));

      const requestId = `${Date.now()}-${Math.random()}`;
      mainWindow.webContents.send('permission-request', { requestId, permission: permissionType, origin: originHost, mediaTypes: [] });

      const timeout = setTimeout(() => {
        resolve(false);
        ipcMain.removeListener('permission-response', responseHandler);
      }, 30000);

      const responseHandler = (event, resp) => {
        if (resp && resp.requestId === requestId) {
          clearTimeout(timeout);
          permissionsStore.set(key, !!resp.allow);
          savePermissions().catch(err => console.error('savePermissions error', err));
          resolve(!!resp.allow);
          ipcMain.removeListener('permission-response', responseHandler);
        }
      };

      ipcMain.on('permission-response', responseHandler);
    });
  });

  mainWindow.webContents.on('before-input-event', (event, input) => {
    const key = input.key.toLowerCase();
    const keybinds = getKeybinds();

    for (const [name, binding] of Object.entries(keybinds)) {
      if (input.control === binding.ctrl && input.shift === binding.shift && key === binding.key) {
        event.preventDefault();
        handleKeybindsAction(binding.action);
        return;
      }
    }
  });

  function handleKeybindsAction(action) {
    switch (action) {
      case 'open-help':
        mainWindow.webContents.send('create-new-tab', 'https://baffynet.rf.gd/help.html');
        break;
      case 'toggle-theme':
        mainWindow.webContents.send('toggle-theme');
        break;
      case 'toggle-history':
        mainWindow.webContents.send('toggle-history');
        break;
      case 'open-devtools':
        mainWindow.webContents.send('show-devtools');
        break;
      case 'open-homepage':
        mainWindow.webContents.send('open-url-prompt');
        break;
      case 'open-search':
        mainWindow.webContents.send('open-search-engine-prompt');
        break;
      case 'open-privacy':
        shell.openPath('C:/Program Files/BaffyNet/PrivacyNet.exe')
          .then(result => { if (result) console.error('error while opening:', result); });
        break;
      case 'set-default':
        mainWindow.webContents.send('create-new-tab', 'https://baffynet.rf.gd/test.html');
        break;
      case 'open-addons':
        mainWindow.webContents.send('create-new-tab', 'https://baffynet.rf.gd/shop.html');
        break;
      case 'open-blocker':
        mainWindow.webContents.send('open-blocker');
        break;
      case 'open-split-view':
        mainWindow.webContents.send('open-split-view');
        break;
      case 'open-tabs':
        mainWindow.webContents.send('con');
        break;
      case 'open-keybinds':
        mainWindow.webContents.send('open-hotkeys-menu');
        break;
      case 'rename-keybinds':
        mainWindow.webContents.send('rename-keybinds');
        break;
      case 'new-tab':
        mainWindow.webContents.send('create-new-tab');
        break;
      case 'close-tab':
        mainWindow.webContents.send('close-current-tab');
        break;
      case 'undo-action':
        mainWindow.webContents.send('undo-action');
        break;
      case 'text-to-speech':
        mainWindow.webContents.send('text-to-speech');
        break;
      case 'switch-tab-0':
      case 'switch-tab-1':
      case 'switch-tab-2':
      case 'switch-tab-3':
      case 'switch-tab-4':
      case 'switch-tab-5':
      case 'switch-tab-6':
      case 'switch-tab-7':
      case 'switch-tab-8':
      case 'switch-tab-9':
        const tabIndex = parseInt(action.replace('switch-tab-', ''));
        mainWindow.webContents.send('switch-to-tab', tabIndex);
        break;
    }
  }

  Menu.setApplicationMenu(null);
}

// Регистрируем обработчики протоколов http/https для системы
registerHttpProtocolHandlers()

app.on('open-url', (event, url) => {
  event.preventDefault();
  if (mainWindow) {
    mainWindow.webContents.send('create-new-tab', url);
  } else {
    app.whenReady().then(() => {
      createWindow();
      mainWindow.webContents.once('did-finish-load', () => {
        mainWindow.webContents.send('create-new-tab', url);
      });
    });
  }
});

// Настроим глобальный перехват открытия окон перед созданием окна
setupGlobalWindowOpenHandler()

async function loadExtensions() {
  try {
    const extensionsPath = 'C:\\Program Files\\BaffyNet\\Addons';
    try {
      await fsPromises.access(extensionsPath);
    } catch {
      await fsPromises.mkdir(extensionsPath, { recursive: true });
    }

    const items = await fsPromises.readdir(extensionsPath, { withFileTypes: true });
    extensions = [];

    for (const item of items) {
      if (item.isDirectory()) {
        const manifestPath = path.join(extensionsPath, item.name, 'manifest.json');
        try {
          const manifestData = await fsPromises.readFile(manifestPath, 'utf8');
          const manifest = JSON.parse(manifestData);
          extensions.push({
            id: item.name,
            name: manifest.name || item.name,
            version: manifest.version || '1.0',
            description: manifest.description || '',
            popup: manifest.action?.default_popup || manifest.browser_action?.default_popup,
            path: path.join(extensionsPath, item.name)
          });
        } catch (error) {
          console.error(`addons loading error${item.name}:`, error);
        }
      }
    }

    mainWindow.webContents.send('extensions-loaded', extensions);
  } catch (error) {
    console.error('addons error:', error);
  }
}

app.whenReady().then(createWindow);

ipcMain.on('open-extensions-folder', async () => {
  const extensionsPath = 'C:\\Program Files\\BaffyNet\\Addons';
  try {
    await shell.openPath(extensionsPath);
  } catch (error) {
    console.error('error while opening folder:', error);
  }
});

ipcMain.on('show-extension-popup', (event, extensionId) => {
  const extension = extensions.find(ext => ext.id === extensionId);
  if (extension && extension.popup) {
    mainWindow.webContents.send('open-extension-popup', {
      id: extension.id,
      name: extension.name,
      popupUrl: `file://${path.join(extension.path, extension.popup)}`
    });
  }
});

ipcMain.on('reload-extensions', () => {
  loadExtensions();
});

ipcMain.on('create-new-tab', (event, url = 'https://baffynet.rf.gd/readme.html') => {
  mainWindow.webContents.send('create-new-tab', url);
});

ipcMain.on('close-current-tab', () => {
  mainWindow.webContents.send('close-current-tab');
});

ipcMain.on('show-devtools', () => {
  mainWindow.webContents.send('show-devtools');
});

ipcMain.on('open-url-prompt', () => {
  mainWindow.webContents.send('open-url-prompt');
});

ipcMain.on('open-search-engine-prompt', () => {
  mainWindow.webContents.send('open-search-engine-prompt');
});

ipcMain.on('toggle-theme', () => {
  mainWindow.webContents.send('toggle-theme');
});

ipcMain.on('undo-action', () => {
  mainWindow.webContents.send('undo-action');
});

ipcMain.on('switch-to-tab', (event, index) => {
  mainWindow.webContents.send('switch-to-tab', index);
});

ipcMain.on('open-split-view', () => {
  mainWindow.webContents.send('open-split-view');
});

ipcMain.on('exit-split-view', () => {
  mainWindow.webContents.send('exit-split-view');
});

ipcMain.on('update-title', (event, title) => {
  mainWindow.setTitle(`BaffyNet - ${title}`);
});

ipcMain.on('check-tabs-count', (event, count) => {
  if (count === 0) {
    mainWindow.close();
  }
});

ipcMain.handle('get-history', () => browsingHistory);
ipcMain.handle('toggle-history', () => { historyEnabled = !historyEnabled; return historyEnabled; });
ipcMain.handle('is-history-enabled', () => historyEnabled);
ipcMain.handle('clear-history', () => { browsingHistory = []; return true; });
ipcMain.handle('remove-history-item', (event, url) => { browsingHistory = browsingHistory.filter(h => h.url !== url); return true; });

// Default keybinds (classic BaffyNet shortcuts)
const defaultKeybinds = {
  help: { key: 'r', ctrl: true, shift: false, action: 'open-help' },
  theme: { key: 'i', ctrl: true, shift: false, action: 'toggle-theme' },
  devtools: { key: 'd', ctrl: true, shift: false, action: 'open-devtools' },
  homepage: { key: 'q', ctrl: true, shift: false, action: 'open-homepage' },
  search: { key: 'j', ctrl: true, shift: false, action: 'open-search' },
  privacy: { key: 'm', ctrl: true, shift: false, action: 'open-privacy' },
  defaultBrowser: { key: '7', ctrl: true, shift: false, action: 'set-default' },
   addons: { key: 'e', ctrl: true, shift: true, action: 'open-addons' },
   history: { key: 'e', ctrl: true, shift: false, action: 'toggle-history' },

   tabs: { key: 'k', ctrl: true, shift: false, action: 'open-tabs' },
   keybinds: { key: 'h', ctrl: true, shift: false, action: 'open-keybinds' },
   newTab: { key: 't', ctrl: true, shift: false, action: 'new-tab' },
   closeTab: { key: 'w', ctrl: true, shift: false, action: 'close-tab' },
   splitView: { key: 'x', ctrl: true, shift: false, action: 'open-split-view' },
switchTab0: { key: '0', ctrl: true, shift: false, action: 'switch-tab-0' },
   switchTab1: { key: '1', ctrl: true, shift: false, action: 'switch-tab-1' },
   switchTab2: { key: '2', ctrl: true, shift: false, action: 'switch-tab-2' },
   switchTab3: { key: '3', ctrl: true, shift: false, action: 'switch-tab-3' },
   switchTab4: { key: '4', ctrl: true, shift: false, action: 'switch-tab-4' },
   switchTab5: { key: '5', ctrl: true, shift: false, action: 'switch-tab-5' },
   switchTab6: { key: '6', ctrl: true, shift: false, action: 'switch-tab-6' },
   switchTab7: { key: '7', ctrl: true, shift: false, action: 'switch-tab-7' },
   switchTab8: { key: '8', ctrl: true, shift: false, action: 'switch-tab-8' },
   switchTab9: { key: '9', ctrl: true, shift: false, action: 'switch-tab-9' },
  reopenTab: { key: 't', ctrl: true, shift: true, action: 'undo-action' },
blocker: { key: 'b', ctrl: true, shift: false, action: 'open-blocker' },
    textToSpeech: { key: 'p', ctrl: true, shift: false, action: 'text-to-speech' }
};

let customKeybinds = {};

async function loadKeybinds() {
  if (!keybindsFile) return;
  try {
    const content = await fsPromises.readFile(keybindsFile, 'utf8');
    customKeybinds = JSON.parse(content || '{}');
  } catch (e) {
    customKeybinds = {};
    await saveKeybinds();
  }
}

async function saveKeybinds() {
  if (!keybindsFile) return;
  try {
    await fsPromises.writeFile(keybindsFile, JSON.stringify(customKeybinds, null, 2), 'utf8');
  } catch (err) {
    console.error('saveKeybinds error', err);
  }
}

function getKeybinds() {
  return { ...defaultKeybinds, ...customKeybinds };
}

ipcMain.handle('get-keybinds', () => getKeybinds());
ipcMain.handle('set-keybinds', async (event, keybinds) => {
  customKeybinds = keybinds;
  await saveKeybinds();
  if (mainWindow) {
    mainWindow.webContents.send('keybinds-updated', getKeybinds());
  }
  return true;
});

// Open the user's downloads folder
ipcMain.handle('open-download-folder', async () => {
  try {
    const downloadsPath = app.getPath('downloads');
    // Downloads folder is now open
    await shell.openPath(downloadsPath);
    return true;
  } catch (err) {
    console.error('Error opening downloads folder:', err);
    return false;
  }
});

// Show an item in folder (highlight the file)
ipcMain.handle('show-item-in-folder', (event, filePath) => {
  try {
    shell.showItemInFolder(filePath);
    return true;
  } catch (err) {
    console.error('Error showing item in folder:', err);
    return false;
  }
});

// ==================== BLOCKER SYSTEM ====================
let blockedSites = new Set();
let blockerListener = null;

function loadBlocklist() {
  return (async () => {
    try {
      const content = await fsPromises.readFile(blocklistFile, 'utf8');
      const sites = JSON.parse(content || '[]');
      blockedSites.clear();
      sites.forEach(site => blockedSites.add(site.toLowerCase()));
      console.log('Blocklist loaded:', Array.from(blockedSites));
      applyBlockerToSession();
    } catch (e) {
      console.log('No blocklist file found, starting fresh');
      applyBlockerToSession();
    }
  })();
}

function saveBlocklist() {
  return (async () => {
    try {
      await fsPromises.writeFile(blocklistFile, JSON.stringify(Array.from(blockedSites), null, 2), 'utf8');
      console.log('Blocklist saved');
    } catch (err) {
      console.error('Error saving blocklist:', err);
    }
  })();
}

function isUrlBlocked(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    for (const blocked of blockedSites) {
      if (hostname === blocked || hostname.endsWith('.' + blocked)) {
        return true;
      }
    }
  } catch (e) {}
  return false;
}

function applyBlockerToSession() {
  if (!session.defaultSession) return;
  if (blockerListener) {
    try { session.defaultSession.webRequest.onBeforeRequest.removeListener(blockerListener); } catch (e) {}
  }
  blockerListener = (details, callback) => {
    try {
      const url = new URL(details.url);
      const hostname = url.hostname.toLowerCase();
      for (const blocked of blockedSites) {
        if (hostname === blocked || hostname.endsWith('.' + blocked)) {
          console.log('Blocked request to:', hostname);
          callback({ cancel: true });
          return;
        }
      }
    } catch (e) {}
    callback({ cancel: false });
  };
  session.defaultSession.webRequest.onBeforeRequest({ urls: ['<all_urls>'] }, blockerListener);
}

function setupNavigationBlocker() {
  if (!session.defaultSession) return;
  session.defaultSession.webContents.on('will-navigate', (webContents, url) => {
    if (isUrlBlocked(url)) {
      console.log('Blocked navigation to:', url);
      webContents.stop();
      webContents.loadURL('data:text/html,' + encodeURIComponent(
        '<html><head><title>Blocked</title></head><body style="background:#25242b;color:#f0f0f0;font-family:sans-serif;display:flex;justify-content:center;align-items:center;height:100vh;margin:0;"><div style="text-align:center;"><h1>(X) SmartBlocker</h1><p>This site has been blocked by BaffyNet Browser.</p><p style="color:#888;">Press Ctrl+B to manage blocked sites</p></div></body></html>'
      ));
    }
  });
}

ipcMain.handle('get-blocked-sites', () => {
  return Array.from(blockedSites);
});

ipcMain.handle('add-blocked-site', async (event, site) => {
  if (site && site.trim()) {
    const normalized = site.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '');
    if (normalized && !blockedSites.has(normalized)) {
      blockedSites.add(normalized);
      await saveBlocklist();
      applyBlockerToSession();
      console.log('Added to blocklist:', normalized);
      return true;
    }
  }
  return false;
});

ipcMain.handle('remove-blocked-site', async (event, site) => {
  if (site && blockedSites.has(site.toLowerCase())) {
    blockedSites.delete(site.toLowerCase());
    await saveBlocklist();
    applyBlockerToSession();
    console.log('Removed from blocklist:', site);
    return true;
  }
  return false;
});

ipcMain.handle('is-site-blocked', (event, url) => {
  return isUrlBlocked(url);
});

// Initialize blocker when app is ready
app.whenReady().then(async () => {
  keybindsFile = path.join(app.getPath('userData'), 'keybinds.json');
  blocklistFile = path.join(app.getPath('userData'), 'blocklist.json');
  
  loadBlocklist();
  setupNavigationBlocker();
  loadKeybinds().catch(() => {});
});
