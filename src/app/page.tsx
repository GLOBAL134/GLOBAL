"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ApplicationForm, {
  type LeadPreset,
} from "../components/ApplicationForm";
import { GlobalLogo } from "../components/Brand";
import { OfficePhotoSlider, VisaPhotoSlider } from "../components/VisaPhotoSlider";
import {
  countries,
  countryGroups,
  photos,
  popularDestinations,
  reviews,
  SCHENGEN_COUNTRIES,
  services,
  primaryServices,
  CONTACT_EMAIL,
  TELEGRAM_URL,
  MAX_URL,
  WHATSAPP_URL,
  getApplicableExtras,
  visaService,
  type PopularDestination,
} from "./site-data";

const socialIconFiles = { Telegram: "social-telegram.webp", MAX: "social-max.webp", WhatsApp: "social-whatsapp.webp" };
const SocialContactIcon = ({ type }: { type: "Telegram" | "MAX" | "WhatsApp" }) => (
  <img className={`social-icon-${type.toLowerCase()}`} src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/images/${socialIconFiles[type]}`} width="32" height="32" alt="" aria-hidden="true" />
);

const SocialContactLink = ({ type, className = "", showIcon = true, children }: { type: "Telegram" | "MAX" | "WhatsApp"; className?: string; showIcon?: boolean; children?: React.ReactNode }) => (
  <a className={className} href={type === "Telegram" ? TELEGRAM_URL : type === "MAX" ? MAX_URL : WHATSAPP_URL} target="_blank" rel="noreferrer" aria-label={`Открыть ${type} GLOBAL`} title={type}>
    {showIcon && <SocialContactIcon type={type} />}{children}
  </a>
);

const SvgIcon = ({
  type,
}: {
  type:
    | "search"
    | "plane"
    | "phone"
    | "chat"
    | "visa"

    | "shield"
    | "copy"
    | "translate";
}) => {
  const paths = {
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.8" />
        <path d="m20 20-4.4-4.4" />
      </>
    ),
    plane: (
      <path d="m3 14 7-2 4-8c.5-1 1.7-1.3 2.6-.7.7.5 1 1.3.6 2.1L15 11.5l4.5-1.4 1.8-2.2 1.2.5-.8 3.2-2.5 2-5 .3-4.5 6-1.5-.5 2.1-5L4.2 16 3 14Z" />
    ),
    phone: (
      <path d="M7 3 4.5 5.5c-.8.8.7 5 3.5 7.8 2.8 2.8 7 4.3 7.8 3.5l2.5-2.5-3.6-2.4-1.7 1.6c-1.6-.6-4-3-4.6-4.6L10 7.2 7 3Z" />
    ),
    chat: (
      <>
        <path d="M4 5h16v11H9l-5 4V5Z" />
        <path d="M8 9h8M8 12h5" />
      </>
    ),
    visa: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="M7 9h4M7 13h7M16 9h1" />
      </>
    ),

    shield: (
      <>
        <path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),
    translate: (
      <>
        <path d="M3 5h12M9 3v2M5 5c1 5 4 8 9 10M13 5c-1 5-4 8-9 10M14 21l4-10 4 10M15.5 17h5" />
      </>
    ),
    copy: (
      <>
        <rect x="7" y="7" width="13" height="13" rx="2" />
        <path d="M4 16V6a2 2 0 0 1 2-2h10" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      aria-hidden="true"
    >
      {paths[type]}
    </svg>
  );
};

type Wizard = {
  country: string;
  purpose: string;
  date: string;
  travelers: number;
  passport: string;
};
const initialWizard: Wizard = {
  country: "",
  purpose: "Туризм",
  date: "",
  travelers: 1,
  passport: "Да",
};

export default function Home() {
  const [scrolled, setScrolled] = useState(false),
    [menu, setMenu] = useState(false),
    [heroQuery, setHeroQuery] = useState(""),
    [country, setCountry] = useState<PopularDestination | null>(null),
    [schengenChoice, setSchengenChoice] = useState(""),
    [lead, setLead] = useState<LeadPreset | null>(null),
    [service, setService] = useState<number | null>(null),
    [wizardOpen, setWizardOpen] = useState(false),
    [wizardStep, setWizardStep] = useState(1),
    [wizard, setWizard] = useState(initialWizard),
    [lightbox, setLightbox] = useState<number | null>(null),
    [reviewIndex, setReviewIndex] = useState(0),
    [applicants, setApplicants] = useState(1),
    [calcCountry, setCalcCountry] = useState("Япония"),
    [calcService, setCalcService] = useState(visaService.formName),
    [extras, setExtras] = useState<string[]>([]),
    [copied, setCopied] = useState(false);
  const previousFocus = useRef<HTMLElement | null>(null);
  const phone = "+7 (913) 787-18-05";
  const panelOpen =
    menu ||
    Boolean(country) ||
    Boolean(lead) ||
    service !== null ||
    wizardOpen ||
    lightbox !== null;
  const activePanel = menu
    ? "menu"
    : country
      ? "country"
      : lead
        ? "lead"
        : service !== null
          ? "service"
          : wizardOpen
            ? "wizard"
            : lightbox !== null
              ? "lightbox"
              : "";
  useEffect(() => {
    const f = () => setScrolled(window.scrollY > 28);
    f();
    window.addEventListener("scroll", f, { passive: true });
    return () => window.removeEventListener("scroll", f);
  }, []);
  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1051px)");
    const closeMenuOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setMenu(false);
    };
    desktop.addEventListener("change", closeMenuOnDesktop);
    return () => desktop.removeEventListener("change", closeMenuOnDesktop);
  }, []);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const items = document.querySelectorAll<HTMLElement>("[data-reveal]");
    if (!items.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.04 },
    );
    items.forEach((item) => observer.observe(item));
    document.documentElement.classList.add("motion-ready");
    return () => {
      observer.disconnect();
      document.documentElement.classList.remove("motion-ready");
    };
  }, []);
  useEffect(() => {
    document.body.style.overflow = panelOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [panelOpen]);
  useEffect(() => {
    if (!activePanel) {
      previousFocus.current?.focus();
      previousFocus.current = null;
      return;
    }
    if (!previousFocus.current)
      previousFocus.current = document.activeElement as HTMLElement;
    const panel = document.querySelector<HTMLElement>(
      ".mobile-menu.open, .overlay, .lightbox",
    );
    const focusables = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          'button:not([disabled]),a[href],input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])',
        ) || [],
      );
    focusables()[0]?.focus();
    const trap = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (!items.length) return;
      const first = items[0],
        last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", trap);
    return () => window.removeEventListener("keydown", trap);
  }, [activePanel]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenu(false);
        setCountry(null);
        setLead(null);
        setService(null);
        setWizardOpen(false);
        setLightbox(null);
      }
      if (lightbox !== null && e.key === "ArrowRight")
        setLightbox((lightbox + 1) % photos.length);
      if (lightbox !== null && e.key === "ArrowLeft")
        setLightbox((lightbox - 1 + photos.length) % photos.length);
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, [lightbox]);
  const heroResults = useMemo(
    () =>
      heroQuery
        ? countries
            .filter((x) =>
              x.name.toLowerCase().includes(heroQuery.toLowerCase()),
            )
            .slice(0, 6)
        : [],
    [heroQuery],
  );
  const applicableExtras = useMemo(
    () => getApplicableExtras(calcService),
    [calcService],
  );
  const price = countries.find((x) => x.name === calcCountry)?.price;
  const total =
    price && calcService === visaService.formName ? price * applicants : null;
  const openLead = (preset: LeadPreset) =>
    setLead({ ...preset, source: preset.source || "website-modal" });
  const openCountry = (destination: PopularDestination) => {
    setSchengenChoice("");
    setCountry(destination);
  };
  const openServiceLead = (item: (typeof services)[number], source = "service") =>
    openLead({
      service: item.formName,
      comment:
        item.formName === "Нотариально заверенный перевод"
          ? "Язык: Английский"
          : undefined,
      source,
    });
  const startWizard = () => {
    setWizard(initialWizard);
    setWizardStep(1);
    setWizardOpen(true);
  };
  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText("Новосибирск, ул. Челюскинцев, 15Б");
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };
  const closeMenu = () => setMenu(false);
  return (
    <>
      <header className={`header ${scrolled ? "header-scrolled" : ""}`}>
        <div className="container header-inner">
          <a className="logo-link" href="#top" aria-label="GLOBAL — на главную">
            <GlobalLogo />
          </a>
          <nav className="nav">
            <a href="#services">Услуги</a>
            <a href="#countries">Страны</a>
            <a href="#process">Подбор визы</a>
            <a href="#reviews">Отзывы</a>
            <a href="#faq">FAQ</a>
            <a href="#contacts">Контакты</a>
          </nav>
          <div className="header-actions">
            <SocialContactLink type="Telegram" className="channel-icon" />
            <SocialContactLink type="MAX" className="channel-icon" />
            <SocialContactLink type="WhatsApp" className="channel-icon" />
            <a className="phone" href="tel:+79137871805">
              {phone}
            </a>
            <button
              className="btn btn-dark header-cta"
              onClick={() => openLead({ source: "header" })}
            >
              Консультация
            </button>
            <button
              className="burger"
              onClick={() => setMenu(true)}
              aria-label="Открыть меню"
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </header>
      <div
        className={`menu-backdrop ${menu ? "open" : ""}`}
        onClick={closeMenu}
      />
      <aside
        className={`mobile-menu ${menu ? "open" : ""}`}
        aria-hidden={!menu}
        inert={!menu ? true : undefined}
      >
        <div className="mobile-menu-head">
          <GlobalLogo />
          <button onClick={closeMenu} aria-label="Закрыть">
            ×
          </button>
        </div>
        <nav>
          {[
            ["Услуги", "services"],
            ["Страны", "countries"],
            ["Подбор визы", "process"],
            ["Отзывы", "reviews"],
            ["FAQ", "faq"],
            ["Контакты", "contacts"],
          ].map(([x, id]) => (
            <a key={id} href={`#${id}`} onClick={closeMenu}>
              {x}
              <span>↗</span>
            </a>
          ))}
        </nav>
        <div className="mobile-menu-actions">
          <a href="tel:+791****1805">{phone}</a>
          <SocialContactLink type="Telegram"><span>Telegram · @SVC_GLOBAL_NSK</span></SocialContactLink>
          <SocialContactLink type="MAX"><span>MAX · профиль GLOBAL</span></SocialContactLink>
          <SocialContactLink type="WhatsApp"><span>WhatsApp</span></SocialContactLink>
          <button
            className="btn btn-primary"
            onClick={() => {
              closeMenu();
              openLead({ source: "mobile-menu" });
            }}
          >
            Получить консультацию
          </button>
        </div>
      </aside>
      <main>
        <section id="top" className="hero">
          <div className="hero-orbit" />
          <div className="container hero-grid">
            <div className="hero-copy">
              <div className="eyebrow light">
                GLOBAL · Сервисно-визовый центр · Новосибирск
              </div>
              <h1>
                Открываем мир <em>без визовых сложностей</em>
              </h1>
              <p>
                Помогаем разобраться в требованиях, подготовить документы и
                выбрать подходящую услугу для поездки.
              </p>
              <div className="hero-actions">
                <button className="btn btn-primary" onClick={startWizard}>
                  Подобрать визу <SvgIcon type="plane" />
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => openLead({ source: "hero" })}
                >
                  Получить консультацию
                </button>
              </div>
              <div className="destination-search">
                <label htmlFor="hero-country">Куда вы хотите поехать?</label>
                <div className="search-shell">
                  <SvgIcon type="search" />
                  <input
                    id="hero-country"
                    aria-autocomplete="list"
                    value={heroQuery}
                    onChange={(e) => setHeroQuery(e.target.value)}
                    placeholder="Введите страну…"
                    autoComplete="off"
                  />
                  {heroQuery && (
                    <button
                      aria-label="Очистить поиск"
                      onClick={() => setHeroQuery("")}
                    >
                      ×
                    </button>
                  )}
                </div>
                {heroResults.length > 0 && (
                  <div className="search-results">
                    {heroResults.map((c) => (
                      <button
                        key={c.name}
                        onClick={() => {
                          openCountry(c);
                          setHeroQuery("");
                        }}
                      >
                        <span>{c.flag}</span>
                        <b>{c.name}</b>
                        <small>
                          {c.service || "Консультация по направлению"}
                        </small>
                        <i>→</i>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="hero-proof">
                <span>
                  <b>4,8</b> рейтинг в 2ГИС
                </span>
                <span>
                  <b>31</b> отзыв
                </span>
                <span>
                  <b>600 м</b> от метро
                </span>
              </div>
            </div>
            <div className="visa-deck travel-scene" aria-label="Декоративная композиция документов GLOBAL">
              <img src={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/images/global-visa-collage.webp`} width="1536" height="1024" alt="" />
            </div>
          </div>
        </section>
        <div className="service-marquee">
          <div>
            {[...primaryServices, ...primaryServices].map((s, i) => (
              <span key={i}>
                {s.name}
                <i>✦</i>
              </span>
            ))}
          </div>
        </div>
        <section id="services" className="section services-section">
          <div className="container">
            <div className="section-heading split" data-reveal>
              <div>
                <div className="eyebrow">Экспертиза GLOBAL</div>
                <h2 className="h2">
                  Всё необходимое
                  <br />
                  для вашей поездки
                </h2>
              </div>
              <p>
                Помогаем пройти понятный путь от идеи поездки до подготовленного
                пакета документов.
              </p>
            </div>
            <div className="service-editorial">
              <article className="service-feature">
                <div className="service-art" aria-hidden="true">
                  <VisaPhotoSlider />
                </div>
                <div>
                  <SvgIcon type="visa" />
                  <h3>{services[0].name}</h3>
                  <p>{services[0].description}</p>
                  <div className="inline-actions">
                    <button onClick={() => setService(0)}>Подробнее</button>
                    <button onClick={() => openServiceLead(services[0])}>
                      Оставить заявку →
                    </button>
                  </div>
                </div>
              </article>
              <div className="service-list">
                {primaryServices.slice(1).map((s, i) => (
                  <article key={s.name}>
                    <SvgIcon type={s.icon} />
                    <div>
                      <h3>{s.name}</h3>
                      <p>{s.description}</p>
                      <div className="inline-actions">
                        <button onClick={() => setService(i + 1)}>Подробнее</button>
                        <button onClick={() => openServiceLead(s)}>
                          Оставить заявку
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section id="countries" className="section countries-section">
          <div className="container">
            <div className="section-heading" data-reveal>
              <div className="eyebrow">Направления</div>
              <h2 className="h2">Куда оформляем визы</h2>
              <p>
                Выберите страну, изучите доступную информацию и передайте
                направление специалисту.
              </p>
            </div>
            <div className="country-showcase" data-reveal>
              {popularDestinations.map((c, i) => (
                <button
                  className={`visual-country vc-${i + 1}`}
                  key={c.name}
                  onClick={() => openCountry(c)}
                >
                  <img src={c.image} alt={c.name} />
                  <span className="visual-shade" />
                  <span className="country-flag" aria-hidden="true">
                    {c.flag}
                  </span>
                  <div>
                    <small>{c.group}</small>
                    <h3>{c.name}</h3>
                    {"aggregate" in c && <span className="schengen-count">29 государств</span>}
                    <p>
                      {"aggregate" in c
                        ? "Подготовка визовых документов"
                        : c.service || "Консультация по направлению"}
                    </p>
                    <b>Подробнее →</b>
                  </div>
                </button>
              ))}
            </div>
            <div className="country-directory">
              {countryGroups.map((group) => {
                return (
                  <div className="country-group" key={group.name}>
                    <h3>{group.name}</h3>
                    <div className="country-group-list">
                      {group.countries.map((c) => (
                        <button key={c.name} onClick={() => openCountry(c)}>
                          <span className="country-mini-flag" aria-hidden="true">
                            {c.flag}
                          </span>
                          <span className="country-directory-name">{c.name}</span>
                          <i>→</i>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
        <section id="process" className="section wizard-promo">
          <div className="container promo-grid">
            <div>
              <div className="eyebrow light">Интерактивный подбор</div>
              <h2>Подберём решение для вашей поездки</h2>
              <p>
                Ответьте на пять вопросов. Передадим информацию специалисту
                GLOBAL для консультации.
              </p>
              <button className="btn btn-primary" onClick={startWizard}>
                Начать подбор <span>5 вопросов</span>
              </button>
            </div>
            <div className="promo-card">
              <span>Маршрут консультации</span>
              {[
                "Направление",
                "Цель поездки",
                "Дата",
                "Путешественники",
                "Загранпаспорт",
              ].map((x, i) => (
                <div key={x}>
                  <b>{i + 1}</b>
                  <p>{x}</p>
                  <i>{i === 0 ? "●" : "○"}</i>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="section calculator-section">
          <div className="container calculator">
            <div>
              <div className="eyebrow">Предварительный расчёт</div>
              <h2 className="h2">Соберите параметры поездки</h2>
              <p>
                Показываем стоимость только в тех случаях, когда стоимость услуги
                GLOBAL подтверждена и опубликована.
              </p>
            </div>
            <div className="calc-panel">
              <label>
                Страна
                <select
                  value={calcCountry}
                  onChange={(e) => setCalcCountry(e.target.value)}
                >
                  {countries.map((c) => (
                    <option key={c.name} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Основная услуга
                <select
                  value={calcService}
                  onChange={(e) => {
                    setCalcService(e.target.value);
                    setExtras([]);
                  }}
                >
                  {primaryServices.map((s) => (
                    <option key={s.formName} value={s.formName}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
              <div className="counter-row">
                <span>Количество заявителей</span>
                <div>
                  <button
                    aria-label="Уменьшить количество заявителей"
                    onClick={() => setApplicants(Math.max(1, applicants - 1))}
                  >
                    −
                  </button>
                  <b>{applicants}</b>
                  <button
                    aria-label="Увеличить количество заявителей"
                    onClick={() => setApplicants(applicants + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <fieldset>
                <legend>Дополнительные услуги</legend>
                {applicableExtras.map((extra) => (
                  <label key={extra.formName}>
                    <input
                      type="checkbox"
                      value={extra.formName}
                      checked={extras.includes(extra.formName)}
                      onChange={() =>
                        setExtras(
                          extras.includes(extra.formName)
                            ? extras.filter((y) => y !== extra.formName)
                            : [...extras, extra.formName],
                        )
                      }
                    />
                    <span>{extra.name}</span>
                  </label>
                ))}
              </fieldset>
              <div className="calc-result">
                <small>Предварительная стоимость</small>
                <strong>
                  {total
                    ? `${total.toLocaleString("ru-RU")} ₽`
                    : "Уточнит специалист"}
                </strong>
                <p>Сборы рассчитываются отдельно. Стоимость дополнительных услуг уточнит специалист.</p>
              </div>
              <button
                className="btn btn-dark"
                onClick={() =>
                  openLead({
                    country: calcCountry,
                    service: calcService,
                    comment: `Заявителей: ${applicants}. Дополнительные услуги: ${extras.join(", ") || "не выбраны"}.`,
                    source: "calculator",
                  })
                }
              >
                Получить точный расчёт
              </button>
            </div>
          </div>
        </section>
        <section className="section why-section">
          <div className="container why-grid">
            <div className="rating-editorial">
              <small>Рейтинг клиентов в 2ГИС</small>
              <strong>4,8</strong>
              <div className="stars">★★★★★</div>
              <p>65 оценок · 31 отзыв</p>
              <a
                href="https://2gis.ru/novosibirsk/firm/141265770283147/tab/reviews"
                target="_blank"
              >
                Смотреть на 2ГИС →
              </a>
            </div>
            <div className="office-editorial">
              <OfficePhotoSlider />
              <div className="office-caption">
                <span>Офис GLOBAL</span>
                <b>ул. Челюскинцев, 15Б</b>
                <small>1 этаж · 600 м от метро</small>
                <a
                  href="https://yandex.ru/maps/?rtext=~55.039855,82.905859&rtt=auto"
                  target="_blank"
                >
                  Построить маршрут →
                </a>
              </div>
            </div>
          </div>
        </section>
        <section id="reviews" className="section reviews-section">
          <div className="container">
            <div className="reviews-head">
              <div>
                <div className="eyebrow">Отзывы клиентов</div>
                <h2 className="h2">Опыт тех, кто уже обращался</h2>
              </div>
              <div className="slider-controls">
                <button
                  aria-label="Предыдущий отзыв"
                  onClick={() =>
                    setReviewIndex(
                      (reviewIndex - 1 + reviews.length) % reviews.length,
                    )
                  }
                >
                  ←
                </button>
                <button
                  aria-label="Следующий отзыв"
                  onClick={() =>
                    setReviewIndex((reviewIndex + 1) % reviews.length)
                  }
                >
                  →
                </button>
              </div>
            </div>
            <div className="review-stage">
              <article>
                <div className="stars">
                  {"★".repeat(reviews[reviewIndex].rating)}
                  {"☆".repeat(5 - reviews[reviewIndex].rating)}
                </div>
                <blockquote>«{reviews[reviewIndex].text}»</blockquote>
                <div>
                  <cite>{reviews[reviewIndex].name}</cite>
                  <small>{reviews[reviewIndex].date && `${reviews[reviewIndex].date} · `}{reviews[reviewIndex].source} · Отрывок отзыва</small>
                  <a href={reviews[reviewIndex].url} target="_blank" rel="noreferrer">Читать отзыв целиком ↗</a>
                </div>
              </article>
              <div className="review-links">
                <a
                  href="https://2gis.ru/novosibirsk/firm/141265770283147/tab/reviews"
                  target="_blank"
                >
                  <span>Все отзывы на 2ГИС</span>
                  <b data-review-arrow aria-hidden="true">↗</b>
                </a>
                <a
                  href="https://yandex.ru/maps/org/global/1780859090/reviews/"
                  target="_blank"
                >
                  <span>Все отзывы на Яндекс Картах</span>
                  <b data-review-arrow aria-hidden="true">↗</b>
                </a>
              </div>
            </div>
          </div>
        </section>
        <section className="section gallery-section">
          <div className="container">
            <div className="section-heading" data-reveal>
              <div className="eyebrow">Пространство GLOBAL</div>
              <h2 className="h2">
                Знакомое место
                <br />
                до первого визита
              </h2>
            </div>
            <div className="gallery-masonry">
              {photos.map((p, i) => (
                <button
                  aria-label={`Открыть фотографию ${i + 1}`}
                  key={p}
                  onClick={() => setLightbox(i)}
                >
                  <img
                    src={p}
                    alt={`Офис GLOBAL ${i + 1}`}
                    loading={i ? "lazy" : "eager"}
                  />
                  <span>0{i + 1}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
        <section id="faq" className="section faq-section">
          <div className="container faq-grid">
            <div>
              <div className="eyebrow">Вопросы и ответы</div>
              <h2 className="h2">Что важно знать перед обращением</h2>
              <button
                className="btn btn-outline"
                onClick={() => openLead({ source: "faq" })}
              >
                Задать вопрос
              </button>
            </div>
            <div>
              {[
                [
                  "Какие документы нужны?",
                  "Перечень зависит от страны, типа визы, цели поездки и ситуации заявителя.",
                ],
                [
                  "Сколько занимает оформление?",
                  "Срок зависит от направления, сезона и работы консульства.",
                ],
                [
                  "Можно обратиться без готового пакета?",
                  "Да, начать можно с консультации и оценки ситуации.",
                ],
                [
                  "Как записаться?",
                  "Позвоните, напишите в Telegram или MAX либо заполните форму.",
                ],
                [
                  "Где находится офис?",
                  "Новосибирск, ул. Челюскинцев, 15Б, 1 этаж.",
                ],
              ].map((x, i) => (
                <details key={x[0]} open={i === 0}>
                  <summary>
                    <span>0{i + 1}</span>
                    {x[0]}
                    <i>+</i>
                  </summary>
                  <p>{x[1]}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section id="request" className="section lead-section">
          <div className="container lead-grid">
            <div>
              <div className="eyebrow light">Начните с консультации</div>
              <h2>Расскажите о вашей поездке</h2>
              <p className="lead-intro">После отправки заявка поступит специалисту GLOBAL.</p>
              <p className="lead-support">Мы свяжемся с вами, уточним детали поездки и подскажем дальнейшие шаги.</p>
              <ul className="trust-list">
                <li><SvgIcon type="chat" /><span>Персональная консультация</span></li>
                <li><SvgIcon type="visa" /><span>Уникальный номер каждой заявки</span></li>
                <li><SvgIcon type="shield" /><span>Контактные данные используются только для связи по вашей заявке</span></li>
              </ul>
            </div>
            <ApplicationForm preset={{ source: "website-main" }} />
          </div>
        </section>
        <section id="contacts" className="section contacts-section">
          <div className="container contacts">
            <div className="contact-card">
              <div className="eyebrow light">Контакты</div>
              <h2>
                Ждём вас
                <br />в офисе GLOBAL
              </h2>
              {[
                ["Адрес", "Новосибирск, ул. Челюскинцев, 15Б, 1 этаж"],
                ["Режим работы", "Пн–Пт: 08:30–15:30"],
                ["Телефон", phone],
                ["Email", CONTACT_EMAIL],
              ].map((x) => (
                <div className="contact-row" key={x[0]}>
                  <span>{x[0]}</span>
                  <b>{x[0] === "Email" ? <a href={`mailto:${CONTACT_EMAIL}`}>{x[1]}</a> : x[1]}</b>
                </div>
              ))}
              <div className="contact-row"><span>Telegram</span><b><SocialContactLink type="Telegram" showIcon={false}><span>@SVC_GLOBAL_NSK ↗</span></SocialContactLink></b></div>
              <div className="contact-row"><span>MAX</span><b><SocialContactLink type="MAX" showIcon={false}><span>Профиль GLOBAL ↗</span></SocialContactLink></b></div>
              <div className="contact-row"><span>WhatsApp</span><b><SocialContactLink type="WhatsApp" showIcon={false}><span>Написать ↗</span></SocialContactLink></b></div>
              <div className="contact-actions">
                <SocialContactLink type="Telegram" className="btn btn-ghost on-dark"><span className="action-label">Telegram</span></SocialContactLink>
                <SocialContactLink type="MAX" className="btn btn-ghost on-dark"><span className="action-label">MAX</span></SocialContactLink>
                <SocialContactLink type="WhatsApp" className="btn btn-ghost on-dark"><span className="action-label">WhatsApp</span></SocialContactLink>
                <a
                  className="btn btn-primary"
                  href="https://yandex.ru/maps/?rtext=~55.039855,82.905859&rtt=auto"
                  target="_blank"
                >
                  Маршрут
                </a>
                <a className="btn btn-ghost on-dark" href="tel:+79137871805">
                  Позвонить
                </a>
                <button className="btn btn-ghost on-dark" onClick={copyAddress}>
                  {copied ? "✓ Скопировано" : "Скопировать адрес"}
                </button>
              </div>
            </div>
            <iframe
              className="map"
              title="GLOBAL на карте"
              src="https://yandex.ru/map-widget/v1/?ll=82.905859%2C55.039855&z=16&pt=82.905859%2C55.039855,pm2rdm"
              loading="lazy"
            />
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="container footer-grid">
          <div>
            <GlobalLogo as="div" />
            <p>
              Сервисно-визовый центр
              <br />
              Новосибирск
            </p>
          </div>
          <div>
            <b>Навигация</b>
            <a href="#services">Услуги</a>
            <a href="#countries">Страны</a>
            <a href="#reviews">Отзывы</a>
          </div>
          <div>
            <b>Связь</b>
            <a href="tel:+79137871805">{phone}</a>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <SocialContactLink type="Telegram"><span>Telegram</span></SocialContactLink>
            <SocialContactLink type="MAX"><span>MAX</span></SocialContactLink>
            <SocialContactLink type="WhatsApp"><span>WhatsApp</span></SocialContactLink>
          </div>
        </div>
        <div className="container footer-bottom">
          <span>© 2026 GLOBAL</span>
          <span>
            <Link href="/privacy/">Политика конфиденциальности</Link> ·{" "}
            <Link href="/consent/">Согласие</Link>
          </span>
        </div>
      </footer>
      <div className="mobile-cta">
        <a href="tel:+79137871805">
          <SvgIcon type="phone" />
          Позвонить
        </a>
        <a href={TELEGRAM_URL} target="_blank" rel="noreferrer">
          <SvgIcon type="chat" />
          Telegram
        </a>
        <button onClick={() => openLead({ source: "mobile-bar" })}>
          <SvgIcon type="plane" />
          Заявка
        </button>
      </div>
      {country && (
        <div
          className="overlay"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => e.target === e.currentTarget && setCountry(null)}
        >
          <div className="country-modal">
            <button
              className="modal-close"
              aria-label="Закрыть окно"
              onClick={() => setCountry(null)}
            >
              ×
            </button>
            <div className="country-modal-visual">
              {country.image ? (
                <img src={country.image} alt={country.name} />
              ) : (
                <div className="country-placeholder" aria-label={`Флаг ${country.name}`}>
                  <span aria-hidden="true">{country.flag}</span>
                </div>
              )}
            </div>
            <div className="country-modal-copy">
              <div className="eyebrow">{country.group}</div>
              <h2>
                {country.flag} {country.name}
              </h2>
              <p>{country.summary}</p>
              {"aggregate" in country ? (
                <div className="field full">
                  <label htmlFor="schengen-country-select">
                    Выберите конкретную страну Шенгенской зоны
                  </label>
                  <select
                    id="schengen-country-select"
                    value={schengenChoice}
                    onChange={(event) => setSchengenChoice(event.target.value)}
                  >
                    <option value="">Выберите страну</option>
                    {SCHENGEN_COUNTRIES.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="detail-list">
                  <div>
                    <span>Услуга</span>
                    <b>{country.service || "Уточняется"}</b>
                  </div>
                  <div>
                    <span>Стоимость услуги GLOBAL</span>
                    <b>
                      {country.price
                        ? `${country.price.toLocaleString("ru-RU")} ₽`
                        : "Уточняется"}
                    </b>
                  </div>
                  <div>
                    <span>Документы</span>
                    <b>Зависят от цели поездки</b>
                  </div>
                </div>
              )}
              <button
                className="btn btn-dark"
                disabled={"aggregate" in country && !schengenChoice}
                onClick={() => {
                  const c = country;
                  const selectedCountry =
                    "aggregate" in c ? schengenChoice : c.name;
                  if (!selectedCountry || selectedCountry === "Шенген") return;
                  setCountry(null);
                  openLead({
                    country: selectedCountry,
                    service:
                      "aggregate" in c
                      ? visaService.formName
                      : c.formService || visaService.formName,
                    source: "country-detail",
                  });
                }}
              >
                {"aggregate" in country
                  ? "Выбрать страну и получить консультацию"
                  : "Получить консультацию"}
              </button>
            </div>
          </div>
        </div>
      )}
      {service !== null && (
        <div className="overlay" role="dialog" aria-modal="true">
          <div className="service-modal">
            <button
              className="modal-close"
              aria-label="Закрыть окно"
              onClick={() => setService(null)}
            >
              ×
            </button>
            <SvgIcon type={services[service].icon} />
            <div className="eyebrow">Услуга GLOBAL</div>
            <h2>{services[service].name}</h2>
            {services[service].detailTitle && <h3>{services[service].detailTitle}</h3>}
            <p>{services[service].detailDescription || services[service].description}</p>
            {services[service].insurers && (
              <p>Страховщики: {services[service].insurers.join(", ")}.</p>
            )}
            <ul>
              <li>Уточняем исходные данные</li>
              <li>Объясняем применимые требования</li>
              <li>Согласовываем состав услуги</li>
            </ul>
            <button
              className="btn btn-dark"
              onClick={() => {
                const selectedService = services[service];
                setService(null);
                openServiceLead(selectedService, "service-detail");
              }}
            >
              Получить консультацию
            </button>
          </div>
        </div>
      )}
      {lead && (
        <div
          className="overlay lead-overlay"
          role="dialog"
          aria-modal="true"
          onMouseDown={(e) => e.target === e.currentTarget && setLead(null)}
        >
          <div className="lead-modal">
            <button
              className="modal-close"
              aria-label="Закрыть окно"
              onClick={() => setLead(null)}
            >
              ×
            </button>
            <div className="lead-modal-head">
              <span>GLOBAL</span>
              <h2>Заявка на консультацию</h2>
              <p>Оставьте контакты — специалист уточнит детали.</p>
            </div>
            <ApplicationForm
              key={`${lead.country}-${lead.service}-${lead.comment}`}
              preset={lead}
              onClose={() => setLead(null)}
            />
          </div>
        </div>
      )}
      {wizardOpen && (
        <div className="overlay wizard-overlay" role="dialog" aria-modal="true">
          <div className="wizard">
            <button
              className="modal-close"
              aria-label="Закрыть окно"
              onClick={() => setWizardOpen(false)}
            >
              ×
            </button>
            <div className="wizard-head">
              <span>Подбор решения</span>
              <b>Шаг {wizardStep} из 5</b>
            </div>
            <div className="wizard-progress">
              <i style={{ width: `${wizardStep * 20}%` }} />
            </div>
            <div className="wizard-body">
              {wizardStep === 1 && (
                <div className="wizard-step">

                  <h2>Куда вы едете?</h2>
                  <input
                    aria-label="Страна поездки"
                    list="wizard-countries"
                    value={wizard.country}
                    onChange={(e) =>
                      setWizard({ ...wizard, country: e.target.value })
                    }
                    placeholder="Введите страну"
                  />
                  <datalist id="wizard-countries">
                    {countries.map((c) => (
                      <option key={c.name}>{c.name}</option>
                    ))}
                  </datalist>
                </div>
              )}
              {wizardStep === 2 && (
                <div className="wizard-step">

                  <h2>Цель поездки?</h2>
                  <div className="choice-grid">
                    {["Туризм", "Бизнес", "Учёба", "Гости", "Другое"].map(
                      (x) => (
                        <button
                          className={wizard.purpose === x ? "selected" : ""}
                          onClick={() => setWizard({ ...wizard, purpose: x })}
                          key={x}
                        >
                          {x}
                        </button>
                      ),
                    )}
                  </div>
                </div>
              )}
              {wizardStep === 3 && (
                <div className="wizard-step">

                  <h2>Когда планируете поездку?</h2>
                  <input
                    aria-label="Месяц поездки"
                    type="month"
                    value={wizard.date}
                    onChange={(e) =>
                      setWizard({ ...wizard, date: e.target.value })
                    }
                  />
                </div>
              )}
              {wizardStep === 4 && (
                <div className="wizard-step">

                  <h2>Сколько человек едет?</h2>
                  <div className="wizard-counter">
                    <button
                      aria-label="Уменьшить количество путешественников"
                      onClick={() =>
                        setWizard({
                          ...wizard,
                          travelers: Math.max(1, wizard.travelers - 1),
                        })
                      }
                    >
                      −
                    </button>
                    <strong>{wizard.travelers}</strong>
                    <button
                      onClick={() =>
                        setWizard({
                          ...wizard,
                          travelers: wizard.travelers + 1,
                        })
                      }
                      aria-label="Увеличить количество путешественников"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}
              {wizardStep === 5 && (
                <div className="wizard-step">

                  <h2>Есть действующий загранпаспорт?</h2>
                  <div className="choice-grid two">
                    {["Да", "Нет"].map((x) => (
                      <button
                        className={wizard.passport === x ? "selected" : ""}
                        onClick={() => setWizard({ ...wizard, passport: x })}
                        key={x}
                      >
                        {x}
                      </button>
                    ))}
                  </div>
                  <p>Передадим информацию специалисту GLOBAL.</p>
                </div>
              )}
            </div>
            <div className="wizard-actions">
              {wizardStep > 1 && (
                <button
                  className="btn btn-outline"
                  onClick={() => setWizardStep(wizardStep - 1)}
                >
                  Назад
                </button>
              )}
              {wizardStep < 5 ? (
                <button
                  className="btn btn-dark"
                  disabled={
                    wizardStep === 1 &&
                    !countries.some((c) => c.name === wizard.country)
                  }
                  onClick={() => setWizardStep(wizardStep + 1)}
                >
                  Продолжить
                </button>
              ) : (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setWizardOpen(false);
                    openLead({
                      country: wizard.country,
                      purpose: wizard.purpose,
                      service: visaService.formName,
                      comment: `Дата: ${wizard.date || "не указана"}. Путешественников: ${wizard.travelers}. Загранпаспорт: ${wizard.passport}.`,
                      source: "visa-wizard",
                    });
                    setWizardStep(1);
                  }}
                >
                  Получить консультацию
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {lightbox !== null && (
        <div
          className="lightbox"
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.target === e.currentTarget && setLightbox(null)}
        >
          <button
            className="lightbox-close"
            aria-label="Закрыть галерею"
            onClick={() => setLightbox(null)}
          >
            ×
          </button>
          <button
            className="lightbox-prev"
            aria-label="Предыдущая фотография"
            onClick={() =>
              setLightbox((lightbox - 1 + photos.length) % photos.length)
            }
          >
            ←
          </button>
          <img src={photos[lightbox]} alt={`Офис GLOBAL ${lightbox + 1}`} />
          <button
            className="lightbox-next"
            aria-label="Следующая фотография"
            onClick={() => setLightbox((lightbox + 1) % photos.length)}
          >
            →
          </button>
          <span>
            {lightbox + 1} / {photos.length}
          </span>
        </div>
      )}
    </>
  );
}
