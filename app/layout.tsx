import "./globals.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://capira.com";
const defaultTitle = "CAPIRA";
const defaultDescription =
  "Infraestructura de carga para movilidad electrica: soluciones para residencial, comercios, flotas y operadores CPO.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultTitle,
    template: "%s | CAPIRA",
  },
  description: defaultDescription,
  applicationName: "CAPIRA",
  keywords: [
    "movilidad electrica",
    "infraestructura de carga",
    "cargadores para autos electricos",
    "carga residencial",
    "carga para comercios",
    "electrificacion de flotas",
    "operacion CPO",
    "gestion de carga inteligente",
  ],
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/images/logo-capira.png",
    shortcut: "/images/logo-capira.png",
    apple: "/images/logo-capira.png",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "CAPIRA",
    title: defaultTitle,
    description: defaultDescription,
    locale: "es_ES",
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const organizationLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CAPIRA",
    url: siteUrl,
    logo: `${siteUrl}/images/logo-capira.png`,
    sameAs: [],
  };

  return (
    <html lang="es">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />
        <Header />
        <div className="min-h-screen bg-white">
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
