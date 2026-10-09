import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseURL = process.env.BASE_URL;
if (!baseURL) throw new Error('BASE_URL is required');
const evidence = process.env.EVIDENCE_DIR;
const widths = [[1920,1080],[1440,900],[768,430],[430,900],[390,844],[375,320],[320,700]];
const current = async (page) => Number((await page.locator('.office-photo-slides img').first().getAttribute('src'))?.match(/office-slide-(\d\d)/)?.[1]);

async function open(browser, width = 1440, height = 900, reducedMotion = 'no-preference') {
  const page = await browser.newPage({ viewport: { width, height }, reducedMotion });
  await page.goto(baseURL, { waitUntil: 'networkidle' });
  await page.locator('.office-editorial').scrollIntoViewIfNeeded();
  return page;
}

test('office visuals fill the existing card, preserve route and only two initial requests at seven widths', async () => {
  const browser = await chromium.launch();
  try {
    for (const [width, height] of widths) {
      const page = await browser.newPage({ viewport: { width, height } });
      const requests = [];
      page.on('request', r => { if (/office-slide-\d\d\.webp/.test(r.url())) requests.push(r.url()); });
      await page.goto(baseURL, { waitUntil: 'networkidle' });
      await page.locator('.office-editorial').scrollIntoViewIfNeeded();
      await page.waitForTimeout(200);
      const data = await page.locator('.office-editorial').evaluate((card) => {
        const box = card.getBoundingClientRect(), img = card.querySelector('.office-photo-slides img'), image = img?.getBoundingClientRect();
        return { box: box.toJSON(), image: image?.toJSON(), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          radius: getComputedStyle(card).borderRadius, fit: getComputedStyle(img).objectFit,
          intrinsic: [img?.naturalWidth, img?.naturalHeight],
          loaded: img?.complete && img.naturalWidth > 0,
          text: card.querySelector(':scope > div:last-child')?.innerText,
          route: card.querySelector('a')?.getAttribute('href'), target: card.querySelector('a')?.target,
          background: getComputedStyle(card.querySelector('.office-photo-slides > div'), '::before').content,
          textBounds: [...card.querySelectorAll(':scope > div:last-child > *')].map(e => e.getBoundingClientRect().toJSON()),
        };
      });
      assert.ok(data.loaded, `${width}: missing entrance photo`);
      assert.equal(data.radius, '30px');
      assert.ok(data.box.height >= (width <= 700 ? 450 : 520) && data.box.width > 0);
      assert.ok(Math.abs(data.image.width - data.box.width) < 1 && Math.abs(data.image.height - data.box.height) < 1);
      assert.ok(data.overflow <= 1, `${width}: horizontal overflow ${data.overflow}`);
      assert.ok(data.textBounds.every(r => r.left >= data.box.left - 1 && r.right <= data.box.right + 1 && r.bottom <= data.box.bottom + 1), `${width}: overlay clipped`);
      assert.match(data.text, /Офис GLOBAL[\s\S]*ул\. Челюскинцев, 15Б[\s\S]*1 этаж · 600 м от метро[\s\S]*Построить маршрут/);
      assert.equal(data.route, 'https://yandex.ru/maps/?rtext=~55.039855,82.905859&rtt=auto');
      assert.equal(data.target, '_blank');
      assert.equal(data.fit, 'fill', `${width}: full source frame must stretch across the card without cropping`);
      assert.deepEqual(data.intrinsic, [1280, 649], `${width}: original entrance frame must load`);
      assert.equal(data.background, 'none', `${width}: no blurred duplicate behind image`);
      assert.ok(new Set(requests).size <= 2, `${width}: eager office requests ${requests.length}`);
      if (evidence) { await mkdir(evidence, { recursive: true }); await page.locator('.office-editorial').screenshot({ path: `${evidence}/office-${width}x${height}.png` }); }
      if (width === 1440) {
        await page.context().route('https://yandex.ru/maps/**', route => route.fulfill({ status: 200, body: '<!doctype html><title>Route</title>', contentType: 'text/html' }));
        const [popup] = await Promise.all([page.waitForEvent('popup'), page.locator('.office-editorial a').click()]);
        await popup.waitForURL(/yandex\.ru\/maps\/\?rtext=/);
        assert.equal(popup.url(), data.route);
        await popup.close();
      }
      await page.close();
    }
    const page = await open(browser);
    for (let n = 1; n <= 3; n++) {
      const response = await page.request.get(`${new URL(baseURL).origin}${new URL(baseURL).pathname}images/office-slider/office-slide-${String(n).padStart(2,'0')}.webp`);
      assert.equal(response.status(), 200);
    }
    await page.close();
  } finally { await browser.close(); }
});

test('office cycles entrance, map, sign and wraps at 5s with 800ms fade', { timeout: 32000 }, async () => {
  const browser = await chromium.launch();
  try {
    const page = await open(browser);
    const seen = [await current(page)]; const times = [Date.now()];
    for (const number of [2,3,1]) {
      if (number === 2) {
        const fade = page.locator('.office-photo-slides .photo-frame.incoming.shown');
        await fade.waitFor({ timeout: 8000 });
        await page.waitForTimeout(120);
        const state = await fade.evaluate(el => ({ duration: getComputedStyle(el).transitionDuration, opacity: Number(getComputedStyle(el).opacity), baseOpacity: Number(getComputedStyle(el.previousElementSibling).opacity) }));
        assert.equal(state.duration, '0.8s');
        assert.ok(state.opacity > 0 && state.opacity < 1 && state.baseOpacity === 1, `office crossfade ${JSON.stringify(state)}`);
        if (evidence) await page.locator('.office-editorial').screenshot({ path: `${evidence}/office-crossfade.png` });
      }
      await page.waitForFunction(n => Number(document.querySelector('.office-photo-slides img')?.getAttribute('src')?.match(/office-slide-(\d\d)/)?.[1]) === n, number, { timeout: 8500 });
      seen.push(await current(page)); times.push(Date.now());
      const loaded = await page.locator('.office-photo-slides img').first().evaluate(el => el.complete && el.naturalWidth > 0 && Number(getComputedStyle(el).opacity) > .99);
      assert.ok(loaded, 'no solid valid base below incoming photo');
      const frame = await page.locator('.office-photo-slides img').first().evaluate(el => ({
        fit: getComputedStyle(el).objectFit, intrinsic: [el.naturalWidth, el.naturalHeight],
        image: el.getBoundingClientRect().toJSON(), card: el.closest('.office-editorial').getBoundingClientRect().toJSON(),
      }));
      assert.equal(frame.fit, 'fill', `slide ${number}: show the full source, not a crop`);
      assert.deepEqual(frame.intrinsic, { 1: [1280,649], 2: [1280,834], 3: [686,800] }[number]);
      assert.ok(Math.abs(frame.image.width - frame.card.width) < 1 && Math.abs(frame.image.height - frame.card.height) < 1);
      assert.equal(await page.locator('.office-photo-slides .photo-frame').first().evaluate(el => getComputedStyle(el, '::before').content), 'none');
      if (evidence) await page.locator('.office-editorial').screenshot({ path: `${evidence}/office-desktop-slide-${number}.png` });
    }
    assert.deepEqual(seen, [1,2,3,1]);
    assert.ok(times.slice(1).every((t,i) => t-times[i] >= (i ? 4600 : 5600) && t-times[i] < (i ? 5600 : 6700)));
    if (evidence) await writeFile(`${evidence}/office-cycle.json`, JSON.stringify({ seen, elapsedMs: times.map(t => t-times[0]) }, null, 2));
    await page.close();
  } finally { await browser.close(); }
});

test('office mobile auto-advances and reduced-motion/hidden/offscreen pause', { timeout: 38000 }, async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [390, 320]) {
      const mobile = await open(browser, width, width === 390 ? 844 : 700);
      for (const number of [2, 3]) {
        await mobile.waitForFunction(n => document.querySelector('.office-photo-slides img')?.getAttribute('src')?.includes(`office-slide-0${n}`), number, { timeout: 8500 });
        assert.equal(await current(mobile), number);
        const frame = await mobile.locator('.office-photo-slides img').first().evaluate(el => ({
          fit: getComputedStyle(el).objectFit, intrinsic: [el.naturalWidth, el.naturalHeight],
          image: el.getBoundingClientRect().toJSON(), card: el.closest('.office-editorial').getBoundingClientRect().toJSON(),
        }));
        assert.equal(frame.fit, 'fill');
        assert.deepEqual(frame.intrinsic, number === 2 ? [1280, 834] : [686, 800]);
        assert.ok(Math.abs(frame.image.width - frame.card.width) < 1 && Math.abs(frame.image.height - frame.card.height) < 1);
        assert.equal(await mobile.locator('.office-photo-slides .photo-frame').first().evaluate(el => getComputedStyle(el, '::before').content), 'none');
        if (evidence) await mobile.locator('.office-editorial').screenshot({ path: `${evidence}/office-${width}-slide-${number}.png` });
      }
      await mobile.close();
    }
    const reduced = await open(browser, 390, 844, 'reduce');
    await reduced.clock.install(); await reduced.clock.fastForward(12000);
    assert.equal(await current(reduced), 1);
    assert.equal(await reduced.locator('.office-photo-slides img').count(), 1);
    await reduced.close();
    const hidden = await open(browser);
    await hidden.evaluate(() => { Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
    await hidden.clock.install(); await hidden.clock.fastForward(12000);
    assert.equal(await current(hidden), 1);
    await hidden.close();
    const offscreen = await open(browser);
    await offscreen.evaluate(() => scrollTo(0, 0));
    await offscreen.waitForTimeout(150);
    await offscreen.clock.install(); await offscreen.clock.fastForward(12000);
    assert.equal(await current(offscreen), 1);
    await offscreen.close();
  } finally { await browser.close(); }
});
