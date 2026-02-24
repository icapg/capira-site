"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";

type Vivienda = "vivienda" | "comunidad" | "comercio";
type Distancia = "0-10" | "10-20" | "20-35" | "35+";
type Red = "monofasica" | "trifasica" | "no-se";
type Cargador = "7.4" | "11" | "22" | "ninguno";
type Obra = "baja" | "media" | "alta";
type Pais = "España" | "Argentina" | "Bolivia" | "Brasil" | "Chile" | "Colombia" | "Costa Rica" | "Ecuador" | "El Salvador" | "Guatemala" | "Honduras" | "México" | "Nicaragua" | "Panamá" | "Paraguay" | "Perú" | "República Dominicana" | "Uruguay" | "Venezuela";

type FormState = {
  pais: Pais | "";
  vivienda: Vivienda | "";
  distancia: Distancia | "";
  red: Red | "";
  cargador: Cargador | "";
  obra: Obra | "";
};

const PAISES: Pais[] = [
  "España",
  "Argentina",
  "Bolivia",
  "Brasil",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Ecuador",
  "El Salvador",
  "Guatemala",
  "Honduras",
  "México",
  "Nicaragua",
  "Panamá",
  "Paraguay",
  "Perú",
  "República Dominicana",
  "Uruguay",
  "Venezuela",
];

const DISTANCIA_COST: Record<Distancia, number> = {
  "0-10": 0,
  "10-20": 160,
  "20-35": 340,
  "35+": 620,
};

const RED_COST: Record<Red, number> = {
  monofasica: 0,
  trifasica: 180,
  "no-se": 90,
};

const CARGADOR_COST: Record<Cargador, number> = {
  "7.4": 620,
  "11": 790,
  "22": 980,
  ninguno: 0,
};

const OBRA_COST: Record<Obra, number> = {
  baja: 0,
  media: 220,
  alta: 520,
};

const VIVIENDA_COST: Record<Vivienda, number> = {
  vivienda: 0,
  comunidad: 180,
  comercio: 260,
};

function labelForVivienda(v: Vivienda) {
  if (v === "vivienda") return "Vivienda unifamiliar";
  if (v === "comunidad") return "Garaje comunitario";
  return "Comercio / PyME";
}

function labelForRed(r: Red) {
  if (r === "monofasica") return "Monofásica";
  if (r === "trifasica") return "Trifásica";
  return "No lo sé";
}

function labelForCargador(c: Cargador) {
  if (c === "ninguno") return "Sin cargador";
  if (c === "7.4") return "Cargador AC 7,4 kW";
  if (c === "11") return "Cargador AC 11 kW";
  return "Cargador AC 22 kW";
}

function labelForObra(o: Obra) {
  if (o === "baja") return "Baja";
  if (o === "media") return "Media";
  return "Alta";
}

function roundToNearest50(value: number) {
  return Math.round(value / 50) * 50;
}

function formatMoney(value: number, currency: "EUR" | "USD") {
  return new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PresupuestoCalculator() {
  const [form, setForm] = useState<FormState>({
    pais: "",
    vivienda: "",
    distancia: "",
    red: "",
    cargador: "",
    obra: "",
  });

  const base = 520;
  const allAnswered = Object.values(form).every(Boolean);

  const subtotal =
    allAnswered
      ? base +
        VIVIENDA_COST[form.vivienda as Vivienda] +
        DISTANCIA_COST[form.distancia as Distancia] +
        RED_COST[form.red as Red] +
        CARGADOR_COST[form.cargador as Cargador] +
        OBRA_COST[form.obra as Obra]
      : 0;

  const estimate = useMemo(() => {
    const min = roundToNearest50(subtotal * 0.92);
    const max = roundToNearest50(subtotal * 1.15);
    return { min, max };
  }, [subtotal]);

  const currency: "EUR" | "USD" = form.pais === "España" ? "EUR" : "USD";
  const [eurUsdRate, setEurUsdRate] = useState<number>(1.1);

  useEffect(() => {
    let cancelled = false;
    const loadFx = async () => {
      try {
        const res = await fetch("/api/fx/eur-usd");
        if (!res.ok) return;
        const data = (await res.json()) as {
          rate?: number;
          date?: string | null;
          source?: string;
        };
        if (cancelled) return;
        if (typeof data.rate === "number" && Number.isFinite(data.rate) && data.rate > 0) {
          setEurUsdRate(data.rate);
        }
      } catch {
        // Fallback already set in state.
      }
    };
    loadFx();
    return () => {
      cancelled = true;
    };
  }, []);

  const displayEstimate =
    currency === "EUR"
      ? estimate
      : {
          min: roundToNearest50(estimate.min * eurUsdRate),
          max: roundToNearest50(estimate.max * eurUsdRate),
        };

  return (
    <section className="border-t border-zinc-200 bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-8 sm:py-14">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Calculadora de presupuesto
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-zinc-900">
              🧮 Calcula un rango de coste en menos de 1 minuto
            </h2>
            <p className="mt-3 text-sm leading-6 text-zinc-600">
              Ajusta estas variables y obtén una estimación inicial para tu instalación. Después
              validamos en detalle para cerrar propuesta final.
            </p>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <label className="text-sm">
                <span className="mb-1.5 block font-medium text-zinc-800">🌎 Elegir país</span>
                <select
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                  value={form.pais}
                  onChange={(e) => setForm((p) => ({ ...p, pais: e.target.value as Pais }))}
                >
                  <option value="">Selecciona un país</option>
                  {PAISES.map((pais) => (
                    <option key={pais} value={pais}>
                      {pais}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1.5 block font-medium text-zinc-800">📍 Tipo de ubicación</span>
                <select
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                  value={form.vivienda}
                  onChange={(e) => setForm((p) => ({ ...p, vivienda: e.target.value as Vivienda }))}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="vivienda">Vivienda unifamiliar</option>
                  <option value="comunidad">Garaje comunitario</option>
                  <option value="comercio">Comercio / PyME</option>
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1.5 block font-medium text-zinc-800">
                  📏 Distancia desde cuadro eléctrico
                </span>
                <select
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                  value={form.distancia}
                  onChange={(e) => setForm((p) => ({ ...p, distancia: e.target.value as Distancia }))}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="0-10">0-10 m</option>
                  <option value="10-20">10-20 m</option>
                  <option value="20-35">20-35 m</option>
                  <option value="35+">Más de 35 m</option>
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1.5 block font-medium text-zinc-800">⚡ Red eléctrica</span>
                <select
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                  value={form.red}
                  onChange={(e) => setForm((p) => ({ ...p, red: e.target.value as Red }))}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="monofasica">Monofásica</option>
                  <option value="trifasica">Trifásica</option>
                  <option value="no-se">No lo sé</option>
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1.5 block font-medium text-zinc-800">🔌 Cargador</span>
                <select
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                  value={form.cargador}
                  onChange={(e) => setForm((p) => ({ ...p, cargador: e.target.value as Cargador }))}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="7.4">Incluye 7,4 kW</option>
                  <option value="11">Incluye 11 kW</option>
                  <option value="22">Incluye 22 kW</option>
                  <option value="ninguno">Solo instalación (sin cargador)</option>
                </select>
              </label>

              <label className="text-sm">
                <span className="mb-1.5 block font-medium text-zinc-800">
                  🏗️ Complejidad de obra civil
                </span>
                <select
                  className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
                  value={form.obra}
                  onChange={(e) => setForm((p) => ({ ...p, obra: e.target.value as Obra }))}
                >
                  <option value="">Selecciona una opción</option>
                  <option value="baja">Baja (canalización simple, pocos obstáculos)</option>
                  <option value="media">Media (recorrido con dificultad moderada)</option>
                  <option value="alta">Alta (obra más compleja)</option>
                </select>
              </label>
            </div>
          </div>

          <aside className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-7 lg:self-start">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Estimación inicial
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900">
              {allAnswered
                ? `${formatMoney(displayEstimate.min, currency)} - ${formatMoney(displayEstimate.max, currency)}`
                : "Completa el formulario"}
            </p>
            <p className="mt-2 text-sm leading-6 text-zinc-600">
              Rango orientativo con instalación estándar. El precio final se confirma tras validar
              fotos, recorrido y protecciones.
            </p>

            <div className="mt-5 space-y-2 rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
              <p>
                <span className="font-medium">País:</span> {form.pais || "-"}
              </p>
              <p>
                <span className="font-medium">Ubicación:</span>{" "}
                {form.vivienda ? labelForVivienda(form.vivienda as Vivienda) : "-"}
              </p>
              <p>
                <span className="font-medium">Distancia:</span> {form.distancia ? `${form.distancia} m` : "-"}
              </p>
              <p>
                <span className="font-medium">Red:</span> {form.red ? labelForRed(form.red as Red) : "-"}
              </p>
              <p>
                <span className="font-medium">Equipo:</span>{" "}
                {form.cargador ? labelForCargador(form.cargador as Cargador) : "-"}
              </p>
              <p>
                <span className="font-medium">Obra:</span> {form.obra ? labelForObra(form.obra as Obra) : "-"}
              </p>
            </div>

            <div className="mt-5">
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Quiero presupuesto cerrado
              </Link>
            </div>
          </aside>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-sm font-semibold text-zinc-900">1) 🧮 Estimación online</p>
            <p className="mt-1 text-sm text-zinc-600">
              Ajustas variables clave y obtienes un rango de precio orientativo.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-sm font-semibold text-zinc-900">2) 🔍 Validación técnica</p>
            <p className="mt-1 text-sm text-zinc-600">
              Revisamos fotos, recorrido y requerimientos eléctricos para cerrar alcance.
            </p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-sm font-semibold text-zinc-900">3) ✅ Propuesta final</p>
            <p className="mt-1 text-sm text-zinc-600">
              Entregamos presupuesto cerrado y siguiente paso de instalación.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
