const tabsContainer = document.getElementById('tab-bar')
const webviewsContainer = document.getElementById('webviews-container')
const urlBar = document.getElementById('url-bar')
let tabCounter = 1
let closedTabsHistory = []

// Загружаем стартовую страницу из настроек
const defaultStartPage = localStorage.getItem('startPage') || 'https://baffynet.rf.gd'
createNewTab(defaultStartPage)

function createNewTab(url) {
  const finalUrl = url || localStorage.getItem('newTabPage') || 'https://baffynet.rf.gd'
  const tabId = tabCounter++

  const tab = document.createElement('div')
  tab.className = 'tab'
  tab.dataset.tabId = tabId
  tab.innerHTML = `
    <img class="tab-favicon" src="https://www.google.com/favicon.ico">
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

function toggleTheme() {
  const isDark = !document.body.classList.contains('dark-theme')
  document.body.classList.toggle('dark-theme', isDark)
  document.body.classList.toggle('light-theme', !isDark)
  localStorage.setItem('theme', isDark ? 'dark' : 'light')
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

function showSearchEnginePromptModal() {
  const modal = document.getElementById('search-engine-modal')
  const searchEngineInput = document.getElementById('search-engine-input')

  // Получаем шаблон поисковой системы
  const getTemplate = async () => {
    if (window.electronAPI) {
      try {
        return await window.electronAPI.getSearchEngine()
      } catch {
        return localStorage.getItem('searchEngineTemplate') || 'https://www.google.com/search?q=${encodeURIComponent(url)}'
      }
    }
    return localStorage.getItem('searchEngineTemplate') || 'https://www.google.com/search?q=${encodeURIComponent(url)}'
  }

  getTemplate().then(template => {
    searchEngineInput.value = template
  })

  modal.classList.remove('hidden')

  document.getElementById('save-search-engine').onclick = () => {
    const template = searchEngineInput.value.trim()
    if (template.includes('${encodeURIComponent(url)}')) {
      if (window.electronAPI) {
        window.electronAPI.saveSearchEngine(template)
      } else {
        localStorage.setItem('searchEngineTemplate', template)
      }
      modal.classList.add('hidden')
    } else {
      alert('Шаблон должен содержать ${encodeURIComponent(url)} для подстановки поискового запроса')
    }
  }

  document.getElementById('cancel-search-engine').onclick = () => {
    modal.classList.add('hidden')
  }
}

function showUrlPrompt() {
  showUrlPromptModal()
}

// Загрузка темы из localStorage (по умолчанию темная)
document.body.classList.add(localStorage.getItem('theme') === 'light' ? 'light-theme' : 'dark-theme')

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
        const searchTemplate = localStorage.getItem('searchEngineTemplate') || 'https://www.google.com/search?q=${encodeURIComponent(url)}'
        url = url.includes('.') ? `https://${url}` : searchTemplate.replace('${encodeURIComponent(url)}', encodeURIComponent(url))
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
}
