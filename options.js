// Kept in sync by hand with DEFAULT_SETTINGS in devtools.js - no build
// step in this extension to share a single source of truth between them.
const DEFAULT_SETTINGS = { enabled: true, nudgePx: 3, restoreDelayMs: 150 };

const enabledEl = document.getElementById("enabled");
const nudgePxEl = document.getElementById("nudgePx");
const restoreDelayMsEl = document.getElementById("restoreDelayMs");
const statusEl = document.getElementById("status");

function load() {
  chrome.storage.local.get(DEFAULT_SETTINGS, (settings) => {
    enabledEl.checked = settings.enabled;
    nudgePxEl.value = settings.nudgePx;
    restoreDelayMsEl.value = settings.restoreDelayMs;
  });
}

function save() {
  const settings = {
    enabled: enabledEl.checked,
    nudgePx: Math.max(1, Number(nudgePxEl.value) || DEFAULT_SETTINGS.nudgePx),
    restoreDelayMs: Math.max(10, Number(restoreDelayMsEl.value) || DEFAULT_SETTINGS.restoreDelayMs),
  };
  chrome.storage.local.set(settings, () => {
    statusEl.textContent = "Saved.";
    setTimeout(() => {
      statusEl.textContent = "";
    }, 1500);
  });
}

document.getElementById("save").addEventListener("click", save);

document.getElementById("reset").addEventListener("click", () => {
  chrome.storage.local.set(DEFAULT_SETTINGS, load);
});

load();
