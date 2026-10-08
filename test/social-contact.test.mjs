import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import * as siteData from '../src/app/site-data.ts';
const WHATSAPP_URL = siteData.WHATSAPP_URL;

const source = readFileSync(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');

test('messenger links share a renderer and unaltered brand art', () => {
  assert.equal(WHATSAPP_URL, 'https://wa.me/79137871805');
  assert.match(source, /const SocialContactIcon\s*=/);
  assert.match(source, /max-colored\.svg/);
  assert.match(source, /whatsapp-white\.svg/);
  assert.match(source, /className="contact-row"><span>Telegram<\/span><b><SocialContactLink type="Telegram"/);
  assert.match(source, /className="contact-row"><span>MAX<\/span><b><SocialContactLink type="MAX"/);
  assert.match(source, /className="contact-row"><span>WhatsApp<\/span>/);
  assert.doesNotMatch(css, /max-icon-art|channel-icon-max img|channel-icon-max\s*\{[^}]*opacity/);
});

test('contact actions form a scoped responsive grid', () => {
  assert.match(css, /\.contact-actions\s*\{[^}]*display:\s*grid/);
  assert.match(css, /\.contact-actions\s*\{[^}]*repeat\(3,\s*minmax\(0,\s*1fr\)\)/);
});

const url = process.env.BASE_URL;
if (url) test('messenger surfaces and six ordered actions fit each viewport', async () => {
  const browser = await chromium.launch();
  try {
    for (const width of [1440, 1024, 768, 430, 390, 375, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.goto(url, { waitUntil: 'networkidle' });
      const result = await page.evaluate(() => {
        const names = ['Telegram', 'MAX', 'WhatsApp'];
        const surfaces = ['.header-actions', '.mobile-menu-actions', '.contact-card', '.footer-grid'];
        const social = surfaces.map(selector => {
          const root = document.querySelector(selector);
          return names.map(name => {
            const link = [...root.querySelectorAll('a')].find(a => a.getAttribute('aria-label') === `Открыть ${name} GLOBAL`);
            const img = link?.querySelector('img');
            return { href: link?.href, target: link?.target, rel: link?.rel, icon: !!(img || link?.querySelector('svg')),
              imageLoaded: img ? img.complete && img.naturalWidth > 0 : true, src: img?.src,
              mask: img ? getComputedStyle(img).maskImage : '', filter: img ? getComputedStyle(img).filter : '', opacity: img ? getComputedStyle(img).opacity : '' };
          });
        });
        const actions = [...document.querySelectorAll('.contact-actions > *')].map(el => {
          const r = el.getBoundingClientRect();
          const span = el.querySelector('.action-label') || el;
          return { label: el.textContent.trim(), x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height,
            clipped: span.scrollWidth > span.clientWidth + 1 };
        });
        return { social, actions, overflow: document.documentElement.scrollWidth - innerWidth, card: document.querySelector('.contact-card').getBoundingClientRect().toJSON() };
      });
      const destinations = ['https://t.me/SVC_GLOBAL_NSK', 'https://max.ru/u/f9LHodD0cOL9XCvB0s54oOa-5DtER3blB5RfJKiYU-tE9NGhkphplmudTYk', WHATSAPP_URL];
      for (const [surface, links] of result.social.entries()) for (const [index, link] of links.entries()) {
        assert.equal(link.href, destinations[index], `${width}px surface ${surface} social ${index}`);
        assert.equal(link.target, '_blank'); assert.match(link.rel, /noreferrer/);
        assert.ok(link.icon && link.imageLoaded, `${width}px surface ${surface} icon ${index} failed`);
        if (link.src) {
          assert.equal(link.mask, 'none'); assert.equal(link.filter, 'none'); assert.equal(link.opacity, '1');
          assert.match(link.src, /\/site-GLOBAL\/images\//);
        }
      }
      const actions = result.actions;
      assert.deepEqual(actions.map(a => a.label), ['Telegram', 'MAX', 'WhatsApp', 'Маршрут', 'Позвонить', 'Скопировать адрес']);
      assert.ok(result.overflow <= 1, `${width}px overflow ${result.overflow}`);
      const rows = [];
      for (const [index, a] of actions.entries()) {
        assert.ok(a.width >= 90 && a.height >= 40 && !a.clipped, `${width}px action ${index} clipped`);
        assert.ok(a.x >= result.card.x - 1 && a.right <= result.card.right + 1, `${width}px action ${index} outside card`);
        const prev = actions[index - 1];
        if (prev) assert.ok(a.y > prev.y + 1 || (Math.abs(a.y - prev.y) <= 1 && a.x >= prev.right - 1), `${width}px actions overlap/out of order`);
        if (!rows.some(y => Math.abs(y - a.y) <= 1)) rows.push(a.y);
      }
      assert.equal(rows.length, width > 700 ? 2 : width > 390 ? 3 : 6, `${width}px wrong column count`);
      await page.close();
    }
  } finally { await browser.close(); }
});
