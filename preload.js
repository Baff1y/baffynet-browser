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
  
  openExtensionsFolder: () => ipcRenderer.send('open-extensions-folder'),
  showExtensionPopup: (extensionId) => ipcRenderer.send('show-extension-popup', extensionId),
  onExtensionsLoaded: (callback) => ipcRenderer.on('extensions-loaded', callback),
  onOpenExtensionPopup: (callback) => ipcRenderer.on('open-extension-popup', callback),
  reloadExtensions: () => ipcRenderer.send('reload-extensions'),
  
  onOpenExtensionsShop: (callback) => ipcRenderer.on('open-extensions-shop', callback),
  
  onDownloadProgress: (callback) => ipcRenderer.on('download-progress', callback),
  onDownloadComplete: (callback) => ipcRenderer.on('download-complete', callback),
  onDownloadError: (callback) => ipcRenderer.on('download-error', callback),
  cancelDownload: (downloadId) => ipcRenderer.invoke('cancel-download', downloadId),
  openDownloadFolder: () => ipcRenderer.invoke('open-download-folder'),
  showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),
  
  // Новые функции для системы разрешений
  requestPermission: (tabId, permissionType, origin, force = false) => ipcRenderer.invoke('request-permission', tabId, permissionType, origin, force),
  checkPermission: (tabId, permissionType, origin) => ipcRenderer.invoke('check-permission', tabId, permissionType, origin),
  onPermissionRequest: (callback) => ipcRenderer.on('permission-request', callback),
  onPermissionResponse: (callback) => ipcRenderer.on('permission-response', callback),
  sendPermissionResponse: (requestId, allow) => ipcRenderer.send('permission-response', { requestId, allow }),
  
  // Функции для блокировщика сайтов
  onOpenBlocker: (callback) => ipcRenderer.on('open-blocker', callback),
  getBlockedSites: () => ipcRenderer.invoke('get-blocked-sites'),
  addBlockedSite: (site) => ipcRenderer.invoke('add-blocked-site', site),
  removeBlockedSite: (site) => ipcRenderer.invoke('remove-blocked-site', site),
  isSiteBlocked: (url) => ipcRenderer.invoke('is-site-blocked', url),
  
  // Ctrl+K menu handler
  onCon: (callback) => ipcRenderer.on('con', callback),
  
  // Ctrl+H hotkeys menu handler
  onOpenHotkeysMenu: (callback) => ipcRenderer.on('open-hotkeys-menu', callback),
  
  // Ctrl+X split view handlers
  onOpenSplitView: (callback) => ipcRenderer.on('open-split-view', callback),
  onExitSplitView: (callback) => ipcRenderer.on('exit-split-view', callback),

  // History functions
  onToggleHistory: (callback) => ipcRenderer.on('toggle-history', callback),
  onHistoryUpdated: (callback) => ipcRenderer.on('history-updated', callback),
  getHistory: () => ipcRenderer.invoke('get-history'),
  toggleHistory: () => ipcRenderer.invoke('toggle-history'),
  isHistoryEnabled: () => ipcRenderer.invoke('is-history-enabled'),
  clearHistory: () => ipcRenderer.invoke('clear-history'),
  removeHistoryItem: (url) => ipcRenderer.invoke('remove-history-item', url),

  // Keybinds functions
  getKeybinds: () => ipcRenderer.invoke('get-keybinds'),
  setKeybinds: (keybinds) => ipcRenderer.invoke('set-keybinds', keybinds),
  onKeybindsUpdated: (callback) => ipcRenderer.on('keybinds-updated', callback),
  onRenameKeybinds: (callback) => ipcRenderer.on('rename-keybinds', callback),
  onCustomHotkeys: (callback) => ipcRenderer.on('custom-hotkeys', callback),
  
  // Text to speech handler
  onTextToSpeech: (callback) => ipcRenderer.on('text-to-speech', callback)
})
