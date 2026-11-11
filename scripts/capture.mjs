import { chromium } from '@playwright/test';
import fs from 'node:fs';
const browser = await chromium.launch({
  headless: true,
  executablePath: process.env.CHROMIUM_EXECUTABLE || undefined,
});
const errors = [];
const directory = process.env.CAPTURE_DIR || 'docs/screenshots';
fs.mkdirSync(directory, { recursive: true });
for (const [name, viewport, touch] of [
  ['desktop', { width: 1440, height: 1000 }, false],
  ['landscape', { width: 844, height: 390 }, true],
  ['mobile', { width: 390, height: 844 }, true],
]) {
  const context = await browser.newContext({
    viewport,
    hasTouch: touch,
    isMobile: touch,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => errors.push({ name, error: e.message }));
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push({ name, error: m.text() });
  });
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push({ name, status: r.status(), url: r.url() });
  });
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${directory}/${name}-opening.png`, fullPage: true });
  await page.getByRole('button', { name: 'BEGIN OUR STORY' }).click();
  await page.waitForTimeout(2400);
  await page.screenshot({ path: `${directory}/${name}-workbench.png`, fullPage: true });
  const first = page.getByRole('button', { name: /展开胶卷 01/ });
  await first.click();
  if (touch) await first.click();
  await page.locator('.unroll-scene[data-ready="true"]').waitFor();
  await page.waitForTimeout(350);
  await page.screenshot({ path: `${directory}/${name}-unroll.png`, fullPage: false });
  console.log(
    name,
    await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      bodyHeight: document.body.scrollHeight,
      viewer: document.querySelector('.preview-viewer').getBoundingClientRect().toJSON(),
    })),
  );
  await context.close();
}
fs.writeFileSync(`${directory}/archive-browser-errors.json`, JSON.stringify(errors, null, 2));
await browser.close();
