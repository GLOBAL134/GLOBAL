import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { countries, services, CONTACT_EMAIL } from "./site-data";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["cyrillic", "latin"] });

const structuredData = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: "GLOBAL",
  description:
    "Сервисно-визовый центр в Новосибирске: консультации, оформление виз, медицинское страхование путешественников и нотариально заверенные переводы.",
  url: "https://svc-global.ru/",
  telephone: "+7 913 787-18-05",
  email: CONTACT_EMAIL,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Новосибирск",
    streetAddress: "ул. Челюскинцев, 15Б",
    addressCountry: "RU",
  },
  areaServed: countries.map((country) => ({
    "@type": "Country",
    name: country.name,
  })),
  makesOffer: services.map((service) => ({
    "@type": "Offer",
    name: service.name,
    description: service.description,
  })),
};

export const metadata: Metadata = {
  metadataBase: new URL("https://svc-global.ru"),
  title: "GLOBAL — сервисно-визовый центр в Новосибирске",
  description:
    "Консультации по визам, медицинское страхование путешественников и нотариально заверенные переводы в Новосибирске. GLOBAL поможет подготовить документы к поездке.",
  keywords: [
    "визовый центр Новосибирск",
    "оформление визы Новосибирск",
    "медицинское страхование путешественников",
    "нотариально заверенные переводы",
    "GLOBAL визовый центр",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: "GLOBAL — консультации по поездкам и документам",
    description:
      "Сервисно-визовый центр в Новосибирске: визовая помощь, медицинское страхование путешественников и нотариально заверенные переводы.",
    url: "https://svc-global.ru",
    siteName: "GLOBAL",
    locale: "ru_RU",
    type: "website",
    images: ["https://avatars.mds.yandex.net/get-altay/17637863/2a0000019c669dfc607d71279ab8b7c2625b/orig"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ru" className={`${manrope.variable} antialiased`}>
      <body>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </body>
    </html>
  );
}
