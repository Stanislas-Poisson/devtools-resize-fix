# DevTools Resize Fix

A tiny Chrome/Chromium extension that fixes an annoying, long-standing
Chromium bug: when DevTools is docked (bottom, side, or right) and you
reload the inspected page, the page's layout sometimes fails to reflow
to the correct viewport size. Content visually slides or gets clipped
under the docked panel until something forces an actual window resize.

This extension forces that resize automatically, invisibly, every time
the inspected tab navigates — so you never have to manually drag the
window or toggle DevTools off and on again to "unstick" the layout.

## How it works

The extension only runs while DevTools is actually open on a tab (via
Chrome's `devtools_page` API — it is not a background script watching
every tab). On every navigation of the inspected tab, it nudges the
browser window's width by 2px and back within ~60ms. That's enough to
force Chromium to recompute layout; the nudge itself is imperceptible.

If the window is maximized, it can't be resized directly, so the
extension briefly restores it to `normal` and re-maximizes it instead.
This is more noticeable than the 2px nudge — if you mostly work with a
maximized browser and find the flicker annoying, that's the one known
rough edge (see [Limitations](#limitations)).

No `host_permissions` are requested: the extension never reads or
touches page content on any site, so it works everywhere, and Chrome
doesn't need to warn you about "reading your data on all websites".

## Install

### From the Chrome Web Store

*(link once published)*

### Manually, from a release zip

1. Download the latest `devtools-resize-fix-vX.Y.Z.zip` from the
   [Releases](../../releases) page and unzip it somewhere permanent.
2. Go to `chrome://extensions`.
3. Enable **Developer mode** (top right).
4. Click **Load unpacked** and select the unzipped folder.

### From source

```sh
git clone https://github.com/<your-username>/devtools-resize-fix.git
```

Then follow the "Load unpacked" steps above, pointing at the cloned
folder.

## Limitations

- Maximized windows flicker through a restore/maximize cycle instead of
  a subtle 2px nudge (see [How it works](#how-it-works)).
- The fix runs on every navigation while DevTools is open, whether
  DevTools is actually docked or undocked (floating in its own window).
  When undocked, the nudge is harmless but unnecessary — there is no
  public Chrome API to detect dock state from an extension.
- Only verified on Chromium-based browsers (Chrome, Edge, Brave, ...).
  Not currently packaged for Firefox — the equivalent bug hasn't been
  confirmed there; open an issue if you can reproduce it.

## Rebuilding the icons

Icons are generated deterministically with Pillow, no external assets:

```sh
python3 icons/generate.py
```

## License

MIT — see [LICENSE](LICENSE).
