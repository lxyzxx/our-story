import { test, expect, type Page } from '@playwright/test';
test.setTimeout(55000);
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('our-story:progress:v1'))
      localStorage.setItem(
        'our-story:progress:v1',
        JSON.stringify({ completed: ['beginning', 'adventures', 'moments'] }),
      );
  });
});
async function finishLast(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'BEGIN OUR STORY' }).click();
  await page.locator('.roll-button').first().waitFor();
  await page.waitForTimeout(1500);
  const roll = page.getByRole('button', { name: /展开胶卷 04/ });
  await roll.click();
  if (!(await page.locator('.unroll-scene').count())) await roll.click();
  await expect(page.locator('.unroll-scene')).toHaveAttribute('data-ready', 'true');
  await page.getByRole('button', { name: '开始放映', exact: true }).click();
  await page.getByLabel('跳至照片').selectOption('2');
  await page.getByRole('button', { name: '结束本章' }).click();
  await expect(page.locator('.birthday-finale')).toBeVisible();
}

test('收卷序幕可暂停继续，字幕顺序到生日信且阅读不消失', async ({ page }) => {
  await finishLast(page);
  await page.getByRole('button', { name: '暂停终幕片头' }).click();
  const beat = await page.locator('.birthday-finale').getAttribute('data-beat');
  await page.waitForTimeout(1500);
  await expect(page.locator('.birthday-finale')).toHaveAttribute('data-beat', beat!);
  await page.getByRole('button', { name: '继续终幕片头' }).click();
  await expect(page.locator('.birthday-finale')).toHaveAttribute('data-beat', 'question', {
    timeout: 4000,
  });
  await expect(page.locator('.birthday-finale')).toHaveAttribute('data-beat', 'continued', {
    timeout: 5000,
  });
  await expect(page.locator('.birthday-finale')).toHaveAttribute('data-stage', 'letter', {
    timeout: 7000,
  });
  await expect(page.getByRole('heading', { name: 'Happy birthday.', exact: true })).toBeVisible();
  await page.waitForTimeout(7000);
  await expect(page.locator('.birthday-finale')).toHaveAttribute('data-stage', 'letter');
});

test('序幕可随时取消并重进，快速跳过没有旧时间线回调', async ({ page }) => {
  await finishLast(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('.birthday-finale')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /展开胶卷 04/ })).toBeFocused();
  await finishLast(page);
  await page.getByRole('button', { name: '跳过终幕片头' }).evaluate((button) => {
    (button as HTMLButtonElement).click();
    (button as HTMLButtonElement).click();
  });
  await expect(page.locator('.birthday-finale')).toHaveAttribute('data-stage', 'letter');
  await page.waitForTimeout(6500);
  await expect(page.locator('.birthday-finale')).toHaveAttribute('data-stage', 'letter');
});

test('减少动态效果直接阅读，片尾与重访入口可用且焦点受保护', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await finishLast(page);
  await expect(page.locator('.birthday-finale')).toHaveAttribute('data-stage', 'letter');
  await expect(page.getByText('这封信，等你亲手写下。')).toBeVisible();
  await page.getByRole('button', { name: '返回工作台', exact: true }).focus();
  await page.keyboard.press('Shift+Tab');
  await expect(page.getByRole('button', { name: '看看片尾字幕' })).toBeFocused();
  await page.getByRole('button', { name: '看看片尾字幕' }).click();
  await expect(
    page.getByRole('heading', { name: 'Our story continues.', exact: true }),
  ).toBeVisible();
  await expect(page.getByText('待填写署名', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: '音乐设置' }).click();
  await page.getByLabel('音乐音量').focus();
  await page.keyboard.press('Escape');
  await expect(page.locator('.birthday-finale')).toHaveAttribute('data-stage', 'credits');
  await expect(page.getByLabel('音乐音量')).toHaveCount(0);
  await page.getByRole('button', { name: 'REVISIT OUR MEMORIES' }).click();
  await expect(page.getByText('所有胶卷已解锁，随时重访。')).toBeVisible();
  await page.getByRole('button', { name: '重读生日信' }).click();
  await expect(page.locator('.birthday-finale')).toHaveAttribute('data-stage', 'letter');
});

test('首映后片头可重读生日信，旋转保持阅读和片尾状态', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await finishLast(page);
  await page.getByRole('button', { name: '返回工作台', exact: true }).click();
  await page.getByRole('button', { name: 'OUR STORY，重看片头' }).click();
  await page.getByRole('button', { name: '重读生日信' }).click();
  await expect(page.locator('.birthday-finale')).toHaveAttribute('data-stage', 'letter');
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.getByRole('heading', { name: 'Happy birthday.', exact: true })).toBeVisible();
  await page.getByRole('button', { name: '音乐设置' }).click();
  await page.getByLabel('音乐音量').fill('0.2');
  await page.getByRole('button', { name: '关闭音乐设置' }).click();
  await page.getByRole('button', { name: '看看片尾字幕' }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('.birthday-finale')).toHaveAttribute('data-stage', 'credits');
  await page.getByRole('button', { name: '音乐设置' }).click();
  await expect(page.getByLabel('音乐音量')).toHaveValue('0.2');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'REVISIT OUR MEMORIES' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await expect(page.getByRole('button', { name: '重读生日信' })).toBeFocused();
});
