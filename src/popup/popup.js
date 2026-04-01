const toggleBtn  = document.getElementById('toggleBtn');
const statusText = document.getElementById('statusText');

let isFloatOpen = false;

// ─── Sync UI with background state ───────────────────────────────────────────

async function refreshStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: MSG.GET_STATUS });
    isFloatOpen = response.isFloatOpen;
    updateUI();
  } catch {
    statusText.textContent = 'Extension error.';
  }
}

function updateUI() {
  if (isFloatOpen) {
    toggleBtn.textContent = 'Close Float Window';
    toggleBtn.classList.add('open');
    statusText.textContent = 'Float window is active';
    statusText.className = 'status active';
  } else {
    toggleBtn.textContent = 'Open Float Window';
    toggleBtn.classList.remove('open');
    statusText.textContent = 'Float window is closed';
    statusText.className = 'status';
  }
}

// ─── Toggle handler ───────────────────────────────────────────────────────────

toggleBtn.addEventListener('click', async () => {
  toggleBtn.disabled = true;
  try {
    if (isFloatOpen) {
      await chrome.runtime.sendMessage({ type: MSG.CLOSE_FLOAT_WINDOW });
      isFloatOpen = false;
    } else {
      await chrome.runtime.sendMessage({ type: MSG.OPEN_FLOAT_WINDOW });
      isFloatOpen = true;
    }
    updateUI();
  } catch {
    statusText.textContent = 'Action failed. Try again.';
  } finally {
    toggleBtn.disabled = false;
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────

refreshStatus();
