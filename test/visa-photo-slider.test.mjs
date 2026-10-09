import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseURL = process.env.BASE_URL;
if (!baseURL) throw new Error('BASE_URL is required');
const evidence = process.env.EVIDENCE_DIR;
const widths = [[1920, 1080], [1440, 900], [768, 430], [430, 900], [390, 844], [375, 320], [320, 700]];
const names = ['Prague', 'Paris', 'Venice', 'Amsterdam', 'Rome', 'Barcelona', 'Vienna', 'Lisbon', 'Athens', 'Zurich'];
const slideNumber = (src) => Number(src?.match(/visa-slide-(\d\d)\.webp/)?.[1]);
const current = (page) => page.locator('.service-photo-slides img').first().getAttribute('src').then(slideNumber);

async function browserPage(browser, width = 1440, height = 900, options = {}) {
  const page = await browser.newPage({ viewport: { width, height }, ...options });
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  return page;
}

test('ten local pictures, stable overlay, seven viewport geometries and both visa CTAs', async () => {
  const browser = await chromium.launch();
  try {
    for (const [width, height] of widths) {
      const requests = [];
      const errors = [];
      const posts = [];
      const page = await browser.newPage({ viewport: { width, height } });
      page.on('request', (r) => { if (/visa-slide-\d\d\.webp/.test(r.url())) requests.push(r.url()); });
      page.on('request', (r) => { if (r.method() === 'POST') posts.push(r.url()); });
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(baseURL, { waitUntil: 'networkidle' });
      await page.locator('.service-feature').scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      const data = await page.locator('.service-feature').evaluate((card) => {
        const photo = card.querySelector('.service-photo-slides img');
        const box = card.getBoundingClientRect(), image = photo?.getBoundingClientRect();
        const heading = card.querySelector('h3'), description = card.querySelector('p');
        const buttons = [...card.querySelectorAll('button')];
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          card: box.toJSON(), image: image?.toJSON(), radius: getComputedStyle(card).borderRadius,
          loaded: photo?.complete && photo.naturalWidth > 0,
          fit: getComputedStyle(photo).objectFit,
          heading: heading.textContent, description: description.textContent,
          textBounds: [heading, description, ...buttons].map((e) => e.getBoundingClientRect().toJSON()),
          gradient: getComputedStyle(card.querySelector('.service-art'), '::after').backgroundImage,
          oldStack: !!card.querySelector('.doc-stack'),
        };
      });
      assert.ok(data.loaded, `${width}: first image failed to load`);
      assert.equal(data.radius, '35px');
      assert.equal(data.fit, 'cover');
      assert.equal(data.oldStack, false);
      assert.match(data.gradient, /linear-gradient/);
      assert.ok(data.heading && data.description, `${width}: service text missing`);
      assert.ok(data.overflow <= 1, `${width}: horizontal overflow ${data.overflow}`);
      assert.ok(data.card.width > 0 && data.card.height >= 570, `${width}: card dimensions`);
      assert.ok(Math.abs(data.image.width - data.card.width) < 1 && Math.abs(data.image.height - data.card.height) < 1, `${width}: photograph does not fill card`);
      assert.ok(data.textBounds.every((r) => r.left >= data.card.left - 1 && r.right <= data.card.right + 1 && r.bottom <= data.card.bottom + 1), `${width}: text/button clipped`);
      assert.ok(new Set(requests).size <= 2, `${width}: eager-loaded ${new Set(requests).size} photos, not just current + next`);
      assert.deepEqual(errors, [], `${width}: browser exceptions`);
      if (evidence) {
        await mkdir(evidence, { recursive: true });
        await page.locator('.service-feature').screenshot({ path: `${evidence}/visa-${width}x${height}.png` });
      }
      if (width === 1440) {
        await page.locator('.service-feature').getByRole('button', { name: 'Подробнее' }).click();
        assert.equal(await page.locator('.service-modal').count(), 1);
        assert.match(await page.locator('.service-modal').innerText(), /Оформление виз/);
        await page.getByRole('button', { name: 'Закрыть окно' }).click();
        await page.locator('.service-feature').getByRole('button', { name: /Оставить заявку/ }).click();
        assert.equal(await page.locator('.lead-modal form select[name="service"]').inputValue(), 'Оформление виз');
      }
      assert.deepEqual(posts, [], `${width}: CTA should never submit without user form action`);
      await page.close();
    }
    const page = await browserPage(browser);
    for (let i = 1; i <= 10; i++) {
      const response = await page.request.get(`${new URL(baseURL).origin}${new URL(baseURL).pathname}images/visa-slider/visa-slide-${String(i).padStart(2, '0')}.webp`);
      assert.equal(response.status(), 200, `${names[i - 1]} asset missing`);
      assert.match(response.headers()['content-type'] ?? '', /image\/webp/);
    }
    await page.close();
  } finally { await browser.close(); }
});

test('real-time 5s crossfades cover all ten images and wrap without blank card', { timeout: 90000 }, async () => {
  const browser = await chromium.launch();
  const page = await browserPage(browser);
  try {
    await page.locator('.service-feature').scrollIntoViewIfNeeded();
    const seen = [await current(page)];
    const timing = [Date.now()];
    for (let index = 2; index <= 11; index++) {
      const expected = (index - 1) % 10 + 1;
      if (index === 2) {
        const fade = page.locator('.service-photo-slides .photo-frame.incoming.shown');
        await fade.waitFor({ timeout: 8000 });
        await page.waitForTimeout(120);
        const state = await fade.evaluate(el => ({ duration: getComputedStyle(el).transitionDuration, opacity: Number(getComputedStyle(el).opacity), baseOpacity: Number(getComputedStyle(el.previousElementSibling).opacity) }));
        assert.equal(state.duration, '1s');
        assert.ok(state.opacity > 0 && state.opacity < 1 && state.baseOpacity === 1, `visa crossfade ${JSON.stringify(state)}`);
        if (evidence) await page.locator('.service-feature').screenshot({ path: `${evidence}/visa-crossfade.png` });
      }
      await page.waitForFunction((n) => Number(document.querySelector('.service-photo-slides img')?.getAttribute('src')?.match(/visa-slide-(\d\d)/)?.[1]) === n, expected, { timeout: 8500 });
      const images = await page.locator('.service-photo-slides img').evaluateAll((els) => els.map((el) => ({ loaded: el.complete && el.naturalWidth > 0, opacity: Number(getComputedStyle(el).opacity) })));
      assert.ok(images[0].loaded && images[0].opacity > .99, `slide ${expected}: no solid loaded base`);
      seen.push(await current(page));
      timing.push(Date.now());
    }
    assert.deepEqual(seen, [1,2,3,4,5,6,7,8,9,10,1]);
    assert.ok(timing.slice(1).every((time, i) => time - timing[i] >= (i ? 4600 : 5800) && time - timing[i] < (i ? 5600 : 7000)), `irregular 5-second cadence ${JSON.stringify(timing)}`);
    if (evidence) await writeFile(`${evidence}/cycle.json`, JSON.stringify({ seen, elapsedMs: timing.map((x) => x - timing[0]) }, null, 2));
  } finally { await browser.close(); }
});

test('reduced motion, hidden and offscreen pause; mobile advances; broken next keeps last valid photo', { timeout: 35000 }, async () => {
  const browser = await chromium.launch();
  try {
    const reduced = await browserPage(browser, 390, 844, { reducedMotion: 'reduce' });
    await reduced.locator('.service-feature').scrollIntoViewIfNeeded();
    await reduced.clock.install();
    await reduced.clock.fastForward(12000);
    assert.equal(await current(reduced), 1, 'reduced-motion must stay on first photo');
    assert.equal(await reduced.locator('.service-photo-slides img').count(), 1);
    await reduced.close();

    const hidden = await browserPage(browser);
    await hidden.locator('.service-feature').scrollIntoViewIfNeeded();
    await hidden.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
    await hidden.clock.install();
    await hidden.clock.fastForward(12000);
    assert.equal(await current(hidden), 1, 'hidden document must pause');
    await hidden.close();

    const offscreen = await browserPage(browser);
    await offscreen.locator('.service-feature').scrollIntoViewIfNeeded();
    await offscreen.evaluate(() => scrollTo(0, 0));
    await offscreen.waitForTimeout(150);
    await offscreen.clock.install();
    await offscreen.clock.fastForward(12000);
    assert.equal(await current(offscreen), 1, 'offscreen card must pause');
    await offscreen.close();

    const mobile = await browserPage(browser, 390, 844);
    await mobile.locator('.service-feature').scrollIntoViewIfNeeded();
    await mobile.waitForFunction(() => document.querySelector('.service-photo-slides img')?.getAttribute('src')?.includes('visa-slide-02'), { timeout: 8500 });
    assert.equal(await current(mobile), 2, 'mobile should auto-advance');
    await mobile.close();

    const broken = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await broken.route('**/images/visa-slider/visa-slide-02.webp', (route) => route.abort());
    await broken.goto(baseURL, { waitUntil: 'networkidle' });
    await broken.locator('.service-feature').scrollIntoViewIfNeeded();
    await broken.clock.install();
    await broken.clock.fastForward(10000);
    assert.equal(await current(broken), 1, 'failed next must retain loaded first image');
    await broken.close();
  } finally { await browser.close(); }
});
