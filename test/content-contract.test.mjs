import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as siteData from "../src/app/site-data.ts";
import {
  countries,
  countryGroups,
  NEUTRAL_COUNTRY_SUMMARY,
  otherCountries,
  popularDestinations,
  SCHENGEN_COUNTRIES,
  services,
} from "../src/app/site-data.ts";

const pageSource = readFileSync(new URL("../src/app/page.tsx", import.meta.url), "utf8");

const schengenNames = [
  "Австрия", "Бельгия", "Болгария", "Венгрия", "Германия", "Греция",
  "Дания", "Исландия", "Испания", "Италия", "Латвия", "Литва",
  "Лихтенштейн", "Люксембург", "Мальта", "Нидерланды", "Норвегия",
  "Польша", "Португалия", "Румыния", "Словакия", "Словения", "Финляндия",
  "Франция", "Хорватия", "Чехия", "Швейцария", "Швеция", "Эстония",
];
const otherNames = ["Кипр", "Япония", "Китай", "Тайвань", "Таиланд", "Южная Корея", "Великобритания"];
const expectedNames = [...schengenNames, ...otherNames];
const expectedFlags = {
  Австрия: "🇦🇹", Бельгия: "🇧🇪", Болгария: "🇧🇬", Венгрия: "🇭🇺", Германия: "🇩🇪",
  Греция: "🇬🇷", Дания: "🇩🇰", Исландия: "🇮🇸", Испания: "🇪🇸", Италия: "🇮🇹",
  Латвия: "🇱🇻", Литва: "🇱🇹", Лихтенштейн: "🇱🇮", Люксембург: "🇱🇺", Мальта: "🇲🇹",
  Нидерланды: "🇳🇱", Норвегия: "🇳🇴", Польша: "🇵🇱", Португалия: "🇵🇹", Румыния: "🇷🇴",
  Словакия: "🇸🇰", Словения: "🇸🇮", Финляндия: "🇫🇮", Франция: "🇫🇷", Хорватия: "🇭🇷",
  Чехия: "🇨🇿", Швейцария: "🇨🇭", Швеция: "🇸🇪", Эстония: "🇪🇪", Кипр: "🇨🇾",
  Япония: "🇯🇵", Китай: "🇨🇳", Тайвань: "🇹🇼", Таиланд: "🇹🇭", "Южная Корея": "🇰🇷",
  Великобритания: "🇬🇧",
};

 test("countries are the single exact 36-country source", () => {
  assert.equal(countries.length, 36);
  assert.deepEqual(countries.map((country) => country.name).sort(), [...expectedNames].sort());
  assert.equal(new Set(countries.map((country) => country.name)).size, 36);
  assert.equal(new Set(countries.map((country) => country.flag)).size, 36);
  assert.deepEqual(Object.fromEntries(countries.map((country) => [country.name, country.flag])), expectedFlags);
  assert.deepEqual(SCHENGEN_COUNTRIES, schengenNames);
  assert.deepEqual(otherCountries.map((country) => country.name), otherNames);
});

test("country groups stay 29 Schengen and 7 other destinations", () => {
  assert.deepEqual(countryGroups.map((group) => [group.name, group.countries.length]), [
    ["Шенген", 29],
    ["Другие направления", 7],
  ]);
  assert.equal(countries.filter((country) => country.group === "Шенген").length, 29);
  assert.equal(countries.filter((country) => country.group === "Другие направления").length, 7);
});

test("Schengen aggregate is popular-only and not a 37th country", () => {
  assert.equal(countries.some((country) => country.name === "Шенген"), false);
  assert.deepEqual(popularDestinations.map((destination) => destination.name), [
    "Шенген", "Великобритания", "Япония", "Китай", "Южная Корея",
  ]);
  assert.equal(popularDestinations.filter((destination) => destination.name === "Шенген").length, 1);
});

test("country details do not invent unconfirmed data", () => {
  assert.equal(NEUTRAL_COUNTRY_SUMMARY, "Условия оформления зависят от цели поездки и ситуации заявителя. Оставьте заявку — специалист GLOBAL проконсультирует по вашему случаю.");
  for (const country of countries.filter((item) => !["Япония", "Южная Корея"].includes(item.name))) {
    assert.equal(country.summary, NEUTRAL_COUNTRY_SUMMARY, country.name);
    assert.equal(country.price, undefined, `${country.name} must not have a new price`);
  }
  assert.equal(countries.find((country) => country.name === "Япония")?.price, 8000);
  assert.equal(countries.find((country) => country.name === "Южная Корея")?.price, 6000);
});

test("service catalog contains exact public services and lead values", () => {
  assert.equal(services.some((service) => service.name === "Загранпаспорта и миграционные услуги"), false);
  const insurance = services.find((service) => service.name === "Медицинское страхование путешественников");
  assert.ok(insurance);
  assert.equal(insurance.formName, "Медицинское страхование путешественников");
  assert.deepEqual(insurance.insurers, ["Евроинс", "АльфаСтрахование"]);
  const translations = services.find((service) => service.name === "Нотариально заверенные переводы");
  assert.ok(translations);
  assert.equal(translations.formName, "Нотариально заверенный перевод");
  assert.equal(translations.detailTitle, "Перевод документов на английский язык");
  assert.equal(translations.icon, "banknotes");
  assert.equal(insurance.icon, "shield");
  assert.equal(services.find((service) => service.name === "Фото и копировальные услуги")?.icon, "copy");
});

test("calculator extras come from service form names and exclude the primary service", () => {
  assert.equal(typeof siteData.getApplicableExtras, "function");
  assert.ok(siteData.visaService);
  assert.deepEqual(
    siteData.getApplicableExtras(siteData.visaService.formName).map((service) => service.formName),
    [
      "Медицинское страхование путешественников",
      "Нотариально заверенный перевод",
      "Фото и копировальные услуги",
      "Бронирование авиабилетов",
      "Бронирование отелей",
      "Запись на подачу документов",
    ],
  );
  assert.deepEqual(
    siteData.getApplicableExtras("Медицинское страхование путешественников").map(
      (service) => service.formName,
    ),
    ["Нотариально заверенный перевод", "Фото и копировальные услуги", "Бронирование авиабилетов", "Бронирование отелей", "Запись на подачу документов"],
  );
});

test("country details and visa wizard use the catalog visa form name", () => {
  assert.match(
    pageSource,
    /"aggregate" in c\s*\?\s*visaService\.formName\s*:\s*c\.formService \|\| visaService\.formName/,
  );
  assert.match(pageSource, /service:\s*visaService\.formName/);
  assert.doesNotMatch(pageSource, /service:\s*"Оформление виз"/);
});
