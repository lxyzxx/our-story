import { chromium } from '@playwright/test';
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_EXECUTABLE });
for (const [name, viewport] of [
  ['desktop', { width: 1440, height: 1000 }],
  ['landscape', { width: 844, height: 390 }],
  ['mobile', { width: 390, height: 844 }],
]) {
  const context = await browser.newContext({ viewport, reducedMotion: 'reduce' });
  const page = await context.newPage();
  await page.route('**/audio/*-test.wav', (route) => route.fulfill({ status: 204 }));
  await page.addInitScript(() =>
    localStorage.setItem('our-story:progress:v1', JSON.stringify({ completed: ['beginning'] })),
  );
  await page.goto(process.env.FINALE_FIXTURE_URL || 'http://localhost:3003');
  await page.getByRole('button', { name: '重读生日信' }).click();
  await page.getByRole('heading', { name: 'Happy birthday.', exact: true }).waitFor();
  await page.screenshot({ path: `docs/screenshots/phase4/${name}-long-letter.png` });
  await page.locator('.birthday-letter-text').evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await page.locator('.birthday-finale').evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await page.screenshot({ path: `docs/screenshots/phase4/${name}-long-letter-end.png` });
  const action = page.getByRole('button', { name: '看看片尾字幕' });
  await action.hover();
  await action.focus();
  await page.screenshot({ path: `docs/screenshots/phase4/${name}-letter-action-focus-hover.png` });
  console.log(
    name,
    'paper action color',
    await action.evaluate((el) => getComputedStyle(el).color),
  );
  await context.close();
}
await browser.close();
