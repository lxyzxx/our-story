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
  await context.addInitScript(() =>
    localStorage.setItem(
      'our-story:progress:v1',
      JSON.stringify({ completed: ['beginning', 'adventures', 'moments'] }),
    ),
  );
  const page = await context.newPage();
  page.on('pageerror', (error) => errors.push({ name, error: error.message }));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push({ name, error: message.text() });
  });
  page.on('response', (response) => {
    if (response.status() >= 400)
      errors.push({ name, status: response.status(), url: response.url() });
  });
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3002');
  await page.getByRole('button', { name: 'BEGIN OUR STORY' }).click();
  await page.locator('.roll-button').first().waitFor();
  await page.waitForTimeout(1600);
  const roll = page.getByRole('button', { name: /展开胶卷 04/ });
  await roll.click();
  if (mobile) await roll.click();
  await page.locator('.unroll-scene[data-ready="true"]').waitFor();
  await page.getByRole('button', { name: '开始放映', exact: true }).click();
  await page.getByLabel('跳至照片').selectOption('2');
  await page.getByRole('button', { name: '结束本章' }).click();
  await page.getByRole('button', { name: '暂停终幕片头' }).click();
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${directory}/${name}-rewind.png` });
  await page.getByRole('button', { name: '继续终幕片头' }).click();
  await page.locator('.birthday-finale[data-beat="question"]').waitFor();
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${directory}/${name}-the-end.png` });
  await page.locator('.birthday-finale[data-beat="continued"]').waitFor();
  await page.waitForTimeout(650);
  await page.screenshot({ path: `${directory}/${name}-continued.png` });
  await page.locator('.birthday-finale[data-stage="letter"]').waitFor();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `${directory}/${name}-birthday-letter.png` });
  await page.getByRole('button', { name: '看看片尾字幕' }).click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${directory}/${name}-credits.png` });
  console.log(
    name,
    'finale captured',
    await page.evaluate(() => ({
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
    })),
  );
  await context.close();
}
fs.writeFileSync(`${directory}/finale-browser-errors.json`, JSON.stringify(errors, null, 2));
await browser.close();
if (errors.length) process.exitCode = 1;
