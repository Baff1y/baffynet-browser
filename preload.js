const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  onCreateNewTab: (callback) => ipcRenderer.on('create-new-tab', callback),
  onCloseCurrentTab: (callback) => ipcRenderer.on('close-current-tab', callback),
  onShowDevTools: (callback) => ipcRenderer.on('show-devtools', callback),
  onOpenUrlPrompt: (callback) => ipcRenderer.on('open-url-prompt', callback),
  onOpenSearchEnginePrompt: (callback) => ipcRenderer.on('open-search-engine-prompt', callback),
  onToggleTheme: (callback) => ipcRenderer.on('toggle-theme', callback),
  onSwitchToTab: (callback) => ipcRenderer.on('switch-to-tab', callback),
  onChangeHomePage: (callback) => ipcRenderer.on('change-home-page', callback),
  onChangeNewTabPage: (callback) => ipcRenderer.on('change-new-tab-page', callback),
  updateTitle: (title) => ipcRenderer.send('update-title', title),
  checkTabsCount: (count) => ipcRenderer.send('check-tabs-count', count),
  onReloadPage: (callback) => ipcRenderer.on('reload-page', callback),
  onGoBack: (callback) => ipcRenderer.on('go-back', callback),
  onGoForward: (callback) => ipcRenderer.on('go-forward', callback),
  onUndoAction: (callback) => ipcRenderer.on('undo-action', callback),
  
  // Новые методы для расширений
  openExtensionsFolder: () => ipcRenderer.send('open-extensions-folder'),
  showExtensionPopup: (extensionId) => ipcRenderer.send('show-extension-popup', extensionId),
  onExtensionsLoaded: (callback) => ipcRenderer.on('extensions-loaded', callback),
  onOpenExtensionPopup: (callback) => ipcRenderer.on('open-extension-popup', callback),
  reloadExtensions: () => ipcRenderer.send('reload-extensions'),
  
  // Новый метод для магазина расширений
  onOpenExtensionsShop: (callback) => ipcRenderer.on('open-extensions-shop', callback)
})
