import "./globals.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "CAPIRA",
    template: "%s | CAPIRA",
  },
  icons: {
    icon: "/images/logo-capira.png",
    shortcut: "/images/logo-capira.png",
    apple: "/images/logo-capira.png",
  },
  description:
    "Infraestructura y software para movilidad y energía. Soluciones para flotas, empresas y operadores, con operación confiable y resultados medibles.",
  metadataBase: new URL("https://capira.com"), // luego lo cambiamos por tu dominio real
  openGraph: {
    type: "website",
    siteName: "CAPIRA",
    title: "CAPIRA",
    description:
      "Infraestructura y software para movilidad y energía. Soluciones para flotas, empresas y operadores.",
  },
  twitter: {
    card: "summary_large_image",
    title: "CAPIRA",
    description:
      "Infraestructura y software para movilidad y energía. Soluciones para flotas, empresas y operadores.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <Header />
        <div className="min-h-screen bg-white">
          <main>{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
