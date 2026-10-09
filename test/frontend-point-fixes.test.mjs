import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error('BASE_URL is required (for example: BASE_URL=http://127.0.0.1:4182/site-GLOBAL/)');
}

const widths = [1920, 1440, 1024, 768, 430, 390, 375, 320];
const evidence = process.env.EVIDENCE_DIR;

async function withPage(width, fn, galleryRequests) {
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
    if (galleryRequests && new URL(request.url()).pathname.includes('/images/gallery/')) galleryRequests.push(request.url());
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

test('gallery is absent and reviews flow directly into FAQ', async () => {
  for (const width of widths) {
    const galleryRequests = [];
    await withPage(width, async (page) => {
      const reviews = page.locator('.reviews-section');
      const faq = page.locator('.faq-section');
      await reviews.scrollIntoViewIfNeeded();
      await faq.scrollIntoViewIfNeeded();
      const state = await page.evaluate(() => {
        const reviews = document.querySelector('.reviews-section');
        const faq = document.querySelector('.faq-section');
        return {
          adjacent: reviews?.nextElementSibling === faq,
          reviewsBottom: reviews?.getBoundingClientRect().bottom,
          faqTop: faq?.getBoundingClientRect().top,
          reviewText: reviews?.textContent,
          faqText: faq?.textContent,
          overflow: document.documentElement.scrollWidth - innerWidth,
        };
      });
      assert.equal(await page.locator('.gallery-section, .gallery-masonry, .lightbox').count(), 0, `${width}px: gallery DOM remains`);
      assert.equal(await page.getByText(/Знакомое место\s*до первого визита/).count(), 0, `${width}px: heading remains`);
      assert.equal(state.adjacent, true, `${width}px: reviews and FAQ must be adjacent siblings`);
      assert.ok(Math.abs(state.reviewsBottom - state.faqTop) <= 1, `${width}px: empty gap between sections`);
      assert.match(state.reviewText, /Опыт тех, кто уже обращался/);
      assert.match(state.faqText, /Что важно знать перед обращением/);
      assert.ok(state.overflow <= 1, `${width}px: horizontal overflow`);
      assert.deepEqual(galleryRequests, [], `${width}px: gallery image requests remain`);
      if (evidence && [1440, 390].includes(width)) {
        await mkdir(evidence, { recursive: true });
        await page.evaluate(() => scrollTo(0, scrollY + document.querySelector('.faq-section').getBoundingClientRect().top - innerHeight / 2));
        await page.screenshot({ path: `${evidence}/reviews-to-faq-${width}.png` });
      }
    }, galleryRequests);
  }
});

test('remaining menu, country, service, wizard and lead panels keep focus trap and Escape', async () => {
  await withPage(390, async (page) => {
    for (const [trigger, panel] of [
      ['button[aria-label="Открыть меню"]', '.mobile-menu.open'],
      ['.country-showcase .vc-2', '.country-modal'],
      ['.service-feature .inline-actions button:first-child', '.service-modal'],
      ['.hero-actions button:first-child', '.wizard'],
      ['.faq-grid .btn', '.lead-modal'],
    ]) {
      const opener = page.locator(trigger);
      await opener.click();
      const dialog = page.locator(panel);
      await dialog.waitFor();
      const focusables = dialog.locator('button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled])');
      assert.equal(await focusables.first().evaluate(el => document.activeElement === el), true, `${panel}: initial focus`);
      await page.keyboard.press('Shift+Tab');
      assert.equal(await focusables.last().evaluate(el => document.activeElement === el), true, `${panel}: reverse focus trap`);
      await page.keyboard.press('Tab');
      assert.equal(await focusables.first().evaluate(el => document.activeElement === el), true, `${panel}: forward focus trap`);
      await page.keyboard.press('Escape');
      assert.equal(await dialog.count(), 0, `${panel}: Escape closes panel`);
      assert.equal(await opener.evaluate(el => document.activeElement === el), true, `${panel}: focus restored`);
      assert.equal(await page.evaluate(() => document.body.style.overflow), '', `${panel}: scroll unlocked`);
    }
  });
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
