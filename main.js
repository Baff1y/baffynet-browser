const { app, BrowserWindow, Menu, ipcMain, session, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;
let extensions = [];
const activeDownloads = new Map();

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

if (!app.isDefaultProtocolClient('http')) {
  app.setAsDefaultProtocolClient('http');
}
if (!app.isDefaultProtocolClient('https')) {
  app.setAsDefaultProtocolClient('https');
}

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
