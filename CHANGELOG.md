# Changelog

## 1.1.0 - 2026-07-09

- Fix: maximized/fullscreen windows now keep their bounds pinned to the
  screen while dropping to `"normal"` state for the nudge, instead of
  letting Chromium snap back to the smaller pre-maximize size and jump
  back - that jump, not the nudge itself, was the "violent" resize
  reported in production. `NUDGE_PX` lowered from 2 to 1 on top of that.
- Debug logging added (`chrome.storage.local` + a plain `debug.html`
  page, reachable at `chrome-extension://<id>/debug.html`): `devtools_page`
  has no console reachable through normal DevTools inspection (Chromium
  exposes it only nested inside `devtools_app.html`, not as its own
  target), so there was no way to see what the script was actually doing
  in production.
- **Tried and reverted**: an in-page `document.documentElement.style.zoom`
  toggle via `chrome.devtools.inspectedWindow.eval()`, as a lighter
  alternative to resizing the browser window. Confirmed working
  mechanically (including at a deliberately aggressive 75%) but does
  **not** fix the underlying bug even at that scale - `style.zoom` only
  triggers a CSS-level layout recompute inside the existing render
  viewport, it doesn't touch the render widget's actual viewport size,
  which is what the Chromium bug leaves stale. Don't retry this specific
  approach without a different mechanism for forcing a real viewport
  resize.
- Fix: `log()` was a read-modify-write on `chrome.storage.local`
  (`get` then `set`) - two calls fired close together (the normal case
  here) could race, with the later `set()` silently overwriting the
  earlier entry before it landed. Calls are now chained through a
  promise queue so nothing gets dropped.
- Fix: after a maximized-window nudge, the window was left in `"normal"`
  state for real (not just visually). Every following navigation then
  took the plain width-only nudge path instead of a full round trip
  through the window manager - which turned out to be the part actually
  forcing Chromium to relayout reliably. The final state restore is back.
- Defaults changed from `NUDGE_PX=2`/`RESTORE_DELAY_MS=60` to
  `nudgePx=3`/`restoreDelayMs=150`, based on empirical testing: 1-2px
  and/or 60ms were not reliably enough to trigger the relayout on a
  `normal`-state window either, independent of the maximized-window
  issue above.
- Added an options page (`options.html`, `chrome.storage.local`-backed):
  `enabled`, `nudgePx`, `restoreDelayMs` are now user-configurable
  instead of hardcoded, since the right values are machine/OS-dependent
  (closes the "Options page" idea below).

## 1.0.1 - 2026-07-08

- Fix: `manifest.json` `description` was 151 characters, over Chrome's
  132-character hard limit - rejected at Chrome Web Store upload
  ("Le champ description... trop long"). Shortened to 113 characters.

## 1.0.0 - 2026-07-08

- Rewritten around `devtools_page` instead of a `webNavigation`
  background listener: the fix now runs only while DevTools is open on
  a tab, and works on any site (no `host_permissions` needed).
- Proper packaging: manifest metadata (name, description, version),
  generated icons, README, MIT license.

## Unreleased ideas

- Firefox build, if the underlying bug is confirmed to reproduce there.
