
const tabsContainer = document.getElementById('tab-bar')
const webviewsContainer = document.getElementById('webviews-container')
const urlBar = document.getElementById('url-bar')
let tabCounter = 1
let closedTabsHistory = []
let extensionsList = []
let blockedSitesList = []

// Загружаем стартовую страницу из настроек
const defaultStartPage = localStorage.getItem('startPage') || 'https://baffynet.rf.gd'

// Восстанавливаем вкладки, если включена опция сохранения
const saveTabsEnabled = localStorage.getItem('saveTabsOnClose') === 'true';
if (saveTabsEnabled) {
  const restored = restoreTabsFromStorage();
  if (!restored) {
    createNewTab(defaultStartPage);
  }
} else {
  createNewTab(defaultStartPage);
}

// Создаем кнопку расширений после загрузки
setTimeout(() => {
  createExtensionsButton()
}, 1000)

// Initialize theme
initializeTheme()
applyCustomCSS()

// Save tabs when closing browser
window.addEventListener('beforeunload', () => {
  if (localStorage.getItem('saveTabsOnClose') === 'true') {
    saveTabsToStorage();
  }
});

function initializeTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark'
  document.body.classList.toggle('dark-theme', savedTheme === 'dark')
  document.body.classList.toggle('light-theme', savedTheme === 'light')
  updateThemeVariables(savedTheme)
}

function applyCustomCSS() {
  const customCSS = localStorage.getItem('customCSS') || ''
  if (customCSS) {
    let styleEl = document.getElementById('custom-css-style')
    if (!styleEl) {
      styleEl = document.createElement('style')
      styleEl.id = 'custom-css-style'
      document.head.appendChild(styleEl)
    }
    styleEl.textContent = customCSS
  }
}

function toggleTheme() {
  const isDark = document.body.classList.contains('dark-theme')
  const newTheme = isDark ? 'light' : 'dark'
  
  document.body.classList.toggle('dark-theme', !isDark)
  document.body.classList.toggle('light-theme', isDark)
  
  localStorage.setItem('theme', newTheme)
  updateThemeVariables(newTheme)
  
  // Используем кастомный alert браузера
  browserAlert(`Тема изменена на: ${newTheme}`, 'BaffyNet');
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

// Theme panel: reuse modal styles to present theme choices and custom CSS editor
function showThemePanel() {
  // If already open, don't open another
  if (document.getElementById('theme-panel-modal')) return

  const modal = document.createElement('div')
  modal.className = 'modal'
  modal.id = 'theme-panel-modal'

  const content = document.createElement('div')
  content.className = 'modal-content'
  content.style.maxWidth = '600px'

  // Render tabs and content
  const current = localStorage.getItem('theme') || 'dark'
  const darkMarker = current === 'dark' ? ')' : ' '
  const lightMarker = current === 'light' ? '*' : ' '
  const customCSS = localStorage.getItem('customCSS') || ''

  content.innerHTML = `
    <h2>Design panel</h2>
    
    <div style="display:flex; gap:8px; margin:10px 0; border-bottom:1px solid var(--border-color); padding-bottom:8px;">
      <button id="tab-themes" style="padding:6px 12px; background:var(--tab-active-bg); color:var(--text-color); border:none; border-radius:4px; cursor:pointer; font-weight:bold;">Themes</button>
      <button id="tab-css" style="padding:6px 12px; background:var(--tab-bg); color:var(--text-color); border:none; border-radius:4px; cursor:pointer;">Custom CSS</button>
    </div>
    
    <div id="content-themes" style="display:block;">
      <div style="margin:10px 0; color:var(--text-color);">I should type something here</div>
      <div style="margin:10px 0; display:flex; flex-direction:column; gap:8px;">
        <button id="theme-btn-dark" style="padding:10px 12px; text-align:left; font-family:monospace; background:${current === 'dark' ? 'var(--tab-active-bg)' : 'var(--tab-bg)'}; color:var(--text-color); border:1px solid var(--border-color); border-radius:4px; cursor:pointer;">${darkMarker}Black</button>
        <button id="theme-btn-light" style="padding:10px 12px; text-align:left; font-family:monospace; background:${current === 'light' ? 'var(--tab-active-bg)' : 'var(--tab-bg)'}; color:var(--text-color); border:1px solid var(--border-color); border-radius:4px; cursor:pointer;">${lightMarker}White</button>
      </div>
    </div>
    
    <div id="content-css" style="display:none;">
      <div style="margin:10px 0; color:var(--text-color);">Enter your css to edit interface:</div>
      <textarea id="custom-css-input" style="width:100%; height:250px; padding:8px; background:var(--url-bar-bg); color:var(--text-color); border:1px solid var(--border-color); border-radius:4px; font-family:monospace; font-size:12px; resize:vertical;">${customCSS}</textarea>
      <div style="margin:10px 0; font-size:12px; color:#888;">
        Example: <code>body { background-color: #1a1a1a !important; }</code>
      </div>
      <div style="display:flex; gap:8px; margin:10px 0;">
        <button id="save-css-btn" style="flex:1; padding:8px 12px; background:var(--button-bg); color:var(--text-color); border:1px solid var(--border-color); border-radius:4px; cursor:pointer;">Apply</button>
        <button id="reset-css-btn" style="flex:1; padding:8px 12px; background:var(--button-bg); color:var(--text-color); border:1px solid var(--border-color); border-radius:4px; cursor:pointer;">Clear</button>
      </div>
    </div>
    
    <div class="modal-actions" style="margin-top:10px;">
      <button id="theme-apply-close">Close</button>
    </div>
  `

  modal.appendChild(content)
  document.body.appendChild(modal)

  // Tab switching
  const tabThemes = document.getElementById('tab-themes')
  const tabCss = document.getElementById('tab-css')
  const contentThemes = document.getElementById('content-themes')
  const contentCss = document.getElementById('content-css')

  tabThemes.onclick = () => {
    contentThemes.style.display = 'block'
    contentCss.style.display = 'none'
    tabThemes.style.background = 'var(--tab-active-bg)'
    tabCss.style.background = 'var(--tab-bg)'
  }

  tabCss.onclick = () => {
    contentThemes.style.display = 'none'
    contentCss.style.display = 'block'
    tabThemes.style.background = 'var(--tab-bg)'
    tabCss.style.background = 'var(--tab-active-bg)'
  }

  // Theme selection handlers
  const setMarkers = (selected) => {
    const darkBtn = document.getElementById('theme-btn-dark')
    const lightBtn = document.getElementById('theme-btn-light')
    if (!darkBtn || !lightBtn) return
    if (selected === 'dark') {
      darkBtn.textContent = 'Black  '
      darkBtn.style.background = 'var(--tab-active-bg)'
      lightBtn.textContent = ' White'
      lightBtn.style.background = 'var(--tab-bg)'
    } else {
      darkBtn.textContent = 'Black  '
      darkBtn.style.background = 'var(--tab-bg)'
      lightBtn.textContent = 'White'
      lightBtn.style.background = 'var(--tab-active-bg)'
    }
  }

  const applyThemeSelection = (sel) => {
    localStorage.setItem('theme', sel)
    if (sel === 'dark') {
      document.body.classList.add('dark-theme')
      document.body.classList.remove('light-theme')
    } else {
      document.body.classList.add('light-theme')
      document.body.classList.remove('dark-theme')
    }
    updateThemeVariables(sel)
    setMarkers(sel)
  }

  const darkBtn = document.getElementById('theme-btn-dark')
  const lightBtn = document.getElementById('theme-btn-light')

  if (darkBtn) darkBtn.onclick = () => applyThemeSelection('dark')
  if (lightBtn) lightBtn.onclick = () => applyThemeSelection('light')

  // CSS editor handlers
  const saveCssBtn = document.getElementById('save-css-btn')
  const resetCssBtn = document.getElementById('reset-css-btn')
  const cssInput = document.getElementById('custom-css-input')

  if (saveCssBtn) {
    saveCssBtn.onclick = () => {
      const css = cssInput.value
      localStorage.setItem('customCSS', css)
      applyCustomCSS()
      
      // Используем кастомный alert браузера
      browserAlert('CSS saved! Reload your browser', 'BaffyNet');
    }
  }

  if (resetCssBtn) {
    resetCssBtn.onclick = async () => {
      // Используем кастомный confirm браузера
      const result = await browserConfirm('Delete custom CSS?', 'BaffyNet');
      
      if (result) {
        cssInput.value = ''
        localStorage.removeItem('customCSS')
        applyCustomCSS()
        
        // Используем кастомный alert браузера
        browserAlert('CSS remooved! Reload your browser', 'BaffyNet');
      }
    }
  }

  // Close modal
  document.getElementById('theme-apply-close').onclick = () => {
    modal.remove()
  }
}


function showBlockedPage() {
  const tabId = tabCounter++
  
  const tab = document.createElement('div')
  tab.className = 'tab'
  tab.dataset.tabId = tabId
  tab.innerHTML = `
    <img class="tab-favicon" src="https://i.ibb.co/v4PmyTNq/image.png">
    <span class="tab-title">Blocked</span>
    <span class="tab-close" data-tab-id="${tabId}">×</span>
  `
  tabsContainer.insertBefore(tab, document.getElementById('new-tab'))

  const webview = document.createElement('webview')
  webview.setAttribute('allowpopups', 'true')
  webview.setAttribute('allowFileAccessFromFiles', 'true')
  webview.dataset.tabId = tabId
  webview.style.display = 'none'
  
  const blockedHtml = `
    <html>
    <head>
      <title>Blocked</title>
      <style>
        body {
          background: #25242b;
          color: #f0f0f0;
          font-family: sans-serif;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
          margin: 0;
          text-align: center;
        }
        h1 { font-size: 48px; margin-bottom: 10px; }
        p { color: #888; font-size: 16px; }
        .hint { margin-top: 20px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div>
        <h1>🚫 Site Blocked</h1>
        <p>This site has been blocked by BaffyNet Browser.</p>
        <p class="hint">Press Ctrl+B to manage blocked sites</p>
      </div>
    </body>
    </html>
  `
  
  webview.src = 'data:text/html;charset=utf-8,' + encodeURIComponent(blockedHtml)
  webviewsContainer.appendChild(webview)

  switchTab(tabId)
}

function createNewTab(url) {
  const finalUrl = url || localStorage.getItem('newTabPage') || 'https://baffynet.rf.gd'
  
  // Check if URL is blocked before loading
  if (window.electronAPI && window.electronAPI.isSiteBlocked) {
    window.electronAPI.isSiteBlocked(finalUrl).then(isBlocked => {
      if (isBlocked) {
        showBlockedPage();
        return;
      }
      createNewTabInternal(finalUrl);
    });
  } else {
    createNewTabInternal(finalUrl);
  }
}

function createNewTabInternal(finalUrl) {
  const tabId = tabCounter++

  // Allow file:// URLs to load directly in a new tab (drop from Explorer should open here)
  // Previously we opened file:// links in the system file explorer; now we let the webview load them.


  const tab = document.createElement('div')
  tab.className = 'tab'
  tab.dataset.tabId = tabId
  tab.innerHTML = `
    <img class="tab-favicon" src="https://i.ibb.co/v4PmyTNq/image.png">
    <span class="tab-title">${finalUrl.includes('example.com') ? 'Example' : 'New Tab'}</span>
    <span class="tab-close" data-tab-id="${tabId}">×</span>
  `
  tabsContainer.insertBefore(tab, document.getElementById('new-tab'))

  const webview = document.createElement('webview')
  webview.setAttribute('allowpopups', 'true')
  webview.setAttribute('allowFileAccessFromFiles', 'true')

  try {
    const preloadPath = new URL('./preload-webview.js', window.location.href).href
    webview.preload = preloadPath
  } catch (err) {
    console.error('Cannot set webview preload:', err)
  }

  webview.src = finalUrl
  webview.dataset.tabId = tabId
  webview.style.display = 'none'
  webviewsContainer.appendChild(webview)

  webview.addEventListener('did-navigate', (e) => {
    urlBar.value = e.url
    updateTabTitle(tabId, webview.getTitle())
  })

  // When DOM is ready, inject extension content scripts / CSS if they match the page
  webview.addEventListener('dom-ready', async () => {
    try {
      const pageUrl = webview.getURL()
      const matchPattern = (url, pattern) => {
        if (!pattern) return false
        if (pattern === '<all_urls>') return true
        const esc = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\\\*/g, '.*')
        try {
          const rg = new RegExp('^' + esc + '$')
          return rg.test(url)
        } catch (e) {
          return url.includes(pattern)
        }
      }

      for (const ext of extensionsList || []) {
        const scripts = ext.content_scripts || []
        for (const cs of scripts) {
          const matches = cs.matches || []
          const matched = matches.some(m => matchPattern(pageUrl, m))
          if (!matched) continue

          if (cs.css && cs.css.length) {
            for (const cssFile of cs.css) {
              try {
                const filePath = `${ext.path}/${cssFile}`
                const res = await window.electronAPI.readExtensionFile(filePath)
                if (res && res.ok && res.content) {
                  try { webview.insertCSS(res.content) } catch (e) { console.error('insertCSS failed', e) }
                }
              } catch (err) {
                console.error('CSS inject error', err)
              }
            }
          }

          if (cs.js && cs.js.length) {
            for (const jsFile of cs.js) {
              try {
                const filePath = `${ext.path}/${jsFile}`
                const res = await window.electronAPI.readExtensionFile(filePath)
                if (res && res.ok && res.content) {
                  try { await webview.executeJavaScript(res.content) } catch (e) { console.error('executeJavaScript failed', e) }
                }
              } catch (err) {
                console.error('JS inject error', err)
              }
            }
          }
        }
      }
    } catch (err) {
      console.error('dom-ready extension injection error:', err)
    }
  })

  webview.addEventListener('ipc-message', async (e) => {
    try {
      // extension messages
      if (e.channel === 'baffy-from-content' && e.args && e.args[0]) {
        const payload = e.args[0]
        window.dispatchEvent(new CustomEvent('extension-content-message', { detail: { tabId, payload } }))
        document.querySelectorAll('iframe').forEach(f => {
          try { f.contentWindow.postMessage({ source: 'baffynet-content', tabId, payload }, '*') } catch (e) {}
        })
      }

      // dialog requests from webview preload (alert / confirm / prompt)
      if (e.channel === 'dialog-request' && e.args && e.args[0]) {
        const data = e.args[0]
        const { requestId, type, message, defaultText } = data
        let result = null
        try {
          if (type === 'alert' && window.showAlert) {
            await window.showAlert(message)
            result = null
          } else if (type === 'confirm' && window.showConfirm) {
            result = await window.showConfirm(message)
          } else if (type === 'prompt' && window.showPrompt) {
            result = await window.showPrompt(message, defaultText)
          }
        } catch (err) {
          console.error('dialog handling error', err)
        }

        try { webview.send('dialog-response', { requestId, result }) } catch (err) { }
      }
    } catch (err) {
      console.error('ipc-message handler error', err)
    }
  })

  webview.addEventListener('page-title-updated', (e) => {
    updateTabTitle(tabId, e.title)
  })

  webview.addEventListener('page-favicon-updated', (e) => {
    updateTabFavicon(tabId, e.favicons[0])
  })

  // Обработка открытия новых окон/ссылок
  webview.addEventListener('new-window', (e) => {
    try {
      const url = e.url || (e.detail && e.detail.url)
      if (e.preventDefault) e.preventDefault()
      if (url && !url.startsWith('javascript:') && !url.startsWith('about:')) {
        createNewTab(url)
      }
    } catch (err) {
      console.error('webview error:', err)
    }
  })

  switchTab(tabId)

  // Сохраняем вкладки при создании новой
  if (localStorage.getItem('saveTabsOnClose') === 'true') {
    saveTabsToStorage()
  }
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
  if (tabTitle) tabTitle.textContent = title || 'New Tab'

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

    // Сохраняем вкладки при закрытии
    if (localStorage.getItem('saveTabsOnClose') === 'true') {
      saveTabsToStorage()
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
      // Используем кастомный alert браузера
      browserAlert('Url should have {URL} parameter to work properly.', 'BaffyNet');
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
  
  const rightButtonsContainer = document.createElement('div')
  rightButtonsContainer.id = 'right-buttons'
  rightButtonsContainer.style.cssText = `
    display: flex;
    gap: 5px;
    margin-left: auto;
    align-items: center;
  `

  const extensionsBtn = document.createElement('button')
  extensionsBtn.id = 'extensions-btn'
  extensionsBtn.innerHTML = '⧉'
  extensionsBtn.title = 'Addons'
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

  rightButtonsContainer.appendChild(extensionsBtn)
  rightButtonsContainer.appendChild(downloadsBtn)

  toolbar.appendChild(rightButtonsContainer)
}

function showExtensionsMenu() {
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
  title.textContent = ' Addons'
  title.style.margin = '0 0 10px 0'
  title.style.color = 'var(--text-color)'
  menu.appendChild(title)

  const openFolderBtn = document.createElement('button')
  openFolderBtn.textContent = '/__/ Open Addons Folder'
  openFolderBtn.style.width = '100%'
  openFolderBtn.style.marginBottom = '10px'
  openFolderBtn.onclick = () => {
    if (window.electronAPI) window.electronAPI.openExtensionsFolder()
    menu.remove()
  }
  menu.appendChild(openFolderBtn)

  const reloadBtn = document.createElement('button')
  reloadBtn.textContent = '⟳ Reload Addons'
  reloadBtn.style.width = '100%'
  reloadBtn.style.marginBottom = '10px'
  reloadBtn.onclick = () => {
    if (window.electronAPI) window.electronAPI.reloadExtensions()
    menu.remove()
  }
  menu.appendChild(reloadBtn)

  const shopBtn = document.createElement('button')
  shopBtn.textContent = '(/) Addons Shop'
  shopBtn.style.width = '100%'
  shopBtn.style.marginBottom = '10px'
  shopBtn.onclick = () => {
    createNewTab('https://baffynet.rf.gd/shop.html')
    menu.remove()
  }
  menu.appendChild(shopBtn)

  if (extensionsList.length === 0) {
    const noExtensions = document.createElement('div')
    noExtensions.textContent = 'Addons not found:('
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
  
  iframe.onload = () => {
    try {
      iframe.contentWindow.postMessage({ source: 'baffynet', extension: { id: extension.id, path: extension.path, manifest: extension.manifest } }, '*')
    } catch (e) {}
  }
  popup.appendChild(iframe)

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

// ==================== BLOCKER PANEL ====================
async function showBlockerPanel() {
  // If already open, remove and recreate
  const existingModal = document.getElementById('blocker-panel-modal');
  if (existingModal) {
    existingModal.remove();
  }

  // Load current blocked sites
  if (window.electronAPI && window.electronAPI.getBlockedSites) {
    blockedSitesList = await window.electronAPI.getBlockedSites();
  }

  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.id = 'blocker-panel-modal';

  const content = document.createElement('div');
  content.className = 'modal-content';
  content.style.maxWidth = '500px';

  const sitesListHtml = blockedSitesList.length > 0 
    ? blockedSitesList.map(site => `
        <div class="blocked-site-item" style="display:flex;justify-content:space-between;align-items:center;padding:8px;margin:5px 0;background:var(--tab-bg);border-radius:4px;">
          <span style="color:var(--text-color);">${site}</span>
          <button class="remove-site-btn" data-site="${site}" style="padding:4px 8px;background:#ff4444;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:12px;">×</button>
        </div>
      `).join('')
    : '<div style="text-align:center;color:#888;padding:20px;">No blocked sites</div>';

  content.innerHTML = `
    <h2> SmartBlocker</h2>
    <p style="color:var(--text-color);font-size:14px;margin-bottom:15px;">
      Add sites you want to block. They won't load in BaffyNet.<br>
      <small style="color:#888;">Press Ctrl+B to open this panel anytime</small>
    </p>
    
    <div style="display:flex;gap:8px;margin-bottom:15px;">
      <input type="text" id="blocker-site-input" placeholder="example.com" style="flex:1;padding:10px;border-radius:4px;border:1px solid var(--border-color);background:var(--url-bar-bg);color:var(--text-color);">
      <button id="blocker-add-btn" style="padding:10px 20px;background:#47a3ff;color:#fff;border:none;border-radius:4px;cursor:pointer;font-weight:bold;">Add</button>
    </div>
    
    <div id="blocked-sites-list" style="max-height:250px;overflow-y:auto;border:1px solid var(--border-color);border-radius:4px;padding:5px;">
      ${sitesListHtml}
    </div>
    
    <div class="modal-actions" style="margin-top:15px;">
      <button id="blocker-close-btn">Close</button>
    </div>
  `;

  modal.appendChild(content);
  document.body.appendChild(modal);

  // Add site handler
  const addBtn = document.getElementById('blocker-add-btn');
  const siteInput = document.getElementById('blocker-site-input');
  
  if (addBtn && siteInput) {
    addBtn.onclick = async () => {
      const site = siteInput.value.trim();
      if (site && window.electronAPI && window.electronAPI.addBlockedSite) {
        const success = await window.electronAPI.addBlockedSite(site);
        if (success) {
          siteInput.value = '';
          showBlockerPanel();
        } else {
          browserAlert('Site already blocked or invalid', 'BaffyNet');
        }
      }
    };
    
    siteInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        addBtn.click();
      }
    });
  }

  // Remove site handlers
  document.querySelectorAll('.remove-site-btn').forEach(btn => {
    btn.onclick = async () => {
      const site = btn.dataset.site;
      if (site && window.electronAPI && window.electronAPI.removeBlockedSite) {
        await window.electronAPI.removeBlockedSite(site);
        showBlockerPanel();
      }
    };
  });

  // Close handler
  const closeBtn = document.getElementById('blocker-close-btn');
  if (closeBtn) {
    closeBtn.onclick = () => {
      modal.remove();
    };
  }

  // Click outside to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}

window.addEventListener('message', (ev) => {
  try {
    const msg = ev.data
    if (!msg || msg.source !== 'baffynet-extension') return

    const reply = (data) => {
      try { ev.source.postMessage({ source: 'baffynet', ...data }, '*') } catch (e) {}
    }

    if (msg.action === 'getTabs') {
      const tabs = Array.from(document.querySelectorAll('.tab:not(#new-tab)')).map(t => {
        const tid = t.dataset.tabId
        const w = document.querySelector(`webview[data-tab-id="${tid}"]`)
        return {
          tabId: tid,
          title: t.querySelector('.tab-title')?.textContent || '',
          url: w?.src || '',
          favicon: t.querySelector('.tab-favicon')?.src || ''
        }
      })
      reply({ action: 'tabs', tabs })
      return
    }

    if (msg.action === 'executeScript') {
      const { tabId, code } = msg
      const w = document.querySelector(`webview[data-tab-id="${tabId}"]`)
      if (w && code) {
        w.executeJavaScript(code).then(result => reply({ action: 'executeResult', result })).catch(err => reply({ action: 'error', error: err.message }))
      } else reply({ action: 'error', error: 'tab or code missing' })
      return
    }

    if (msg.action === 'insertCSS') {
      const { tabId, css } = msg
      const w = document.querySelector(`webview[data-tab-id="${tabId}"]`)
      if (w && css) {
        try { w.insertCSS(css); reply({ action: 'inserted' }) } catch (e) { reply({ action: 'error', error: e.message }) }
      } else reply({ action: 'error', error: 'tab or css missing' })
      return
    }

    if (msg.action === 'sendMessageToTab') {
      const { tabId, channel, data } = msg
      const w = document.querySelector(`webview[data-tab-id="${tabId}"]`)
      if (w) {
        try { w.send('baffy-to-content', channel, data); reply({ action: 'sent' }) } catch (e) { reply({ action: 'error', error: e.message }) }
      } else reply({ action: 'error', error: 'tab not found' })
      return
    }

    if (msg.action === 'broadcastMessage') {
      const { channel, data } = msg
      document.querySelectorAll('webview').forEach(w => { try { w.send('baffy-to-content', channel, data) } catch (e) {} })
      reply({ action: 'broadcasted' })
      return
    }

  } catch (err) {
    // ignore
  }
})

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

// Drag and drop tabs functionality
let draggedTab = null;

tabsContainer.addEventListener('dragstart', (e) => {
  const tab = e.target.closest('.tab');
  if (tab) {
    draggedTab = tab;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', tab.innerHTML);
    tab.style.opacity = '0.5';
  }
});

tabsContainer.addEventListener('dragend', (e) => {
  const tab = e.target.closest('.tab');
  if (tab) {
    tab.style.opacity = '1';
    draggedTab = null;
  }
});

tabsContainer.addEventListener('dragover', (e) => {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const tab = e.target.closest('.tab');
  if (tab && draggedTab && tab !== draggedTab) {
    const allTabs = Array.from(tabsContainer.querySelectorAll('.tab'));
    const draggedIndex = allTabs.indexOf(draggedTab);
    const targetIndex = allTabs.indexOf(tab);
    
    if (draggedIndex < targetIndex) {
      tab.parentNode.insertBefore(draggedTab, tab.nextSibling);
    } else {
      tab.parentNode.insertBefore(draggedTab, tab);
    }
  }
});

tabsContainer.addEventListener('drop', (e) => {
  e.preventDefault();
});

tabsContainer.addEventListener('mousedown', (e) => {
  const tab = e.target.closest('.tab');
  if (tab && !e.target.classList.contains('tab-close')) {
    tab.draggable = true;
  }
});

tabsContainer.addEventListener('mouseup', (e) => {
  const tab = e.target.closest('.tab');
  if (tab) {
    tab.draggable = false;
  }
});

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

// Account Login
document.getElementById('profile-btn')?.addEventListener('click', () => {
  showAccountModal()
})

async function showAccountModal() {
  const modal = document.getElementById('profile-modal')
  const currentAccount = await window.electronAPI?.getCurrentAccount()
  const loginForm = document.getElementById('login-form')
  const registerForm = document.getElementById('register-form')
  const accountInfo = document.getElementById('current-account-info')
  const loginTabs = document.getElementById('login-tabs')
  const accountsListDiv = document.getElementById('accounts-list')
  
  // Load accounts list
  const accounts = await window.electronAPI?.getAccounts() || []
  const accountItemsDiv = document.getElementById('account-items')
  
  if (accounts.length > 0) {
    accountItemsDiv.innerHTML = accounts.map(acc => `
      <div class="account-item" data-account="${acc}" style="padding:12px;margin:5px 0;border-radius:4px;cursor:pointer;background:rgba(255,255,255,0.1);display:flex;justify-content:space-between;align-items:center;">
        <span style="color:var(--text-color,#fff);">👤 ${acc}</span>
        <button class="delete-account-btn" data-account="${acc}" style="background:none;border:none;color:#ff4444;cursor:pointer;font-size:16px;">✕</button>
      </div>
    `).join('')
    
    accountItemsDiv.querySelectorAll('.account-item').forEach(el => {
      el.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-account-btn')) return
        const acc = el.dataset.account
        document.getElementById('login-username').value = acc
        document.getElementById('tab-login')?.click()
      })
    })
    
    accountItemsDiv.querySelectorAll('.delete-account-btn').forEach(el => {
      el.addEventListener('click', async (e) => {
        e.stopPropagation()
        const acc = el.dataset.account
        if (confirm(`Delete account "${acc}"? This will delete all data!`)) {
          await window.electronAPI?.deleteAccount(acc)
          showAccountModal()
        }
      })
    })
  } else {
    accountItemsDiv.innerHTML = '<p style="color:var(--muted,#888);">No accounts yet. Create one!</p>'
  }
  
  if (currentAccount) {
    loginForm.style.display = 'none'
    registerForm.style.display = 'none'
    accountsListDiv.style.display = 'none'
    loginTabs.style.display = 'none'
    accountInfo.style.display = 'block'
    document.getElementById('account-name').textContent = currentAccount
  } else {
    loginForm.style.display = 'none'
    registerForm.style.display = 'none'
    accountsListDiv.style.display = 'block'
    loginTabs.style.display = 'flex'
    accountInfo.style.display = 'none'
  }
  
  modal.classList.remove('hidden')
}

document.getElementById('tab-accounts')?.addEventListener('click', () => {
  document.getElementById('accounts-list').style.display = 'block'
  document.getElementById('login-form').style.display = 'none'
  document.getElementById('register-form').style.display = 'none'
  document.getElementById('login-error').style.display = 'none'
})

document.getElementById('tab-login')?.addEventListener('click', () => {
  document.getElementById('accounts-list').style.display = 'none'
  document.getElementById('login-form').style.display = 'block'
  document.getElementById('register-form').style.display = 'none'
  document.getElementById('login-error').style.display = 'none'
})

document.getElementById('tab-register')?.addEventListener('click', () => {
  document.getElementById('accounts-list').style.display = 'none'
  document.getElementById('login-form').style.display = 'none'
  document.getElementById('register-form').style.display = 'block'
  document.getElementById('login-error').style.display = 'none'
})

document.getElementById('login-btn')?.addEventListener('click', async () => {
  const username = document.getElementById('login-username').value.trim()
  const password = document.getElementById('login-password').value
  const errorDiv = document.getElementById('login-error')
  
  if (!username || !password) {
    errorDiv.textContent = 'Please enter username and password'
    errorDiv.style.display = 'block'
    return
  }
  
  const result = await window.electronAPI?.loginAccount(username, password)
  if (result?.success) {
    document.getElementById('profile-modal').classList.add('hidden')
    window.location.reload()
  } else {
    errorDiv.textContent = result?.error || 'Login failed'
    errorDiv.style.display = 'block'
  }
})

document.getElementById('register-btn')?.addEventListener('click', async () => {
  const username = document.getElementById('register-username').value.trim()
  const password = document.getElementById('register-password').value
  const confirm = document.getElementById('register-confirm').value
  const errorDiv = document.getElementById('login-error')
  
  if (!username || !password) {
    errorDiv.textContent = 'Please enter username and password'
    errorDiv.style.display = 'block'
    return
  }
  
  if (password !== confirm) {
    errorDiv.textContent = 'Passwords do not match'
    errorDiv.style.display = 'block'
    return
  }
  
  if (password.length < 4) {
    errorDiv.textContent = 'Password must be at least 4 characters'
    errorDiv.style.display = 'block'
    return
  }
  
  const result = await window.electronAPI?.createAccount(username, password)
  if (result?.success) {
    const loginResult = await window.electronAPI?.loginAccount(username, password)
    if (loginResult?.success) {
      document.getElementById('profile-modal').classList.add('hidden')
      window.location.reload()
    }
  } else {
    errorDiv.textContent = result?.error || 'Registration failed'
    errorDiv.style.display = 'block'
  }
})

document.getElementById('logout-btn')?.addEventListener('click', async () => {
  await window.electronAPI?.logoutAccount()
  showAccountModal()
})

document.getElementById('close-profile-modal')?.addEventListener('click', () => {
  document.getElementById('profile-modal').classList.add('hidden')
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


urlBar.addEventListener('dragover', (e) => {
  e.preventDefault();
  urlBar.classList.add('drag-over');
  try { e.dataTransfer.dropEffect = 'copy' } catch (err) {}
});

urlBar.addEventListener('dragleave', (e) => {
  urlBar.classList.remove('drag-over');
});

urlBar.addEventListener('drop', (e) => {
  e.preventDefault();
  e.stopPropagation();
  urlBar.classList.remove('drag-over');

  try {
    let finalUrl = null;

    // 1. Try files array first (Electron provides full path in file.path)
    const files = e.dataTransfer && e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file && file.path) {
        finalUrl = 'file:///' + file.path.replace(/\\/g, '/');
        console.debug('Opening from files[0].path:', finalUrl);
      }
    }

    // 2. Try uri-list (Windows Explorer drag provides full path here as file://C:/...)
    if (!finalUrl) {
      const uriList = e.dataTransfer && e.dataTransfer.getData('text/uri-list');
      if (uriList && uriList.trim()) {
        const trimmed = uriList.trim();
        if (trimmed.startsWith('file://')) {
          finalUrl = trimmed;
          console.debug('Opening from uri-list:', finalUrl);
        }
      }
    }

    // 3. Try plain text for raw file path
    if (!finalUrl) {
      const text = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || '';
      if (text && text.trim()) {
        const dropText = text.trim();
        // Check if it's a valid file path (Windows C:\... or Unix /...)
        if (dropText.match(/^[A-Za-z]:[\\\/]/) || dropText.startsWith('/')) {
          finalUrl = 'file:///' + dropText.replace(/\\/g, '/');
          console.debug('Opening from text:', finalUrl);
        }
      }
    }

    // 4. Just use whatever we received as a URL
    if (!finalUrl) {
      const text = (e.dataTransfer && e.dataTransfer.getData('text/plain')) || '';
      if (text && text.trim()) {
        finalUrl = text.trim();
        console.debug('Opening as URL:', finalUrl);
      }
    }

    // Open the URL in new tab
    if (finalUrl) {
      createNewTab(finalUrl);
    }
  } catch (err) {
    console.error('Error handling drop on URL bar:', err);
  }
});

// Zoom with Ctrl/Cmd + mouse wheel
;(function setupWheelZoom() {
  const MIN_ZOOM = 0.5 // 50%
  const MAX_ZOOM = 2.0 // 200%
  const BASE_STEP = 0.1 // 10%

  const webviewZoom = new WeakMap()

  function getActiveWebview() {
    return document.querySelector('webview[style*="display: flex;"]')
  }

  function getStoredZoom(w) {
    return (w && webviewZoom.has(w)) ? webviewZoom.get(w) : 1
  }

  function getZoomFactor(w) {
    return new Promise(resolve => {
      try {
        if (w && typeof w.getZoomFactor === 'function') {
          w.getZoomFactor((f) => resolve(typeof f === 'number' ? f : getStoredZoom(w)))
        } else {
          resolve(getStoredZoom(w))
        }
      } catch (e) { resolve(getStoredZoom(w)) }
    })
  }

  async function applyInPageZoom(w, factor) {
    try {
      if (typeof w.executeJavaScript === 'function') {
        await w.executeJavaScript(`(function(){try{document.documentElement.style.zoom='${factor}';document.body.style.zoom='${factor}';return true}catch(e){return false}})()`)
        return true
      }
    } catch (e) {
      // ignore
    }
    return false
  }

  async function setZoomFactor(w, factor) {
    try {
      factor = Math.max(MIN_ZOOM, Math.min(factor, MAX_ZOOM))
      webviewZoom.set(w, factor)

      if (w && typeof w.setZoomFactor === 'function') {
        w.setZoomFactor(factor)
      } else {
        await applyInPageZoom(w, factor)
      }

      showZoomIndicator(Math.round(factor * 100) + '%')
    } catch (e) { console.error('setZoomFactor error', e) }
  }

  function showZoomIndicator(text) {
    let el = document.getElementById('zoom-indicator')
    if (!el) {
      el = document.createElement('div')
      el.id = 'zoom-indicator'
      el.style.cssText = 'position:fixed;right:12px;top:72px;padding:6px 10px;background:rgba(0,0,0,0.7);color:white;border-radius:6px;z-index:9999;font-weight:600'
      document.body.appendChild(el)
    }
    el.textContent = text
    el.style.opacity = '1'
    clearTimeout(el._hideTimer)
    el._hideTimer = setTimeout(()=>{ el.style.transition='opacity 250ms'; el.style.opacity='0'; }, 1000)
  }

  window.addEventListener('wheel', async (e) => {
    if (!(e.ctrlKey || e.metaKey)) return
    e.preventDefault()

    const w = getActiveWebview()
    if (!w) return

    const cur = await getZoomFactor(w)
    const delta = -Math.sign(e.deltaY) * BASE_STEP
    await setZoomFactor(w, cur + delta)
  }, { passive: false })

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node && node.tagName === 'WEBVIEW') {
          if (!webviewZoom.has(node)) webviewZoom.set(node, 1)
        }
      }
    }
  })
  observer.observe(document.body, { childList: true, subtree: true })
})()

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
    showThemePanel()
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

  window.electronAPI.onExtensionsLoaded((event, extensions) => {
    extensionsList = extensions
    console.log('Addons loaded:', extensions)
  })

  window.electronAPI.onOpenExtensionPopup((event, extension) => {
    showExtensionPopup(extension)
  })

  window.electronAPI.onOpenBlocker(() => {
    showBlockerPanel()
  })

  window.electronAPI.onOpenSplitView(() => {
    showSplitViewPanel()
  })

  window.electronAPI.onExitSplitView(() => {
    exitSplitView()
  })

  window.electronAPI.onCon(() => {
    showConMenu()
  })

  window.electronAPI.onOpenHotkeysMenu(() => {
    showHotkeysMenu()
  })

  window.electronAPI.onRenameKeybinds(() => {
    showRenameKeybindsMenu()
  })
}

// Ctrl+H hotkeys menu functionality
function showHotkeysMenu() {
  // Remove existing menu if present
  const existingMenu = document.getElementById('hotkeys-menu');
  if (existingMenu) {
    existingMenu.remove();
    return;
  }

  const menu = document.createElement('div');
  menu.id = 'hotkeys-menu';
  menu.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--panel-bg, #222);
    border: 1px solid var(--border-color, #333);
    border-radius: 8px;
    padding: 16px;
    min-width: 450px;
    max-width: 550px;
    max-height: 80vh;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    z-index: 100001;
    overflow-y: auto;
  `;

  const titleContainer = document.createElement('div');
  titleContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;';

  const title = document.createElement('h3');
  title.textContent = '[:::] Keyboard Shortcuts';
  title.style.cssText = 'margin: 0; color: var(--text-color, #fff); font-size: 16px;';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    background: transparent;
    border: none;
    color: var(--muted, #888);
    font-size: 24px;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
  `;
  closeBtn.onclick = () => menu.remove();

  titleContainer.appendChild(title);
  titleContainer.appendChild(closeBtn);
  menu.appendChild(titleContainer);

  const keybindsDescriptions = {
    help: 'Help / Guide',
    theme: 'Switch Theme',
    devtools: 'Developer Tools',
    homepage: 'Homepage Settings',
    search: 'Search Engine',
    privacy: 'PrivacyNet',
    defaultBrowser: 'Set as Default',
    addons: 'Addons Shop',
    blocker: 'SmartBlocker',
    tabs: 'Tabs Saver',
    keybinds: 'Custom Keybinds',
    renameKeybinds: 'Rename Keybinds',
    newTab: 'New Tab',
    closeTab: 'Close Tab',
    switchTab1: 'Tab 1',
    switchTab2: 'Tab 2',
    switchTab3: 'Tab 3',
    switchTab4: 'Tab 4',
    switchTab5: 'Tab 5',
    switchTab6: 'Tab 6',
    switchTab7: 'Tab 7',
    switchTab8: 'Tab 8',
    switchTab9: 'Tab 9'
  };

  const loadAndDisplayKeybinds = async () => {
    let keybinds = {};
    try {
      if (window.electronAPI && window.electronAPI.getKeybinds) {
        keybinds = await window.electronAPI.getKeybinds();
      }
    } catch (e) {
      console.error('Error loading keybinds:', e);
    }

    const listContainer = document.getElementById('keybinds-list');
    if (listContainer) listContainer.innerHTML = '';

    const usedKeys = new Set();

    for (const [name, binding] of Object.entries(keybinds)) {
      usedKeys.add(binding.key.toLowerCase());

      const item = document.createElement('div');
      item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px 10px; background: var(--tab-bg, #333); border-radius: 4px; margin-bottom: 6px; gap: 10px;';

      const label = document.createElement('span');
      label.style.cssText = 'color: var(--text-color, #fff); font-size: 13px; flex: 1;';
      label.textContent = keybindsDescriptions[name] || name;

      const shortcutDisplay = document.createElement('span');
      shortcutDisplay.style.cssText = 'color: #47a3ff; font-size: 12px; font-weight: bold; min-width: 80px; text-align: right;';
      let shortcutText = 'Ctrl';
      if (binding.shift) shortcutText += '+Shift';
      shortcutText += '+' + binding.key.toUpperCase();
      shortcutDisplay.textContent = shortcutText;

      const editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.style.cssText = 'background: transparent; border: none; color: #888; cursor: pointer; font-size: 14px; padding: 2px 6px; margin-left: 4px;';
      editBtn.onclick = () => {
        item.innerHTML = '';
        
        const labelSpan = document.createElement('span');
        labelSpan.style.cssText = 'color: var(--text-color, #fff); font-size: 13px; flex: 1;';
        labelSpan.textContent = keybindsDescriptions[name] || name;
        item.appendChild(labelSpan);

        const newKeySelect = document.createElement('select');
        newKeySelect.style.cssText = 'padding: 4px 8px; background: var(--tab-bg, #333); color: var(--text-color, #fff); border: 1px solid var(--border-color, #444); border-radius: 4px; font-size: 12px;';

        const freeKeys = [];
        for (let i = 97; i <= 122; i++) {
          const letter = String.fromCharCode(i);
          if (!usedKeys.has(letter) || letter === binding.key.toLowerCase()) freeKeys.push(letter);
        }
        for (let i = 48; i <= 57; i++) {
          const num = String.fromCharCode(i);
          if (!usedKeys.has(num) || num === binding.key.toLowerCase()) freeKeys.push(num);
        }

        freeKeys.forEach(key => {
          const opt = document.createElement('option');
          opt.value = key;
          opt.textContent = key.toUpperCase();
          if (key === binding.key.toLowerCase()) opt.selected = true;
          newKeySelect.appendChild(opt);
        });

        const shiftCheck = document.createElement('input');
        shiftCheck.type = 'checkbox';
        shiftCheck.checked = binding.shift;
        shiftCheck.style.cssText = 'margin: 0 6px;';

        const shiftLabel = document.createElement('span');
        shiftLabel.style.cssText = 'color: var(--text-color, #fff); font-size: 11px;';
        shiftLabel.textContent = '+Shift';

        item.appendChild(newKeySelect);
        item.appendChild(shiftCheck);
        item.appendChild(shiftLabel);

        const saveBtn = document.createElement('button');
        saveBtn.textContent = '✓';
        saveBtn.style.cssText = 'background: #47a3ff; border: none; color: white; cursor: pointer; font-size: 12px; padding: 4px 8px; border-radius: 4px; margin-left: 4px;';
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = '✕';
        cancelBtn.style.cssText = 'background: #666; border: none; color: white; cursor: pointer; font-size: 12px; padding: 4px 8px; border-radius: 4px; margin-left: 2px;';

        const btnContainer = document.createElement('div');
        btnContainer.style.cssText = 'display: flex; margin-left: 8px;';
        btnContainer.appendChild(saveBtn);
        btnContainer.appendChild(cancelBtn);
        item.appendChild(btnContainer);

        saveBtn.onclick = async () => {
          const newBinding = {
            key: newKeySelect.value,
            ctrl: true,
            shift: shiftCheck.checked,
            action: binding.action
          };
          
          const newKeybinds = { ...keybinds, [name]: newBinding };
          
          try {
            if (window.electronAPI && window.electronAPI.setKeybinds) {
              await window.electronAPI.setKeybinds(newKeybinds);
            }
          } catch (e) {
            console.error('Error saving keybinds:', e);
          }
          
          loadAndDisplayKeybinds();
        };

        cancelBtn.onclick = () => loadAndDisplayKeybinds();
      };

      item.appendChild(shortcutDisplay);
      item.appendChild(editBtn);
      
      if (listContainer) {
        listContainer.appendChild(item);
      }
    }
  };

  const listTitle = document.createElement('h4');
  listTitle.textContent = 'Keyboard Shortcuts (click Edit to edit)';
  listTitle.style.cssText = 'margin: 0 0 12px 0; color: var(--text-color, #fff); font-size: 13px; border-bottom: 1px solid var(--border-color, #444); padding-bottom: 8px;';
  menu.appendChild(listTitle);

  const listContainer = document.createElement('div');
  listContainer.id = 'keybinds-list';
  listContainer.style.cssText = 'margin-bottom: 16px;';
  menu.appendChild(listContainer);

  loadAndDisplayKeybinds();

  // Button to open custom Alt+key hotkeys menu
  const altHotkeysBtn = document.createElement('button');
  altHotkeysBtn.textContent = '+ Add Custom Alt+Key Hotkey';
  altHotkeysBtn.style.cssText = 'width: 100%; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; margin-top: 8px;';
  altHotkeysBtn.onclick = () => showCustomAltHotkeysMenu();
  menu.appendChild(altHotkeysBtn);

  document.body.appendChild(menu);
}




// Ctrl+K menu functionality
function showConMenu() {
  // Remove existing menu if present
  const existingMenu = document.getElementById('con-menu');
  if (existingMenu) {
    existingMenu.remove();
    return;
  }

  const saveTabsEnabled = localStorage.getItem('saveTabsOnClose') === 'true';

  const menu = document.createElement('div');
  menu.id = 'con-menu';
  menu.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--panel-bg, #222);
    border: 1px solid var(--border-color, #333);
    border-radius: 8px;
    padding: 16px;
    min-width: 300px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    z-index: 100001;
  `;

  const titleContainer = document.createElement('div');
  titleContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;';

  const title = document.createElement('h3');
  title.textContent = '(*) Settings';
  title.style.cssText = 'margin: 0; color: var(--text-color, #fff); font-size: 16px;';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    background: transparent;
    border: none;
    color: var(--muted, #888);
    font-size: 24px;
    cursor: pointer;
    padding: 0 4px;
    line-height: 1;
  `;
  closeBtn.onclick = () => menu.remove();

  titleContainer.appendChild(title);
  titleContainer.appendChild(closeBtn);
  menu.appendChild(titleContainer);

  // Save tabs toggle
  const toggleContainer = document.createElement('div');
  toggleContainer.style.cssText = `
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    background: var(--tab-bg, #333);
    border-radius: 6px;
    margin-bottom: 8px;
    cursor: pointer;
  `;

  const toggleLabel = document.createElement('span');
  toggleLabel.textContent = 'Save tabs after closing browser';
  toggleLabel.style.color = 'var(--text-color, #fff)';

  const toggleSwitch = document.createElement('div');
  toggleSwitch.style.cssText = `
    width: 44px;
    height: 24px;
    background: ${saveTabsEnabled ? '#47a3ff' : '#555'};
    border-radius: 12px;
    position: relative;
    transition: background 0.3s;
  `;

  const toggleKnob = document.createElement('div');
  toggleKnob.style.cssText = `
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    position: absolute;
    top: 2px;
    left: ${saveTabsEnabled ? '22px' : '2px'};
    transition: left 0.3s;
  `;

  toggleSwitch.appendChild(toggleKnob);
  toggleContainer.appendChild(toggleLabel);
  toggleContainer.appendChild(toggleSwitch);
  menu.appendChild(toggleContainer);

  // Toggle click handler
  toggleContainer.onclick = () => {
    const newValue = localStorage.getItem('saveTabsOnClose') !== 'true';
    localStorage.setItem('saveTabsOnClose', newValue.toString());
    toggleSwitch.style.background = newValue ? '#47a3ff' : '#555';
    toggleKnob.style.left = newValue ? '22px' : '2px';
    
    // Save current tabs if enabled
    if (newValue) {
      saveTabsToStorage();
    }
  };

  // Close menu hint
  const hint = document.createElement('div');
  hint.textContent = 'Press any key or click outside to close';
  hint.style.cssText = 'margin-top: 12px; font-size: 11px; color: var(--muted, #888); text-align: center;';
  menu.appendChild(hint);

  document.body.appendChild(menu);

  // Close on click outside
  const closeMenu = (e) => {
    if (!menu.contains(e.target)) {
      menu.remove();
      document.removeEventListener('click', closeMenu);
      document.removeEventListener('keydown', closeKeyHandler);
    }
  };

  const closeKeyHandler = (e) => {
    menu.remove();
    document.removeEventListener('click', closeMenu);
    document.removeEventListener('keydown', closeKeyHandler);
  };

  setTimeout(() => {
    document.addEventListener('click', closeMenu);
    document.addEventListener('keydown', closeKeyHandler);
  }, 100);
}

// Save tabs to localStorage
function saveTabsToStorage() {
  const tabs = Array.from(document.querySelectorAll('.tab:not(#new-tab)')).map(tab => {
    const tabId = tab.dataset.tabId;
    const webview = document.querySelector(`webview[data-tab-id="${tabId}"]`);
    return {
      url: webview ? (webview.src || webview.getURL ? webview.getURL() : '') : '',
      title: tab.querySelector('.tab-title')?.textContent || '',
      favicon: tab.querySelector('.tab-favicon')?.src || ''
    };
  });
  localStorage.setItem('savedTabs', JSON.stringify(tabs));
  console.log('Tabs saved:', tabs.length);
}

// Restore tabs from localStorage
function restoreTabsFromStorage() {
  const savedTabs = localStorage.getItem('savedTabs');
  if (savedTabs) {
    try {
      const tabs = JSON.parse(savedTabs);
      if (Array.isArray(tabs) && tabs.length > 0) {
        tabs.forEach(tab => {
          if (tab.url) {
            createNewTab(tab.url);
          }
        });
        console.log('Tabs restored:', tabs.length);
        return true;
      }
    } catch (e) {
      console.error('Error restoring tabs:', e);
    }
  }
  return false;
}

// Register and handle custom hotkeys
let customHotkeyHandler = null;

function registerCustomHotkeys() {
  if (customHotkeyHandler) {
    document.removeEventListener('keydown', customHotkeyHandler);
  }
  
  let customHotkeys = [];
  try {
    customHotkeys = JSON.parse(localStorage.getItem('customHotkeys') || '[]');
    console.log('Loaded custom hotkeys:', customHotkeys);
  } catch (e) {
    console.error('Error loading custom hotkeys:', e);
  }
  
  customHotkeyHandler = (e) => {
    const key = e.key.toLowerCase();
    const hasCtrl = e.ctrlKey || e.metaKey;
    const hasShift = e.shiftKey;
    const hasAlt = e.altKey;
    
    for (const hotkey of customHotkeys) {
      const needsCtrl = hotkey.modifier.includes('Ctrl');
      const needsShift = hotkey.modifier.includes('Shift');
      const needsAlt = hotkey.modifier.includes('Alt');
      
      if (key === hotkey.key && hasCtrl === needsCtrl && hasShift === needsShift && hasAlt === needsAlt) {
        e.preventDefault();
        e.stopPropagation();
        try {
          // Execute in the browser context (always)
          const code = hotkey.code;
          console.log('Executing hotkey code:', code);
          eval(code);
        } catch (err) {
          console.error('Error executing custom hotkey:', err);
        }
        return;
      }
    }
  };
  
  document.addEventListener('keydown', customHotkeyHandler);
}

// Initialize custom hotkeys on load
registerCustomHotkeys();

// Ctrl+V — re-check permissions for active tab (keeps on-screen buttons, opens prompt again)
(function setupPermissionRecheck() {
  function isEditableElement(el) {
    if (!el) return false
    const tag = el.tagName
    if (!tag) return false
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true
    if (el.isContentEditable) return true
    return false
  }

  async function recheckPermissionsForActiveTab() {
    const activeWebview = document.querySelector('webview[style*="display: flex;"]')
    if (!activeWebview) return
    try {
      const url = activeWebview.getURL ? activeWebview.getURL() : activeWebview.src
      const origin = url ? (new URL(url)).origin : null
      if (!origin) return

      // Trigger recheck for 'media' and 'geolocation' — each will reopen the modal so you can re-check
      if (window.electronAPI && window.electronAPI.requestPermission) {
        // trigger media first, then geolocation
        try { await window.electronAPI.requestPermission(null, 'media', origin, true) } catch (e) { /* ignore */ }
        try { await window.electronAPI.requestPermission(null, 'geolocation', origin, true) } catch (e) { /* ignore */ }
      }
    } catch (err) {
      console.error('recheckPermissions error', err)
    }
  }

  document.addEventListener('keydown', (e) => {
    // ignore when focusing inputs
    if (isEditableElement(document.activeElement)) return
    if ((e.ctrlKey || e.metaKey) && e.key && (e.key.toLowerCase() === 'v' || e.key.toLowerCase() === 'n')) {
      e.preventDefault()
      recheckPermissionsForActiveTab()
    }
  })
})()

// ==================== SPLIT VIEW PANEL ====================
let splitViewMode = null; // '2h', '2v', '3', '4'
let splitViewTabAssignments = {}; // boxIndex -> tabId

function showSplitViewPanel() {
  const existingPanel = document.getElementById('split-view-panel');
  if (existingPanel) {
    existingPanel.remove();
    return;
  }

  const panel = document.createElement('div');
  panel.id = 'split-view-panel';
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--panel-bg, #222);
    border: 1px solid var(--border-color, #333);
    border-radius: 12px;
    padding: 20px;
    min-width: 400px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    z-index: 100002;
  `;

  const title = document.createElement('h2');
  title.textContent = 'Split View - Select tabs for each box';
  title.style.cssText = 'margin: 0 0 16px 0; color: var(--text-color, #fff); font-size: 16px; text-align: center;';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 12px;
    right: 12px;
    background: transparent;
    border: none;
    color: var(--muted, #888);
    font-size: 20px;
    cursor: pointer;
  `;
  closeBtn.onclick = () => panel.remove();
  panel.appendChild(closeBtn);

  panel.appendChild(title);

  const tabs = Array.from(document.querySelectorAll('.tab:not(#new-tab)')).map(t => {
    const tid = t.dataset.tabId;
    const w = document.querySelector(`webview[data-tab-id="${tid}"]`);
    return {
      tabId: tid,
      title: t.querySelector('.tab-title')?.textContent || 'New Tab',
      url: w?.src || '',
      favicon: t.querySelector('.tab-favicon')?.src || ''
    };
  });

  if (tabs.length === 0) {
    const msg = document.createElement('div');
    msg.textContent = 'No tabs available';
    msg.style.cssText = 'color: var(--muted, #888); text-align: center; padding: 20px;';
    panel.appendChild(msg);
  } else {
    const optionsContainer = document.createElement('div');
    optionsContainer.style.cssText = 'display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;';

    const options = [
      { label: '2 Horizontal', value: '2h' },
      { label: '2 Vertical', value: '2v' },
      { label: '3 Boxes', value: '3' },
      { label: '4 Boxes', value: '4' }
    ];

    options.forEach(opt => {
      const btn = document.createElement('button');
      btn.textContent = opt.label;
      btn.style.cssText = `
        padding: 12px 16px;
        background: var(--tab-bg, #333);
        color: var(--text-color, #fff);
        border: 1px solid var(--border-color, #444);
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        transition: background 0.2s;
      `;
      btn.onmouseenter = () => btn.style.background = 'var(--tab-active-bg, #444)';
      btn.onmouseleave = () => btn.style.background = 'var(--tab-bg, #333)';
      btn.onclick = () => {
        panel.remove();
        showTabSelectionPanel(opt.value, tabs);
      };
      optionsContainer.appendChild(btn);
    });

    panel.appendChild(optionsContainer);
  }

  document.body.appendChild(panel);

  const closeOnOutside = (e) => {
    if (!panel.contains(e.target)) {
      panel.remove();
      document.removeEventListener('click', closeOnOutside);
    }
  };
  setTimeout(() => document.addEventListener('click', closeOnOutside), 100);
}

function showTabSelectionPanel(mode, tabs) {
  splitViewMode = mode;
  splitViewTabAssignments = {};

  let boxCount = 2;
  if (mode === '3') boxCount = 3;
  if (mode === '4') boxCount = 4;

  const panel = document.createElement('div');
  panel.id = 'split-view-panel';
  panel.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--panel-bg, #222);
    border: 1px solid var(--border-color, #333);
    border-radius: 12px;
    padding: 20px;
    min-width: 500px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0,0,0,0.6);
    z-index: 100002;
  `;

  const title = document.createElement('h2');
  title.textContent = 'Assign tabs to boxes';
  title.style.cssText = 'margin: 0 0 16px 0; color: var(--text-color, #fff); font-size: 16px; text-align: center;';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = `
    position: absolute;
    top: 12px;
    right: 12px;
    background: transparent;
    border: none;
    color: var(--muted, #888);
    font-size: 20px;
    cursor: pointer;
  `;
  closeBtn.onclick = () => panel.remove();
  panel.appendChild(closeBtn);

  panel.appendChild(title);

  const hint = document.createElement('div');
  hint.textContent = 'Click a tab to assign it to the selected box';
  hint.style.cssText = 'color: var(--muted, #888); font-size: 12px; text-align: center; margin-bottom: 16px;';
  panel.appendChild(hint);

  const boxesContainer = document.createElement('div');
  boxesContainer.style.cssText = 'display: flex; gap: 12px; margin-bottom: 20px; justify-content: center;';

  const boxes = [];
  for (let i = 0; i < boxCount; i++) {
    const box = document.createElement('div');
    box.dataset.boxIndex = i;
    box.style.cssText = `
      flex: 1;
      min-width: 100px;
      padding: 12px;
      background: var(--tab-bg, #333);
      border: 2px solid var(--border-color, #444);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s;
    `;

    const boxTitle = document.createElement('div');
    boxTitle.textContent = 'Box ' + (i + 1);
    boxTitle.style.cssText = 'font-weight: bold; color: var(--text-color, #fff); margin-bottom: 8px; text-align: center;';

    const assignedTab = document.createElement('div');
    assignedTab.className = 'assigned-tab';
    assignedTab.style.cssText = 'color: var(--muted, #888); font-size: 12px; text-align: center; min-height: 20px;';

    box.appendChild(boxTitle);
    box.appendChild(assignedTab);
    boxesContainer.appendChild(box);
    boxes.push(box);
  }

  panel.appendChild(boxesContainer);

  let selectedBox = 0;
  boxes[0].style.borderColor = '#47a3ff';
  boxes[0].style.background = 'var(--tab-active-bg, #444)';

  boxes.forEach((box, idx) => {
    box.onclick = () => {
      boxes.forEach(b => {
        b.style.borderColor = 'var(--border-color, #444)';
        b.style.background = 'var(--tab-bg, #333)';
      });
      box.style.borderColor = '#47a3ff';
      box.style.background = 'var(--tab-active-bg, #444)';
      selectedBox = idx;
    };
  });

  const tabsListContainer = document.createElement('div');
  tabsListContainer.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

  tabs.forEach(tab => {
    const tabItem = document.createElement('div');
    tabItem.dataset.tabId = tab.tabId;
    tabItem.style.cssText = `
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      background: var(--tab-bg, #333);
      border: 1px solid var(--border-color, #444);
      border-radius: 6px;
      cursor: pointer;
      transition: background 0.2s;
    `;
    tabItem.onmouseenter = () => tabItem.style.background = 'var(--tab-active-bg, #444)';
    tabItem.onmouseleave = () => tabItem.style.background = 'var(--tab-bg, #333)';

    const favicon = document.createElement('img');
    favicon.src = tab.favicon || 'https://www.google.com/favicon.ico';
    favicon.style.cssText = 'width: 16px; height: 16px; border-radius: 2px;';

    const title = document.createElement('span');
    title.textContent = tab.title;
    title.style.cssText = 'color: var(--text-color, #fff); font-size: 13px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';

    tabItem.appendChild(favicon);
    tabItem.appendChild(title);

    tabItem.onclick = () => {
      splitViewTabAssignments[selectedBox] = tab.tabId;
      const assignedTabEl = boxes[selectedBox].querySelector('.assigned-tab');
      assignedTabEl.textContent = tab.title;
      assignedTabEl.style.color = 'var(--text-color, #fff)';
    };

    tabsListContainer.appendChild(tabItem);
  });

  panel.appendChild(tabsListContainer);

  const applyBtn = document.createElement('button');
  applyBtn.textContent = 'Apply Split View';
  applyBtn.style.cssText = `
    margin-top: 16px;
    width: 100%;
    padding: 12px;
    background: #47a3ff;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    font-weight: bold;
  `;
  applyBtn.onclick = () => {
    panel.remove();
    applySplitView();
  };
  panel.appendChild(applyBtn);

  document.body.appendChild(panel);

  const closeOnOutside = (e) => {
    if (!panel.contains(e.target)) {
      panel.remove();
      document.removeEventListener('click', closeOnOutside);
    }
  };
  setTimeout(() => document.addEventListener('click', closeOnOutside), 100);
}

function applySplitView() {
  const container = document.getElementById('webviews-container');
  const webviews = Array.from(document.querySelectorAll('webview'));

  webviews.forEach(w => {
    w.style.display = 'none';
    w.style.width = '100%';
    w.style.height = '100%';
    w.style.position = 'absolute';
    w.style.top = '0';
    w.style.left = '0';
    w.style.zIndex = '0';
  });

  const mode = splitViewMode;
  let boxCount = 2;
  if (mode === '3') boxCount = 3;
  if (mode === '4') boxCount = 4;

  const assignedTabIds = [];

  for (let i = 0; i < boxCount; i++) {
    const tabId = splitViewTabAssignments[i];
    if (tabId) {
      assignedTabIds.push(tabId);
      const w = document.querySelector(`webview[data-tab-id="${tabId}"]`);
      if (w) {
        w.style.display = 'flex';
        w.style.zIndex = '1';

        if (mode === '2h') {
          w.style.width = '50%';
          w.style.height = '100%';
          w.style.left = (i * 50) + '%';
        } else if (mode === '2v') {
          w.style.width = '100%';
          w.style.height = '50%';
          w.style.top = (i * 50) + '%';
        } else if (mode === '3') {
          w.style.width = '50%';
          w.style.height = '50%';
          if (i === 0) {
            w.style.left = '0';
            w.style.top = '0';
          } else if (i === 1) {
            w.style.left = '50%';
            w.style.top = '0';
          } else if (i === 2) {
            w.style.left = '0';
            w.style.top = '50%';
          }
        } else if (mode === '4') {
          w.style.width = '50%';
          w.style.height = '50%';
          w.style.left = ((i % 2) * 50) + '%';
          w.style.top = (Math.floor(i / 2) * 50) + '%';
        }
      }
    }
  }

  if (assignedTabIds.length > 0) {
    const firstTabId = assignedTabIds[0];
    const firstTab = document.querySelector(`.tab[data-tab-id="${firstTabId}"]`);
    if (firstTab) {
      const titleSpan = firstTab.querySelector('.tab-title');
      if (titleSpan) {
        const modeLabel = mode === '2h' ? '2 Horizontal' : 
                          mode === '2v' ? '2 Vertical' : 
                          mode === '3' ? '3 Boxes' : '4 Boxes';
        titleSpan.textContent = 'Group Tab';
      }
      const favicon = firstTab.querySelector('.tab-favicon');
      if (favicon) {
        favicon.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="%2347a3ff"%3E%3Crect x="3" y="3" width="7" height="7"/%3E%3Crect x="14" y="3" width="7" height="7"/%3E%3Crect x="3" y="14" width="7" height="7"/%3E%3Crect x="14" y="14" width="7" height="7"/%3E%3C/svg%3E';
      }
    }
  }

  container.dataset.splitMode = mode;
}

function exitSplitView() {
  splitViewMode = null;
  splitViewTabAssignments = {};
  
  const container = document.getElementById('webviews-container');
  if (container) {
    delete container.dataset.splitMode;
  }

  const webviews = Array.from(document.querySelectorAll('webview'));
  webviews.forEach(w => {
    w.style.display = 'none';
    w.style.width = '';
    w.style.height = '';
    w.style.position = '';
    w.style.top = '';
    w.style.left = '';
    w.style.zIndex = '';
  });

  const allTabs = document.querySelectorAll('.tab:not(#new-tab)');
  allTabs.forEach(tab => {
    const titleSpan = tab.querySelector('.tab-title');
    if (titleSpan && titleSpan.textContent === 'Group Tab') {
      const tabId = tab.dataset.tabId;
      const w = document.querySelector(`webview[data-tab-id="${tabId}"]`);
      if (w && w.src && w.src.startsWith('data:')) {
        tab.remove();
        w.remove();
      } else {
        titleSpan.textContent = 'New Tab';
        tab.querySelector('.tab-favicon').src = 'https://i.ibb.co/v4PmyTNq/image.png';
      }
    }
  });

  const activeTab = document.querySelector('.tab.active');
  if (activeTab) {
    const tid = activeTab.dataset.tabId;
    const w = document.querySelector(`webview[data-tab-id="${tid}"]`);
    if (w) w.style.display = 'flex';
  }
}

// ==================== CUSTOM ALT+KEY HOTKEYS ====================
let customAltHotkeys = [];

function loadCustomAltHotkeys() {
  try {
    customAltHotkeys = JSON.parse(localStorage.getItem('customAltHotkeys') || '[]');
  } catch (e) {
    customAltHotkeys = [];
  }
}

function saveCustomAltHotkeys() {
  localStorage.setItem('customAltHotkeys', JSON.stringify(customAltHotkeys));
}

loadCustomAltHotkeys();

document.addEventListener('keydown', (e) => {
  if (e.altKey && !e.ctrlKey && !e.metaKey) {
    const key = e.key.toLowerCase();
    if (key === 'alt' || key === 'control' || key === 'shift' || key === 'meta') return;
    
    const hotkey = customAltHotkeys.find(h => h.key.toLowerCase() === key);
    if (hotkey && hotkey.code) {
      e.preventDefault();
      e.stopPropagation();
      try {
        eval(hotkey.code);
      } catch (err) {
        console.error('Error executing custom Alt+key hotkey:', err);
      }
    }
  }
});

// Show custom hotkeys menu (called from Ctrl+H)
function showCustomAltHotkeysMenu() {
  const existingMenu = document.getElementById('custom-alt-hotkeys-menu');
  if (existingMenu) {
    existingMenu.remove();
    return;
  }

  const menu = document.createElement('div');
  menu.id = 'custom-alt-hotkeys-menu';
  menu.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: var(--panel-bg, #222);
    border: 1px solid var(--border-color, #333);
    border-radius: 8px;
    padding: 16px;
    min-width: 380px;
    max-width: 450px;
    max-height: 70vh;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    z-index: 100002;
    overflow-y: auto;
  `;

  const titleContainer = document.createElement('div');
  titleContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;';

  const title = document.createElement('h3');
  title.textContent = '[:::] Custom Alt+Key Hotkeys';
  title.style.cssText = 'margin: 0; color: var(--text-color, #fff); font-size: 16px;';

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '×';
  closeBtn.style.cssText = 'background: transparent; border: none; color: #888; font-size: 24px; cursor: pointer;';
  closeBtn.onclick = () => menu.remove();

  titleContainer.appendChild(title);
  titleContainer.appendChild(closeBtn);
  menu.appendChild(titleContainer);

  const hint = document.createElement('div');
  hint.style.cssText = 'color: #888; font-size: 12px; margin-bottom: 12px; padding: 8px; background: var(--tab-bg, #333); border-radius: 4px;';
  hint.textContent = 'Add custom shortcuts: Alt + any key → executes JavaScript code';
  menu.appendChild(hint);

  // Current hotkeys list
  if (customAltHotkeys.length > 0) {
    const listTitle = document.createElement('h4');
    listTitle.textContent = 'Your Alt+Key Hotkeys:';
    listTitle.style.cssText = 'margin: 0 0 8px 0; color: var(--text-color, #fff); font-size: 13px;';
    menu.appendChild(listTitle);

    const list = document.createElement('div');
    list.style.cssText = 'max-height: 150px; overflow-y: auto; margin-bottom: 16px;';
    
    customAltHotkeys.forEach((hotkey, index) => {
      const item = document.createElement('div');
      item.style.cssText = 'display: flex; justify-content: space-between; align-items: center; padding: 8px; background: var(--tab-bg, #333); border-radius: 4px; margin-bottom: 4px; gap: 8px;';
      
      const keyInfo = document.createElement('span');
      keyInfo.style.cssText = 'color: #47a3ff; font-size: 13px; font-weight: bold; min-width: 50px;';
      keyInfo.textContent = 'Alt+' + hotkey.key.toUpperCase();
      
      const codeInfo = document.createElement('span');
      codeInfo.style.cssText = 'color: #aaa; font-size: 11px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;';
      codeInfo.textContent = hotkey.code.substring(0, 30) + (hotkey.code.length > 30 ? '...' : '');
      codeInfo.title = hotkey.code;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.textContent = '×';
      deleteBtn.style.cssText = 'background: transparent; border: none; color: #ff4444; cursor: pointer; font-size: 16px; padding: 0 4px;';
      deleteBtn.onclick = (ev) => {
        ev.stopPropagation();
        customAltHotkeys.splice(index, 1);
        saveCustomAltHotkeys();
        menu.remove();
        showCustomAltHotkeysMenu();
      };
      
      item.appendChild(keyInfo);
      item.appendChild(codeInfo);
      item.appendChild(deleteBtn);
      list.appendChild(item);
    });
    menu.appendChild(list);
  }

  // Add new hotkey form
  const formTitle = document.createElement('h4');
  formTitle.textContent = 'Add New Alt+Key Hotkey:';
  formTitle.style.cssText = 'margin: 0 0 8px 0; color: var(--text-color, #fff); font-size: 13px;';
  menu.appendChild(formTitle);

  const form = document.createElement('div');
  form.style.cssText = 'display: flex; flex-direction: column; gap: 8px;';

  const keyRow = document.createElement('div');
  keyRow.style.cssText = 'display: flex; align-items: center; gap: 8px;';
  
  const keyLabel = document.createElement('span');
  keyLabel.textContent = 'Alt +';
  keyLabel.style.cssText = 'color: var(--text-color, #fff); font-size: 13px;';

  const keySelect = document.createElement('select');
  keySelect.style.cssText = 'flex: 1; padding: 8px; background: var(--tab-bg, #333); color: var(--text-color, #fff); border: 1px solid var(--border-color, #444); border-radius: 4px;';
  
  const letters = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('');
  letters.forEach(l => {
    const opt = document.createElement('option');
    opt.value = l;
    opt.textContent = l.toUpperCase();
    keySelect.appendChild(opt);
  });

  keyRow.appendChild(keyLabel);
  keyRow.appendChild(keySelect);
  form.appendChild(keyRow);

  const codeRow = document.createElement('div');
  const codeLabel = document.createElement('label');
  codeLabel.textContent = 'JavaScript Code:';
  codeLabel.style.cssText = 'display: block; color: var(--text-color, #fff); font-size: 12px; margin-bottom: 4px;';

  const codeInput = document.createElement('textarea');
  codeInput.placeholder = 'alert("Hello!")';
  codeInput.rows = 2;
  codeInput.style.cssText = 'width: 100%; padding: 8px; background: var(--tab-bg, #333); color: var(--text-color, #fff); border: 1px solid var(--border-color, #444); border-radius: 4px; box-sizing: border-box; font-family: monospace; font-size: 12px;';

  codeRow.appendChild(codeLabel);
  codeRow.appendChild(codeInput);
  form.appendChild(codeRow);

  const addBtn = document.createElement('button');
  addBtn.textContent = 'Add Hotkey';
  addBtn.style.cssText = 'margin-top: 8px; padding: 10px; background: #47a3ff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px;';
  addBtn.onclick = () => {
    const key = keySelect.value;
    const code = codeInput.value.trim();
    
    if (!key || !code) return;

    customAltHotkeys.push({ key, code });
    saveCustomAltHotkeys();
    
    addBtn.textContent = '✓ Added!';
    setTimeout(() => { addBtn.textContent = 'Add Hotkey'; }, 1500);
    
    codeInput.value = '';
    menu.remove();
    showCustomAltHotkeysMenu();
  };

  form.appendChild(addBtn);
  menu.appendChild(form);

  document.body.appendChild(menu);
}

// ==================== TEXT TO SPEECH ====================
let speechSynthesis = window.speechSynthesis;
let speechUtterance = null;

function speakSelectedText() {
  // Get selected text from the active webview
  const activeWebview = document.querySelector('webview[style*="display: flex;"]');
  if (!activeWebview) return;
  
  activeWebview.executeJavaScript(`
    window.getSelection().toString();
  `).then(selectedText => {
    if (selectedText && selectedText.trim().length > 0) {
      // Cancel any ongoing speech
      if (speechSynthesis.speaking) {
        speechSynthesis.cancel();
      }
      
      // Create new utterance
      speechUtterance = new SpeechSynthesisUtterance(selectedText);
      speechUtterance.lang = 'en-US';
      speechUtterance.rate = 1.0;
      speechUtterance.pitch = 1.0;
      
      // Speak the text
      speechSynthesis.speak(speechUtterance);
      
      console.log('Speaking:', selectedText.substring(0, 50) + '...');
    }
  }).catch(err => {
    console.log('Could not get selection:', err);
  });
}

// Listen for Ctrl+P to speak selected text
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'p') {
    e.preventDefault();
    speakSelectedText();
  }
});
