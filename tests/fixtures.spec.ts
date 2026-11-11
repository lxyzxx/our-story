import { test, expect, type Page } from '@playwright/test';
test.setTimeout(45000);
function tone() {
  const count = 22050;
  const buffer = Buffer.alloc(44 + count * 2);
  buffer.write('RIFF');
  buffer.writeUInt32LE(buffer.length - 8, 4);
  buffer.write('WAVEfmt ', 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(count, 24);
  buffer.writeUInt32LE(count * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(count * 2, 40);
  for (let i = 0; i < count; i++)
    buffer.writeInt16LE(Math.round(Math.sin((i * 2 * Math.PI * 220) / count) * 1000), 44 + i * 2);
  return buffer;
}
async function boot(page: Page) {
  await page.route('**/audio/*-test.wav', (route) =>
    route.fulfill({ contentType: 'audio/wav', body: tone() }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'BEGIN OUR STORY' }).click();
  await page.locator('.roll-button').first().waitFor();
  await page.waitForTimeout(1600);
}
async function open(page: Page, index = 0) {
  await page
    .getByRole('button', { name: /展开胶卷/ })
    .nth(index)
    .click();
  await expect(page.locator('.unroll-scene')).toHaveAttribute('data-ready', 'true');
}

test('50 张数据按需展示、跳转到末帧、无图章节安全降级', async ({ page }) => {
  await boot(page);
  await open(page);
  expect(await page.locator('.negative').count()).toBeLessThanOrEqual(12);
  await page.getByRole('button', { name: '开始放映', exact: true }).click();
  await expect(page.locator('.screening')).toHaveAttribute('data-playing', 'true');
  await expect(page.getByLabel('跳至照片').locator('option')).toHaveCount(50);
  await page.getByLabel('跳至照片').selectOption('49');
  await expect(page.locator('.screening')).toHaveAttribute('data-frame', '49');
  await expect(page.locator('.screening-image img')).toHaveCount(1);
  await page.getByRole('button', { name: '结束本章' }).click();
  await page.getByRole('button', { name: '返回工作台', exact: true }).click();
  await open(page, 1);
  await expect(page.locator('.unroll-scene')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByText('这一卷还没有照片。')).toBeVisible();
  await expect(page.getByRole('button', { name: '开始放映', exact: true })).toBeDisabled();
  expect(await page.locator('.viewer-bottom').innerText()).not.toContain('NaN');
});

test('原生音频仅点击后启动、音量静音与跨场景播放', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeAudio = window.Audio;
    const state = window as typeof window & {
      __testAudio?: HTMLAudioElement;
      __plays?: Array<{ source: string; active: boolean }>;
    };
    state.__plays = [];
    window.Audio = function (...args: ConstructorParameters<typeof Audio>) {
      const el = new NativeAudio(...args);
      state.__testAudio = el;
      const play = el.play.bind(el);
      el.play = () => {
        state.__plays!.push({ source: el.src, active: navigator.userActivation.isActive });
        return play();
      };
      return el;
    } as unknown as typeof Audio;
  });
  await page.route('**/audio/*-test.wav', (route) =>
    route.fulfill({ contentType: 'audio/wav', body: tone() }),
  );
  await page.goto('/');
  expect(
    await page.evaluate(
      () =>
        (window as typeof window & { __testAudio?: HTMLAudioElement }).__testAudio === undefined,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'BEGIN OUR STORY' }).click();
  await page.locator('.roll-button').first().waitFor();
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { __testAudio?: HTMLAudioElement }).__testAudio?.paused,
      ),
    )
    .toBe(false);
  expect(
    await page.evaluate(
      () => (window as typeof window & { __plays: Array<{ active: boolean }> }).__plays[0].active,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: '音乐设置' }).click();
  await page.getByLabel('音乐音量').fill('0.2');
  await page.waitForTimeout(1800);
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { __testAudio: HTMLAudioElement }).__testAudio.volume,
      ),
    )
    .toBeCloseTo(0.2, 1);
  await page.getByRole('button', { name: '关闭音乐设置' }).click();
  await page.getByRole('button', { name: '静音', exact: true }).click();
  expect(
    await page.evaluate(
      () => (window as typeof window & { __testAudio: HTMLAudioElement }).__testAudio.muted,
    ),
  ).toBe(true);
  await open(page);
  await page.getByRole('button', { name: '开始放映', exact: true }).click();
  expect(
    await page.evaluate(
      () => (window as typeof window & { __testAudio: HTMLAudioElement }).__testAudio.muted,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: '开启音乐', exact: true }).click();
  expect(
    await page.evaluate(
      () => (window as typeof window & { __testAudio: HTMLAudioElement }).__testAudio.muted,
    ),
  ).toBe(false);
});

test('音源损坏可恢复且不阻塞影片', async ({ page }) => {
  await boot(page);
  await page.route('**/audio/missing-test.wav', (route) =>
    route.fulfill({ status: 404, body: 'missing' }),
  );
  await open(page, 2);
  await expect(page.getByRole('button', { name: '重新播放音乐' })).toBeVisible();
  await page.getByRole('button', { name: '音乐设置' }).click();
  await expect(page.getByText('配乐加载失败，可重试或继续安静浏览。')).toBeVisible();
  await page.getByRole('button', { name: '关闭音乐设置' }).click();
  await page.getByRole('button', { name: '返回工作台' }).click();
  await open(page);
  await page.getByRole('button', { name: '开始放映', exact: true }).click();
  await expect(page.locator('.screening')).toHaveAttribute('data-playing', 'true');
});

test('预先静音贯穿激活、原生音量键不翻片、阅读和字幕可调音乐', async ({ page }) => {
  await page.addInitScript(() => {
    const NativeAudio = window.Audio;
    window.Audio = function (...args: ConstructorParameters<typeof Audio>) {
      const el = new NativeAudio(...args);
      (window as typeof window & { __testAudio?: HTMLAudioElement }).__testAudio = el;
      return el;
    } as unknown as typeof Audio;
  });
  await page.route('**/audio/*-test.wav', (route) =>
    route.fulfill({ contentType: 'audio/wav', body: tone() }),
  );
  await page.goto('/');
  await page.getByRole('button', { name: '静音', exact: true }).click();
  await page.getByRole('button', { name: 'BEGIN OUR STORY' }).click();
  await page.locator('.roll-button').first().waitFor();
  await page.waitForTimeout(1600);
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as typeof window & { __testAudio?: HTMLAudioElement }).__testAudio?.muted,
      ),
    )
    .toBe(true);
  await open(page);
  await page.getByRole('button', { name: '音乐设置' }).click();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '关闭音乐设置' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByLabel('音乐音量')).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.viewer-bottom')).toContainText('01 / 50');
  await page.keyboard.press('Tab');
  await expect(page.locator('.negative').first()).toBeFocused();
  await page.getByLabel('音乐音量').focus();
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('音乐音量')).toHaveCount(0);
  await expect(page.locator('.unroll-scene')).toHaveCount(1);
  await page.getByRole('button', { name: '开始放映', exact: true }).click();
  await page.getByRole('button', { name: '阅读完整故事' }).click();
  await page.getByRole('button', { name: '开启音乐', exact: true }).click();
  expect(
    await page.evaluate(
      () => (window as typeof window & { __testAudio: HTMLAudioElement }).__testAudio.muted,
    ),
  ).toBe(false);
  await page.getByRole('button', { name: '收起故事', exact: true }).first().click();
  await page.getByLabel('跳至照片').selectOption('49');
  await page.getByRole('button', { name: '结束本章' }).click();
  await page.getByRole('button', { name: '静音', exact: true }).click();
  expect(
    await page.evaluate(
      () => (window as typeof window & { __testAudio: HTMLAudioElement }).__testAudio.muted,
    ),
  ).toBe(true);
});
