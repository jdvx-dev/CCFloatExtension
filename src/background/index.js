// Service worker — CCFloat background script

importScripts('../utils/messages.js');

// ─── State ────────────────────────────────────────────────────────────────────

let floatWindowId = null;
let floatTabId    = null;
let lastSubtitle  = '';

// ─── Persist / restore state across service worker restarts ──────────────────
// MV3 service workers are terminated after ~30s of inactivity. All in-memory
// state is lost on restart. chrome.storage.session survives SW restarts for
// the duration of the browser session.

async function persistState() {
  await chrome.storage.session.set({ floatWindowId, floatTabId });
}

async function restoreState() {
  const data = await chrome.storage.session.get(['floatWindowId', 'floatTabId']);
  if (data.floatWindowId != null) {
    floatWindowId = data.floatWindowId;
    floatTabId    = data.floatTabId ?? null;
  }
}

// ─── Resolve float tab ID ─────────────────────────────────────────────────────

async function resolveFloatTabId() {
  if (floatWindowId === null) return null;
  try {
    const win = await chrome.windows.get(floatWindowId, { populate: true });
    if (win && win.tabs && win.tabs.length > 0) {
      floatTabId = win.tabs[0].id;
      return floatTabId;
    }
  } catch {
    floatWindowId = null;
    floatTabId    = null;
    await persistState();
  }
  return null;
}

// ─── Open / close float window ────────────────────────────────────────────────

async function openFloatWindow() {
  if (floatWindowId !== null) {
    try {
      await chrome.windows.update(floatWindowId, { focused: true });
      return { success: true, alreadyOpen: true };
    } catch {
      floatWindowId = null;
      floatTabId    = null;
    }
  }

  const win = await chrome.windows.create({
    url:     chrome.runtime.getURL('src/popup/float.html'),
    type:    'popup',
    width:   520,
    height:  130,
    focused: true,
  });

  floatWindowId = win.id;
  floatTabId    = win.tabs[0].id;
  await persistState();

  return { success: true, alreadyOpen: false };
}

async function closeFloatWindow() {
  if (floatWindowId !== null) {
    try {
      await chrome.windows.remove(floatWindowId);
    } catch { /* already closed */ }
    floatWindowId = null;
    floatTabId    = null;
    await persistState();
  }
}

// ─── Forward subtitle to float window ────────────────────────────────────────

async function sendSubtitleToFloat(text) {
  lastSubtitle = text;

  if (floatWindowId === null) {
    await restoreState();
  }

  const tabId = floatTabId ?? await resolveFloatTabId();
  if (tabId === null) return;

  try {
    await chrome.tabs.sendMessage(tabId, { type: MSG.SUBTITLE_UPDATE, text });
  } catch {
    // Float tab still loading — next caption event will retry
  }
}

// ─── Track float window closure via OS title bar ──────────────────────────────

chrome.windows.onRemoved.addListener(async (windowId) => {
  if (windowId === floatWindowId) {
    floatWindowId = null;
    floatTabId    = null;
    lastSubtitle  = '';
    await persistState();
  }
});

// ─── Message router ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  switch (message.type) {

    case MSG.SUBTITLE_UPDATE:
      sendSubtitleToFloat(message.text);
      sendResponse({ ok: true });
      break;

    case MSG.OPEN_FLOAT_WINDOW:
      openFloatWindow().then(sendResponse);
      return true;

    case MSG.CLOSE_FLOAT_WINDOW:
      closeFloatWindow().then(() => sendResponse({ ok: true }));
      return true;

    case MSG.GET_STATUS:
      restoreState().then(() => {
        sendResponse({ isFloatOpen: floatWindowId !== null });
      });
      return true;

    case MSG.FLOAT_READY:
      if (lastSubtitle) {
        sendSubtitleToFloat(lastSubtitle);
      }
      sendResponse({ ok: true });
      break;

    default:
      break;
  }
});
