const { app, BrowserWindow, Menu, ipcMain, session, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;

let mainWindow;
let extensions = [];

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

  mainWindow.webContents.on('before-input-event', (event, input) => {
    // DevTools
    if (input.control && (input.key.toLowerCase() === 'd' || input.key === 'в')) {
      event.preventDefault();
      mainWindow.webContents.send('show-devtools');
    }

    // Новая вкладка
    if (input.control && (input.key.toLowerCase() === 't' || input.key === 'е')) {
      event.preventDefault();
      mainWindow.webContents.send('create-new-tab');
    }

    // Закрыть вкладку
    if (input.control && (input.key.toLowerCase() === 'w' || input.key === 'ц')) {
      event.preventDefault();
      mainWindow.webContents.send('close-current-tab');
    }

    // Свитчер домашней страницы
    if (input.control && (input.key.toLowerCase() === 'q' || input.key === 'й')) {
      event.preventDefault();
      mainWindow.webContents.send('open-url-prompt');
    }

    // Свитчер поисковых систем
    if (input.control && (input.key.toLowerCase() === 'j' || input.key === 'о')) {
      event.preventDefault();
      mainWindow.webContents.send('open-search-engine-prompt');
    }

    // Переключение темы
    if (input.control && (input.key.toLowerCase() === 'i' || input.key === 'ш')) {
      event.preventDefault();
      mainWindow.webContents.send('toggle-theme');
    }

    // Undo
    if (input.control && (input.key.toLowerCase() === 'z' || input.key === 'я')) {
      event.preventDefault();
      mainWindow.webContents.send('undo-action');
    }

    // Переключение вкладок Ctrl+1..9
    if (input.control && /^[1-9]$/.test(input.key)) {
      event.preventDefault();
      mainWindow.webContents.send('switch-to-tab', parseInt(input.key) - 1);
    }

    // Открыть справку (Ctrl+R)
    if (input.control && (input.key.toLowerCase() === 'r' || input.key === 'к')) {
      event.preventDefault();
      mainWindow.webContents.send('create-new-tab', `https://baffynet.rf.gd/help.html`);
    }

    // Открыть C:\Windows (Ctrl+M)
    if (input.control && (input.key.toLowerCase() === 'm' || input.key === 'ь')) {
      event.preventDefault();
      shell.openPath('C:/Program Files/BaffyNet/PrivacyNet.exe')
        .then(result => {
          if (result) console.error('Ошибка при открытии папки:', result);
        });
    }

    // Открыть магазин расширений (Ctrl+Shift+E)
    if (input.control && input.shift && (input.key.toLowerCase() === 'e' || input.key === 'у')) {
      event.preventDefault();
      mainWindow.webContents.send('create-new-tab', 'https://baffynet.rf.gd/shop.html');
    }
  });

  Menu.setApplicationMenu(null);
}

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

ipcMain.on('save-search-engine', (event, template) => {
  localStorage.setItem('searchEngineTemplate', template);
});
