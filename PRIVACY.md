# Privacy Policy — DevTools Resize Fix

Last updated: 2026-07-08

**DevTools Resize Fix does not collect, store, transmit, or share any user
data of any kind.**

## What the extension does

While DevTools is open on a tab, it listens for that tab's navigation
events (`chrome.devtools.network.onNavigated`) and briefly resizes the
browser window (`chrome.windows`) to force Chromium to correct a known
layout bug (page content not reflowing correctly under a docked DevTools
panel after a reload).

## What it does not do

- It does not read, modify, or store the content of any web page.
- It requests no host permissions — it cannot access page content on any
  site.
- It does not use analytics, trackers, or remote code of any kind.
- It does not transmit any information anywhere. All logic runs locally,
  entirely within your browser.

## Permissions used

- **`tabs`** — to identify the browser window that owns the tab currently
  being inspected in DevTools, so the correct window can be resized. No
  tab URL, title, or page content is read or stored.
- **`windows`** — to perform the resize itself.

## Source code

The full source is public and MIT-licensed:
https://github.com/Stanislas-Poisson/devtools-resize-fix

## Contact

Questions or concerns: open an issue at
https://github.com/Stanislas-Poisson/devtools-resize-fix/issues
