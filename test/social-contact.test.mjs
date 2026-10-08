import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { chromium } from 'playwright';
import * as siteData from '../src/app/site-data.ts';
const WHATSAPP_URL = siteData.WHATSAPP_URL;

const source = readFileSync(new URL('../src/app/page.tsx', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/app/globals.css', import.meta.url), 'utf8');

test('messenger links share a renderer and unaltered brand art', () => {
  assert.equal(WHATSAPP_URL, 'https://wa.me/79137871805');
  assert.match(source, /const SocialContactIcon\s*=/);
  for (const name of ['telegram', 'max', 'whatsapp']) assert.match(source, new RegExp(`social-${name}\\.webp`));
  assert.doesNotMatch(source, /max-colored\.svg|whatsapp-white\.svg|M21\.6 3\.5 18\.3 20c|whatsapp-icon/);
  for (const name of ['Telegram', 'MAX', 'WhatsApp']) assert.match(source, new RegExp(`className="contact-row"><span>${name}</span><b><SocialContactLink type="${name}" showIcon={false}`));
  assert.doesNotMatch(css, /max-icon-art|channel-icon-max img|channel-icon-max\s*\{[^}]*opacity/);
  assert.doesNotMatch(css, /\.whatsapp-icon\s*\{/);
});

test('approved RGBA artwork survives only transparent cropping and lossless scaling', () => {
  const result = spawnSync('python3', ['-c', `
from PIL import Image, ImageChops
from pathlib import Path
import hashlib
root=Path.cwd(); source=Path.home()/'Library/Application Support/Hermes/composer-images'
assets={
 'max':('Изображение_ChatGPT_8_окт._2026_г._09_54_21-3_9e8513.png','0aff65754985ac8f83c7da560d5e369a5eb405013cad82cdd4550f13f5e1eca2','edd9ffbeda10ab4422778c10d4b8ea5ac4a93659fe13ff0b7bc35a53e7aaebd9'),
 'whatsapp':('Изображение_ChatGPT_8_окт._2026_г._09_54_20-2_da020a.png','abea85a14e1acd690a1da07e0d877a1b0ad6611e5a3fa80dd72d3b82b5bbe8b6','4e9e7d9b319f8edd3713a2307622fb86d4dc521cb720cb3f73dd8bdd73a1be66'),
 'telegram':('Изображение_ChatGPT_8_окт._2026_г._09_54_19-1_062f6f.png','6731ff9503f970dd7ce9586132046cf8f5d1a36705dfb8afffc5c5427fface9c','c3c8b8a929fac4f3d084cffb3d47dfa8e8393eb07a87436a2cae22d101f770f2'),
}
for name,(filename,digest,artifact_digest) in assets.items():
 original=source/filename
 artifact=root/'public/images'/('social-'+name+'.webp')
 assert hashlib.sha256(artifact.read_bytes()).hexdigest()==artifact_digest, name+' asset mismatch'
 output=Image.open(artifact).convert('RGBA')
 assert output.size==(384,384), name+' dimensions'
 assert output.getchannel('A').getpixel((0,0))==0, name+' backdrop'
 if original.exists():
  assert hashlib.sha256(original.read_bytes()).hexdigest()==digest, name+' source mismatch'
  im=Image.open(original).convert('RGBA'); alpha=im.getchannel('A'); bounds=alpha.getbbox(); visible=alpha.point(lambda a:255 if a>128 else 0).getbbox()
  cx=(visible[0]+visible[2])//2; cy=(visible[1]+visible[3])//2
  radius=max(cx-bounds[0],bounds[2]-cx,cy-bounds[1],bounds[3]-cy)
  expected=im.crop((cx-radius,cy-radius,cx+radius,cy+radius)).resize((384,384),Image.Resampling.LANCZOS)
  assert not ImageChops.difference(expected,output).getbbox(), name+' pixel mismatch'
`], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr || result.stdout);
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
        const surfaces = ['.header-actions', '.mobile-menu-actions', '.contact-actions', '.footer-grid'];
        const social = surfaces.map(selector => {
          const root = document.querySelector(selector);
          return names.map(name => {
            const link = [...root.querySelectorAll('a')].find(a => a.getAttribute('aria-label') === `Открыть ${name} GLOBAL`);
            const img = link?.querySelector('img');
            return { href: link?.href, target: link?.target, rel: link?.rel, icon: !!img,
              imageLoaded: img?.complete && img.naturalWidth > 0, src: img?.src,
              mask: img ? getComputedStyle(img).maskImage : '', filter: img ? getComputedStyle(img).filter : '', opacity: img ? getComputedStyle(img).opacity : '' };
          });
        });
        const rows = [...document.querySelectorAll('.contact-card .contact-row a[aria-label^="Открыть"]')].map(a => ({ name: a.title, href: a.href, target: a.target, rel: a.rel, icon: !!a.querySelector('img,svg'), label: a.textContent.trim() }));
        const actions = [...document.querySelectorAll('.contact-actions > *')].map(el => {
          const r = el.getBoundingClientRect();
          const span = el.querySelector('.action-label') || el;
          return { label: el.textContent.trim(), x: r.x, y: r.y, right: r.right, bottom: r.bottom, width: r.width, height: r.height,
            clipped: span.scrollWidth > span.clientWidth + 1 };
        });
        return { social, rows, actions, overflow: document.documentElement.scrollWidth - innerWidth, card: document.querySelector('.contact-card').getBoundingClientRect().toJSON() };
      });
      const destinations = ['https://t.me/SVC_GLOBAL_NSK', 'https://max.ru/u/f9LHodD0cOL9XCvB0s54oOa-5DtER3blB5RfJKiYU-tE9NGhkphplmudTYk', WHATSAPP_URL];
      for (const [surface, links] of result.social.entries()) for (const [index, link] of links.entries()) {
        assert.equal(link.href, destinations[index], `${width}px surface ${surface} social ${index}`);
        assert.equal(link.target, '_blank'); assert.match(link.rel, /noreferrer/);
        assert.ok(link.icon && link.imageLoaded, `${width}px surface ${surface} icon ${index} failed`);
        assert.equal(link.mask, 'none'); assert.equal(link.filter, 'none'); assert.equal(link.opacity, '1');
        assert.match(link.src, new RegExp(`/site-GLOBAL/images/social-${['telegram', 'max', 'whatsapp'][index]}\\.webp$`));
      }
      assert.deepEqual(result.rows.map(row => row.name), ['Telegram', 'MAX', 'WhatsApp']);
      for (const [index, row] of result.rows.entries()) {
        assert.equal(row.href, destinations[index]); assert.equal(row.target, '_blank'); assert.match(row.rel, /noreferrer/);
        assert.equal(row.icon, false, `${width}px ${row.name} contact row must stay text-only`);
        assert.match(row.label, /↗$/);
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
