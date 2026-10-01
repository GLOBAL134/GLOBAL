import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error('BASE_URL is required (for example: BASE_URL=http://127.0.0.1:4182/site-GLOBAL/)');
}
const widths = [1920, 1440, 1024, 768, 430, 390, 375, 320];

async function withPage(width, fn) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width, height: width >= 1200 ? 900 : 844 } });
  try {
    await page.goto(`${baseURL}?visual-test=${Date.now()}`, { waitUntil: 'networkidle' });
    await fn(page);
  } finally {
    await browser.close();
  }
}

test('responsive chrome, country imagery and horizontal bounds', async () => {
  for (const width of widths) {
    await withPage(width, async (page) => {
      const result = await page.evaluate(() => {
        const rect = (element) => element?.getBoundingClientRect().toJSON();
        const menu = document.querySelector('.mobile-menu');
        const cards = [...document.querySelectorAll('.visual-country')];
        const desktop = innerWidth > 1050;
        return {
          width: innerWidth,
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          menuDisplay: menu ? getComputedStyle(menu).display : null,
          navDisplay: getComputedStyle(document.querySelector('.nav')).display,
          burgerDisplay: getComputedStyle(document.querySelector('.burger')).display,
          desktop,
          cards: cards.map((card) => ({ card: rect(card), image: rect(card.querySelector('img')) })),
          placeholderFlags: [...document.querySelectorAll('.country-directory .country-mini-flag')]
            .map((flag) => flag.textContent?.trim()).filter((flag) => flag === 'EU'),
          heroParts: ['.travel-photo', '.passport-card', '.boarding-card'].map((selector) => ({ selector, rect: rect(document.querySelector(selector)) })),
        };
      });

      assert.ok(result.overflow <= 1, `${width}px: horizontal overflow ${result.overflow}px`);
      if (result.desktop) {
        assert.equal(result.menuDisplay, 'none', `${width}px: mobile menu must be display:none on desktop`);
        assert.notEqual(result.navDisplay, 'none', `${width}px: desktop nav must be visible`);
        assert.equal(result.burgerDisplay, 'none', `${width}px: burger must be hidden`);
      } else {
        assert.equal(result.navDisplay, 'none', `${width}px: desktop nav must be hidden`);
        assert.notEqual(result.burgerDisplay, 'none', `${width}px: burger must be visible`);
      }
      assert.equal(result.placeholderFlags.length, 0, `${width}px: EU text placeholders remain`);
      for (const [index, item] of result.cards.entries()) {
        assert.ok(item.image, `${width}px card ${index}: image missing`);
        assert.ok(Math.abs(item.image.x - item.card.x) <= 1, `${width}px card ${index}: image x mismatch`);
        assert.ok(Math.abs(item.image.y - item.card.y) <= 1, `${width}px card ${index}: image y mismatch`);
        assert.ok(Math.abs(item.image.width - item.card.width) <= 1, `${width}px card ${index}: image width mismatch`);
        assert.ok(Math.abs(item.image.height - item.card.height) <= 1, `${width}px card ${index}: image height mismatch`);
      }
      for (const part of result.heroParts) {
        if (!part.rect) continue;
        assert.ok(part.rect.left >= -1 && part.rect.right <= width + 1, `${width}px: ${part.selector} leaves viewport`);
      }
    });
  }
});

test('mobile menu closes and unlocks the page after resizing to desktop', async () => {
  await withPage(390, async (page) => {
    await page.locator('.burger').click();
    assert.equal(await page.locator('.mobile-menu.open').count(), 1);
    assert.equal(await page.evaluate(() => document.body.style.overflow), 'hidden');

    await page.setViewportSize({ width: 1440, height: 900 });
    await page.waitForFunction(() => document.body.style.overflow !== 'hidden');

    assert.equal(await page.locator('.mobile-menu.open').count(), 0);
    assert.equal(await page.locator('.mobile-menu').getAttribute('aria-hidden'), 'true');
    assert.equal(await page.evaluate(() => document.body.style.overflow), '');
  });
});
