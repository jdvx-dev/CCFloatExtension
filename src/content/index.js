(function () {
  'use strict';

  // ─── Config ───────────────────────────────────────────────────────────────────

  const CAPTION_CONTAINER_SELECTOR = '.ytp-caption-window-container';
  const CAPTION_SEGMENT_SELECTOR   = '.ytp-caption-segment';
  const OBSERVER_DEBOUNCE_MS       = 80;
  const POLL_INTERVAL_MS           = 1500;

  // ─── State ────────────────────────────────────────────────────────────────────

  let observer      = null;
  let lastSentText  = '';
  let debounceTimer = null;
  let pollTimer     = null;

  // ─── Caption extraction ───────────────────────────────────────────────────────

  function extractCurrentCaption() {
    const segments = document.querySelectorAll(CAPTION_SEGMENT_SELECTOR);
    if (!segments.length) return '';
    return Array.from(segments)
      .map(el => el.textContent.trim())
      .filter(Boolean)
      .join(' ');
  }

  // ─── Send to background (debounced + deduplicated) ───────────────────────────

  function scheduleSubtitleSend(text) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      if (text === lastSentText) return;
      lastSentText = text;
      chrome.runtime.sendMessage({ type: MSG.SUBTITLE_UPDATE, text })
        .catch(() => {});
    }, OBSERVER_DEBOUNCE_MS);
  }

  // ─── MutationObserver ─────────────────────────────────────────────────────────

  function attachObserver(container) {
    if (observer) observer.disconnect();

    observer = new MutationObserver(() => {
      const text = extractCurrentCaption();
      scheduleSubtitleSend(text);
    });

    observer.observe(container, {
      childList:     true,
      subtree:       true,
      characterData: true,
    });
  }

  // ─── Polling fallback ─────────────────────────────────────────────────────────

  function tryAttach() {
    const container = document.querySelector(CAPTION_CONTAINER_SELECTOR);
    if (container) {
      attachObserver(container);
      return true;
    }
    return false;
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(() => {
      if (tryAttach()) {
        clearInterval(pollTimer);
        pollTimer = null;
      }
    }, POLL_INTERVAL_MS);
  }

  // ─── YouTube SPA navigation ───────────────────────────────────────────────────

  document.addEventListener('yt-navigate-finish', () => {
    if (observer) {
      observer.disconnect();
      observer = null;
    }
    lastSentText = '';
    setTimeout(() => {
      if (!tryAttach()) startPolling();
    }, 800);
  });

  // ─── Bootstrap ────────────────────────────────────────────────────────────────

  chrome.runtime.sendMessage({ type: MSG.CONTENT_SCRIPT_READY }).catch(() => {});

  if (!tryAttach()) {
    startPolling();
  }

})();
