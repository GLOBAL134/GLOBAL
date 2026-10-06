import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { reviews, popularDestinations, primaryServices, services } from '../src/app/site-data.ts';

const source = (file) => readFileSync(new URL(`../src/${file}`, import.meta.url), 'utf8');
const page = source('app/page.tsx');
const form = source('components/ApplicationForm.tsx');

test('MAX header uses the supplied image without replacing the Telegram icon', () => {
  assert.match(page, /className="channel-icon channel-icon-max"[\s\S]*?aria-label="MAX GLOBAL"[\s\S]*?<img src=\{`\$\{process.env.NEXT_PUBLIC_BASE_PATH \|\| ""\}\/images\/max-icon.webp`\}/);
  assert.match(page, /aria-label="Telegram GLOBAL"[^>]*><svg/);
});

test('the main review is a sourced short 2GIS excerpt', () => {
  const review = reviews[0];
  assert.equal(review.name, 'Анна Карпова');
  assert.equal(review.source, '2ГИС');
  assert.equal(review.url, 'https://2gis.ru/reviews/141265770283147/review/212502268');
  assert.equal(review.text, 'Благодарю менеджера, Николая, за профессиональную, качественную и очень полезную информацию по получению шенгенской визы и организации поездки!!!');
  assert.ok(review.text.split(/\s+/).length <= 25);
  assert.match(page, /Отрывок отзыва/);
});

test('one contact source replaces all old email references and preserves the confirmed MAX URL', () => {
  for (const file of ['app/page.tsx', 'app/layout.tsx', 'app/privacy/page.tsx', 'app/consent/page.tsx', 'app/site-data.ts', 'components/ApplicationForm.tsx']) {
    assert.doesNotMatch(source(file), /global\.novosibirsk@mail\.ru/);
  }
  assert.match(source('app/site-data.ts'), /n9137871805@yandex\.ru/);
  assert.match(source('app/site-data.ts'), /https:\/\/t\.me\/SVC_GLOBAL_NSK/);
  assert.match(source('app/site-data.ts'), /https:\/\/max\.ru\/u\/f9LHodD0cOL9XCvB0s54oOa-5DtER3blB5RfJKiYU-tE9NGhkphplmudTYk/);
  assert.match(page, /TELEGRAM_URL/);
  assert.match(page, /MAX_URL/);
});

test('hero has a fictional visa deck instead of the Tokyo scene or boarding card', () => {
  assert.match(page, /className="visa-deck travel-scene"/);
  assert.match(page, /<GlobalEmblem/);
  assert.doesNotMatch(page, /travel-photo|passport-card|boarding-card|BOARDING PASS|OVB|TYO/);
});

test('only four original services are primary and extras stay in the shared catalog', () => {
  assert.equal(primaryServices.length, 4);
  assert.equal(services.length, 7);
  assert.match(page, /primaryServices\.map/);
  assert.match(form, /primaryServices\.map/);
  assert.match(page, /extras\.join/);
  assert.match(page, /getApplicableExtras\(calcService\)/);
  assert.match(form, /defaultValue=\{preset.comment\}/);
  assert.match(form, /comment: data.get\("comment"\)/);
});

test('wizard has one step counter without secondary numbered labels', () => {
  assert.match(page, /Шаг \{wizardStep\} из 5/);
  assert.doesNotMatch(page, /0[1-5] · (Направление|Цель|Дата|Путешественники|Загранпаспорт)/);
});

test('five popular cards in desired order with a dedicated UK photo', () => {
  assert.deepEqual(popularDestinations.map((country) => country.name), ['Шенген', 'Великобритания', 'Япония', 'Китай', 'Южная Корея']);
  assert.match(popularDestinations[1].image, /photo-/);
});
