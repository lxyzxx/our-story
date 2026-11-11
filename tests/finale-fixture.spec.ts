import { test, expect, type Page } from '@playwright/test';
test.setTimeout(45000);
function tone() {
  const n = 22050;
  const b = Buffer.alloc(44 + n * 2);
  b.write('RIFF');
  b.writeUInt32LE(b.length - 8, 4);
  b.write('WAVEfmt ', 8);
  b.writeUInt32LE(16, 16);
  b.writeUInt16LE(1, 20);
  b.writeUInt16LE(1, 22);
  b.writeUInt32LE(n, 24);
  b.writeUInt32LE(n * 2, 28);
  b.writeUInt16LE(2, 32);
  b.writeUInt16LE(16, 34);
  b.write('data', 36);
  b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++)
    b.writeInt16LE(Math.round(Math.sin((i * 2 * Math.PI * 220) / n) * 1000), 44 + i * 2);
  return b;
}
async function finish(page: Page, failedFinale = false) {
  await page.route('**/audio/*-test.wav', (route) =>
    route.fulfill({ contentType: 'audio/wav', body: tone() }),
  );
  if (failedFinale)
    await page.route('**/audio/finale-test.wav', (route) =>
      route.fulfill({ status: 404, body: 'missing' }),
    );
  await page.goto('/');
  await page.getByRole('button', { name: 'BEGIN OUR STORY' }).click();
  await page.locator('.roll-button').first().waitFor();
  await page.waitForTimeout(1500);
  await page.getByRole('button', { name: /展开胶卷 01/ }).click();
  await expect(page.locator('.unroll-scene')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: '开始放映', exact: true }).click();
  await page.getByLabel('跳至照片').selectOption('1');
  await page.getByRole('button', { name: '结束本章' }).click();
}

test('长信与署名纯文本呈现，阅读不自动消失，移动可滚动完整内容', async ({ page }) => {
  await finish(page);
  await page.getByRole('button', { name: '跳过终幕片头' }).click();
  await expect(page.locator('.birthday-letter-prose p')).toHaveCount(12);
  await expect(page.getByText('排版测试署名', { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as typeof window & { __letterExecuted?: boolean }).__letterExecuted,
    ),
  ).toBeUndefined();
  expect(await page.locator('.birthday-letter-prose').innerText()).toContain(
    '<script>window.__letterExecuted=true</script>',
  );
  await page.setViewportSize({ width: 844, height: 390 });
  const area = page.getByRole('article', { name: 'A letter for you.' });
  expect(await area.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await area.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await expect(page.getByText('排版测试署名', { exact: true })).toBeInViewport();
  await page.waitForTimeout(6500);
  await expect(page.locator('.birthday-finale')).toHaveAttribute('data-stage', 'letter');
  await page.getByRole('button', { name: '看看片尾字幕' }).click();
  await expect(page.getByText('测试署名 · 非真实身份', { exact: true })).toBeVisible();
  await expect(page.getByText('测试主角甲 & 测试主角乙', { exact: true })).toBeVisible();
});

test('终幕音轨复用原生音频，静音音量跨信件片尾保留并返回档案音轨', async ({ page }) => {
  await page.addInitScript(() => {
    const Native = window.Audio;
    const state = window as typeof window & { __audio?: HTMLAudioElement; __audioCount?: number };
    state.__audioCount = 0;
    window.Audio = function (...args: ConstructorParameters<typeof Audio>) {
      const audio = new Native(...args);
      state.__audio = audio;
      state.__audioCount!++;
      return audio;
    } as unknown as typeof Audio;
  });
  await finish(page);
  await page.getByRole('button', { name: '音乐设置' }).click();
  await expect(page.locator('.birthday-finale')).toHaveAttribute('data-intro-paused', 'true');
  const beat = await page.locator('.birthday-finale').getAttribute('data-beat');
  await page.waitForTimeout(1000);
  await expect(page.locator('.birthday-finale')).toHaveAttribute('data-beat', beat!);
  await page.getByLabel('音乐音量').fill('0.2');
  await page.keyboard.press('Escape');
  await expect(page.locator('.birthday-finale')).toHaveCount(1);
  await page.getByRole('button', { name: '跳过终幕片头' }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as typeof window & { __audio: HTMLAudioElement }).__audio.src),
    )
    .toContain('/audio/finale-test.wav');
  await page.getByRole('button', { name: '静音', exact: true }).click();
  await page.getByRole('button', { name: '看看片尾字幕' }).click();
  expect(
    await page.evaluate(
      () => (window as typeof window & { __audio: HTMLAudioElement }).__audio.muted,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: '重读生日信' }).click();
  await page.getByRole('button', { name: '音乐设置' }).click();
  await expect(page.getByLabel('音乐音量')).toHaveValue('0.2');
  await page.getByRole('button', { name: '关闭音乐设置' }).click();
  await page.getByRole('button', { name: '返回工作台', exact: true }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as typeof window & { __audio: HTMLAudioElement }).__audio.src),
    )
    .toContain('/audio/archive-test.wav');
  expect(
    await page.evaluate(() => (window as typeof window & { __audioCount: number }).__audioCount),
  ).toBe(1);
});

test('终幕音轨损坏不阻塞阅读与返回', async ({ page }) => {
  await finish(page, true);
  await page.getByRole('button', { name: '跳过终幕片头' }).click();
  await expect(page.getByRole('heading', { name: 'Happy birthday.', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: '重新播放音乐' })).toBeVisible();
  await page.getByRole('button', { name: '返回工作台', exact: true }).click();
  await expect(page.getByText('所有胶卷已解锁，随时重访。')).toBeVisible();
});
