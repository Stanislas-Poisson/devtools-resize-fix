# Contributing to DevTools Resize Fix

Thank you for contributing! This project is a Chrome/Chromium extension (Manifest V3) designed to automatically fix the viewport resize layout bug when DevTools is docked.

## Git Workflow

- **Base Branch:** Always create your branches off of and target `develop` for your pull requests.
- **Branch Naming:** One branch per issue, for example `feature/#12-short-name`.
- **Commit Format:** Use the format `type(scope): #ticket subject`:
  - Example: `docs(community): #2 add community documentation files`

## Local Development & Setup

### 1. Build & Icon Setup
Icons are generated using Python and Pillow:
```sh
python3 icons/generate.py