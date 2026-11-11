import { test, expect } from '@playwright/test';
import { readFile, writeFile, rename } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
test.describe.configure({ mode: 'serial' });
test.setTimeout(25000);
const file = process.env.PREMIERE_FIXTURE_FILE || '';
const letter = 'GATE_PRIVATE_LETTER_CANARY';
const chapter = 'GATE_PRIVATE_CHAPTER_CANARY';
async function configure(premiere: Record<string, unknown>) {
  if (!file.startsWith(tmpdir() + path.sep))
    throw new Error('PREMIERE_FIXTURE_FILE must use a temporary directory');
  const content = JSON.parse(
    await readFile(path.resolve('tests/fixtures/archive-finale.json'), 'utf8'),
  );
  content.finale.letter = letter;
  content.chapters[0].title = chapter;
  content.premiere = {
    enabled: true,
    opensAt: new Date(Date.now() + 86400000).toISOString(),
    timeZone: 'Asia/Shanghai',
    ...premiere,
  };
  await writeFile(file + '.tmp', JSON.stringify(content));
  await rename(file + '.tmp', file);
}

test('首映前仅发送邀请，状态接口不泄露章节和信件', async ({ page, request }) => {
  await configure({});
  const response = await request.get('/');
  const html = await response.text();
  expect(html).not.toContain(letter);
  expect(html).not.toContain(chapter);
  expect(response.headers()['cache-control']).toContain('no-store');
  const status = await request.get('/api/premiere');
  expect(status.headers()['cache-control']).toContain('no-store');
  const body = await status.json();
  expect(body.status).toBe('locked');
  expect(body.preview).toBe(false);
  expect(JSON.stringify(body)).not.toContain(letter);
  expect(Object.keys(body).sort()).toEqual(
    ['enabled', 'opensAt', 'preview', 'serverNow', 'status', 'timeZone'].sort(),
  );
  await page.goto('/');
  await expect(page.getByRole('button', { name: '首映尚未开始' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'BEGIN OUR STORY' })).toHaveCount(0);
});

test('客户端改时间、查询参数和请求头不能提前解锁', async ({ page, request }) => {
  await configure({});
  await page.addInitScript(() => {
    Date.now = () => Date.UTC(2099, 0, 1);
  });
  await page.goto('/?preview=1&PREMIERE_PREVIEW=1&now=9999999999999');
  await expect(page.getByRole('button', { name: '首映尚未开始' })).toBeDisabled();
  const response = await request.get('/api/premiere?preview=1&now=9999999999999', {
    headers: { 'x-premiere-preview': '1' },
  });
  expect((await response.json()).status).toBe('locked');
  expect(await page.content()).not.toContain(letter);
});

test('无时区、错误日期和错误时区配置都保持关闭', async ({ request }) => {
  for (const bad of [
    { opensAt: '2027-02-07T00:00:00' },
    { opensAt: '2027-02-30T00:00:00+08:00' },
    { timeZone: 'Moon/Sea' },
    { enabled: 'yes' },
  ]) {
    await configure(bad);
    const result = await request.get('/api/premiere');
    expect((await result.json()).status).toBe('invalid');
    const response = await request.get('/');
    const html = await response.text();
    expect(html).toContain('首映时间正在安排');
    expect(html).not.toContain(letter);
    expect(html).not.toContain('Invalid Date');
  }
});

test('服务端到点后自动开放，无需访客刷新', async ({ page, request }) => {
  await configure({ opensAt: new Date(Date.now() + 4000).toISOString() });
  await page.goto('/');
  await expect(page.getByRole('button', { name: '首映尚未开始' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'BEGIN OUR STORY' })).toBeVisible({
    timeout: 12000,
  });
  expect((await (await request.get('/api/premiere')).json()).status).toBe('open');
  expect(await (await request.get('/')).text()).toContain(letter);
});

test('网络失败时不会只因本地归零而进入，恢复后可确认开放', async ({ page }) => {
  await configure({ opensAt: new Date(Date.now() + 2200).toISOString() });
  await page.route('**/api/premiere', (route) =>
    route.fulfill({ status: 503, body: 'unavailable' }),
  );
  await page.goto('/');
  await expect(page.getByText('连接暂时中断，首映时间还在等待确认。')).toBeVisible();
  await page.waitForTimeout(3000);
  await expect(page.getByRole('button', { name: '首映尚未开始' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'BEGIN OUR STORY' })).toHaveCount(0);
  await page.unroute('**/api/premiere');
  await page.getByRole('button', { name: '重新确认时间' }).click();
  await expect(page.getByRole('button', { name: 'BEGIN OUR STORY' })).toBeVisible({
    timeout: 10000,
  });
});

test('三种屏幕邀请页无横向溢出，禁用或已过首映则正常进入', async ({ page, request }) => {
  await configure({});
  await page.goto('/');
  for (const size of [
    { width: 1440, height: 1000 },
    { width: 844, height: 390 },
    { width: 390, height: 844 },
  ]) {
    await page.setViewportSize(size);
    await expect(page.getByRole('timer')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
  await configure({ enabled: false, opensAt: 'invalid' });
  expect((await (await request.get('/api/premiere')).json()).status).toBe('open');
  await page.reload();
  await expect(page.getByRole('button', { name: 'BEGIN OUR STORY' })).toBeVisible();
});
