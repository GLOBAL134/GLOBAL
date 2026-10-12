import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { organization } from "../src/app/site-data.ts";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const privacy = read("../src/app/privacy/page.tsx");
const consent = read("../src/app/consent/page.tsx");
const css = read("../src/app/legal.css");

test("confirmed operator identity and working contacts are shared", () => {
  assert.equal(organization.fullName, "Индивидуальный предприниматель Красюк Николай Александрович");
  assert.equal(organization.inn, "544127911674");
  assert.equal(organization.ogrnip, "323547600070729");
  assert.equal(organization.officeAddress, "630132, г. Новосибирск, ул. Челюскинцев, 15 Б");
  assert.equal(organization.phoneHref, "tel:+79137871805");
  assert.equal(organization.email, "n9137871805@yandex.ru");
  for (const page of [privacy, consent]) {
    for (const field of ["fullName", "inn", "ogrnip", "officeAddress", "phoneHref", "email"]) {
      assert.ok(page.includes(`organization.${field}`), `legal page lacks ${field}`);
    }
    assert.match(page, /письменн.*запрос/i);
    assert.match(page, /Ирланди[яи]/);
    assert.match(page, /Роскомнадзор/);
    assert.match(page, /срок/i);
    assert.doesNotMatch(page, /не подтвержд[её]н.*(?:письменн|почтов)|при[её]м.*не подтвержд[её]н/i);
    assert.doesNotMatch(page, /ТРЕБУЕТ ЗАПОЛНЕНИЯ|Дзержинского|банковск.*(?:сч[её]т|реквизит)/i);
    assert.match(page, /\.\/legal\.css/);
  }
});

test("disclosure matches current application path without invented compliance", () => {
  for (const page of [privacy, consent]) {
    for (const service of ["Cloudflare Worker", "Cloudflare KV", "Supabase", "Telegram"]) {
      assert.ok(page.includes(service), `${service} missing`);
    }
    assert.match(page, /IP-адрес/);
    assert.match(page, /хеширован/);
    assert.match(page, /локализац/);
  }
  assert.match(privacy, /имя.*телефон.*стран.*цель.*услуг.*комментари.*источник/i);
  assert.match(consent, /имя.*телефон.*стран.*цель.*услуг.*комментари.*источник/i);
  assert.match(css, /overflow-wrap:\s*anywhere/);
  assert.match(css, /\.legal-card h1/);
});
