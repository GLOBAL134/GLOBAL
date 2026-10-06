import assert from 'node:assert/strict';
import { chromium } from 'playwright';
const url = process.env.BASE_URL;
assert.ok(url, 'BASE_URL required');
const browser = await chromium.launch();
try {
  for (const width of [1920, 1440, 390, 320]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto(url, { waitUntil: 'networkidle' });
    for (const scrollY of [0, 1200]) {
      await page.evaluate(y => window.scrollTo(0, y), scrollY);
      await page.waitForTimeout(600);
      const telegram = page.locator('a[aria-label="Telegram GLOBAL"]');
      const max = page.locator('a[aria-label="MAX GLOBAL"]');
      const art = max.locator('.max-icon-art');
      const color = await telegram.evaluate(e => getComputedStyle(e).color);
      assert.equal(await art.evaluate(e => getComputedStyle(e).backgroundColor), color);
      assert.equal(await max.evaluate(e => getComputedStyle(e).opacity), await telegram.evaluate(e => getComputedStyle(e).opacity));
      assert.match(await art.evaluate(e => getComputedStyle(e).maskImage), /\/site-GLOBAL\/images\/max-icon.webp/);
      assert.ok(await max.locator('img').evaluate(e => e.complete && e.naturalWidth === 128));
      const t = await telegram.boundingBox(), m = await max.boundingBox();
      assert.ok(t && m); assert.equal(t.width, m.width); assert.equal(t.height, m.height);
      assert.equal(m.width, 32);
      if (width === 1440) await page.locator('.header-actions').screenshot({ path: `/Users/grizzly/GLOBAL-qa/oct6-production/max-color-${scrollY ? 'light' : 'dark'}.png` });
      console.log(`${width}px ${scrollY ? 'light' : 'dark'}: matching color ${color}, opacity and 32px diameter`);
    }
    await page.close();
  }
} finally { await browser.close(); }
