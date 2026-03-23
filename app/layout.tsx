import "./globals.css";
import { ConditionalNav } from "./components/ConditionalNav";
import { WhatsAppButton } from "./components/WhatsAppButton";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";

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

  const pixelId = process.env.NEXT_PUBLIC_PIXEL_ID;
  const gaId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <html lang="es">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }}
        />

        {/* Meta Pixel */}
        {pixelId && (
          <Script
            id="meta-pixel"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                !function(f,b,e,v,n,t,s)
                {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                n.queue=[];t=b.createElement(e);t.async=!0;
                t.src=v;s=b.getElementsByTagName(e)[0];
                s.parentNode.insertBefore(t,s)}(window, document,'script',
                'https://connect.facebook.net/en_US/fbevents.js');
                fbq('init', '${pixelId}');
                fbq('track', 'PageView');
              `,
            }}
          />
        )}

        {/* Google Analytics 4 */}
        {gaId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script
              id="ga4-config"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}');
                `,
              }}
            />
          </>
        )}

        <ConditionalNav>{children}</ConditionalNav>
        <WhatsAppButton />
      </body>
    </html>
  );
}

