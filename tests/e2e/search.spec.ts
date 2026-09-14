import { test, expect } from '@playwright/test';

async function waitForApp(page) {
  await page.goto('/');
  await page.waitForFunction(
    () => typeof window.setSearchEngine === 'function' && typeof window.SearchUX === 'object'
  );
  await expect(page.locator('#btn-summon-search')).toBeVisible();
}

test.describe('P4 search', () => {
  test('P4-3: typing with page focus keeps the first character', async ({ page }) => {
    await waitForApp(page);
    const sea = page.locator('#sea-input');
    await sea.evaluate((el) => {
      el.value = '';
      el.blur();
    });
    await page.locator('#sidebar').click({ position: { x: 8, y: 8 } });
    await page.waitForFunction(() => document.activeElement?.id !== 'sea-input');
    await page.keyboard.type('q');
    await expect(page.locator('body')).toHaveClass(/search-active/);
    await expect(sea).toBeVisible();
    await expect(sea).toHaveValue(/^q/);
  });

  test('P4-4: switching to 百度 survives refresh', async ({ page }) => {
    await waitForApp(page);
    await page.locator('#btn-summon-search').click();
    await expect(page.locator('#sea-input')).toBeVisible();
    await page.locator('#current-engine-trigger').click();
    await page.locator('.engine-item[data-engine="baidu"]').click();
    await expect.poll(async () => page.evaluate(() => localStorage.getItem('nav_search_engine'))).toBe(
      'baidu'
    );
    await page.reload();
    await waitForApp(page);
    await expect
      .poll(async () => page.evaluate(() => localStorage.getItem('nav_search_engine')))
      .toBe('baidu');
    await page.locator('#btn-summon-search').click();
    await expect(page.locator('.engine-item[data-engine="baidu"]')).toHaveClass(/active/);
  });

  test('Enter searches the engine instead of auto-opening the first bookmark match', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      window.__openedUrls = [];
      window.open = (url) => {
        window.__openedUrls.push(String(url || ''));
        return null;
      };
      window.appData = window.appData || { items: [], categories: [], settings: {} };
      window.appData.items = [
        ...(window.appData.items || []),
        {
          id: 'gmail-fixture',
          title: 'Gmail',
          url: 'https://mail.google.com',
          desc: '',
          icon: '',
          hidden: false,
        },
      ];
    });

    const sea = page.locator('#sea-input');
    await page.locator('#btn-summon-search').click();
    await sea.fill('Google.com');
    await expect(page.locator('.local-result-item')).toContainText('mail.google.com');
    await expect(page.locator('.local-result-item.active')).toHaveCount(0);
    await sea.press('Enter');

    const opened = await page.evaluate(() => window.__openedUrls);
    expect(opened.some((url) => url.includes('mail.google.com'))).toBe(false);
    expect(opened.some((url) => /[?&](q|wd|query)=/.test(url) && decodeURIComponent(url).includes('Google.com'))).toBe(
      true
    );
  });

  test('ArrowDown then Enter opens the highlighted bookmark', async ({ page }) => {
    await waitForApp(page);
    await page.evaluate(() => {
      window.__openedUrls = [];
      window.open = (url) => {
        window.__openedUrls.push(String(url || ''));
        return null;
      };
      window.appData = window.appData || { items: [], categories: [], settings: {} };
      window.appData.items = [
        ...(window.appData.items || []),
        {
          id: 'gmail-fixture-2',
          title: 'Gmail',
          url: 'https://mail.google.com',
          desc: '',
          icon: '',
          hidden: false,
        },
      ];
    });

    const sea = page.locator('#sea-input');
    await page.locator('#btn-summon-search').click();
    await sea.fill('Google.com');
    await expect(page.locator('.local-result-item')).toContainText('mail.google.com');
    await sea.press('ArrowDown');
    await expect(page.locator('.local-result-item.active')).toContainText('mail.google.com');
    await sea.press('Enter');

    const opened = await page.evaluate(() => window.__openedUrls);
    expect(opened.some((url) => url.includes('https://mail.google.com'))).toBe(true);
  });
});
