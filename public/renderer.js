// Renderer helpers: show a custom modal for permission requests (supports keyboard shortcuts)
window.addEventListener('DOMContentLoaded', () => {
  const buildModal = () => {
    let modal = document.getElementById('permission-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'permission-modal';
    modal.style = `position:fixed;top:0;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.4);z-index:99999;`;
    modal.innerHTML = `
      <div id="permission-box" style="background:var(--panel-bg, #222);color:var(--text-color,#fff);padding:20px;border-radius:8px;min-width:320px;max-width:560px;box-shadow:0 4px 24px rgba(0,0,0,0.5);">
        <h3 id="permission-title" style="margin:0 0 10px 0;font-size:16px;">Permission request</h3>
        <p id="permission-message" style="margin:0 0 12px 0;font-size:13px;color:var(--muted,#ccc);"></p>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button id="permission-deny" style="padding:6px 12px;background:#ff4444;color:#fff;border:none;border-radius:4px;cursor:pointer;">Deny (Del)</button>
          <button id="permission-allow" style="padding:6px 12px;background:#47a3ff;color:#fff;border:none;border-radius:4px;cursor:pointer;">Allow</button>
        </div>
        <div style="margin-top:10px;font-size:11px;color:var(--muted,#ccc);">Tip: Press <strong>Ctrl+V</strong> or <strong>Ctrl+N</strong> anytime to re-check saved permissions for the active site. While modal is open, press <strong>Delete</strong> or <strong>Escape</strong> to deny.</div>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  };

  let activeRequest = null;
  let keyHandler = (e) => {
    if (!activeRequest) return;
    // Delete to deny
    if (e.key === 'Delete' || e.key === 'Del') {
      e.preventDefault();
      respond(false);
    }
    // Escape to deny
    if (e.key === 'Escape') {
      e.preventDefault();
      respond(false);
    }
  };

  function showModal(request) {
    activeRequest = request;
    const modal = buildModal();
    const title = modal.querySelector('#permission-title');
    const msg = modal.querySelector('#permission-message');
    const allowBtn = modal.querySelector('#permission-allow');
    const denyBtn = modal.querySelector('#permission-deny');

    title.textContent = 'Permission request';

    msg.textContent = `${request.origin} wants to access your ${request.permText}.`;

    const onAllow = () => respond(true);
    const onDeny = () => respond(false);

    allowBtn.onclick = onAllow;
    denyBtn.onclick = onDeny;

    // show
    modal.style.display = 'flex';

    // focus for keyboard events
    document.addEventListener('keydown', keyHandler);
  }

  function hideModal() {
    const modal = document.getElementById('permission-modal');
    if (modal) modal.style.display = 'none';
    document.removeEventListener('keydown', keyHandler);
    activeRequest = null;
  }

  function respond(allow) {
    try {
      if (!activeRequest) return;
      const { requestId, permission, origin } = activeRequest;

      // persist a simple flag in localStorage for UI visibility
      try {
        if (window && window.localStorage && origin && permission) {
          localStorage.setItem(`perm:${origin}:${permission}`, allow ? 'allow' : 'deny');
        }
      } catch (e) { /* ignore localStorage errors */ }

      if (window.electronAPI && window.electronAPI.sendPermissionResponse) {
        window.electronAPI.sendPermissionResponse(requestId, allow);
      }
    } catch (err) {
      console.error('permission response error', err);
    } finally {
      hideModal();
    }
  }

  if (window.electronAPI && window.electronAPI.onPermissionRequest) {
    window.electronAPI.onPermissionRequest((event, data) => {
      try {
        const { requestId, permission, origin, mediaTypes = [] } = data || {};
        let permText = permission;

        if (permission === 'media') {
          const parts = [];
          if (mediaTypes.includes('video')) parts.push('camera');
          if (mediaTypes.includes('audio')) parts.push('microphone');
          permText = parts.length ? parts.join(' and ') : 'camera / microphone';
        } else if (permission === 'geolocation') {
          permText = 'location';
        }

        showModal({ requestId, permission, origin, permText });
      } catch (err) {
        console.error('permission prompt error', err);
      }
    });
  }

  // Generic dialog UI: alert / confirm / prompt
  function buildDialogModal() {
    let modal = document.getElementById('native-dialog-modal');
    if (modal) return modal;

    modal = document.createElement('div');
    modal.id = 'native-dialog-modal';
    modal.style = 'position:fixed;top:0;left:0;right:0;bottom:0;display:none;align-items:center;justify-content:center;background:rgba(0,0,0,0.45);z-index:100000;';
    modal.innerHTML = `
      <div id="native-dialog-box" style="background:var(--panel-bg,#222);color:var(--text-color,#fff);padding:18px;border-radius:8px;min-width:320px;max-width:560px;box-shadow:0 6px 36px rgba(0,0,0,0.5);">
        <div id="native-dialog-message" style="font-size:14px;margin-bottom:12px;color:var(--muted,#ccc);"></div>
        <div id="native-dialog-input" style="margin-bottom:12px;display:none;"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end;">
          <button id="native-dialog-cancel" style="padding:6px 12px;background:#777;color:#fff;border:none;border-radius:4px;cursor:pointer;display:none;">Cancel</button>
          <button id="native-dialog-ok" style="padding:6px 12px;background:#47a3ff;color:#fff;border:none;border-radius:4px;cursor:pointer;">OK</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    return modal;
  }

  function showAlert(message) {
    return new Promise((resolve) => {
      const modal = buildDialogModal();
      modal.querySelector('#native-dialog-message').textContent = message;
      const inputWrap = modal.querySelector('#native-dialog-input');
      inputWrap.style.display = 'none';
      const cancelBtn = modal.querySelector('#native-dialog-cancel');
      const okBtn = modal.querySelector('#native-dialog-ok');

      cancelBtn.style.display = 'none';
      okBtn.onclick = () => { hideDialog(); resolve(); };

      function hideDialog() { modal.style.display = 'none'; document.removeEventListener('keydown', keyHandler); }
      function keyHandler(e) { if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); hideDialog(); resolve(); } }

      modal.style.display = 'flex';
      document.addEventListener('keydown', keyHandler);
    });
  }

  function showConfirm(message) {
    return new Promise((resolve) => {
      const modal = buildDialogModal();
      modal.querySelector('#native-dialog-message').textContent = message;
      const inputWrap = modal.querySelector('#native-dialog-input');
      inputWrap.style.display = 'none';
      const cancelBtn = modal.querySelector('#native-dialog-cancel');
      const okBtn = modal.querySelector('#native-dialog-ok');

      cancelBtn.style.display = '';
      cancelBtn.onclick = () => { hideDialog(); resolve(false); };
      okBtn.onclick = () => { hideDialog(); resolve(true); };

      function hideDialog() { modal.style.display = 'none'; document.removeEventListener('keydown', keyHandler); }
      function keyHandler(e) { if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); hideDialog(); resolve(false); } }

      modal.style.display = 'flex';
      document.addEventListener('keydown', keyHandler);
    });
  }

  function showPrompt(message, defaultValue = '') {
    return new Promise((resolve) => {
      const modal = buildDialogModal();
      modal.querySelector('#native-dialog-message').textContent = message;
      const inputWrap = modal.querySelector('#native-dialog-input');
      inputWrap.innerHTML = `<input id="native-dialog-input-el" style="width:100%;padding:8px;border-radius:4px;border:1px solid #333;background:transparent;color:var(--text-color,#fff);" value="${String(defaultValue).replace(/"/g, '&quot;')}" />`;
      inputWrap.style.display = '';
      const inputEl = inputWrap.querySelector('#native-dialog-input-el');
      const cancelBtn = modal.querySelector('#native-dialog-cancel');
      const okBtn = modal.querySelector('#native-dialog-ok');

      cancelBtn.style.display = '';
      cancelBtn.onclick = () => { hideDialog(); resolve(null); };
      okBtn.onclick = () => { hideDialog(); resolve(inputEl.value); };

      function hideDialog() { modal.style.display = 'none'; document.removeEventListener('keydown', keyHandler); }
      function keyHandler(e) {
        if (e.key === 'Escape' || e.key === 'Esc') { e.preventDefault(); hideDialog(); resolve(null); }
        if (e.key === 'Enter') { e.preventDefault(); hideDialog(); resolve(inputEl.value); }
      }

      modal.style.display = 'flex';
      inputEl.focus();
      inputEl.select();
      document.addEventListener('keydown', keyHandler);
    });
  }

  // expose globally for host page to call from main.js
  window.showAlert = showAlert;
  window.showConfirm = showConfirm;
  window.showPrompt = showPrompt;
});
