# Store listings

Everything the stores ask for, to fill a listing by copy and paste. The package is the zip of
`./build.sh`: `devtools-resize-fix-X.Y.Z.zip`, for Chrome, Edge and Opera. It is also attached to each
GitHub release.

The limits of the forms change: check them when you submit.

## Texts

**Name**

```
DevTools Resize Fix
```

**Short description** (the manifest `description`, 117 characters)

```
Fixes the Chromium bug where docked DevTools breaks page layout after reload. Active only while DevTools is open.
```

**Long description**

```
DevTools Resize Fix removes a long-standing Chromium annoyance: when DevTools is docked and you reload the inspected page, the layout sometimes does not reflow to the right size. Content slides or gets clipped under the docked panel until the window is resized.

What it does
- Runs only while DevTools is open on a tab, and only on that tab's window.
- On each navigation of the inspected tab, it shrinks the browser window by a few pixels and restores it right after. That is enough to make Chromium recompute the layout.
- Works with DevTools docked at the bottom, on the side or on the right.
- The nudge size and the restore delay can be changed on the options page, and the fix can be turned off without removing the extension.
- A debug page shows what the extension does.

Privacy
- It never reads or changes the content of a page, and asks for no access to websites.
- It collects nothing and sends nothing anywhere. No analytics, no tracker, no remote code.
- Only your options and a short local debug log are kept, in your browser.
- Open source (MIT).

Note: a maximized window flickers briefly, because it has to leave the maximized state for the nudge.
```

**Search terms** (Edge asks for a few)

```
devtools, resize, layout, reload, viewport, docked
```

## Fields

| Field | Value |
|---|---|
| Category (Chrome, Edge, Opera) | Developer Tools |
| Language | English |
| Homepage | https://github.com/Stanislas-Poisson/devtools-resize-fix |
| Support | https://github.com/Stanislas-Poisson/devtools-resize-fix/issues |
| Privacy policy | https://github.com/Stanislas-Poisson/devtools-resize-fix/blob/main/PRIVACY.md |
| License | MIT |
| Price | Free |
| Data collected | None |
| Remote code | No |

## Chrome Web Store: privacy tab

**Single purpose**

```
Fix the layout of a page that does not resize correctly under docked DevTools after a reload.
```

**Permission justifications**

```
tabs: finds the browser window that owns the tab inspected in DevTools, so that this window is the one resized. No URL, title or content of a tab is read or stored.
windows: shrinks the width of that window by a few pixels and restores it, which forces the browser to recompute the layout.
storage: keeps the options chosen by the user and a short local debug log.
Host permissions: none.
Remote code: none. All the code is in the package.
```

## Notes for the reviewers

```
The extension does nothing until DevTools is opened (F12) on a tab. Then, on each navigation of that tab, it resizes the window by a few pixels and back. To see it work: open any page, open DevTools, reload the page, then open chrome-extension://<extension-id>/debug.html: the log shows each navigation and each resize.
No build step: the submitted package is the source. Source and tests: https://github.com/Stanislas-Poisson/devtools-resize-fix
```

## Images

| Use | File | Size | Store |
|---|---|---|---|
| Icon | `icons/icon128.png` | 128x128 | all (also read from the manifest) |
| Screenshot 1 | `store-assets/screenshot.png` | 1280x800 | all |
| Screenshot 2 | `store-assets/screenshot_options.png` | 1280x800 | all |
| Screenshot 3 | `store-assets/screenshot_debug.png` | 1280x800 | all |
| Small promo tile | `store-assets/small_promo_tile.png` | 440x280 | Chrome, Edge (optional) |
| Marquee promo tile | `store-assets/marquee_promo.png` | 1400x560 | Chrome, Edge (optional) |

Edge also asks for a 300x300 logo: there is none yet, make one from the icon if you submit there.

## Stores

| Store | Package | Where to submit | Listing |
|---|---|---|---|
| Chrome Web Store | Chromium zip | https://chrome.google.com/webstore/devconsole | https://chromewebstore.google.com/detail/devtools-resize-fix/dcpnklkeicghdphjbcbaccemjofdagli |
| Microsoft Edge Add-ons | Chromium zip | https://partner.microsoft.com/dashboard/microsoftedge/overview | Not planned: the bug was not seen in Edge |
| Opera add-ons | Chromium zip | https://addons.opera.com/developer/ | Not planned yet (the bug was seen in Opera GX) |
| Firefox Add-ons (AMO) | None | https://addons.mozilla.org/developers/addon/submit/distribution | Not planned: the bug was not seen in Firefox, there is no Firefox package |

Chrome Web Store: new item, then upload the zip. Edge: Partner Center, Microsoft Edge program, **Create new extension**. Opera: sign in, **Upload new add-on**.

Brave, Vivaldi and Arc install the Chrome Web Store listing. Safari needs a Mac and an Apple developer account: not planned.

## Before each submission

1. The `ci` check is green on `main`, and the GitHub release of the version is published.
2. The version of `manifest.json` and the top of `CHANGELOG.md` match.
3. Upload the zip of the release, never a local build.
