// End-to-end tests: the built package is loaded in a real browser, with DevTools open on a page.
//
//   xvfb-run -a env BROWSER=chrome|edge npm test      (default: chrome)
//
// 1. install: the package as it goes to the store loads, and its pages work.
// 2. devtools page: the code runs when DevTools opens, it nudges the window on each navigation, and it
//    stops when the fix is disabled in the options.
//
// The layout bug itself is not tested: it does not show up in a browser on a virtual screen.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { after, before, describe, test } from 'node:test';

import { By } from 'selenium-webdriver';

import { launch, sleep, startPageServer, unpack, waitFor, zip } from './lib.mjs';

const browser = process.env.BROWSER || 'chrome';

describe(`extension in ${browser}`, { timeout: 300_000 }, () => {
  let driver;
  let base;
  let pages;
  let inspectedTab;
  let extensionTab;

  // The helpers read and write chrome.storage.local from an extension page, so they run in extensionTab.
  const storageGet = async () => {
    await driver.switchTo().window(extensionTab);
    return driver.executeAsyncScript(`
      const done = arguments[arguments.length - 1];
      chrome.storage.local.get(null, done);
    `);
  };
  const storageSet = async (values) => {
    await driver.switchTo().window(extensionTab);
    return driver.executeAsyncScript(`
      const done = arguments[arguments.length - 1];
      chrome.storage.local.set(arguments[0], () => done(true));
    `, values);
  };
  // The log entries written after a moment, as text.
  const logSince = async (since) => ((await storageGet()).debugLog || []).filter((entry) => entry.ts > since).map((entry) => entry.msg);
  // Waits until the extension has written nothing for a moment: the nudges of the previous navigations are over.
  const waitForQuiet = (quiet = 1000) => waitFor(async () => {
    const log = (await storageGet()).debugLog || [];
    return log.length > 0 && Date.now() - log[log.length - 1].ts > quiet;
  }, { message: 'the log to be quiet' });
  // Navigates the inspected tab, with DevTools open on it.
  const navigateInspected = async (name) => {
    await driver.switchTo().window(inspectedTab);
    await driver.get(pages.url(name));
  };

  before(async () => {
    pages = await startPageServer();
    ({ driver, base } = await launch(browser, unpack(zip())));

    // DevTools opens by itself on this tab: the devtools page of the extension is loaded with it.
    inspectedTab = await driver.getWindowHandle();
    await driver.get(pages.url('first'));

    await driver.switchTo().newWindow('tab');
    extensionTab = await driver.getWindowHandle();
    await driver.get(`${base}options.html`);
  });
  after(async () => {
    await driver?.quit();
    await pages?.close();
  });

  describe('install', () => {
    test('the options page loads with the default settings', async () => {
      await driver.switchTo().window(extensionTab);
      await driver.get(`${base}options.html`);
      await waitFor(async () => (await driver.findElement(By.id('nudgePx')).getAttribute('value')) === '3', { message: 'the default nudge size' });

      assert.equal(await driver.findElement(By.id('restoreDelayMs')).getAttribute('value'), '150');
      assert.equal(await driver.findElement(By.id('enabled')).isSelected(), true);
    });

    test('the options page saves and resets the settings', async () => {
      await driver.switchTo().window(extensionTab);
      await driver.get(`${base}options.html`);
      await waitFor(async () => (await driver.findElement(By.id('nudgePx')).getAttribute('value')) === '3', { message: 'the options page' });

      const nudge = await driver.findElement(By.id('nudgePx'));
      await nudge.clear();
      await nudge.sendKeys('5');
      await driver.findElement(By.id('save')).click();
      await waitFor(async () => (await storageGet()).nudgePx === 5, { message: 'the saved settings' });

      await driver.switchTo().window(extensionTab);
      await driver.findElement(By.id('reset')).click();
      await waitFor(async () => (await storageGet()).nudgePx === 3, { message: 'the reset settings' });
    });
    test('the options and debug pages show the version and the links', async () => {
      const { version } = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, '../../manifest.json'), 'utf8'));

      for (const page of ['options.html', 'debug.html']) {
        await driver.switchTo().window(extensionTab);
        await driver.get(`${base}${page}`);
        await waitFor(async () => (await driver.findElement(By.id('version')).getText()) === `v${version}`, { message: `the version on ${page}` });

        const links = await driver.findElements(By.css('footer .links a'));
        const hrefs = await Promise.all(links.map((link) => link.getAttribute('href')));
        assert.deepEqual(hrefs, [
          'https://github.com/Stanislas-Poisson/devtools-resize-fix',
          'https://github.com/Stanislas-Poisson/devtools-resize-fix/issues',
          'https://github.com/Stanislas-Poisson/devtools-resize-fix/blob/main/PRIVACY.md',
        ]);
      }
    });
  });

  describe('devtools page', () => {
    test('the code runs when DevTools opens on the inspected tab', async () => {
      const messages = await waitFor(async () => {
        const log = await logSince(0);
        return log.includes('devtools_page loaded') && log;
      }, { message: 'the devtools page to start' });

      assert.ok(messages.includes('devtools_page loaded'));
    });

    test('each navigation of the inspected tab nudges the window and restores it', async () => {
      const since = Date.now();
      await navigateInspected('second');

      const messages = await waitFor(async () => {
        const log = await logSince(since);
        return log.some((msg) => msg.endsWith('width restored')) && log;
      }, { message: 'the window to be nudged and restored' });

      assert.ok(messages.includes('onNavigated fired'));
      assert.ok(messages.some((msg) => /^nudge\(\d+\): width=\d+ -> shrinking by 3px$/.test(msg)), messages.join('\n'));
      assert.ok(messages.some((msg) => msg.endsWith('restoring in 150ms')));
    });

    test('the debug page shows the log of the extension', async () => {
      await driver.switchTo().window(extensionTab);
      await driver.get(`${base}debug.html`);
      await waitFor(async () => (await driver.findElement(By.id('log')).getText()).includes('onNavigated fired'), { message: 'the log on the debug page' });

      assert.equal((await driver.findElement(By.id('statusText')).getText()).trim(), 'fix enabled');
    });

    test('a navigation does not nudge the window when the fix is disabled', async () => {
      await driver.switchTo().window(extensionTab);
      await driver.get(`${base}options.html`);
      await storageSet({ enabled: false });
      await waitForQuiet();

      const since = Date.now();
      await navigateInspected('third');

      const messages = await waitFor(async () => {
        const log = await logSince(since);
        return log.includes('onNavigated: disabled in options, skipping nudge') && log;
      }, { message: 'the navigation to be skipped' });

      // A nudge that would still happen starts at once and shows up within the restore delay.
      await sleep(1000);
      const all = await logSince(since);
      assert.ok(!all.some((msg) => msg.includes('shrinking by')), all.join('\n'));
      assert.ok(messages.includes('onNavigated fired'));

      await storageSet({ enabled: true });
    });
  });
});
