const logEl = document.getElementById("log");
const statusEl = document.getElementById("status");
const statusTextEl = document.getElementById("statusText");

function render(debugLog) {
  logEl.innerHTML = debugLog
    .map((entry) => {
      const time = new Date(entry.ts).toLocaleTimeString();
      return `<div class="entry"><span class="ts">${time}</span> ${entry.msg}</div>`;
    })
    .join("");
  logEl.scrollTop = logEl.scrollHeight;
}

function renderStatus(enabled) {
  statusEl.classList.toggle("on", enabled);
  statusTextEl.textContent = enabled ? "fix enabled" : "fix disabled";
}

chrome.storage.local.get({ debugLog: [], enabled: true }, ({ debugLog, enabled }) => {
  render(debugLog);
  renderStatus(enabled);
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "local") return;
  if (changes.debugLog) {
    render(changes.debugLog.newValue || []);
  }
  if (changes.enabled) {
    renderStatus(changes.enabled.newValue);
  }
});

document.getElementById("clear").addEventListener("click", () => {
  chrome.storage.local.set({ debugLog: [] });
});
