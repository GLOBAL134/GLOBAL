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
      const telegram = page.locator('.header-actions a[aria-label="Открыть Telegram GLOBAL"]');
      const max = page.locator('.header-actions a[aria-label="Открыть MAX GLOBAL"]');
      const whatsapp = page.locator('.header-actions a[aria-label="Открыть WhatsApp GLOBAL"]');
      for (const icon of [max, whatsapp]) {
        const img = icon.locator('img');
        assert.ok(await img.evaluate(e => e.complete && e.naturalWidth > 0));
        assert.equal(await img.evaluate(e => getComputedStyle(e).maskImage), 'none');
        assert.equal(await img.evaluate(e => getComputedStyle(e).filter), 'none');
        assert.equal(await img.evaluate(e => getComputedStyle(e).opacity), '1');
        const t = await telegram.boundingBox(), m = await icon.boundingBox();
        assert.ok(t && m); assert.equal(t.width, m.width); assert.equal(t.height, m.height);
        assert.equal(m.width, 32);
      }
      assert.match(await max.locator('img').getAttribute('src'), /\/site-GLOBAL\/images\/max-colored\.svg/);
      assert.match(await whatsapp.locator('img').getAttribute('src'), /\/site-GLOBAL\/images\/whatsapp-white\.svg/);
      console.log(`${width}px ${scrollY ? 'light' : 'dark'}: full-color assets visible at 32px`);
    }
    await page.close();
  }
} finally { await browser.close(); }
