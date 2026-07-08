/**
 * DevTools Resize Fix
 *
 * Chromium bug: when DevTools is docked (bottom/side/right) and the
 * inspected page reloads, the page's layout sometimes doesn't reflow to
 * the correct viewport size — content visually slides/misaligns under
 * the docked panel until an actual window resize forces a relayout.
 *
 * This script runs only while DevTools is open for a tab (devtools_page
 * is loaded on DevTools open and unloaded on DevTools close), so it
 * never touches tabs the user isn't inspecting. On every navigation of
 * the inspected tab, it nudges the browser window width by a couple of
 * pixels and immediately back, which is enough to force Chromium to
 * recompute layout without any visible flicker.
 */

const NUDGE_PX = 2;
const RESTORE_DELAY_MS = 60;

function nudge(windowId) {
  chrome.windows.get(windowId, {}, (win) => {
    if (!win) return;

    if (win.state === "normal") {
      const originalWidth = win.width;
      chrome.windows.update(windowId, { width: originalWidth - NUDGE_PX }, () => {
        setTimeout(() => {
          chrome.windows.update(windowId, { width: originalWidth });
        }, RESTORE_DELAY_MS);
      });
      return;
    }

    // A maximized/fullscreen window can't be resized directly — cycling
    // through "normal" forces the same relayout at the cost of a brief,
    // visible restore/maximize flicker. No lighter alternative is known
    // to reliably trigger the fix in this state.
    chrome.windows.update(windowId, { state: "normal" }, () => {
      setTimeout(() => {
        chrome.windows.update(windowId, { state: "maximized" });
      }, RESTORE_DELAY_MS);
    });
  });
}

chrome.devtools.network.onNavigated.addListener(() => {
  chrome.tabs.get(chrome.devtools.inspectedWindow.tabId, (tab) => {
    if (!tab || !tab.windowId) return;
    nudge(tab.windowId);
  });
});
