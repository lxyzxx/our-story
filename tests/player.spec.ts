import { test, expect, type Page } from '@playwright/test';
test.setTimeout(65000);
async function desk(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'BEGIN OUR STORY' }).click();
  await page.locator('.roll-button').first().waitFor();
  await page.waitForTimeout(1500);
}
async function roll(page: Page, index = 0) {
  const button = page.getByRole('button', { name: /展开胶卷/ }).nth(index);
  await button.click();
  if (!(await page.locator('.unroll-scene').count())) await button.click();
  await expect(page.locator('.unroll-scene')).toHaveAttribute('data-ready', 'true');
}
async function play(page: Page) {
  await page.getByRole('button', { name: '开始放映', exact: true }).click();
  await expect(page.locator('.screening')).toHaveAttribute('data-playing', 'true');
}

test('真实自动切片、暂停保留计时、继续播放', async ({ page }) => {
  await desk(page);
  await roll(page);
  await play(page);
  await page.waitForTimeout(1000);
  await page.getByRole('button', { name: '暂停放映' }).click();
  const value = await page.getByRole('progressbar').getAttribute('aria-valuenow');
  await page.waitForTimeout(1100);
  await expect(page.getByRole('progressbar')).toHaveAttribute('aria-valuenow', value!);
  await expect(page.locator('.screening')).toHaveAttribute('data-frame', '0');
  await page.getByRole('button', { name: '继续放映' }).click();
  await expect(page.locator('.screening')).toHaveAttribute('data-frame', '1', { timeout: 11000 });
});

test('阅读超过一帧时长不换片、收起保持暂停、键盘不翻动背景', async ({ page }) => {
  await desk(page);
  await roll(page);
  await play(page);
  await page.getByRole('button', { name: '阅读完整故事' }).click();
  await expect(page.getByLabel('完整回忆故事')).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(8500);
  await expect(page.locator('.screening')).toHaveAttribute('data-frame', '0');
  await expect(page.locator('.screening')).toHaveAttribute('data-playing', 'false');
  await page.keyboard.press('Escape');
  await expect(page.getByLabel('完整回忆故事')).toHaveCount(0);
  await expect(page.getByRole('button', { name: '继续放映' })).toBeVisible();
  await page.waitForTimeout(900);
  await expect(page.locator('.screening')).toHaveAttribute('data-frame', '0');
  await expect(page.getByRole('button', { name: '阅读完整故事' })).toBeFocused();
});

test('首映顺序、章节字幕等待确认、完成后解锁并可重看', async ({ page }) => {
  await desk(page);
  await roll(page, 1);
  await expect(page.getByRole('button', { name: '先看完前面的章节' })).toBeDisabled();
  await page.getByRole('button', { name: '返回工作台' }).click();
  await roll(page);
  for (let index = 0; index < 4; index++) {
    await play(page);
    await page.getByLabel('跳至照片').selectOption('2');
    await page.getByRole('button', { name: '结束本章' }).click();
    if (index < 3) {
      await expect(page.getByRole('heading', { name: 'Let this moment linger.' })).toBeVisible();
      await page.waitForTimeout(500);
      await expect(page.locator('.unroll-scene')).toHaveCount(0);
      await page.getByRole('button', { name: /进入下一幕/ }).click();
      await expect(page.locator('.unroll-scene')).toHaveAttribute('data-ready', 'true');
    }
  }
  await expect(page.getByRole('heading', { name: 'The story goes on.' })).toBeVisible();
  await page.getByRole('button', { name: '返回胶片档案馆' }).click();
  await expect(page.getByText('所有胶卷已解锁，随时重访。')).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '再看一次完整电影' }).click();
  await expect(page.locator('.unroll-scene')).toHaveAttribute('data-ready', 'true');
  await play(page);
  await expect(page.locator('.screening')).toHaveAttribute('data-frame', '0');
});

test('旋转和刷新恢复照片、音乐面板暂停计时、触屏滑动', async ({ page, isMobile }) => {
  await desk(page);
  await roll(page);
  await play(page);
  await page.getByRole('button', { name: '暂停放映' }).click();
  await page.getByRole('button', { name: '下一张照片', exact: true }).click();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('.screening')).toHaveAttribute('data-frame', '1');
  await page.getByRole('button', { name: '音乐设置' }).click();
  await expect(page.getByLabel('音乐音量')).toBeVisible();
  await expect(page.locator('.screening')).toHaveAttribute('data-playing', 'false');
  await page.getByRole('button', { name: '关闭音乐设置' }).click();
  await page.reload();
  await desk(page);
  await roll(page);
  await play(page);
  await expect(page.locator('.screening')).toHaveAttribute('data-frame', '1');
  await page.getByRole('button', { name: '暂停放映' }).click();
  if (isMobile) {
    const box = (await page.locator('.screening-photo').boundingBox())!;
    const session = await page.context().newCDPSession(page);
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: box.x + box.width * 0.8, y: box.y + box.height * 0.5 }],
    });
    await session.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x: box.x + box.width * 0.2, y: box.y + box.height * 0.5 }],
    });
    await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await session.detach();
  } else await page.getByRole('button', { name: '下一张照片', exact: true }).click();
  await expect(page.locator('.screening')).toHaveAttribute('data-frame', '2');
  await expect(page.locator('.screening-image img')).toHaveCSS('object-fit', 'contain');
  await expect(page.locator('.screening-theatre')).toHaveClass(/is-portrait/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('减少动态效果、隐藏控件可恢复、选择框保留原生键盘行为', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await desk(page);
  await roll(page);
  await play(page);
  await page.getByRole('button', { name: '暂停放映' }).click();
  await expect(page.locator('.screening-image')).toHaveCSS('animation-name', 'none');
  await page.locator('.controls-toggle').click();
  await expect(page.getByRole('button', { name: '继续放映' })).toBeHidden();
  await page.locator('.controls-toggle').click();
  await expect(page.getByRole('button', { name: '继续放映' })).toBeVisible();
  await page.getByLabel('跳至照片').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.screening')).toHaveAttribute('data-frame', '1');
  await page.keyboard.press('Escape');
  await expect(page.locator('.screening')).toHaveCount(0);
});

test('浏览器禁用存储时仍能完整进入和阅读', async ({ page }) => {
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => {
      throw new Error('storage denied');
    };
    Storage.prototype.setItem = () => {
      throw new Error('storage denied');
    };
  });
  await desk(page);
  await roll(page);
  await play(page);
  await page.getByRole('button', { name: '阅读完整故事' }).click();
  await expect(page.getByLabel('完整回忆故事')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.keyboard.press('Escape');
  await expect(page.locator('.screening')).toHaveCount(0);
});
