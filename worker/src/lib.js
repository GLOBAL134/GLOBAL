const clean = (value, max = 500) => String(value ?? "").replace(/[<>\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);

export function validateApplication(input) {
  if (clean(input.website, 100)) return { ok: false, errors: { form: "Invalid submission" } };
  const name = clean(input.name, 80);
  const country = clean(input.country, 80);
  const phoneDigits = String(input.phone ?? "").replace(/\D/g, "").replace(/^8/, "7").slice(0, 11);
  const errors = {};
  if (name.length < 2) errors.name = "Укажите имя";
  if (phoneDigits.length !== 11 || !phoneDigits.startsWith("7")) errors.phone = "Укажите корректный номер";
  if (!country) errors.country = "Укажите страну";
  if (input.consent !== true) errors.consent = "Необходимо согласие";
  if (Object.keys(errors).length) return { ok: false, errors };
  return { ok: true, value: { name, phone: `+${phoneDigits}`, country, purpose: clean(input.purpose, 80), service: clean(input.service, 120), comment: clean(input.comment, 1500), source: clean(input.source || "website", 80) } };
}

export function makeApplicationId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(8));
  return `G-${Array.from(bytes, b => chars[b % chars.length]).join("")}`;
}

export function formatTelegramMessage(a) {
  return [`НОВАЯ ЗАЯВКА — GLOBAL`, ``, `Имя: ${a.name}`, `Телефон: ${a.phone}`, `Страна: ${a.country}`, `Цель: ${a.purpose || "Не указана"}`, `Услуга: ${a.service || "Не указана"}`, `Комментарий: ${a.comment || "Нет"}`, ``, `Дата: ${a.created_at}`, `ID заявки: #${a.id}`, `Статус: ${a.status}`].join("\n");
}
