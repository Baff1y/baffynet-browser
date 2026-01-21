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

// Инициализация Themes и пользовательского CSS при загрузке
initializeTheme()
applyCustomCSS()

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

function createNewTab(url) {
  const finalUrl = url || localStorage.getItem('newTabPage') || 'https://baffynet.rf.gd'
  const tabId = tabCounter++

  // If the URL is a local file (file://), open it in Explorer instead of loading in a webview
  try {
    if (finalUrl && finalUrl.startsWith('file://')) {
      let filePath = finalUrl.replace(/^file:\/\//i, '')
      // Remove leading slash on Windows paths like /C:/...
      if (filePath.startsWith('/')) filePath = filePath.slice(1)
      filePath = decodeURIComponent(filePath)
      if (window.electronAPI && window.electronAPI.showItemInFolder) {
        window.electronAPI.showItemInFolder(filePath)
      } else if (window.electronAPI && window.electronAPI.openDownloadFolder) {
        window.electronAPI.openDownloadFolder()
      }
      return
    }
  } catch (err) {
    console.error('Error handling file:// URL in createNewTab:', err)
  }

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
}

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
