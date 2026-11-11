import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { chromium, expect } from '@playwright/test';
const base = (process.env.VERIFY_BASE_URL || 'http://localhost:3020/our-story').replace(/\/$/, '');
const preview = process.env.VERIFY_PREVIEW_URL?.replace(/\/$/, '');
const directory = process.env.VERIFY_CAPTURE_DIR || 'docs/screenshots/deployment-local';
await fs.mkdir(directory, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE });
const errors = [];
const checks = [];
let passed = false;
function observe(page, prefix) {
  page.on('pageerror', (error) => errors.push({ prefix, error: error.message }));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push({ prefix, error: message.text() });
  });
  page.on('response', (response) => {
    if (response.status() >= 400)
      errors.push({ prefix, status: response.status(), url: response.url() });
  });
  page.on('requestfailed', (request) => {
    if (request.failure()?.errorText !== 'net::ERR_ABORTED')
      errors.push({ prefix, url: request.url(), error: request.failure()?.errorText });
  });
  page.on('request', (request) => {
    const target = new URL(request.url());
    const own = new URL(prefix);
    if (target.origin === own.origin && !target.pathname.startsWith(own.pathname))
      errors.push({ prefix, error: 'Request escaped deployment basePath', url: request.url() });
  });
}
function tone() {
  const b = Buffer.alloc(44 + 22050 * 2);
  b.write('RIFF');
  b.writeUInt32LE(b.length - 8, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(22050, 24);
  b.writeUInt32LE(44100, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(44100, 40);
  return b;
}
try {
  for (const [name, viewport, mobile] of [
    ['desktop', { width: 1440, height: 1000 }, false],
    ['landscape', { width: 844, height: 390 }, true],
    ['mobile', { width: 390, height: 844 }, true],
  ]) {
    const context = await browser.newContext({
      viewport,
      isMobile: mobile,
      hasTouch: mobile,
      deviceScaleFactor: 1,
    });
    const page = await context.newPage();
    observe(page, base);
    const response = await page.goto(base);
    assert.equal(response.status(), 200);
    assert.match(response.headers()['cache-control'], /no-store/);
    const html = await response.text();
    assert(!html.includes('The Beginning'), 'Premiere HTML must not send chapter titles');
    const stateResponse = await context.request.get(`${base}/api/premiere`);
    const state = await stateResponse.json();
    assert.equal(state.status, 'locked');
    assert.equal(state.preview, false);
    assert.equal(state.opensAt, '2027-02-07T00:00:00+08:00');
    assert.match(stateResponse.headers()['cache-control'], /no-store/);
    await expect(page.getByRole('button', { name: '首映尚未开始' })).toBeDisabled();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1200);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    assert(
      (await page.locator('html').getAttribute('style')).includes(
        `${new URL(base).pathname}/images/grain.png`,
      ),
    );
    await page.screenshot({ path: `${directory}/${name}-premiere.png` });
    checks.push(`${name}: gated HTML, API, no-cache, resources and layout`);
    await context.close();
    if (!preview) continue;
    const film = await browser.newContext({
      viewport,
      isMobile: mobile,
      hasTouch: mobile,
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
    });
    await film.addInitScript(() =>
      localStorage.setItem(
        'our-story:progress:v1',
        JSON.stringify({ completed: ['beginning', 'adventures', 'moments', 'continued'] }),
      ),
    );
    await film.addInitScript(() => {
      const NativeAudio = window.Audio;
      window.Audio = function (...args) {
        const audio = new NativeAudio(...args);
        window.__deploymentAudio = audio;
        return audio;
      };
    });
    const screen = await film.newPage();
    await screen.route('**/our-story/audio/deployment-test.wav', (route) =>
      route.fulfill({ contentType: 'audio/wav', body: tone() }),
    );
    observe(screen, preview);
    await screen.goto(preview);
    await screen.getByRole('button', { name: 'BEGIN OUR STORY' }).click();
    await screen.locator('.roll-button').first().waitFor();
    await screen.waitForTimeout(350);
    await screen.screenshot({ path: `${directory}/${name}-workbench.png` });
    const roll = screen.getByRole('button', { name: /展开胶卷 01/ });
    await roll.click();
    if (mobile) await roll.click();
    await expect(screen.locator('.unroll-scene')).toHaveAttribute('data-ready', 'true');
    await screen.getByRole('button', { name: '开始放映', exact: true }).click();
    const photo = screen.locator('.screening-image img');
    await expect(photo).toBeVisible();
    await expect
      .poll(() => photo.evaluate((img) => img.complete && img.naturalWidth > 0))
      .toBe(true);
    assert((await photo.getAttribute('src')).includes('/our-story/'));
    await screen.getByRole('button', { name: '音乐设置' }).click();
    await expect(screen.getByText('音量只影响背景音乐。')).toBeVisible();
    await expect
      .poll(() => screen.evaluate(() => window.__deploymentAudio?.src))
      .toContain(`${new URL(preview).pathname}/audio/deployment-test.wav`);
    await expect.poll(() => screen.evaluate(() => window.__deploymentAudio?.paused)).toBe(false);
    const audioTime = await screen.evaluate(() => window.__deploymentAudio.currentTime);
    await expect
      .poll(() => screen.evaluate(() => window.__deploymentAudio.currentTime))
      .not.toBe(audioTime);
    await screen.screenshot({ path: `${directory}/${name}-music-panel.png` });
    await screen.getByRole('button', { name: '关闭音乐设置' }).click();
    await screen.screenshot({ path: `${directory}/${name}-player.png` });
    await screen.getByRole('button', { name: '返回工作台', exact: true }).click();
    await screen.getByRole('button', { name: '重读生日信' }).click();
    await expect(screen.locator('.birthday-finale')).toHaveAttribute('data-stage', 'letter');
    await expect(
      screen.getByText('子路径部署排版测试。这里只验证资源路径与阅读，不是真实私人信件。'),
    ).toBeVisible();
    await screen.screenshot({ path: `${directory}/${name}-letter.png` });
    checks.push(`${name}: prefixed images, native audio, player and external JSON letter`);
    await film.close();
  }
  assert.deepEqual(errors, []);
  passed = true;
} finally {
  await fs.writeFile(
    `${directory}/verification.json`,
    JSON.stringify({ passed, base, preview, checks, errors }, null, 2) + '\n',
  );
  await browser.close();
}
console.log(JSON.stringify({ checks, errors }, null, 2));
