import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error('BASE_URL is required (for example: BASE_URL=http://127.0.0.1:4182/site-GLOBAL/)');
}

const widths = [1920, 1440, 1024, 768, 430, 390, 375, 320];
const evidence = process.env.EVIDENCE_DIR;

async function withPage(width, fn) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width, height: width >= 1200 ? 900 : 844 },
  });
  const consoleErrors = [];
  const asset404s = [];
  const postRequests = [];
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('response', (response) => {
    if (response.status() === 404 && ['image', 'stylesheet', 'script', 'font'].includes(response.request().resourceType())) {
      asset404s.push(response.url());
    }
  });
  page.on('request', (request) => {
    if (request.method() === 'POST' && request.frame() === page.mainFrame()) postRequests.push(request.url());
  });
  try {
    await page.goto(`${baseURL}?point-fixes=${Date.now()}-${width}`, { waitUntil: 'networkidle' });
    await fn(page);
    assert.deepEqual(consoleErrors, [], `${width}px: console errors: ${consoleErrors.join(' | ')}`);
    assert.deepEqual(asset404s, [], `${width}px: asset 404s: ${asset404s.join(' | ')}`);
    assert.deepEqual(postRequests, [], `${width}px: unexpected POST requests`);
  } finally {
    await browser.close();
  }
}

function numericPixels(value) {
  return Number.parseFloat(value) || 0;
}

test('gallery replaces only photos 02/03; preserves photo 01, tiles and shared lightbox', async () => {
  const names = ['gallery-01.webp', 'hammock-beach.webp', 'bike-alpine-lake.webp'];
  const alts = ['Пара с чемоданами в аэропорту', 'Мужчина отдыхает в гамаке на пляже у моря', 'Женщина на велосипеде у альпийского озера и гор'];
  const sha256 = bytes => createHash('sha256').update(bytes).digest('hex');
  const airportHash = '08dbc3737cdf2514a4901ad47ed994a8bee2cc9054433adbe2d45b3d657741f4';
  assert.equal(sha256(await readFile(new URL('../public/images/gallery/gallery-01.webp', import.meta.url))), airportHash);
  for (const width of widths) {
    await withPage(width, async (page) => {
      const gallery = page.locator('.gallery-masonry');
      await gallery.scrollIntoViewIfNeeded();
      for (let i = 0; i < 3; i++) {
        const card = gallery.locator('button').nth(i);
        await card.scrollIntoViewIfNeeded();
        await card.locator('img').evaluate(img => img.decode());
        if (evidence) {
          await mkdir(evidence, { recursive: true });
          await card.screenshot({ path: `${evidence}/gallery-${width}-card-${i + 1}.png` });
        }
      }
      const tiles = await gallery.locator('button').evaluateAll(buttons => buttons.map(button => {
        const img = button.querySelector('img'), rect = button.getBoundingClientRect();
        return { rect: rect.toJSON(), src: img.currentSrc, loaded: img.complete && img.naturalWidth > 0,
          fit: getComputedStyle(img).objectFit, alt: img.alt, radius: getComputedStyle(button).borderRadius,
          number: button.querySelector('span')?.textContent };
      }));
      assert.equal(tiles.length, 3);
      tiles.forEach((tile, i) => {
        assert.ok(tile.src.endsWith(`/site-GLOBAL/images/gallery/${names[i]}`), `${width}px: wrong gallery photo ${i + 1}: ${tile.src}`);
        assert.ok(tile.loaded, `${width}px: gallery photo ${i + 1} failed to load`);
        assert.equal(tile.fit, 'cover');
        assert.equal(tile.alt, alts[i]);
        assert.equal(tile.radius, '25px');
        assert.equal(tile.number, `0${i + 1}`);
      });
      const airportResponse = await page.request.get(tiles[0].src);
      assert.equal(airportResponse.status(), 200);
      assert.equal(sha256(await airportResponse.body()), airportHash);
      if (width > 700) {
        assert.ok(Math.abs(tiles[0].rect.height - 575) < 1);
        assert.ok(Math.abs(tiles[1].rect.height - 280) < 1 && Math.abs(tiles[2].rect.height - 280) < 1);
        assert.ok(Math.abs(tiles[0].rect.right + 15 - tiles[1].rect.left) < 1);
        assert.ok(Math.abs(tiles[1].rect.bottom + 15 - tiles[2].rect.top) < 1);
      } else {
        assert.ok(tiles.every(t => Math.abs(t.rect.height - 380) < 1 && t.rect.width <= width));
        const scroll = await gallery.evaluate(el => ({ width: el.clientWidth, content: el.scrollWidth }));
        assert.ok(scroll.content > scroll.width, `${width}px: gallery must scroll within its container`);
      }
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1), `${width}px: document horizontal overflow`);
      if ([1440, 390].includes(width)) {
        for (let i = 0; i < 3; i++) {
          await gallery.locator('button').nth(i).click();
          const photo = page.locator('.lightbox img');
          assert.ok((await photo.getAttribute('src')).endsWith(`/site-GLOBAL/images/gallery/${names[i]}`));
          assert.equal(await photo.getAttribute('alt'), alts[i]);
          assert.ok(await photo.evaluate(img => img.complete && img.naturalWidth > 0));
          if (evidence) await page.locator('.lightbox').screenshot({ path: `${evidence}/gallery-lightbox-${width}-${i + 1}.png` });
          await page.locator('.lightbox-next').click();
          assert.ok((await photo.getAttribute('src')).endsWith(`/site-GLOBAL/images/gallery/${names[(i + 1) % 3]}`));
          await page.locator('.lightbox-prev').click();
          assert.ok((await photo.getAttribute('src')).endsWith(`/site-GLOBAL/images/gallery/${names[i]}`));
          await page.locator('.lightbox-close').click();
          assert.equal(await page.locator('.lightbox').count(), 0);
        }
      }
    });
  }
});

test('point fixes preserve bounds and place hero stats only on mobile', async () => {
  for (const width of widths) {
    await withPage(width, async (page) => {
      const state = await page.evaluate(() => {
        const faq = document.querySelector('.faq-grid .btn');
        const faqStyle = faq ? getComputedStyle(faq) : null;
        const proof = document.querySelector('.hero-proof');
        const proofText = proof ? getComputedStyle(proof) : null;
        const hero = document.querySelector('.hero');
        const heroStyle = hero ? getComputedStyle(hero) : null;
        const stats = proof ? getComputedStyle(proof.querySelector('b')) : null;
        const officeImages = [...document.querySelectorAll('.office-photo-slides img')]
          .filter((image) => image.currentSrc.includes('/images/office-slider/office-slide-01.webp'))
          .map((image) => ({ src: image.currentSrc, naturalWidth: image.naturalWidth }));
        return {
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          faqMarginTop: faqStyle?.marginTop,
          officeImages,
          proofDisplay: proofText?.display,
          proofGrid: proofText?.gridTemplateColumns,
          proofColor: proofText?.color,
          proofStatColor: stats?.color,
          heroBackground: heroStyle?.backgroundColor,
          proofBounds: proof?.getBoundingClientRect().toJSON(),
        };
      });

      assert.ok(state.overflow <= 1, `${width}px: horizontal overflow ${state.overflow}px`);
      assert.ok(state.officeImages.length >= 1, `${width}px: office asset is not rendered`);
      for (const image of state.officeImages) {
        assert.match(image.src, /\/images\/office-slider\/office-slide-01\.webp$/);
        assert.ok(image.naturalWidth > 0, `${width}px: office asset did not load`);
      }
      assert.ok(numericPixels(state.faqMarginTop) >= 20, `${width}px: FAQ CTA margin-top is ${state.faqMarginTop}`);
      if (width >= 768) {
        assert.equal(state.proofDisplay, 'none', `${width}px: hero stats must be hidden`);
      } else {
        assert.equal(state.proofDisplay, 'grid', `${width}px: hero stats must use mobile grid`);
        assert.ok(state.proofGrid?.split(' ').length >= 2, `${width}px: mobile stats need grid columns`);
        assert.ok(state.proofBounds.width <= width + 1, `${width}px: stats exceed viewport`);
        assert.notEqual(state.proofColor, 'rgba(0, 0, 0, 0)', `${width}px: stats need contrast color`);
        assert.equal(state.proofStatColor, 'rgb(255, 255, 255)', `${width}px: stat values need strong contrast`);
      }
    });
  }
});

test('FAQ, calculator copy, trust copy and review links match the point-fix contract', async () => {
  await withPage(1440, async (page) => {
    const contract = await page.evaluate(() => ({
      faqMarginTop: getComputedStyle(document.querySelector('.faq-grid .btn')).marginTop,
      calculator: document.querySelector('.calculator > div:first-child p')?.textContent.trim(),
      trustMessages: [...document.querySelectorAll('.lead-grid > div > p')].map(x => x.textContent.replace(/\s+/g, ' ').trim()),
      trust: document.querySelector('.lead-section')?.innerText,
      reviewLinks: [...document.querySelectorAll('.review-links a')].map((link) => {
        const style = getComputedStyle(link);
        const arrow = link.querySelector('[data-review-arrow]');
        return {
          text: link.innerText,
          borderStyle: style.borderStyle,
          borderRadius: style.borderRadius,
          padding: style.padding,
          arrow: arrow?.textContent,
          arrowDisplay: arrow ? getComputedStyle(arrow).display : null,
        };
      }),
    }));

    assert.ok(numericPixels(contract.faqMarginTop) >= 20, `FAQ CTA margin-top is ${contract.faqMarginTop}`);
    assert.equal(
      contract.calculator,
      'Показываем стоимость только в тех случаях, когда стоимость услуги GLOBAL подтверждена и опубликована.',
    );
    assert.deepEqual(
      contract.trustMessages,
      ['После отправки заявка поступит специалисту GLOBAL.', 'Мы свяжемся с вами, уточним детали поездки и подскажем дальнейшие шаги.'],
    );
    assert.match(contract.trust, /Персональная консультация/);
    assert.match(contract.trust, /Уникальный номер каждой заявки/);
    assert.match(contract.trust, /Контактные данные используются только для связи по вашей заявке/);
    assert.equal(contract.reviewLinks.length, 2);
    for (const link of contract.reviewLinks) {
      assert.notEqual(link.borderStyle, 'none');
      assert.ok(numericPixels(link.borderRadius) >= 8, `${link.text}: rounded border required`);
      assert.ok(numericPixels(link.padding) >= 12, `${link.text}: padding required`);
      assert.equal(link.arrow, '↗');
      assert.notEqual(link.arrowDisplay, 'none');
    }
  });
});

test('review links expose hover movement and visible keyboard focus', async () => {
  await withPage(390, async (page) => {
    const link = page.locator('.review-links a').first();
    const arrow = link.locator('[data-review-arrow]');
    const before = await arrow.evaluate((element) => getComputedStyle(element).transform);
    await link.hover();
    const after = await arrow.evaluate((element) => getComputedStyle(element).transform);
    assert.notEqual(after, before, 'review arrow should move on hover');

    await link.focus();
    const outline = await link.evaluate((element) => {
      const style = getComputedStyle(element);
      return `${style.outlineStyle} ${style.outlineWidth}`;
    });
    assert.match(outline, /solid/);
    assert.ok(numericPixels(outline.split(' ').at(-1)) >= 2, `focus outline is ${outline}`);
  });
});
