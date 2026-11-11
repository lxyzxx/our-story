import { chromium } from '@playwright/test';
import fs from 'node:fs';
const directory = 'docs/screenshots/phase4';
fs.mkdirSync(directory, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE });
const errors = [];
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
  page.on('pageerror', (error) => errors.push({ name, error: error.message }));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push({ name, error: message.text() });
  });
  page.on('response', (response) => {
    if (response.status() >= 400)
      errors.push({ name, status: response.status(), url: response.url() });
  });
  await page.goto(process.env.PREMIERE_BASE_URL || 'http://localhost:3001');
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${directory}/${name}-premiere.png`, fullPage: true });
  console.log(
    name,
    await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      height: document.documentElement.scrollHeight,
    })),
  );
  await context.close();
}
fs.writeFileSync(`${directory}/premiere-browser-errors.json`, JSON.stringify(errors, null, 2));
await browser.close();
if (errors.length) process.exitCode = 1;
