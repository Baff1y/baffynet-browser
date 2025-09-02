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
  saveSearchEngine: (template) => ipcRenderer.send('save-search-engine', template),
  getSearchEngine: () => localStorage.getItem('searchEngineTemplate') || 'https://www.google.com/search?q=${encodeURIComponent(url)}',
  onReloadPage: (callback) => ipcRenderer.on('reload-page', callback),
  onGoBack: (callback) => ipcRenderer.on('go-back', callback),
  onGoForward: (callback) => ipcRenderer.on('go-forward', callback),
  onUndoAction: (callback) => ipcRenderer.on('undo-action', callback)
})  