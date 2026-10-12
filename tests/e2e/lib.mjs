// Helpers of the end-to-end tests: the package under test, the local page and the browsers.
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Browser, Builder } from 'selenium-webdriver';
import chrome from 'selenium-webdriver/chrome.js';
import edge from 'selenium-webdriver/edge.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Waits until check() returns something truthy, and returns it.
export async function waitFor(check, { timeout = 60_000, interval = 250, message = 'condition' } = {}) {
  const end = Date.now() + timeout;
  let last;
  while (Date.now() < end) {
    try {
      last = await check();
      if (last) return last;
    } catch (error) {
      last = error;
    }
    await sleep(interval);
  }
  throw new Error(`Timed out waiting for ${message}${last instanceof Error ? ` (${last.message})` : ''}`);
}

// ---------------------------------------------------------------------------------------------
// Package
// ---------------------------------------------------------------------------------------------

// The zip built by build.sh, which is the package that goes to the stores.
export function zip() {
  const version = JSON.parse(fs.readFileSync(path.join(root, 'manifest.json'), 'utf8')).version;
  const file = path.join(root, 'dist', `devtools-resize-fix-${version}.zip`);
  if (!fs.existsSync(file)) {
    execFileSync('bash', [path.join(root, 'build.sh')], { stdio: 'inherit' });
  }
  return file;
}

// Unzips the package in a temporary folder, for --load-extension.
export function unpack(file) {
  const dir = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'drf-ext-')));
  execFileSync('unzip', ['-q', file, '-d', dir]);
  return dir;
}

// ---------------------------------------------------------------------------------------------
// Local page
// ---------------------------------------------------------------------------------------------

// A plain page to inspect: the extension works on any page, it asks for no host permission.
export async function startPageServer() {
  const server = http.createServer((req, res) => {
    res.writeHead(200, { 'content-type': 'text/html' }).end(`<!doctype html><title>Inspected page</title><p id="n">${req.url}</p>`);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    url: (name) => `http://localhost:${port}/${name}`,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

// ---------------------------------------------------------------------------------------------
// Browsers
// ---------------------------------------------------------------------------------------------

// The id Chromium gives to an unpacked extension: the hash of its path, written with the letters a-p.
function chromiumId(dir) {
  const hash = crypto.createHash('sha256').update(dir).digest('hex').slice(0, 32);
  return [...hash].map((char) => String.fromCharCode('a'.charCodeAt(0) + parseInt(char, 16))).join('');
}

// DevTools only opens in a browser with a window, so the tests run under a virtual screen (xvfb-run),
// not in headless mode. chromedriver starts the browser with --disable-extensions by default:
// excludeSwitches removes it.
const CHROMIUM_ARGS = (dir) => [
  '--no-sandbox',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-sync',
  '--window-size=1200,800',
  // DevTools opens by itself, docked, on each new tab.
  '--auto-open-devtools-for-tabs',
  `--load-extension=${dir}`,
  // Recent Chrome and Edge ignore --load-extension unless this feature is disabled.
  '--disable-features=DisableLoadExtensionCommandLineSwitch',
];

async function launchOnce(browser, dir) {
  const builder = new Builder();
  if (browser === 'edge') {
    const options = new edge.Options().addArguments(...CHROMIUM_ARGS(dir)).excludeSwitches('disable-extensions');
    // Selenium Manager downloads its own build, as it does on a machine without Edge.
    options.setBrowserVersion('stable');
    builder.forBrowser(Browser.EDGE).setEdgeOptions(options);
  } else {
    const options = new chrome.Options().addArguments(...CHROMIUM_ARGS(dir)).excludeSwitches('disable-extensions');
    if (process.env.BROWSER_BINARY) {
      options.setChromeBinaryPath(process.env.BROWSER_BINARY);
    } else {
      // Chrome for Testing, downloaded by Selenium Manager: the Chrome of the runner ignores --load-extension.
      options.setBrowserVersion('stable');
    }
    builder.forBrowser(Browser.CHROME).setChromeOptions(options);
  }
  const driver = await builder.build();
  await driver.manage().setTimeouts({ pageLoad: 30_000, script: 30_000 });
  return { driver, base: `chrome-extension://${chromiumId(dir)}/` };
}

// A browser sometimes does not start on a busy runner: each attempt has a time limit and a new one follows.
export async function launch(browser, dir, { attempts = 3, timeout = 90_000 } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    console.log(`[e2e] starting ${browser} (attempt ${attempt}/${attempts})`);
    const started = launchOnce(browser, dir);
    let timer;
    try {
      const result = await Promise.race([
        started,
        new Promise((_, reject) => { timer = setTimeout(() => reject(new Error(`${browser} did not start in ${timeout / 1000}s`)), timeout); }),
      ]);
      console.log(`[e2e] ${browser} started`);
      return result;
    } catch (error) {
      // A browser that starts late is closed.
      started.then(({ driver }) => driver.quit()).catch(() => {});
      console.log(`[e2e] ${error.message}`);
      if (attempt >= attempts) throw error;
    } finally {
      clearTimeout(timer);
    }
  }
}
