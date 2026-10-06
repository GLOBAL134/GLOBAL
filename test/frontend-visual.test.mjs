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
          collage: (() => {
            const deck = document.querySelector('.hero .visa-deck');
            const image = deck?.querySelector('img');
            return { deck: rect(deck), image: rect(image), src: image?.currentSrc, loaded: image?.complete && image.naturalWidth === 1536 && image.naturalHeight === 1024,
              fit: image && getComputedStyle(image).objectFit, pieces: deck?.children.length,
              copy: rect(document.querySelector('.hero-copy')), emblem: deck?.querySelector('svg') };
          })(),
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
      const { collage } = result;
      assert.ok(collage.loaded, `${width}px: approved collage missing or dimensions changed`);
      assert.match(collage.src, /\/site-GLOBAL\/images\/global-visa-collage\.webp$/);
      assert.equal(collage.fit, 'contain');
      assert.equal(collage.pieces, 1, `${width}px: old deck still present`);
      assert.equal(collage.emblem, null, `${width}px: duplicate emblem`);
      assert.ok(collage.image.left >= -1 && collage.image.right <= width + 1, `${width}px: collage leaves viewport`);
      assert.ok(Math.abs((collage.image.left + collage.image.right - collage.deck.left - collage.deck.right) / 2) < 2, `${width}px: collage not centered`);
      if (width <= 1050) assert.ok(collage.image.top >= collage.copy.bottom - 1, `${width}px: collage not below copy`);
    });
  }
});

test('popular mosaic has five ordered cards with the intended desktop spans and mobile stack', async () => {
  for (const width of widths) {
    await withPage(width, async (page) => {
      const cards = await page.locator('.visual-country').evaluateAll((elements) => elements.map((element) => ({
        name: element.querySelector('h3')?.textContent,
        x: element.getBoundingClientRect().x,
        y: element.getBoundingClientRect().y,
        w: element.getBoundingClientRect().width,
        h: element.getBoundingClientRect().height,
      })));
      assert.deepEqual(cards.map((card) => card.name), ['Шенген', 'Великобритания', 'Япония', 'Китай', 'Южная Корея']);
      if (width > 700) {
        assert.ok(cards[0].h > cards[1].h * 1.8, `${width}px: Schengen must span both rows`);
        assert.ok(cards[1].w > cards[2].w * 2.8, `${width}px: UK must span all three right columns`);
        assert.ok(Math.abs(cards[2].w - cards[3].w) < 2 && Math.abs(cards[3].w - cards[4].w) < 2);
        assert.ok(cards.slice(1).every((card) => card.x >= cards[0].x + cards[0].w));
      } else {
        assert.ok(cards.every((card, index) => index === 0 || card.y >= cards[index - 1].y + cards[index - 1].h));
      }
    });
  }
});

test('contact channels, excerpt and selected calculator extras reach the real form without posting', async () => {
  await withPage(390, async (page) => {
    await page.locator('.burger').click();
    assert.equal(await page.locator('.mobile-menu a[href^="https://t.me/"]').count(), 1);
    assert.equal(await page.locator('.mobile-menu a[href^="https://max.ru/"]').count(), 1);
    await page.locator('.mobile-menu button[aria-label="Закрыть"]').click();
    assert.equal(await page.locator('.review-stage cite').innerText(), 'Анна Карпова');
    assert.equal(await page.locator('.review-stage article a').getAttribute('href'), 'https://2gis.ru/reviews/141265770283147/review/212502268');
    for (const extra of ['Бронирование авиабилетов', 'Бронирование отелей', 'Запись на подачу документов']) {
      await page.locator(`.calculator fieldset input[value="${extra}"]`).check();
    }
    await page.locator('.calculator button').filter({ hasText: 'Получить точный расчёт' }).click();
    const form = page.locator('.lead-modal form');
    const comment = await form.locator('textarea[name="comment"]').inputValue();
    for (const extra of ['Бронирование авиабилетов', 'Бронирование отелей', 'Запись на подачу документов']) {
      assert.ok(comment.includes(extra), `Lost extra: ${extra}`);
    }
    assert.equal(await form.locator('select[name="service"]').inputValue(), 'Оформление виз');
    assert.equal(await form.locator('input[name="consent"]').isChecked(), false);
  });
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

test('motion is restrained, scroll-triggered and disabled for reduced motion', async () => {
  await withPage(1440, async (page) => {
    const intro = await page.locator('.hero-copy').evaluate((element) => getComputedStyle(element).animationName);
    assert.notEqual(intro, 'none', 'hero needs an entrance animation');
    const heading = page.locator('#countries .section-heading');
    await heading.scrollIntoViewIfNeeded();
    await page.waitForFunction(() => {
      const element = document.querySelector('#countries .section-heading');
      return element?.classList.contains('is-visible') && getComputedStyle(element).opacity === '1';
    });
    assert.equal(await heading.evaluate((element) => getComputedStyle(element).opacity), '1');
  });

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  try {
    await page.goto(baseURL, { waitUntil: 'networkidle' });
    const state = await page.evaluate(() => ({
      intro: getComputedStyle(document.querySelector('.hero-copy')).animationName,
      marquee: getComputedStyle(document.querySelector('.service-marquee > div')).animationName,
      heading: getComputedStyle(document.querySelector('#countries .section-heading')).opacity,
    }));
    assert.equal(state.intro, 'none');
    assert.equal(state.marquee, 'none');
    assert.equal(state.heading, '1');
  } finally {
    await browser.close();
  }
});

test('country detail opens a prefilled consultation form without a second overlay', async () => {
  await withPage(1440, async (page) => {
    await page.locator('.visual-country').nth(2).click();
    const detail = page.getByRole('dialog');
    assert.equal(await detail.locator('.country-modal').count(), 1);
    await detail.getByRole('button', { name: 'Получить консультацию' }).click();
    const form = page.getByRole('dialog').locator('.lead-modal form');
    await form.waitFor({ state: 'visible' });
    assert.equal(await page.getByRole('dialog').count(), 1);
    assert.equal(await form.locator('select[name="country"]').inputValue(), 'Япония');
    await form.locator('input[name="name"]').fill('Проверка интерфейса');
    await form.locator('input[name="phone"]').fill('+79991112233');
    await form.locator('input[name="consent"]').check();
    assert.equal(await form.locator('input[name="consent"]').isChecked(), true);
    // No production request: this test verifies interaction, not delivery.
  });
});

test('country detail uses a flag fallback when no country image exists', async () => {
  await withPage(1440, async (page) => {
    await page.locator('.country-group-list button').filter({ hasText: 'Австрия' }).click();
    const detail = page.locator('.country-modal');
    assert.equal(await detail.locator('.country-modal-visual img').count(), 0);
    assert.equal(await detail.locator('.country-placeholder').count(), 1);
    assert.equal(await detail.locator('.country-placeholder span').innerText(), '🇦🇹');
  });
});

test('country directory keeps all 36 entries, removes the secondary search, and preserves hero search', async () => {
  for (const width of [1920, 1440, 390]) {
    await withPage(width, async (page) => {
      await page.locator('#countries').scrollIntoViewIfNeeded();
      assert.equal(await page.locator('.country-search').count(), 0, `${width}px: secondary country search remains`);
      assert.equal(await page.locator('.country-group-list button').count(), 36);
      assert.equal(await page.locator('.country-group').nth(0).locator('button').count(), 29);
      assert.equal(await page.locator('.country-group').nth(1).locator('button').count(), 7);
      assert.equal(await page.locator('.country-group-list').getByText('Ирландия').count(), 0);

      const state = await page.evaluate(() => {
        const heading = document.querySelector('#countries .section-heading');
        const showcase = document.querySelector('#countries .country-showcase');
        const headingRect = heading?.getBoundingClientRect();
        const showcaseRect = showcase?.getBoundingClientRect();
        const cards = [...document.querySelectorAll('#countries .visual-country')];
        return {
          gap: (showcaseRect?.top ?? 0) - (headingRect?.bottom ?? 0),
          cards: cards.map((card) => {
            const rect = card.getBoundingClientRect();
            return {
              width: rect.width,
              height: rect.height,
              cursor: getComputedStyle(card).cursor,
            };
          }),
          heroSearch: document.querySelector('#hero-country')?.getAttribute('placeholder'),
        };
      });
      assert.equal(state.gap, 28, `${width}px: country cards need the standard heading gap`);
      assert.equal(state.heroSearch, 'Введите страну…', `${width}px: hero search was removed or changed`);
      assert.equal(state.cards.length, 5, `${width}px: popular card count changed`);
      for (const [index, card] of state.cards.entries()) {
        assert.ok(card.width > 0 && card.height > 0, `${width}px card ${index}: card has no clickable size`);
        assert.equal(card.cursor, 'pointer', `${width}px card ${index}: card is not clickable`);
      }

      const countrySelect = page.locator('.calculator .calc-panel select').nth(0);
      const serviceSelect = page.locator('.calculator .calc-panel select').nth(1);
      assert.equal(await countrySelect.locator('option').count(), 36);
      assert.equal(await countrySelect.locator('option[value="Шенген"]').count(), 0);
      assert.equal(await serviceSelect.locator('option').count(), 4);

      const extras = page.locator('.calculator fieldset input[type="checkbox"]');
      assert.deepEqual(await extras.evaluateAll((inputs) => inputs.map((input) => input.value)), [
        'Медицинское страхование путешественников',
        'Нотариально заверенный перевод',
        'Фото и копировальные услуги',
        'Бронирование авиабилетов',
        'Бронирование отелей',
        'Запись на подачу документов',
      ]);
      await serviceSelect.selectOption('Медицинское страхование путешественников');
      assert.deepEqual(await extras.evaluateAll((inputs) => inputs.map((input) => input.value)), [
        'Нотариально заверенный перевод',
        'Фото и копировальные услуги',
        'Бронирование авиабилетов',
        'Бронирование отелей',
        'Запись на подачу документов',
      ]);

      for (const card of await page.locator('.visual-country').all()) {
        await card.click();
        assert.equal(await page.locator('.country-modal').count(), 1, `${width}px: popular card is not clickable`);
        await page.getByRole('button', { name: 'Закрыть окно' }).click();
      }
    });
  }
});

test('wizard uses a real country and service preset without posting', async () => {
  await withPage(1440, async (page) => {
    await page.locator('.wizard-promo button').click();
    const wizard = page.locator('.wizard');
    await wizard.getByLabel('Страна поездки').fill('Германия');
    await wizard.getByRole('button', { name: 'Продолжить' }).click();
    await wizard.getByRole('button', { name: 'Туризм' }).click();
    await wizard.getByRole('button', { name: 'Продолжить' }).click();
    await wizard.getByLabel('Месяц поездки').fill('2027-05');
    await wizard.getByRole('button', { name: 'Продолжить' }).click();
    await wizard.getByRole('button', { name: 'Увеличить количество путешественников' }).click();
    await wizard.getByRole('button', { name: 'Продолжить' }).click();
    await wizard.getByRole('button', { name: 'Да' }).click();
    await wizard.getByRole('button', { name: 'Получить консультацию' }).click();

    const form = page.locator('.lead-modal form');
    assert.equal(await form.locator('select[name="country"]').inputValue(), 'Германия');
    assert.equal(await form.locator('select[name="service"]').inputValue(), 'Оформление виз');
    assert.match(await form.locator('textarea[name="comment"]').inputValue(), /Дата: 2027-05/);
  });
});

test('Schengen aggregate requires a concrete country before opening the form', async () => {
  await withPage(1440, async (page) => {
    await page.locator('.visual-country').first().click();
    const detail = page.locator('.country-modal');
    const cta = detail.getByRole('button', { name: 'Выбрать страну и получить консультацию' });
    assert.equal(await cta.isDisabled(), true);
    await detail.locator('#schengen-country-select').selectOption('Франция');
    assert.equal(await cta.isDisabled(), false);
    await cta.click();
    const form = page.locator('.lead-modal form');
    assert.equal(await form.locator('select[name="country"]').inputValue(), 'Франция');
    assert.equal(await form.locator('select[name="country"] option[value="Шенген"]').count(), 0);
  });
});

test('insurance and translation cards have detail and lead presets', async () => {
  await withPage(1440, async (page) => {
    const insurance = page.locator('.service-list article').filter({ hasText: 'Медицинское страхование путешественников' });
    await insurance.getByRole('button', { name: 'Подробнее' }).click();
    const detail = page.locator('.service-modal');
    assert.match(await detail.innerText(), /Евроинс/);
    assert.match(await detail.innerText(), /АльфаСтрахование/);
    await detail.getByRole('button', { name: 'Получить консультацию' }).click();
    assert.equal(
      await page.locator('.lead-modal form select[name="service"]').inputValue(),
      'Медицинское страхование путешественников',
    );
  });

  await withPage(1440, async (page) => {
    const translations = page.locator('.service-list article').filter({ hasText: 'Нотариально заверенные переводы' });
    await translations.getByRole('button', { name: 'Подробнее' }).click();
    const detail = page.locator('.service-modal');
    assert.match(await detail.innerText(), /Перевод документов на английский язык/);
    await detail.getByRole('button', { name: 'Получить консультацию' }).click();
    const form = page.locator('.lead-modal form');
    assert.equal(await form.locator('select[name="service"]').inputValue(), 'Нотариально заверенный перевод');
    assert.equal(await form.locator('textarea[name="comment"]').inputValue(), 'Язык: Английский');
  });
});
