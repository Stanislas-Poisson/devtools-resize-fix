# Privacy Policy - DevTools Resize Fix

Last updated: 2026-07-09

**DevTools Resize Fix does not collect, transmit, or share any user data of
any kind.** It stores a small amount of technical diagnostic data, but only
locally in your own browser - see below.

## What the extension does

While DevTools is open on a tab, it listens for that tab's navigation
events (`chrome.devtools.network.onNavigated`) and briefly resizes the
browser window (`chrome.windows`) to force Chromium to correct a known
layout bug (page content not reflowing correctly under a docked DevTools
panel after a reload).

## What it does not do

- It does not read, modify, or store the content of any web page.
- It requests no host permissions - it cannot access page content on any
  site.
- It does not use analytics, trackers, or remote code of any kind.
- It does not transmit any information anywhere. All logic runs locally,
  entirely within your browser.

## What it stores locally

Two things live in `chrome.storage.local` (never synced, never
transmitted, cleared if you remove the extension):

- **Settings** - the nudge size (px) and restore delay (ms) you set on
  the options page, plus whether the fix is enabled.
- **Debug log** - a rolling log (last 100 entries) of the extension's own
  operations: window IDs, dimensions, and timing of each resize cycle.
  No page URL, title, or content is ever included. This log exists
  because `devtools_page` scripts have no console reachable through
  normal DevTools inspection; it's visible at
  `chrome-extension://<extension-id>/debug.html`, a plain page you have
  to navigate to on purpose - nothing is shown automatically.

## Permissions used

- **`tabs`** - to identify the browser window that owns the tab currently
  being inspected in DevTools, so the correct window can be resized. No
  tab URL, title, or page content is read or stored.
- **`windows`** - to perform the resize itself.
- **`storage`** - to save your options and the local debug log described
  above.

## Source code

The full source is public and MIT-licensed:
https://github.com/Stanislas-Poisson/devtools-resize-fix

## Contact

Questions or concerns: open an issue at
https://github.com/Stanislas-Poisson/devtools-resize-fix/issues
