# Contributing to DevTools Resize Fix

Thank you for contributing! This project is a Chrome/Chromium extension (Manifest V3) designed to automatically fix the viewport resize layout bug when DevTools is docked.

## Git Workflow

- **Base Branch:** Always create your branches off of and target `develop` for your pull requests.
- **Branch Naming:** One branch per issue, for example `feature/#12-short-name`.
- **Commit Format:** Use the format `type(scope): #ticket subject`:
  - Example: `docs(community): #2 add community documentation files`

## Try your change

1. Open `chrome://extensions` and enable **Developer mode**.
2. Click **Load unpacked** and select the repository folder.
3. After each edit, click the reload button of the extension.
4. Open `debug.html` from the extension to read the log.

## Build the package

```sh
./build.sh
```

The zip is written in `dist/`, named after the version in `manifest.json`.

## Icons

The icons are generated with Python and Pillow. Run this only if you change the design:

```sh
python3 icons/generate.py
```