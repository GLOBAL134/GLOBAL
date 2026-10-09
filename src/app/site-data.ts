export type Country = {
  name: string;
  flag: string;
  group: "Шенген" | "Другие направления";
  image?: string;
  price?: number;
  service?: string;
  formService?: string;
  summary: string;
};

export type Service = {
  name: string;
  formName: string;
  description: string;
  detailTitle?: string;
  detailDescription?: string;
  insurers?: string[];
  extraOnly?: true;
  icon: "visa" | "shield" | "copy" | "banknotes";
};

export type AggregateDestination = {
  name: "Шенген";
  flag: "🇪🇺";
  group: "Шенген";
  image: string;
  summary: string;
  aggregate: true;
};

export type PopularDestination = Country | AggregateDestination;

export const NEUTRAL_COUNTRY_SUMMARY =
  "Условия оформления зависят от цели поездки и ситуации заявителя. Оставьте заявку — специалист GLOBAL проконсультирует по вашему случаю.";
export const CONTACT_EMAIL = "n9137871805@yandex.ru";
export const WHATSAPP_URL = "https://wa.me/79137871805";
export const TELEGRAM_URL = "https://t.me/SVC_GLOBAL_NSK";
export const MAX_URL = "https://max.ru/u/f9LHodD0cOL9XCvB0s54oOa-5DtER3blB5RfJKiYU-tE9NGhkphplmudTYk";

export const SCHENGEN_COUNTRIES = [
  "Австрия",
  "Бельгия",
  "Болгария",
  "Венгрия",
  "Германия",
  "Греция",
  "Дания",
  "Исландия",
  "Испания",
  "Италия",
  "Латвия",
  "Литва",
  "Лихтенштейн",
  "Люксембург",
  "Мальта",
  "Нидерланды",
  "Норвегия",
  "Польша",
  "Португалия",
  "Румыния",
  "Словакия",
  "Словения",
  "Финляндия",
  "Франция",
  "Хорватия",
  "Чехия",
  "Швейцария",
  "Швеция",
  "Эстония",
] as const;

const countryFlags: Record<string, string> = {
  Австрия: "🇦🇹",
  Бельгия: "🇧🇪",
  Болгария: "🇧🇬",
  Венгрия: "🇭🇺",
  Германия: "🇩🇪",
  Греция: "🇬🇷",
  Дания: "🇩🇰",
  Исландия: "🇮🇸",
  Испания: "🇪🇸",
  Италия: "🇮🇹",
  Латвия: "🇱🇻",
  Литва: "🇱🇹",
  Лихтенштейн: "🇱🇮",
  Люксембург: "🇱🇺",
  Мальта: "🇲🇹",
  Нидерланды: "🇳🇱",
  Норвегия: "🇳🇴",
  Польша: "🇵🇱",
  Португалия: "🇵🇹",
  Румыния: "🇷🇴",
  Словакия: "🇸🇰",
  Словения: "🇸🇮",
  Финляндия: "🇫🇮",
  Франция: "🇫🇷",
  Хорватия: "🇭🇷",
  Чехия: "🇨🇿",
  Швейцария: "🇨🇭",
  Швеция: "🇸🇪",
  Эстония: "🇪🇪",
  Кипр: "🇨🇾",
  Япония: "🇯🇵",
  Китай: "🇨🇳",
  Тайвань: "🇹🇼",
  Таиланд: "🇹🇭",
  "Южная Корея": "🇰🇷",
  Великобритания: "🇬🇧",
};

const countryImage =
  "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1400&q=82";

export const countries: Country[] = [
  ...SCHENGEN_COUNTRIES.map((name) => ({
    name,
    flag: countryFlags[name],
    group: "Шенген" as const,
    summary: NEUTRAL_COUNTRY_SUMMARY,
  })),
  {
    name: "Кипр",
    flag: countryFlags["Кипр"],
    group: "Другие направления",
    summary: NEUTRAL_COUNTRY_SUMMARY,
  },
  {
    name: "Япония",
    flag: countryFlags["Япония"],
    group: "Другие направления",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1400&q=82",
    price: 8000,
    service: "Оформление виз",
    formService: "Оформление виз",
    summary: "Консультация и подготовка документов для поездки в Японию.",
  },
  {
    name: "Китай",
    flag: countryFlags["Китай"],
    group: "Другие направления",
    image:
      "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1400&q=82",
    summary: NEUTRAL_COUNTRY_SUMMARY,
  },
  {
    name: "Тайвань",
    flag: countryFlags["Тайвань"],
    group: "Другие направления",
    summary: NEUTRAL_COUNTRY_SUMMARY,
  },
  {
    name: "Таиланд",
    flag: countryFlags["Таиланд"],
    group: "Другие направления",
    summary: NEUTRAL_COUNTRY_SUMMARY,
  },
  {
    name: "Южная Корея",
    flag: countryFlags["Южная Корея"],
    group: "Другие направления",
    image:
      "https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=1400&q=82",
    price: 6000,
    service: "Оформление виз",
    formService: "Оформление виз",
    summary: "Помощь с электронной визой и подготовкой данных для поездки.",
  },
  {
    name: "Великобритания",
    flag: countryFlags["Великобритания"],
    group: "Другие направления",
    image: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1400&q=82",
    summary: NEUTRAL_COUNTRY_SUMMARY,
  },
];

export const otherCountries = countries.filter(
  (country) => country.group === "Другие направления",
);

export const countryGroups = [
  {
    name: "Шенген",
    countries: countries.filter((country) => country.group === "Шенген"),
  },
  { name: "Другие направления", countries: otherCountries },
] as const;

export const schengenAggregate: AggregateDestination = {
  name: "Шенген",
  flag: "🇪🇺",
  group: "Шенген",
  image: countryImage,
  summary: NEUTRAL_COUNTRY_SUMMARY,
  aggregate: true,
};

export const popularDestinations: PopularDestination[] = [
  schengenAggregate,
  countries.find((country) => country.name === "Великобритания")!,
  countries.find((country) => country.name === "Япония")!,
  countries.find((country) => country.name === "Китай")!,
  countries.find((country) => country.name === "Южная Корея")!,
];

export const services: Service[] = [
  {
    name: "Оформление виз",
    formName: "Оформление виз",
    description:
      "Консультация и подготовка комплекта документов для выбранного направления.",
    icon: "visa",
  },
  {
    name: "Медицинское страхование путешественников",
    formName: "Медицинское страхование путешественников",
    description: "Поможем оформить медицинскую страховку для поездки за границу.",
    detailDescription:
      "Поможем подобрать и оформить медицинскую страховку для поездки за границу.",
    insurers: ["Евроинс", "АльфаСтрахование"],
    icon: "shield",
  },
  {
    name: "Нотариально заверенные переводы",
    formName: "Нотариально заверенный перевод",
    description:
      "Подготовка перевода документов на английский язык с последующим нотариальным заверением.",
    detailTitle: "Перевод документов на английский язык",
    detailDescription:
      "Поможем подготовить перевод документов на английский язык и оформить нотариальное заверение.",
    icon: "banknotes",
  },
  {
    name: "Фото и копировальные услуги",
    formName: "Фото и копировальные услуги",
    description: "Фото на документы и копировальные услуги в офисе GLOBAL.",
    icon: "copy",
  },
  ...["Бронирование авиабилетов", "Бронирование отелей", "Запись на подачу документов"].map((name): Service => ({
    name,
    formName: name,
    description: "Условия и стоимость уточнит специалист.",
    icon: "visa",
    extraOnly: true,
  })),
];

export const primaryServices = services.filter((service) => !service.extraOnly);
export const visaService = primaryServices[0];

export const getApplicableExtras = (primaryServiceFormName: string) =>
  services.filter(
    (service) =>
      service !== visaService && service.formName !== primaryServiceFormName,
  );

export const reviews = [
  {
    name: "Анна Карпова",
    date: "",
    text: "Благодарю менеджера, Николая, за профессиональную, качественную и очень полезную информацию по получению шенгенской визы и организации поездки!!!",
    rating: 5,
    source: "2ГИС",
    url: "https://2gis.ru/reviews/141265770283147/review/212502268",
  },
  {
    name: "Инна М.",
    date: "27 мая 2025",
    text: "Хочу сказать слова благодарности специалисту по работе с визами Великобритании, Варваре. Свою работу знает отлично, очень внимательная и доброжелательная.",
    rating: 5,
    source: "Яндекс Карты",
    url: "https://yandex.ru/maps/org/global/1780859090/reviews/",
  },
  {
    name: "Ольга Шлосс",
    date: "28 августа 2025",
    text: "Дочь обращалась и осталась недовольна качеством обслуживания. По мнению автора, сделку не сопровождали и не сообщили об изменениях в требованиях.",
    rating: 2,
    source: "Яндекс Карты",
    url: "https://yandex.ru/maps/org/global/1780859090/reviews/",
  },
  {
    name: "Ярик Яроки",
    date: "3 марта 2026",
    text: "Отличный центр. Персонал приятен в общении и отвечает на вопросы. Остался очень доволен.",
    rating: 5,
    source: "Яндекс Карты",
    url: "https://yandex.ru/maps/org/global/1780859090/reviews/",
  },
];
