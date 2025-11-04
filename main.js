const { app, BrowserWindow, Menu, ipcMain, session, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;
let extensions = [];
const activeDownloads = new Map();
let deeplinkingUrl = null;

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
    console.error('Не удалось зарегистрировать обработчики протоколов:', err);
  }
}

// Перехватываем попытки открыть новое окно из любого webContents (включая webview)
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
          console.error('Ошибка в глобальном обработчике открытия окна:', err)
        }
        return { action: 'deny' }
      })
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

  // 🔥 Обработка target="_blank"
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

  mainWindow.webContents.on('before-input-event', (event, input) => {
    const key = input.key.toLowerCase();

    if (input.control && key === 'd') {
      event.preventDefault();
      mainWindow.webContents.send('show-devtools');
    }
    if (input.control && key === 't') {
      event.preventDefault();
      mainWindow.webContents.send('create-new-tab');
    }
    if (input.control && key === 'w') {
      event.preventDefault();
      mainWindow.webContents.send('close-current-tab');
    }
    if (input.control && key === 'q') {
      event.preventDefault();
      mainWindow.webContents.send('open-url-prompt');
    }
    if (input.control && key === 'j') {
      event.preventDefault();
      mainWindow.webContents.send('open-search-engine-prompt');
    }
    if (input.control && key === 'i') {
      event.preventDefault();
      mainWindow.webContents.send('toggle-theme');
    }
    if (input.control && key === 'z') {
      event.preventDefault();
      mainWindow.webContents.send('undo-action');
    }
    if (input.control && /^[1-9]$/.test(key)) {
      event.preventDefault();
      mainWindow.webContents.send('switch-to-tab', parseInt(key) - 1);
    }
    if (input.control && key === 'r') {
      event.preventDefault();
      mainWindow.webContents.send('create-new-tab', `https://baffynet.rf.gd/help.html`);
    }
    if (input.control && key === 'm') {
      event.preventDefault();
      shell.openPath('C:/Program Files/BaffyNet/PrivacyNet.exe')
        .then(result => {
          if (result) console.error('Ошибка при открытии:', result);
        });
    }
    if (input.control && input.shift && key === 'e') {
      event.preventDefault();
      mainWindow.webContents.send('create-new-tab', 'https://baffynet.rf.gd/shop.html');
    }

    if (input.control && key === '7') {
      event.preventDefault();
      mainWindow.webContents.send('create-new-tab', 'https://baffynet.rf.gd/test.html');
    }
  });

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
      await fs.access(extensionsPath);
    } catch {
      await fs.mkdir(extensionsPath, { recursive: true });
    }

    const items = await fs.readdir(extensionsPath, { withFileTypes: true });
    extensions = [];

    for (const item of items) {
      if (item.isDirectory()) {
        const manifestPath = path.join(extensionsPath, item.name, 'manifest.json');
        try {
          const manifestData = await fs.readFile(manifestPath, 'utf8');
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
          console.error(`Ошибка загрузки расширения ${item.name}:`, error);
        }
      }
    }

    mainWindow.webContents.send('extensions-loaded', extensions);
  } catch (error) {
    console.error('Ошибка загрузки расширений:', error);
  }
}

app.whenReady().then(createWindow);

ipcMain.on('open-extensions-folder', async () => {
  const extensionsPath = 'C:\\Program Files\\BaffyNet\\Addons';
  try {
    await shell.openPath(extensionsPath);
  } catch (error) {
    console.error('Ошибка открытия папки:', error);
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

ipcMain.on('update-title', (event, title) => {
  mainWindow.setTitle(`BaffyNet - ${title}`);
});

ipcMain.on('check-tabs-count', (event, count) => {
  if (count === 0) {
    mainWindow.close();
  }
});

ipcMain.handle('cancel-download', (event, downloadId) => {
  const download = activeDownloads.get(downloadId);
  if (download && download.item) {
    download.item.cancel();
    activeDownloads.delete(downloadId);
    return true;
  }
  return false;
});

// Open the user's downloads folder
ipcMain.handle('open-download-folder', async () => {
  try {
    const downloadsPath = app.getPath('downloads');
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
    // shell.showItemInFolder returns a boolean in some Electron versions; just call it
    shell.showItemInFolder(filePath);
    return true;
  } catch (err) {
    console.error('Error showing item in folder:', err);
    return false;
  }
});
