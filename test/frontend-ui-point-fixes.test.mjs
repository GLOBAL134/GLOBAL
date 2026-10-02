import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error('BASE_URL is required (for example: BASE_URL=http://127.0.0.1:4194/site-GLOBAL/)');
}

const viewports = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
];

async function withPage(viewport, fn) {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport });
  const posts = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') posts.push(request.url());
  });
  try {
    await page.goto(`${baseURL}?ui-point-fixes=${Date.now()}-${viewport.width}`, {
      waitUntil: 'networkidle',
    });
    await fn(page);
    assert.deepEqual(posts, [], `${viewport.width}px: unexpected POST requests`);
  } finally {
    await browser.close();
  }
}

function pixels(value) {
  return Number.parseFloat(value) || 0;
}

test('hero country dropdown stays above ticker and remains clickable after ticker scroll', async () => {
  for (const viewport of viewports) {
    await withPage(viewport, async (page) => {
      const input = page.locator('#hero-country');
      await input.fill('Япония');
      const option = page.locator('.search-results button').first();
      await option.waitFor({ state: 'visible' });
      await page.locator('.service-marquee').scrollIntoViewIfNeeded();
      await option.scrollIntoViewIfNeeded();

      const hit = await page.evaluate(() => {
        const dropdown = document.querySelector('.search-results');
        const option = dropdown?.querySelector('button');
        const ticker = document.querySelector('.service-marquee');
        if (!dropdown || !option || !ticker) return null;
        const rect = option.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        return {
          x,
          y,
          visible: rect.top >= 0 && rect.bottom <= innerHeight,
          topTag: document.elementsFromPoint(x, y)[0]?.tagName,
          topInteractive: document.elementsFromPoint(x, y).find((element) => element.closest('button'))?.closest('button')?.tagName,
          topClass: document.elementsFromPoint(x, y)[0]?.className,
          heroOverflowY: getComputedStyle(document.querySelector('.hero')).overflowY,
          dropdownZ: getComputedStyle(dropdown).zIndex,
          tickerZ: getComputedStyle(ticker).zIndex,
        };
      });

      assert.ok(hit, `${viewport.width}px: dropdown hit target missing`);
      assert.equal(hit.heroOverflowY, 'visible', `${viewport.width}px: hero clips dropdown`);
      assert.ok(hit.visible, `${viewport.width}px: dropdown option is not in the viewport`);
      assert.equal(hit.topInteractive, 'BUTTON', `${viewport.width}px: elementsFromPoint did not hit dropdown option`);
      assert.ok(pixels(hit.dropdownZ) > pixels(hit.tickerZ), `${viewport.width}px: dropdown must stack above ticker`);

      await page.mouse.click(hit.x, hit.y);
      await page.locator('.country-modal').waitFor({ state: 'visible' });
      assert.match(await page.locator('.country-modal').innerText(), /Япония/);
    });
  }
});

test('service, countries, wizard and trust point fixes keep scoped spacing and exact copy', async () => {
  for (const viewport of viewports) {
    await withPage(viewport, async (page) => {
      const state = await page.evaluate(() => {
        const gap = (upper, lower) => {
          const upperRect = upper?.getBoundingClientRect();
          const lowerRect = lower?.getBoundingClientRect();
          return (lowerRect?.top ?? 0) - (upperRect?.bottom ?? 0);
        };
        const serviceHeading = document.querySelector('.services-section .section-heading');
        const serviceIntro = serviceHeading?.querySelector('p');
        const serviceH2 = serviceHeading?.querySelector('h2');
        const countryHeading = document.querySelector('.countries-section .section-heading');
        const countryP = countryHeading?.querySelector('p');
        const promo = document.querySelector('.wizard-promo > .container > div:first-child');
        const promoH2 = promo?.querySelector('h2');
        const promoP = promo?.querySelector('p');
        const promoButton = promo?.querySelector('button');
        const serviceCards = [...document.querySelectorAll('.service-list article')];
        return {
          serviceHeadingMargin: getComputedStyle(serviceHeading).marginBottom,
          serviceIntroMargin: getComputedStyle(serviceIntro).marginTop,
          serviceIntroGap: gap(serviceH2, serviceIntro),
          serviceNumbers: [...document.querySelectorAll('.service-list .service-number')].map((x) => x.textContent.trim()),
          serviceGrid: serviceCards.map((card) => getComputedStyle(card).gridTemplateColumns),
          serviceTextPadding: serviceCards.map((card) => getComputedStyle(card.querySelector(':scope > div')).paddingTop),
          serviceCardCount: serviceCards.length,
          countrySubtitleMargin: getComputedStyle(countryP).marginTop,
          wizardGapOne: gap(promoH2, promoP),
          wizardGapTwo: gap(promoP, promoButton),
          trustMessage: document.querySelector('.lead-grid > div > p')?.textContent.replace(/\s+/g, ' ').trim(),
          trustItems: [...document.querySelectorAll('.lead-grid > div > ul li')].map((x) => x.textContent.trim()),
        };
      });

      assert.ok(pixels(state.serviceHeadingMargin) <= 40, `${viewport.width}px: services heading gap is too large`);
      assert.equal(state.serviceIntroMargin, '10px', `${viewport.width}px: services intro margin changed unexpectedly`);
      assert.ok(Math.abs(state.serviceIntroGap) <= 120, `${viewport.width}px: services intro alignment gap is ${state.serviceIntroGap}px`);
      assert.equal(state.serviceCardCount, 3, `${viewport.width}px: service-list should contain three secondary cards`);
      assert.deepEqual(state.serviceNumbers, [], `${viewport.width}px: service-list numbering remains`);
      for (const grid of state.serviceGrid) {
        assert.equal(grid.split(' ').length, 2, `${viewport.width}px: service card has an empty grid track: ${grid}`);
      }
      for (const padding of state.serviceTextPadding) {
        assert.ok(pixels(padding) >= 8 && pixels(padding) <= 12, `${viewport.width}px: service text air is ${padding}`);
      }
      assert.equal(state.countrySubtitleMargin, '10px', `${viewport.width}px: countries subtitle margin should be small`);
      assert.ok(Math.abs(pixels(state.wizardGapOne) - pixels(state.wizardGapTwo)) <= 2, `${viewport.width}px: wizard intro gaps are uneven`);
      assert.ok(pixels(state.wizardGapOne) >= 12 && pixels(state.wizardGapOne) <= 24, `${viewport.width}px: wizard gap is not restrained`);
      assert.equal(
        state.trustMessage,
        'После отправки заявка поступит специалисту GLOBAL. Мы свяжемся с вами, уточним детали поездки и подскажем дальнейшие шаги.',
      );
      assert.deepEqual(state.trustItems, [
        'Персональная консультация',
        'Уникальный номер каждой заявки',
        'Контактные данные используются только для связи по вашей заявке',
      ]);
    });
  }
});
