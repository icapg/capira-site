import Link from "next/link";

type Charger = {
  id: string;
  brand: string;
  model: string;
  power: "7.4" | "11";
  solar: boolean;
  description: string;
};

const CHARGERS: Charger[] = [
  {
    id: "wallbox-pulsar-plus-74",
    brand: "Wallbox",
    model: "Pulsar Plus",
    power: "7.4",
    solar: false,
    description:
      "Compacto y fiable. Ideal para viviendas con instalación monofásica.",
  },
  {
    id: "wallbox-pulsar-plus-11",
    brand: "Wallbox",
    model: "Pulsar Plus",
    power: "11",
    solar: false,
    description: "Versión trifásica para mayor velocidad de carga.",
  },
  {
    id: "wallbox-pulsar-max-solar",
    brand: "Wallbox",
    model: "Pulsar Max + Solar",
    power: "11",
    solar: true,
    description: "Optimiza la carga usando excedentes solares.",
  },
  {
  id: "wallbox-pulsar-plus-74-solar",
  brand: "Wallbox",
  model: "Pulsar Plus + Solar",
  power: "7.4",
  solar: true,
  description: "Carga monofásica de 7,4 kW optimizada para autoconsumo solar.",
},

  {
    id: "zaptec-go-74",
    brand: "Zaptec",
    model: "Go",
    power: "7.4",
    solar: false,
    description: "Diseño minimalista con conectividad avanzada.",
  },
  {
    id: "zaptec-pro-11-solar",
    brand: "Zaptec",
    model: "Pro + Solar",
    power: "11",
    solar: true,
    description: "Pensado para instalaciones avanzadas y solares.",
  },
];

type SearchParams = { potencia?: string; solar?: string };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<SearchParams> | SearchParams;
}) {
  const sp = await Promise.resolve(searchParams);

  const potencia = sp?.potencia; // "7.4" | "11" (string)
  const solarFilterEnabled = typeof sp?.solar !== "undefined";
  const solar = sp?.solar === "true";

  const base = CHARGERS.filter((c) => {
  if (potencia && c.power !== potencia) return false;
  if (solarFilterEnabled && c.solar !== solar) return false;
  return true;
});

// orden: primero los que matchean exactamente los filtros recibidos (si hay)
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
      {/* HERO */}
      <section className="bg-white border-b border-zinc-200">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
          <h1 className="text-2xl font-bold text-zinc-900">
            Cargadores disponibles
          </h1>
          <p className="mt-2 max-w-3xl text-zinc-600">
            Selección de cargadores recomendados según tu instalación y uso.
          </p>

          {(potencia || solarFilterEnabled) && (
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              {potencia && (
                <span className="rounded-full border border-zinc-300 bg-zinc-50 px-3 py-1">
                  Potencia: {potencia === "7.4" ? "7,4 kW" : "11 kW"}
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

      {/* GRID */}
      <section className="bg-zinc-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-6 text-center">
              <p className="text-zinc-700">
                No encontramos cargadores con estos filtros.
              </p>
              <Link
                href="/contacto"
                className="mt-4 inline-block rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-white hover:bg-zinc-800"
              >
                Hablar con un especialista
              </Link>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((c) => (
  <div
    key={c.id}
    className="rounded-2xl border border-zinc-200 bg-white p-6"
  >
    {isTopRecommended(c) && (
      <div className="mb-3 inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-700">
        ⭐ Más recomendado
      </div>
    )}

    <div className="flex items-center justify-between">
      <h2 className="text-lg font-semibold text-zinc-900">
        {c.brand}
      </h2>
      <span className="text-xs font-medium text-zinc-500">
        {c.power === "7.4" ? "7,4 kW" : "11 kW"}
      </span>
    </div>

    <p className="mt-1 text-sm font-medium text-zinc-700">
      {c.model}
    </p>
    ...


                  <p className="mt-3 text-sm text-zinc-600">
                    {c.description}
                  </p>

                  {c.solar && (
                    <div className="mt-3 inline-flex items-center rounded-full bg-yellow-50 px-3 py-1 text-xs font-medium text-yellow-800">
                      ☀️ Compatible con solar
                    </div>
                  )}

                  <div className="mt-5 flex gap-3">
                    <Link
                      href="/recursos/presupuesto"
                      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
                    >
                      Presupuestar
                    </Link>
                    <Link
                      href="/contacto"
                      className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                    >
                      Consultar
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
