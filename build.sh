#!/usr/bin/env bash
# Packages the extension into dist/devtools-resize-fix-vX.Y.Z.zip,
# ready for Chrome Web Store upload or manual "Load unpacked" sideload.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")"

version=$(python3 -c "import json; print(json.load(open('manifest.json'))['version'])")
out_dir="dist"
out_zip="${out_dir}/devtools-resize-fix-v${version}.zip"

mkdir -p "$out_dir"
rm -f "$out_zip"

zip -r "$out_zip" \
  manifest.json \
  devtools.html \
  devtools.js \
  icons/icon16.png \
  icons/icon48.png \
  icons/icon128.png \
  LICENSE \
  -x '.*'

echo "built ${out_zip}"
