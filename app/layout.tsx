import "./globals.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

const siteUrl = "https://capirapower.com";
const defaultTitle = "CAPIRA";
const defaultDescription = "Movilidad eléctrica con visión de negocio";

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
    icon: "/icon.png?v=7",
    shortcut: "/favicon.ico?v=7",
    apple: "/apple-icon.png?v=7",
  },
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "CAPIRA",
    title: defaultTitle,
    description: defaultDescription,
    locale: "es_ES",
    images: [
      {
        url: `${siteUrl}/images/og-capira-share-square.png?v=1`,
        width: 512,
        height: 512,
        alt: "CAPIRA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description: defaultDescription,
    images: [`${siteUrl}/images/og-capira-share-square.png?v=1`],
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

