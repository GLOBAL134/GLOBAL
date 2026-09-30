import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ variable: "--font-manrope", subsets: ["cyrillic", "latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://svc-global.ru"),
  title: "GLOBAL — сервисно-визовый центр в Новосибирске",
  description: "Помощь в оформлении виз, загранпаспортов и сопутствующих документов в Новосибирске. Консультация специалистов GLOBAL.",
  keywords: ["визовый центр Новосибирск", "оформление визы Новосибирск", "помощь с визой Новосибирск", "GLOBAL визовый центр"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "GLOBAL — визы без лишних сложностей",
    description: "Сервисно-визовый центр в Новосибирске: подготовка документов, визовая помощь, страхование и фото на документы.",
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
      <body>{children}</body>
    </html>
  );
}
