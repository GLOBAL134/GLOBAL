import test from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const baseURL = process.env.BASE_URL;
if (!baseURL) throw new Error('BASE_URL required');
const sizes = [[1920, 1080], [1440, 900], [1051, 900], [768, 1024], [430, 900], [390, 844], [375, 844], [320, 720]];
const intro = 'После отправки заявка поступит специалисту GLOBAL.';
const supporting = 'Мы свяжемся с вами, уточним детали поездки и подскажем дальнейшие шаги.';
const items = ['Персональная консультация', 'Уникальный номер каждой заявки', 'Контактные данные используются только для связи по вашей заявке'];

test('services, decorative index, trust and hero stay responsive', async () => {
  const browser = await chromium.launch();
  try {
    for (const [width, height] of sizes) {
      const page = await browser.newPage({ viewport: { width, height }, reducedMotion: 'reduce' });
      try {
        await page.goto(baseURL, { waitUntil: 'networkidle' });
        const state = await page.evaluate(() => {
          const box = (element) => element?.getBoundingClientRect().toJSON();
          const paragraph = document.querySelector('.services-section .section-heading.split > p');
          const insurance = document.querySelector('.service-list h3');
          const container = document.querySelector('.services-section > .container');
          const scene = document.querySelector('.travel-scene');
          const heroGrid = document.querySelector('.hero-grid');
          const sceneStyle = getComputedStyle(scene);
          const image = scene.querySelector('img');
          const trust = document.querySelector('.lead-grid > div:first-child');
          const list = trust.querySelector('ul');
          const lis = [...list.querySelectorAll(':scope > li')];
          return {
            paragraph: box(paragraph), insurance: box(insurance), container: box(container),
            paragraphSize: getComputedStyle(paragraph).fontSize,
            paragraphLine: getComputedStyle(paragraph).lineHeight,
            numbers: [...document.querySelectorAll('.service-feature .service-number')].map(x => x.textContent),
            scene: box(scene), heroGrid: box(heroGrid), sceneLeft: sceneStyle.left, sceneTop: sceneStyle.top,
            image: { src: image.currentSrc, loaded: image.complete && image.naturalWidth === 1536 && image.naturalHeight === 1024 },
            trustParas: [...trust.querySelectorAll(':scope > p')].map(p => p.textContent.replace(/\s+/g, ' ').trim()),
            trustItems: lis.map(li => li.textContent.replace(/\s+/g, ' ').trim()),
            trustIcons: lis.map(li => li.querySelectorAll('svg').length),
            trustDisplay: getComputedStyle(list).display,
            trustStyle: getComputedStyle(list).listStyleType,
            trustGap: getComputedStyle(list).rowGap,
            trustBoxes: lis.map(box),
            scrollOverflow: document.documentElement.scrollWidth - innerWidth,
          };
        });
        assert.equal(state.scrollOverflow, 0, `${width}: horizontal overflow`);
        assert.equal(state.paragraphSize, '16px');
        assert.equal(state.paragraphLine, '28px');
        if (width > 1050) {
          assert.ok(Math.abs(state.paragraph.left - state.insurance.left) <= 2, `${width}: intro ${state.paragraph.left} vs insurance ${state.insurance.left}`);
          assert.equal(state.sceneTop, '-70px', `${width}: desktop hero not lifted`);
          const expectedShift = Math.min(133, width - state.heroGrid.right - 16);
          assert.ok(Math.abs(parseFloat(state.sceneLeft) - expectedShift) <= 2, `${width}: desktop hero not responsively shifted right`);
          assert.ok(Math.abs(state.scene.right - state.heroGrid.right - expectedShift) <= 2, `${width}: desktop collage has wrong displacement`);
        } else {
          assert.ok(Math.abs(state.paragraph.left - state.container.left) <= 2, `${width}: stacked intro not container-aligned`);
          assert.equal(state.sceneTop, '0px', `${width}: mobile hero vertical shift`);
          assert.equal(state.sceneLeft, '0px', `${width}: mobile hero horizontal shift`);
          assert.ok(Math.abs((state.scene.left + state.scene.right - state.heroGrid.left - state.heroGrid.right) / 2) <= 2, `${width}: mobile collage not centered`);
        }
        assert.ok(state.scene.left >= 0 && state.scene.right <= width, `${width}: hero leaves viewport`);
        assert.equal(state.image.loaded, true, `${width}: original collage not loaded`);
        assert.match(state.image.src, /\/site-GLOBAL\/images\/global-visa-collage\.webp$/);
        assert.deepEqual(state.numbers, [], `${width}: decorative number remains`);
        assert.deepEqual(state.trustParas, [intro, supporting], `${width}: trust paragraphs`);
        assert.deepEqual(state.trustItems, items, `${width}: trust items`);
        assert.deepEqual(state.trustIcons, [1, 1, 1], `${width}: outline SVG icons`);
        assert.equal(state.trustDisplay, 'grid', `${width}: trust list not vertical grid`);
        assert.equal(state.trustStyle, 'none', `${width}: default bullets remain`);
        assert.ok(parseFloat(state.trustGap) >= 12, `${width}: trust items touch`);
        for (let i = 1; i < 3; i++) assert.ok(state.trustBoxes[i].top - state.trustBoxes[i - 1].bottom >= 12, `${width}: trust item spacing`);
        assert.ok(state.trustBoxes.every(box => box.left >= 0 && box.right <= width), `${width}: trust item overflow`);
      } finally { await page.close(); }
    }
  } finally { await browser.close(); }
});
