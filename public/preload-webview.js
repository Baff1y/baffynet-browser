// Preload for webview: override native alert/confirm/prompt and forward to host (embedder)
const { ipcRenderer } = require('electron')

(function overrideDialogs() {
  function sendRequest(type, message, defaultText) {
    return new Promise((resolve) => {
      const requestId = `${Date.now()}-${Math.random()}`;

      const responseHandler = (event, resp) => {
        if (!resp || resp.requestId !== requestId) return;
        // remove listener
        ipcRenderer.removeListener('dialog-response', responseHandler);
        resolve(resp.result);
      };

      ipcRenderer.on('dialog-response', responseHandler);
      ipcRenderer.sendToHost('dialog-request', { requestId, type, message, defaultText });

      // safety timeout
      setTimeout(() => {
        ipcRenderer.removeListener('dialog-response', responseHandler);
        resolve(null);
      }, 30000);
    });
  }

  // Replace blocking functions with async-backed versions
  window.alert = function (msg) {
    // show a non-blocking popup
    try { sendRequest('alert', String(msg)); } catch (e) { /* ignore */ }
  }

  window.confirm = function (msg) {
    try {
      const p = sendRequest('confirm', String(msg));
      // return a boolean via synchronous fallback (not truly blocking but best-effort)
      let resolved = false;
      let result = false;
      p.then(r => { resolved = true; result = !!r });
      // busy-wait short loop to allow some sites that expect sync confirm to work
      const start = Date.now();
      while (!resolved && (Date.now() - start) < 50) { /* spin for up to 50ms */ }
      return result;
    } catch (e) { return false }
  }

  window.prompt = function (msg, defaultText) {
    try {
      const p = sendRequest('prompt', String(msg), String(defaultText || ''));
      // cannot emulate blocking reliably; return null and let page handle async if needed
      let resolved = false;
      let value = null;
      p.then(r => { resolved = true; value = (typeof r === 'string' ? r : null) });
      const start = Date.now();
      while (!resolved && (Date.now() - start) < 50) { /* spin for up to 50ms */ }
      return value;
    } catch (e) { return null }
  }
})()

// Fullscreen API passthrough for webview
const { ipcRenderer } = require('electron');
['requestFullscreen', 'webkitRequestFullscreen', 'webkitRequestFullScreen'].forEach(method => {
  Element.prototype[method] = function() {
    // Try all possible fullscreen methods
    try {
      const fn = this[method] || this.requestFullscreen || this.webkitRequestFullscreen || this.webkitRequestFullScreen;
      if (fn) return fn.call(this);
    } catch (e) {
      console.error('Fullscreen error:', e);
    }
    // Fallback: notify host
    ipcRenderer.sendToHost('webview-fullscreen-request');
    return Promise.reject(new Error('Fullscreen not supported'));
  };
});

['exitFullscreen', 'webkitExitFullscreen', 'webkitExitFullScreen'].forEach(method => {
  Document.prototype[method] = function() {
    try {
      const fn = this[method] || this.exitFullscreen || this.webkitExitFullscreen || this.webkitExitFullScreen;
      if (fn) return fn.call(this);
    } catch (e) {
      console.error('Exit fullscreen error:', e);
    }
    ipcRenderer.sendToHost('webview-fullscreen-exit');
    return Promise.reject(new Error('Exit fullscreen not supported'));
  };
});

// Also listen for fullscreen changes
document.addEventListener('fullscreenchange', () => {
  ipcRenderer.sendToHost('webview-fullscreen-change', document.fullscreenElement !== null);
});

document.addEventListener('webkitfullscreenchange', () => {
  ipcRenderer.sendToHost('webview-fullscreen-change', document.webkitFullscreenElement !== null);
});
