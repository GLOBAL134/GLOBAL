import { FormEvent, useId, useState } from "react";
import Link from "next/link";
import { countries, primaryServices, TELEGRAM_URL } from "../app/site-data";

export type LeadPreset = {
  country?: string;
  purpose?: string;
  service?: string;
  source?: string;
  comment?: string;
};

type ApplicationFormProps = {
  preset?: LeadPreset;
  onSuccess?: (id: string) => void;
  onClose?: () => void;
};

const API = process.env.NEXT_PUBLIC_APPLICATIONS_API_URL || "";

export default function ApplicationForm({
  preset = {},
  onSuccess,
  onClose,
}: ApplicationFormProps) {
  const uid = useId();
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");
  const [id, setId] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    if (!form.reportValidity()) return;

    const data = new FormData(form);
    setStatus("loading");
    setMessage("");
    const payload = {
      name: data.get("name"),
      phone: data.get("phone"),
      country: data.get("country"),
      purpose: data.get("purpose"),
      service: data.get("service"),
      comment: data.get("comment"),
      source: data.get("source") || preset.source || "website",
      consent: data.get("consent") === "on",
      website: data.get("website"),
    };

    try {
      if (!API) throw new Error("API URL не настроен");
      const response = await fetch(`${API}/applications`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Ошибка отправки");
      setId(result.id);
      setStatus("success");
      onSuccess?.(result.id);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Не удалось отправить заявку");
    }
  }

  if (status === "success") {
    return (
      <div className="success-screen" role="status">
        <span className="success-mark">✓</span>
        <h3>Заявка отправлена</h3>
        <p>Спасибо! Специалист GLOBAL свяжется с вами.</p>
        <small>Номер заявки</small>
        <strong>{id}</strong>
        <div className="success-actions">
          {onClose && (
            <button className="btn btn-dark" onClick={onClose}>
              Закрыть
            </button>
          )}
          <a
            className="btn btn-outline"
            href={TELEGRAM_URL}
            target="_blank"
            rel="noreferrer"
          >
            Написать в Telegram
          </a>
        </div>
      </div>
    );
  }

  return (
    <form className="form" onSubmit={submit}>
      <input
        className="honeypot"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
      />
      <input type="hidden" name="source" value={preset.source || "website"} />
      {(preset.country || preset.service) && (
        <div className="form-context full">
          <span>Заявка на консультацию</span>
          <strong>{[preset.country, preset.service].filter(Boolean).join(" · ")}</strong>
        </div>
      )}
      <div className="field">
        <label htmlFor={`${uid}-name`}>Имя *</label>
        <input id={`${uid}-name`} name="name" required autoComplete="name" />
      </div>
      <div className="field">
        <label htmlFor={`${uid}-phone`}>Телефон *</label>
        <input
          id={`${uid}-phone`}
          name="phone"
          required
          inputMode="tel"
          minLength={10}
          placeholder="+7 (___) ___-__-__"
          autoComplete="tel"
        />
      </div>
      <div className="field">
        <label htmlFor={`${uid}-country`}>Страна *</label>
        <select
          id={`${uid}-country`}
          name="country"
          required
          defaultValue={preset.country || ""}
        >
          <option value="" disabled>
            Выберите страну
          </option>
          {countries.map((country) => (
            <option key={country.name} value={country.name}>
              {country.flag} {country.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor={`${uid}-purpose`}>Цель поездки</label>
        <select
          id={`${uid}-purpose`}
          name="purpose"
          defaultValue={preset.purpose || "Туризм"}
        >
          <option>Туризм</option>
          <option>Бизнес</option>
          <option>Учёба</option>
          <option>Гости</option>
          <option>Другое</option>
        </select>
      </div>
      <div className="field full">
        <label htmlFor={`${uid}-service`}>Услуга</label>
        <select
          id={`${uid}-service`}
          name="service"
          defaultValue={preset.service || ""}
        >
          <option value="">Выберите услугу</option>
          {primaryServices.map((service) => (
            <option key={service.formName} value={service.formName}>
              {service.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field full">
        <label htmlFor={`${uid}-comment`}>Комментарий</label>
        <textarea
          id={`${uid}-comment`}
          name="comment"
          rows={4}
          defaultValue={preset.comment}
        />
      </div>
      <label className="checkbox full">
        <input type="checkbox" name="consent" required />
        <span>
          Я согласен(на) на обработку персональных данных. {" "}
          <Link href="/privacy/">Политика конфиденциальности</Link>
        </span>
      </label>
      <p className="privacy-note full">Ваши данные используются только для связи по вашей заявке.</p>
      <button className="btn btn-dark full" disabled={status === "loading"}>
        {status === "loading" ? (
          <>
            <span className="spinner" />Отправляем…
          </>
        ) : (
          "Получить консультацию"
        )}
      </button>
      {status === "error" && <div className="form-notice full" role="alert"><b>Не удалось отправить заявку.</b><br />{message}. Проверьте данные и попробуйте снова.</div>}
    </form>
  );
}
