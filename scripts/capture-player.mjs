import { chromium } from '@playwright/test';
import fs from 'node:fs';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE });
const errors = [];
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
  await page.goto(process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3001');
  await page.getByRole('button', { name: 'BEGIN OUR STORY' }).click();
  await page.locator('.roll-button').first().waitFor();
  await page.waitForTimeout(1600);
  const first = page.getByRole('button', { name: /展开胶卷 01/ });
  await first.click();
  if (touch) await first.click();
  await page.locator('[data-ready="true"]').waitFor();
  await page.getByRole('button', { name: '开始放映', exact: true }).click();
  await page.locator('.screening[data-playing="true"]').waitFor();
  await page.getByRole('button', { name: '暂停放映' }).click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `docs/screenshots/phase3/${name}-player.png` });
  await page.getByRole('button', { name: '阅读完整故事' }).click();
  await page.waitForTimeout(600);
  await page.screenshot({ path: `docs/screenshots/phase3/${name}-story.png` });
  await page.getByRole('button', { name: '收起故事', exact: true }).first().click();
  await page.getByRole('button', { name: '下一张照片', exact: true }).click();
  await page.getByRole('button', { name: '下一张照片', exact: true }).click();
  await page.waitForTimeout(700);
  await page.screenshot({ path: `docs/screenshots/phase3/${name}-portrait-photo.png` });
  await page.getByRole('button', { name: '结束本章' }).click();
  await page.waitForTimeout(1100);
  await page.screenshot({ path: `docs/screenshots/phase3/${name}-chapter-end.png` });
  await context.close();
  console.log(name, 'captured');
}
fs.writeFileSync('docs/screenshots/phase3/browser-errors.json', JSON.stringify(errors, null, 2));
await browser.close();
if (errors.length) process.exitCode = 1;
