import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import fs from "node:fs";
import path from "node:path";

type Charger = {
  id: string;
  brand: string;
  model: string;
  power: "7.4" | "11" | "22";
  solar: boolean;
  description: string;
  productUrl: string;
  image: string;
  imageAlt: string;
};

const CHARGERS: Charger[] = [
  {
    id: "wallbox-pulsar-plus-74",
    brand: "Wallbox",
    model: "Pulsar Plus",
    power: "7.4",
    solar: false,
    description: "Compacto y fiable. Ideal para viviendas con instalación monofásica.",
    productUrl: "https://wallbox.com/es/pulsar-family",
    image: "/images/cargadores/wallbox-pulsar-plus-74.svg",
    imageAlt: "Wallbox Pulsar Plus",
  },
  {
    id: "wallbox-pulsar-plus-11",
    brand: "Wallbox",
    model: "Pulsar Plus",
    power: "11",
    solar: false,
    description: "Versión trifásica para mayor velocidad de carga.",
    productUrl: "https://wallbox.com/es/pulsar-family",
    image: "/images/cargadores/wallbox-pulsar-plus-11.svg",
    imageAlt: "Wallbox Pulsar Plus 11 kW",
  },
  {
    id: "wallbox-pulsar-max-22",
    brand: "Wallbox",
    model: "Pulsar Max",
    power: "22",
    solar: true,
    description: "Hasta 22 kW en AC, con gestión inteligente y foco en autoconsumo.",
    productUrl: "https://wallbox.com/es/pulsar-family",
    image: "/images/cargadores/wallbox-pulsar-max-22.svg",
    imageAlt: "Wallbox Pulsar Max",
  },
  {
    id: "wallbox-pulsar-plus-74-solar",
    brand: "Wallbox",
    model: "Pulsar Plus + Solar",
    power: "7.4",
    solar: true,
    description: "Carga monofásica de 7,4 kW optimizada para autoconsumo solar.",
    productUrl: "https://wallbox.com/es/pulsar-family",
    image: "/images/cargadores/wallbox-pulsar-plus-74-solar.svg",
    imageAlt: "Wallbox Pulsar Plus con solar",
  },
  {
    id: "ohme-home-pro-74",
    brand: "Ohme",
    model: "Home Pro",
    power: "7.4",
    solar: false,
    description: "Muy popular en residencial por su app y programación inteligente.",
    productUrl: "https://ohme-ev.com/home-pro/",
    image: "/images/cargadores/ohme-home-pro-74.svg",
    imageAlt: "Ohme Home Pro",
  },
  {
    id: "ohme-epod-74",
    brand: "Ohme",
    model: "ePod",
    power: "7.4",
    solar: false,
    description: "Formato compacto para instalación doméstica con control remoto.",
    productUrl: "https://ohme-ev.com/epod-home-ev-charger/",
    image: "/images/cargadores/ohme-epod-74.svg",
    imageAlt: "Ohme ePod",
  },
  {
    id: "policharger-nw-t2-74",
    brand: "Policharger",
    model: "NW-T2",
    power: "7.4",
    solar: true,
    description: "Fabricado en España, robusto y con opciones para balanceo y solar.",
    productUrl: "https://policharger.com/",
    image: "/images/cargadores/policharger-nw-t2-74.svg",
    imageAlt: "Policharger NW-T2",
  },
  {
    id: "policharger-nw-t2-22",
    brand: "Policharger",
    model: "NW-T2",
    power: "22",
    solar: true,
    description: "Versión trifásica hasta 22 kW para instalaciones de mayor exigencia.",
    productUrl: "https://policharger.com/",
    image: "/images/cargadores/policharger-nw-t2-22.svg",
    imageAlt: "Policharger NW-T2 22 kW",
  },
  {
    id: "v2c-trydan-74",
    brand: "V2C",
    model: "Trydan",
    power: "7.4",
    solar: true,
    description: "Cargador inteligente con fuerte foco en integración fotovoltaica.",
    productUrl: "https://v2charge.com/es/cargadores/trydan/",
    image: "/images/cargadores/v2c-trydan-74.svg",
    imageAlt: "V2C Trydan",
  },
  {
    id: "v2c-trydan-pro-22",
    brand: "V2C",
    model: "Trydan Pro",
    power: "22",
    solar: true,
    description: "Hasta 22 kW AC con funcionalidades avanzadas y control cloud.",
    productUrl: "https://v2charge.com/es/cargadores/trydan-pro/",
    image: "/images/cargadores/v2c-trydan-pro-22.svg",
    imageAlt: "V2C Trydan Pro",
  },
  {
    id: "circontrol-ehome-22",
    brand: "Circontrol",
    model: "eHome 5",
    power: "22",
    solar: false,
    description: "Referencia en AC para uso residencial avanzado y semipúblico.",
    productUrl: "https://circontrol.com/ehome-series/",
    image: "/images/cargadores/circontrol-ehome-22.svg",
    imageAlt: "Circontrol eHome 5",
  },
  {
    id: "schneider-evlink-home-11",
    brand: "Schneider Electric",
    model: "EVlink Home",
    power: "11",
    solar: false,
    description: "Equipo de marca consolidada, orientado a fiabilidad y seguridad eléctrica.",
    productUrl: "https://www.se.com/es/es/product-range/68431-evlink-home/",
    image: "/images/cargadores/schneider-evlink-home-11.svg",
    imageAlt: "Schneider EVlink Home",
  },
  {
    id: "orbis-viaris-uni-22",
    brand: "Orbis",
    model: "VIARIS UNI",
    power: "22",
    solar: true,
    description: "Modelo extendido en España con opciones de gestión dinámica y solar.",
    productUrl: "https://www.orbis.es/es/productos/viaris-uni",
    image: "/images/cargadores/orbis-viaris-uni-22.svg",
    imageAlt: "Orbis VIARIS UNI",
  },
  {
    id: "zaptec-go-74",
    brand: "Zaptec",
    model: "Go",
    power: "7.4",
    solar: false,
    description: "Diseño minimalista con conectividad avanzada.",
    productUrl: "https://www.zaptec.com/es/cargadores/zaptec-go",
    image: "/images/cargadores/zaptec-go-74.svg",
    imageAlt: "Zaptec Go",
  },
  {
    id: "zaptec-pro-11-solar",
    brand: "Zaptec",
    model: "Pro + Solar",
    power: "11",
    solar: true,
    description: "Pensado para instalaciones avanzadas y solares.",
    productUrl: "https://www.zaptec.com/es/cargadores/zaptec-pro",
    image: "/images/cargadores/zaptec-pro-11-solar.svg",
    imageAlt: "Zaptec Pro",
  },
];

type SearchParams = { potencia?: string; solar?: string };

const cargadoresDir = path.join(process.cwd(), "public", "images", "cargadores");
const availableImages = new Set(
  fs.existsSync(cargadoresDir)
    ? fs.readdirSync(cargadoresDir).map((file) => file.toLowerCase())
    : []
);

export const metadata: Metadata = {
  title: "Cargadores para coche eléctrico",
  description:
    "Catálogo de cargadores AC recomendados para hogar y negocio, con filtros por potencia e integración solar.",
  keywords: [
    "cargadores coche eléctrico",
    "wallbox 7.4 kW",
    "cargador 11 kW",
    "cargador 22 kW",
    "cargador con integración solar",
  ],
  alternates: {
    canonical: "/cargadores",
  },
};

function powerLabel(power: Charger["power"]) {
  if (power === "7.4") return "7,4 kW";
  if (power === "11") return "11 kW";
  return "22 kW";
}

function resolveLocalImage(id: string) {
  const exts = ["jpg", "jpeg", "png", "webp", "avif", "svg"];
  for (const ext of exts) {
    const filename = `${id}.${ext}`.toLowerCase();
    if (availableImages.has(filename)) {
      return `/images/cargadores/${filename}`;
    }
  }
  return null;
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const sp = await Promise.resolve(searchParams);

  const potencia = sp?.potencia;
  const solarFilterEnabled = typeof sp?.solar !== "undefined";
  const solar = sp?.solar === "true";

  const base = CHARGERS.filter((c) => {
    if (potencia && c.power !== potencia) return false;
    if (solarFilterEnabled && c.solar !== solar) return false;
    return true;
  });

  const filtered = base
    .map((c) => {
      const score =
        (potencia ? (c.power === potencia ? 2 : 0) : 0) +
        (solarFilterEnabled ? (c.solar === solar ? 1 : 0) : 0);
      return { c, score };
    })
    .sort((a, b) => b.score - a.score)
    .map((x) => x.c);

  const hasFilters = Boolean(potencia || solarFilterEnabled);
  const isTopRecommended = (c: Charger) => {
    if (!hasFilters) return false;
    if (potencia && c.power !== potencia) return false;
    if (solarFilterEnabled && c.solar !== solar) return false;
    return true;
  };

  return (
    <main>
      <section className="border-b border-zinc-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
          <h1 className="text-2xl font-bold text-zinc-900">Cargadores disponibles</h1>
          <p className="mt-2 max-w-3xl text-zinc-600">
            Selección de cargadores AC recomendados según tu instalación y uso.
          </p>

          {(potencia || solarFilterEnabled) && (
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {potencia && (
                <span className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1">
                  Potencia: {potencia === "7.4" ? "7,4 kW" : potencia === "22" ? "22 kW" : "11 kW"}
                </span>
              )}
              {solarFilterEnabled && (
                <span className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1">
                  Integración solar
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="bg-zinc-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
              <p className="text-zinc-700">No encontramos cargadores con estos filtros.</p>
              <Link
                href="/contacto"
                className="mt-4 inline-block rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Hablar con un especialista
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => {
                const imageSrc = resolveLocalImage(c.id);
                return (
                  <div
                    key={c.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                  <a href={c.productUrl} target="_blank" rel="noopener noreferrer" className="block">
                    <div className="aspect-square overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={c.imageAlt}
                          width={480}
                          height={480}
                          sizes="(min-width: 1024px) 28vw, (min-width: 640px) 44vw, 92vw"
                          className="h-full w-full object-contain p-3"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-100 px-4 text-center text-xs text-zinc-500">
                          Imagen pendiente
                          <br />
                          {`public/images/cargadores/${c.id}.jpg`}
                        </div>
                      )}
                    </div>

                    {isTopRecommended(c) && (
                      <div className="mb-3 mt-3 inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
                        ⭐ Más recomendado
                      </div>
                    )}

                    <div className="mt-3 flex items-center justify-between">
                      <h2 className="text-lg font-semibold text-zinc-900">{c.brand}</h2>
                      <span className="text-xs font-medium text-zinc-500">{powerLabel(c.power)}</span>
                    </div>

                    <p className="mt-1 text-sm font-medium text-zinc-700">{c.model}</p>
                    <p className="mt-3 text-sm text-zinc-600">{c.description}</p>

                    {c.solar && (
                      <div className="mt-3 inline-flex items-center rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-800">
                        ☀️ Compatible con solar
                      </div>
                    )}
                  </a>

                  <div className="mt-5 flex gap-3">
                    <Link
                      href="/contacto"
                      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                    >
                      Presupuestar
                    </Link>
                  </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
