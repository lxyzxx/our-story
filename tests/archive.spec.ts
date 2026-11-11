import { test, expect, type Page } from '@playwright/test';
async function enter(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'BEGIN OUR STORY' }).click();
  await expect(page.getByRole('heading', { name: /Some things/ })).toBeVisible();
  await page.locator('.roll-button').first().waitFor();
  await page.waitForTimeout(1400);
}
async function openRoll(page: Page, index = 0) {
  const button = page.getByRole('button', { name: /展开胶卷/ }).nth(index);
  await button.click();
  if (!(await page.getByRole('dialog').count())) await button.click();
}

test('片头可跳过，四卷可读，缺失配乐不阻塞', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'OUR STORY', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '跳过片头' }).click();
  await expect(page.getByRole('button', { name: /展开胶卷/ })).toHaveCount(4);
  await page.getByRole('button', { name: '音乐尚未配置' }).click();
  await expect(page.getByRole('status')).toContainText('尚未添加配乐');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('展开胶片、手动换片、保持原图、返回焦点', async ({ page }) => {
  await enter(page);
  await openRoll(page);
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.locator('.unroll-scene')).toHaveAttribute('data-ready', 'true');
  await expect(page.locator('.viewer-bottom')).toContainText('01 / 03');
  await page.getByRole('button', { name: '下一张演示照片' }).click();
  await expect(page.locator('.viewer-bottom')).toContainText('02 / 03');
  await page.getByRole('button', { name: '下一张演示照片' }).click();
  await expect(page.locator('.viewer-bottom')).toContainText('03 / 03');
  await expect(page.locator('.viewer-aperture img')).toHaveCSS('object-fit', 'contain');
  await page.getByRole('button', { name: '返回工作台' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /展开胶卷 01/ })).toBeFocused();
});

test('动画中断并重新打开不残留多重场景', async ({ page }) => {
  await enter(page);
  await openRoll(page);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await openRoll(page, 1);
  await expect(page.locator('.unroll-scene')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByRole('dialog')).toHaveCount(1);
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Our Adventures' }),
  ).toBeVisible();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.viewer-bottom')).toContainText('02 / 03');
});

test('旋转保持当前卷与照片，无横向页面溢出', async ({ page }) => {
  await enter(page);
  await openRoll(page, 2);
  await expect(page.locator('.unroll-scene')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: '下一张演示照片' }).click();
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('.viewer-bottom')).toContainText('02 / 03');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(
    page.getByRole('dialog').getByRole('heading', { name: 'Little Moments' }),
  ).toBeVisible();
  await expect(page.locator('.viewer-bottom')).toContainText('02 / 03');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

test('减少动态效果时立即显示，键盘焦点被保护', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await enter(page);
  await openRoll(page);
  await expect(page.locator('.unroll-scene')).toHaveAttribute('data-ready', 'true');
  await expect(page.getByRole('button', { name: '返回工作台' })).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: '下一张演示照片' })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: '返回工作台' })).toBeFocused();
});
