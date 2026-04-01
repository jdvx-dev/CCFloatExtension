(function () {
  'use strict';

  // ─── Config ───────────────────────────────────────────────────────────────────

  const FONT_SIZE_MIN     = 11;
  const FONT_SIZE_MAX     = 36;
  const FONT_SIZE_STEP    = 2;
  const FONT_SIZE_DEFAULT = 18;
  const STORAGE_KEY_FONT  = 'ccfloat_fontsize';

  // ─── DOM refs ─────────────────────────────────────────────────────────────────

  const captionText = document.getElementById('captionText');
  const fontIncBtn  = document.getElementById('fontIncBtn');
  const fontDecBtn  = document.getElementById('fontDecBtn');
  const closeBtn    = document.getElementById('closeBtn');

  // ─── Font size ────────────────────────────────────────────────────────────────

  let fontSize = FONT_SIZE_DEFAULT;

  function applyFontSize() {
    captionText.style.fontSize = `${fontSize}px`;
  }

  function saveFontSize() {
    chrome.storage.local.set({ [STORAGE_KEY_FONT]: fontSize });
  }

  async function loadFontSize() {
    const result = await chrome.storage.local.get(STORAGE_KEY_FONT);
    if (result[STORAGE_KEY_FONT]) {
      fontSize = result[STORAGE_KEY_FONT];
    }
  }

  fontIncBtn.addEventListener('click', () => {
    if (fontSize < FONT_SIZE_MAX) {
      fontSize = Math.min(fontSize + FONT_SIZE_STEP, FONT_SIZE_MAX);
      applyFontSize();
      saveFontSize();
    }
  });

  fontDecBtn.addEventListener('click', () => {
    if (fontSize > FONT_SIZE_MIN) {
      fontSize = Math.max(fontSize - FONT_SIZE_STEP, FONT_SIZE_MIN);
      applyFontSize();
      saveFontSize();
    }
  });

  // ─── Close button ─────────────────────────────────────────────────────────────

  closeBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: MSG.CLOSE_FLOAT_WINDOW }).catch(() => {});
    window.close();
  });

  // ─── Caption display ──────────────────────────────────────────────────────────

  let clearTimer = null;

  function showCaption(text) {
    clearTimeout(clearTimer);

    if (!text || !text.trim()) {
      clearTimer = setTimeout(() => {
        captionText.textContent = 'Waiting for captions...';
        captionText.classList.add('placeholder');
      }, 2500);
      return;
    }

    captionText.classList.remove('placeholder');
    captionText.textContent = text.trim();
  }

  // ─── Message listener ─────────────────────────────────────────────────────────

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.type === MSG.SUBTITLE_UPDATE) {
      showCaption(message.text);
      sendResponse({ ok: true });
    }
  });

  // ─── Init ─────────────────────────────────────────────────────────────────────

  async function init() {
    await loadFontSize();
    applyFontSize();
    captionText.classList.add('placeholder');

    try {
      await chrome.runtime.sendMessage({ type: MSG.FLOAT_READY });
    } catch {
      // Service worker terminated between window creation and script load.
      // Not fatal — captions will arrive on the next mutation event.
    }
  }

  init();

})();
