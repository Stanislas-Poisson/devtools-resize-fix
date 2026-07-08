# Changelog

## 1.0.0 — 2026-07-08

- Rewritten around `devtools_page` instead of a `webNavigation`
  background listener: the fix now runs only while DevTools is open on
  a tab, and works on any site (no `host_permissions` needed).
- Proper packaging: manifest metadata (name, description, version),
  generated icons, README, MIT license.

## Unreleased ideas

- Options page to disable the extension or tweak the nudge delay.
- Investigate a lighter fix for maximized windows (the current
  restore/maximize cycle is more visible than the 2px nudge).
- Firefox build, if the underlying bug is confirmed to reproduce there.
