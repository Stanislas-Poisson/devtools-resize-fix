/**
 * DevTools Resize Fix
 *
 * Chromium bug: when DevTools is docked (bottom/side/right) and the
 * inspected page reloads, the page's layout sometimes doesn't reflow to
 * the correct viewport size - content visually slides/misaligns under
 * the docked panel until an actual window resize forces a relayout.
 *
 * This script runs only while DevTools is open for a tab (devtools_page
 * is loaded on DevTools open and unloaded on DevTools close), so it
 * never touches tabs the user isn't inspecting. On every navigation of
 * the inspected tab, it nudges the browser window width by a couple of
 * pixels and immediately back, which is enough to force Chromium to
 * recompute layout without any visible flicker.
 */

const DEFAULT_SETTINGS = { enabled: true, nudgePx: 3, restoreDelayMs: 150 };
const LOG_MAX_ENTRIES = 100;

function getSettings(callback) {
  chrome.storage.local.get(DEFAULT_SETTINGS, callback);
}

// devtools_page has no reachable console in practice (Chromium exposes it
// only as a nested iframe inside devtools_app.html, not as its own
// inspectable target) - so logs go to chrome.storage.local instead,
// readable from the normal extension page debug.html.
//
// get() then set() is a read-modify-write: two log() calls fired close
// together (which happens constantly here) can race, with the second
// set() overwriting the first's entry before it ever lands. Chaining
// through logQueue serializes them so nothing gets silently dropped.
let logQueue = Promise.resolve();
function log(msg) {
  logQueue = logQueue.then(
    () =>
      new Promise((resolve) => {
        chrome.storage.local.get({ debugLog: [] }, ({ debugLog }) => {
          debugLog.push({ ts: Date.now(), msg });
          if (debugLog.length > LOG_MAX_ENTRIES) {
            debugLog.splice(0, debugLog.length - LOG_MAX_ENTRIES);
          }
          chrome.storage.local.set({ debugLog }, resolve);
        });
      })
  );
}

function shrinkAndRestoreWidth(windowId, originalWidth, restoreState, settings) {
  log(`nudge(${windowId}): width=${originalWidth} -> shrinking by ${settings.nudgePx}px`);
  chrome.windows.update(windowId, { width: originalWidth - settings.nudgePx }, () => {
    log(`nudge(${windowId}): shrink applied, restoring in ${settings.restoreDelayMs}ms`);
    setTimeout(() => {
      chrome.windows.update(windowId, { width: originalWidth }, () => {
        log(`nudge(${windowId}): width restored`);
        if (!restoreState) return;
        chrome.windows.update(windowId, { state: restoreState }, () => {
          log(`nudge(${windowId}): state restored to ${restoreState}`);
        });
      });
    }, settings.restoreDelayMs);
  });
}

function windowNudge(windowId, settings) {
  chrome.windows.get(windowId, {}, (win) => {
    if (!win) {
      log(`nudge(${windowId}): window not found`);
      return;
    }

    if (win.state === "normal") {
      log(`nudge(${windowId}): state=normal`);
      shrinkAndRestoreWidth(windowId, win.width, null, settings);
      return;
    }

    // A maximized/fullscreen window can't be resized directly. Dropping
    // to "normal" without pinning bounds lets Chromium snap back to
    // whatever smaller size the window had before it was maximized -
    // that jump (not the nudge itself) is what reads as violent, so
    // state and bounds are set together in one call. Restoring the real
    // `restoreState` afterwards is NOT cosmetic: leaving the window
    // stuck in "normal" made every following navigation take the plain
    // width-only path above instead of a full round trip through the
    // window manager - which is the part that actually forces Chromium
    // to relayout reliably. Confirmed by testing: dropping this step
    // broke the fix from the second navigation onward.
    const bounds = {
      state: "normal",
      left: Math.max(0, win.left),
      top: Math.max(0, win.top),
      width: win.width,
      height: win.height,
    };
    const restoreState = win.state;
    log(`nudge(${windowId}): state=${restoreState}, pinning bounds ${JSON.stringify(bounds)} in one call`);
    chrome.windows.update(windowId, bounds, () => {
      shrinkAndRestoreWidth(windowId, bounds.width, restoreState, settings);
    });
  });
}

chrome.devtools.network.onNavigated.addListener(() => {
  log("onNavigated fired");
  getSettings((settings) => {
    if (!settings.enabled) {
      log("onNavigated: disabled in options, skipping nudge");
      return;
    }
    chrome.tabs.get(chrome.devtools.inspectedWindow.tabId, (tab) => {
      if (!tab || !tab.windowId) {
        log("onNavigated: no tab or windowId, skipping nudge");
        return;
      }
      windowNudge(tab.windowId, settings);
    });
  });
});

log("devtools_page loaded");
