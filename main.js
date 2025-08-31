const { app, BrowserWindow, Menu, ipcMain } = require('electron')
const path = require('path')
const { exec } = require('child_process')

let mainWindow

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
  })

  mainWindow.loadFile('public/index.html')

  // Горячие клавиши
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.control && (input.key.toLowerCase() === 'd' || input.key === 'в')) {
      event.preventDefault()
      mainWindow.webContents.send('show-devtools')
    }
    
    if (input.control && (input.key.toLowerCase() === 't' || input.key === 'е')) {
      event.preventDefault()
      mainWindow.webContents.send('create-new-tab')
    }
    
    if (input.control && (input.key.toLowerCase() === 'w' || input.key === 'ц')) {
      event.preventDefault()
      mainWindow.webContents.send('close-current-tab')
    }
    
    if (input.control && (input.key.toLowerCase() === 'q' || input.key === 'й')) {
      event.preventDefault()
      mainWindow.webContents.send('open-url-prompt')
    }

    if (input.control && (input.key.toLowerCase() === 'j' || input.key === 'о')) {
      event.preventDefault()
      mainWindow.webContents.send('open-search-engine-prompt')
    }

    // Переключение темы (Ctrl+I / Ctrl+Ш)
    if (input.control && (input.key.toLowerCase() === 'i' || input.key === 'ш')) {
      event.preventDefault()
      mainWindow.webContents.send('toggle-theme')
    }

    // Undo (Ctrl+Z) – восстановление вкладки
    if (input.control && (input.key.toLowerCase() === 'z' || input.key === 'я')) {
      event.preventDefault()
      mainWindow.webContents.send('undo-action')
    }

    // Переключение вкладок по Ctrl+1, Ctrl+2, ...
    if (input.control && /^[1-9]$/.test(input.key)) {
      event.preventDefault()
      mainWindow.webContents.send('switch-to-tab', parseInt(input.key) - 1)
    }

    // Открытие PrivacyNet (Ctrl+M / Ctrl+Ь)
    if (input.control && (input.key.toLowerCase() === 'm' || input.key === 'ь')) {
      event.preventDefault()
      mainWindow.webContents.send('open-privacynet')
    }

    // Сброс масштаба (Ctrl+0)
    if (input.control && input.key === '0') {
      event.preventDefault()
      mainWindow.webContents.send('reset-zoom')
    }
  })

  Menu.setApplicationMenu(null)
}

app.whenReady().then(createWindow)

ipcMain.on('create-new-tab', (event, url = 'https://baffynet.rf.gd/') => {
  mainWindow.webContents.send('create-new-tab', url)
})

ipcMain.on('close-current-tab', () => {
  mainWindow.webContents.send('close-current-tab')
})

ipcMain.on('show-devtools', () => {
  mainWindow.webContents.send('show-devtools')
})

ipcMain.on('open-url-prompt', () => {
  mainWindow.webContents.send('open-url-prompt')
})

ipcMain.on('open-search-engine-prompt', () => {
  mainWindow.webContents.send('open-search-engine-prompt')
})

ipcMain.on('toggle-theme', () => {
  mainWindow.webContents.send('toggle-theme')
})

ipcMain.on('undo-action', () => {
  mainWindow.webContents.send('undo-action')
})

ipcMain.on('switch-to-tab', (event, index) => {
  mainWindow.webContents.send('switch-to-tab', index)
})

ipcMain.on('update-title', (event, title) => {
  mainWindow.setTitle(`BaffyNet - ${title}`)
})

ipcMain.on('check-tabs-count', (event, count) => {
  if (count === 0) {
    mainWindow.close()
  }
})

ipcMain.on('open-privacynet', () => {
  const privacynetPath = path.join(__dirname, 'privacynet', 'privacynet.exe')
  exec(privacynetPath, (error) => {
    if (error) {
      console.error('Ошибка при запуске PrivacyNet:', error)
    }
  })
})


// Новый обработчик для изменения масштаба
ipcMain.on('change-zoom-level', (event, {tabId, delta}) => {
  mainWindow.webContents.send('change-zoom-level', {tabId, delta})
})

// Новый обработчик для сброса масштаба
ipcMain.on('reset-zoom-level', (event, tabId) => {
  mainWindow.webContents.send('reset-zoom-level', tabId)
})
console.log("BaffyNet 5.5 is started  ")
