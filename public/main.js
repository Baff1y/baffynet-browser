const tabsContainer = document.getElementById('tab-bar')
const webviewsContainer = document.getElementById('webviews-container')
const urlBar = document.getElementById('url-bar')
let tabCounter = 1
let closedTabsHistory = []
let extensionsList = []

// Загружаем стартовую страницу из настроек
const defaultStartPage = localStorage.getItem('startPage') || 'https://baffynet.rf.gd'
createNewTab(defaultStartPage)

// Создаем кнопку расширений после загрузки
setTimeout(() => {
  createExtensionsButton()
}, 1000)

// Инициализация темы при загрузке
initializeTheme()

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark'
  document.body.classList.toggle('dark-theme', savedTheme === 'dark')
  document.body.classList.toggle('light-theme', savedTheme === 'light')
  updateThemeVariables(savedTheme)
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark-theme')
  const newTheme = isDark ? 'light' : 'dark'
  
  document.body.classList.toggle('dark-theme', !isDark)
  document.body.classList.toggle('light-theme', isDark)
  
  localStorage.setItem('theme', newTheme)
  updateThemeVariables(newTheme)
  
  console.log(`Тема изменена на: ${newTheme}`)
}

function updateThemeVariables(theme) {
  const root = document.documentElement
  
  if (theme === 'light') {
    root.style.setProperty('--bg-color', '#f0f0f0')
    root.style.setProperty('--text-color', '#333333')
    root.style.setProperty('--panel-bg', '#ffffff')
    root.style.setProperty('--tab-bg', '#e0e0e0')
    root.style.setProperty('--tab-active-bg', '#d0d0d0')
    root.style.setProperty('--url-bar-bg', '#ffffff')
    root.style.setProperty('--button-bg', '#e8e8e8')
    root.style.setProperty('--button-hover', '#d8d8d8')
    root.style.setProperty('--border-color', '#cccccc')
  } else {
    root.style.setProperty('--bg-color', '#25242b')
    root.style.setProperty('--text-color', '#f0f0f0')
    root.style.setProperty('--panel-bg', '#353440')
    root.style.setProperty('--tab-bg', '#353440')
    root.style.setProperty('--tab-active-bg', '#4a475f')
    root.style.setProperty('--url-bar-bg', '#353440')
    root.style.setProperty('--button-bg', '#353440')
    root.style.setProperty('--button-hover', '#4a475f')
    root.style.setProperty('--border-color', '#3a3944')
  }
}

function createNewTab(url) {
  const finalUrl = url || localStorage.getItem('newTabPage') || 'https://baffynet.rf.gd'
  const tabId = tabCounter++

  const tab = document.createElement('div')
  tab.className = 'tab'
  tab.dataset.tabId = tabId
  tab.innerHTML = `
    <img class="tab-favicon" src="https://i.ibb.co/v4PmyTNq/image.png">
    <span class="tab-title">${finalUrl.includes('example.com') ? 'Example' : 'Новая вкладка'}</span>
    <span class="tab-close" data-tab-id="${tabId}">×</span>
  `
  tabsContainer.insertBefore(tab, document.getElementById('new-tab'))

  const webview = document.createElement('webview')
  webview.src = finalUrl
  webview.dataset.tabId = tabId
  webview.style.display = 'none'
  webviewsContainer.appendChild(webview)

  webview.addEventListener('did-navigate', (e) => {
    urlBar.value = e.url
    updateTabTitle(tabId, webview.getTitle())
  })

  webview.addEventListener('page-title-updated', (e) => {
    updateTabTitle(tabId, e.title)
  })

  webview.addEventListener('page-favicon-updated', (e) => {
    updateTabFavicon(tabId, e.favicons[0])
  })

  switchTab(tabId)
}

function updateTabFavicon(tabId, faviconUrl) {
  const tab = document.querySelector(`.tab[data-tab-id="${tabId}"]`)
  if (!tab) return

  let favicon = tab.querySelector('.tab-favicon')
  if (!favicon) {
    favicon = document.createElement('img')
    favicon.className = 'tab-favicon'
    tab.insertBefore(favicon, tab.querySelector('.tab-title'))
  }

  favicon.src = faviconUrl || 'https://www.google.com/favicon.ico'
}

function updateTabTitle(tabId, title) {
  const tabTitle = document.querySelector(`.tab[data-tab-id="${tabId}"] .tab-title`)
  if (tabTitle) tabTitle.textContent = title || 'Новая вкладка'

  if (window.electronAPI) {
    window.electronAPI.updateTitle(title)
  }
}

function switchTab(tabId) {
  document.querySelectorAll('webview').forEach(w => {
    w.style.display = 'none'
  })

  document.querySelectorAll('.tab').forEach(t => {
    t.classList.remove('active')
  })

  const tab = document.querySelector(`.tab[data-tab-id="${tabId}"]`)
  const webview = document.querySelector(`webview[data-tab-id="${tabId}"]`)

  if (tab && webview) {
    tab.classList.add('active')
    webview.style.display = 'flex'
    urlBar.value = webview.src
  }
}

function closeTab(tabId) {
  const tab = document.querySelector(`.tab[data-tab-id="${tabId}"]`)
  const webview = document.querySelector(`webview[data-tab-id="${tabId}"]`)

  if (tab && webview) {
    closedTabsHistory.push({
      id: tabId,
      url: webview.src,
      title: tab.querySelector('.tab-title').textContent,
      favicon: tab.querySelector('.tab-favicon')?.src
    })

    tab.remove()
    webview.remove()

    const remainingTabs = document.querySelectorAll('.tab:not(#new-tab)')
    if (remainingTabs.length > 0) {
      switchTab(remainingTabs[0].dataset.tabId)
    } else {
      if (window.electronAPI) {
        window.electronAPI.checkTabsCount(0)
      }
    }
  }
}

function undoCloseTab() {
  if (closedTabsHistory.length > 0) {
    const lastTab = closedTabsHistory.pop()
    createNewTab(lastTab.url)
  }
}

function switchToTabByIndex(index) {
  const tabs = Array.from(document.querySelectorAll('.tab:not(#new-tab)'))
  if (index >= 0 && index < tabs.length) {
    switchTab(tabs[index].dataset.tabId)
  }
}

function showUrlPromptModal() {
  const modal = document.getElementById('url-prompt-modal')
  const startInput = document.getElementById('start-url')
  const newTabInput = document.getElementById('new-tab-url')

  startInput.value = localStorage.getItem('startPage') || 'https://baffynet.rf.gd'
  newTabInput.value = localStorage.getItem('newTabPage') || 'https://baffynet.rf.gd'

  modal.classList.remove('hidden')

  document.getElementById('save-url-settings').onclick = () => {
    localStorage.setItem('startPage', startInput.value.trim())
    localStorage.setItem('newTabPage', newTabInput.value.trim())
    modal.classList.add('hidden')
  }

  document.getElementById('cancel-url-settings').onclick = () => {
    modal.classList.add('hidden')
  }
}

function getSearchEngineTemplate() {
  return localStorage.getItem('searchEngineTemplate') || 'https://www.google.com/search?q={URL}';
}

function showSearchEnginePromptModal() {
  const modal = document.getElementById('search-engine-modal')
  const searchEngineInput = document.getElementById('search-engine-input')

  searchEngineInput.value = getSearchEngineTemplate();

  modal.classList.remove('hidden')

  document.getElementById('save-search-engine').onclick = () => {
    const template = searchEngineInput.value.trim()
    if (template.includes('{URL}')) {
      localStorage.setItem('searchEngineTemplate', template)
      modal.classList.add('hidden')
    } else {
      alert('Шаблон должен содержать {URL} для подстановки поискового запроса')
    }
  }

  document.getElementById('cancel-search-engine').onclick = () => {
    modal.classList.add('hidden')
  }
}

function showUrlPrompt() {
  showUrlPromptModal()
}

// Система расширений
function createExtensionsButton() {
  const toolbar = document.getElementById('toolbar')
  
  // Создаем контейнер для кнопок расширений и загрузок
  const rightButtonsContainer = document.createElement('div')
  rightButtonsContainer.id = 'right-buttons'
  rightButtonsContainer.style.cssText = `
    display: flex;
    gap: 5px;
    margin-left: auto;
    align-items: center;
  `

  // Кнопка расширений
  const extensionsBtn = document.createElement('button')
  extensionsBtn.id = 'extensions-btn'
  extensionsBtn.innerHTML = '⧉'
  extensionsBtn.title = 'Расширения'
  extensionsBtn.style.cssText = `
    padding: 6px 12px;
    background: var(--button-bg);
    color: var(--text-color);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  `

  extensionsBtn.addEventListener('click', showExtensionsMenu)

  // Кнопка загрузок (без счетчика)
  const downloadsBtn = document.createElement('button')
  downloadsBtn.id = 'downloads-btn'
  downloadsBtn.innerHTML = '⭳'
  downloadsBtn.title = 'Загрузки'
  downloadsBtn.style.cssText = `
    padding: 6px 12px;
    background: var(--button-bg);
    color: var(--text-color);
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
  `

  downloadsBtn.addEventListener('click', showDownloads)

  // Добавляем кнопки в контейнер
  rightButtonsContainer.appendChild(extensionsBtn)
  rightButtonsContainer.appendChild(downloadsBtn)

  // Вставляем контейнер в тулбар
  toolbar.appendChild(rightButtonsContainer)
}

function showExtensionsMenu() {
  // Создаем меню расширений
  const menu = document.createElement('div')
  menu.className = 'extensions-menu'
  menu.style.cssText = `
    position: absolute;
    top: 40px;
    right: 10px;
    background: var(--panel-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 10px;
    min-width: 250px;
    max-height: 400px;
    overflow-y: auto;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `

  const title = document.createElement('h3')
  title.textContent = 'Расширения'
  title.style.margin = '0 0 10px 0'
  title.style.color = 'var(--text-color)'
  menu.appendChild(title)

  // Кнопка открытия папки
  const openFolderBtn = document.createElement('button')
  openFolderBtn.textContent = '/__/ Открыть папку расширений'
  openFolderBtn.style.width = '100%'
  openFolderBtn.style.marginBottom = '10px'
  openFolderBtn.onclick = () => {
    if (window.electronAPI) window.electronAPI.openExtensionsFolder()
    menu.remove()
  }
  menu.appendChild(openFolderBtn)

  // Кнопка перезагрузки
  const reloadBtn = document.createElement('button')
  reloadBtn.textContent = '⟳ Перезагрузить расширения'
  reloadBtn.style.width = '100%'
  reloadBtn.style.marginBottom = '10px'
  reloadBtn.onclick = () => {
    if (window.electronAPI) window.electronAPI.reloadExtensions()
    menu.remove()
  }
  menu.appendChild(reloadBtn)

  // Кнопка открытия магазина расширений
  const shopBtn = document.createElement('button')
  shopBtn.textContent = '(/) Магазин расширений'
  shopBtn.style.width = '100%'
  shopBtn.style.marginBottom = '10px'
  shopBtn.onclick = () => {
    createNewTab('https://baffynet.rf.gd/shop.html')
    menu.remove()
  }
  menu.appendChild(shopBtn)

  // Список расширений
  if (extensionsList.length === 0) {
    const noExtensions = document.createElement('div')
    noExtensions.textContent = 'Расширения не найдены'
    noExtensions.style.color = 'var(--text-color)'
    noExtensions.style.textAlign = 'center'
    noExtensions.style.padding = '20px'
    menu.appendChild(noExtensions)
  } else {
    extensionsList.forEach(ext => {
      const extItem = document.createElement('div')
      extItem.className = 'extension-item'
      extItem.style.cssText = `
        padding: 8px;
        margin: 5px 0;
        background: var(--tab-bg);
        border-radius: 4px;
        cursor: pointer;
      `
      extItem.innerHTML = `
        <div style="font-weight: bold; color: var(--text-color)">${ext.name}</div>
        <div style="font-size: 12px; color: #888">${ext.version}</div>
        ${ext.description ? `<div style="font-size: 11px; color: #666; margin-top: 4px">${ext.description}</div>` : ''}
      `

      extItem.onclick = () => {
        if (ext.popup && window.electronAPI) {
          window.electronAPI.showExtensionPopup(ext.id)
        }
        menu.remove()
      }

      menu.appendChild(extItem)
    })
  }

  // Закрытие при клике вне меню
  const closeMenu = (e) => {
    if (!menu.contains(e.target) && e.target.id !== 'extensions-btn') {
      menu.remove()
      document.removeEventListener('click', closeMenu)
    }
  }

  setTimeout(() => {
    document.addEventListener('click', closeMenu)
  }, 100)

  document.body.appendChild(menu)
}

// Popup для расширений
function showExtensionPopup(extension) {
  const popup = document.createElement('div')
  popup.className = 'extension-popup'
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--panel-bg);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 0;
    z-index: 1001;
    min-width: 300px;
    max-width: 400px;
    max-height: 500px;
    overflow: hidden;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  `

  const header = document.createElement('div')
  header.style.cssText = `
    padding: 12px;
    background: var(--tab-active-bg);
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  `

  const title = document.createElement('div')
  title.textContent = extension.name
  title.style.fontWeight = 'bold'
  title.style.color = 'var(--text-color)'

  const closeBtn = document.createElement('button')
  closeBtn.textContent = '×'
  closeBtn.style.background = 'none'
  closeBtn.style.border = 'none'
  closeBtn.style.fontSize = '18px'
  closeBtn.style.cursor = 'pointer'
  closeBtn.style.color = 'var(--text-color)'
  closeBtn.onclick = () => popup.remove()

  header.appendChild(title)
  header.appendChild(closeBtn)
  popup.appendChild(header)

  const iframe = document.createElement('iframe')
  iframe.src = extension.popupUrl
  iframe.style.width = '100%'
  iframe.style.height = '400px'
  iframe.style.border = 'none'
  popup.appendChild(iframe)

  // Закрытие при клике вне popup
  const overlay = document.createElement('div')
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.5);
    z-index: 1000;
  `
  overlay.onclick = () => {
    popup.remove()
    overlay.remove()
  }

  document.body.appendChild(overlay)
  document.body.appendChild(popup)
}

function showDownloads() {
  document.getElementById('downloads-panel').classList.remove('hidden');
}

// Обработчики кнопок
document.getElementById('new-tab').addEventListener('click', () => {
  createNewTab()
})

tabsContainer.addEventListener('click', (e) => {
  if (e.target.classList.contains('tab-close')) {
    e.stopPropagation()
    closeTab(e.target.dataset.tabId)
  } else if (e.target.closest('.tab')) {
    switchTab(e.target.closest('.tab').dataset.tabId)
  }
})

document.getElementById('back').addEventListener('click', () => {
  const activeWebview = document.querySelector('webview[style*="display: flex;"]')
  if (activeWebview) activeWebview.goBack()
})

document.getElementById('forward').addEventListener('click', () => {
  const activeWebview = document.querySelector('webview[style*="display: flex;"]')
  if (activeWebview) activeWebview.goForward()
})

document.getElementById('reload').addEventListener('click', () => {
  const activeWebview = document.querySelector('webview[style*="display: flex;"]')
  if (activeWebview) activeWebview.reload()
})

urlBar.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    const activeWebview = document.querySelector('webview[style*="display: flex;"]')
    if (activeWebview) {
      let url = urlBar.value.trim()
      if (!url.startsWith('http')) {
        const searchTemplate = getSearchEngineTemplate();
        url = url.includes('.') ? `https://${url}` : searchTemplate.replace('{URL}', encodeURIComponent(url))
      }
      activeWebview.src = url
    }
  }
})

// Обработчики горячих клавиш
if (window.electronAPI) {
  window.electronAPI.onCreateNewTab((event, url) => {
    createNewTab(url)
  })

  window.electronAPI.onCloseCurrentTab(() => {
    const activeTab = document.querySelector('.tab.active')
    if (activeTab) closeTab(activeTab.dataset.tabId)
  })

  window.electronAPI.onShowDevTools(() => {
    const activeWebview = document.querySelector('webview[style*="display: flex;"]')
    if (activeWebview) activeWebview.openDevTools()
  })

  window.electronAPI.onOpenUrlPrompt(() => {
    showUrlPrompt()
  })

  window.electronAPI.onOpenSearchEnginePrompt(() => {
    showSearchEnginePromptModal()
  })

  window.electronAPI.onToggleTheme(() => {
    toggleTheme()
  })

  window.electronAPI.onUndoAction(() => {
    undoCloseTab()
  })

  window.electronAPI.onSwitchToTab((event, index) => {
    switchToTabByIndex(index)
  })

  window.electronAPI.onOpenExtensionsShop(() => {
    createNewTab('https://baffynet.rf.gd/shop.html')
  })

  // Обработчики расширений
  window.electronAPI.onExtensionsLoaded((event, extensions) => {
    extensionsList = extensions
    console.log('Расширения загружены:', extensions)
  })

  window.electronAPI.onOpenExtensionPopup((event, extension) => {
    showExtensionPopup(extension)
  })
}
