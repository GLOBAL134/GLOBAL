export type Country = {
  name: string;
  flag: string;
  group: string;
  image?: string;
  price?: number;
  service?: string;
  summary: string;
};
export type Service = {
  name: string;
  description: string;
  icon: "visa" | "passport" | "shield" | "copy";
};

export const photos = [
  "https://avatars.mds.yandex.net/get-altay/17637863/2a0000019c669dfc607d71279ab8b7c2625b/orig",
  "https://avatars.mds.yandex.net/get-altay/18140291/2a0000019c6f642009f1dd72cd2c3665f869/XXL_height",
  "https://avatars.mds.yandex.net/get-altay/18111128/2a0000019c669814a8294c3839199ba1cf8a/XXL_height",
];

const europe = [
  ["Италия", "🇮🇹"],
  ["Финляндия", "🇫🇮"],
  ["Испания", "🇪🇸"],
  ["Германия", "🇩🇪"],
  ["Франция", "🇫🇷"],
  ["Чехия", "🇨🇿"],
  ["Греция", "🇬🇷"],
  ["Польша", "🇵🇱"],
  ["Венгрия", "🇭🇺"],
  ["Литва", "🇱🇹"],
  ["Латвия", "🇱🇻"],
  ["Австрия", "🇦🇹"],
  ["Португалия", "🇵🇹"],
  ["Болгария", "🇧🇬"],
  ["Швеция", "🇸🇪"],
  ["Швейцария", "🇨🇭"],
  ["Бельгия", "🇧🇪"],
  ["Дания", "🇩🇰"],
  ["Нидерланды", "🇳🇱"],
  ["Норвегия", "🇳🇴"],
  ["Эстония", "🇪🇪"],
  ["Ирландия", "🇮🇪"],
] as const;
export const countries: Country[] = [
  {
    name: "Япония",
    flag: "🇯🇵",
    group: "Азия",
    image:
      "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=1400&q=82",
    price: 8000,
    service: "Оформление визы",
    summary: "Консультация и подготовка документов для поездки в Японию.",
  },
  {
    name: "Южная Корея",
    flag: "🇰🇷",
    group: "Азия",
    image:
      "https://images.unsplash.com/photo-1517154421773-0529f29ea451?auto=format&fit=crop&w=1400&q=82",
    price: 6000,
    service: "Электронная виза",
    summary: "Помощь с электронной визой и подготовкой данных для поездки.",
  },
  {
    name: "Китай",
    flag: "🇨🇳",
    group: "Азия",
    image:
      "https://images.unsplash.com/photo-1508804185872-d7badad00f7d?auto=format&fit=crop&w=1400&q=82",
    summary: "Специалист уточнит подходящую услугу после консультации.",
  },
  {
    name: "Шенген",
    flag: "🇪🇺",
    group: "Европа",
    image:
      "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=1400&q=82",
    price: 7000,
    service: "Подготовка визовых документов",
    summary: "Подготовка документов для выбранной страны Шенгенской зоны.",
  },
  ...europe.map(([name, flag]) => ({
    name,
    flag,
    group: "Европа",
    summary: "Требования, сроки и стоимость уточнит специалист GLOBAL.",
  })),
];

export const services: Service[] = [
  {
    name: "Оформление виз",
    description:
      "Консультация и подготовка комплекта документов для выбранного направления.",
    icon: "visa",
  },
  {
    name: "Загранпаспорта и миграционные услуги",
    description:
      "Помощь с документами в рамках услуг, указанных в карточке организации.",
    icon: "passport",
  },
  {
    name: "Страхование для поездки",
    description: "Оформление страхования выезжающих за рубеж.",
    icon: "shield",
  },
  {
    name: "Фото и копировальные услуги",
    description: "Фото на документы и копировальные услуги в офисе GLOBAL.",
    icon: "copy",
  },
];

export const reviews = [
  {
    name: "Инна М.",
    date: "27 мая 2025",
    text: "Хочу сказать слова благодарности специалисту по работе с визами Великобритании, Варваре. Свою работу знает отлично, очень внимательная и доброжелательная.",
    rating: 5,
  },
  {
    name: "Ольга Шлосс",
    date: "28 августа 2025",
    text: "Дочь обращалась и осталась недовольна качеством обслуживания. По мнению автора, сделку не сопровождали и не сообщили об изменениях в требованиях.",
    rating: 2,
  },
  {
    name: "Ярик Яроки",
    date: "3 марта 2026",
    text: "Отличный центр. Персонал приятен в общении и отвечает на вопросы. Остался очень доволен.",
    rating: 5,
  },
];
