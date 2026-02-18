"use client";

import { useMemo, useState } from "react";

/* ================= DATA ================= */

const MODELS = [
  {
    key: "capex",
    label: "Inversión directa",
    icon: "🏗️",
    title: "Inversión directa del operador",
    bullets: [
      "El cliente invierte en la infraestructura y mantiene la propiedad del activo.",
      "CAPIRA instala, gestiona y realiza el mantenimiento de la infraestructura.",
      "CAPIRA asegura la disponibilidad operativa del activo según SLA.",
    ],
    meta: [
      { k: "Propiedad", v: "Cliente" },
      { k: "Operación", v: "CAPIRA" },
      { k: "Contabilidad", v: "CAPEX" },
    ],
    note:
      "Ideal para: flotas pequeñas que priorizan el control del activo y cuentan con capital disponible.",
    definesText:
      "Definimos la solución técnica, el dimensionamiento de potencia, el CAPEX inicial y el alcance de la gestión, operación y mantenimiento.",
  },
  {
    key: "fin",
    label: "Leasing operativo",
    icon: "💳",
    title: "Leasing de infraestructura",
    bullets: [
      "Estructuras de leasing o financiación para no inmovilizar capital.",
      "Permite arrancar rápidamente y escalar el despliegue por hitos.",
      "Costes previsibles y fiscalmente eficientes.",
    ],
    meta: [
      { k: "Propiedad", v: "Cliente / Arrendador" },
      { k: "Operación", v: "CAPIRA" },
      { k: "Contabilidad", v: "OPEX" },
    ],
    note:
      "Ideal para: flotas en crecimiento que buscan flexibilidad financiera sin comprometer caja.",
    definesText:
      "Definimos la estructura de leasing o financiación, el ritmo de despliegue y el alcance de la gestión, operación y mantenimiento.",
  },
  {
    key: "caas",
    label: "Carga como servicio",
    icon: "🔁",
    title: "Charging as a Service (CaaS)",
    bullets: [
      "CAPIRA diseña, implementa y opera la infraestructura de carga.",
      "El cliente paga por uso con un mínimo garantizado.",
      "El riesgo técnico y operativo se traslada a un modelo de servicio.",
    ],
    meta: [
      { k: "Propiedad", v: "CAPIRA" },
      { k: "Operación", v: "CAPIRA" },
      { k: "Contabilidad", v: "OPEX" },
    ],
    note:
      "Ideal para: grandes flotas que quieren minimizar riesgos y enfocarse en la operación.",
    definesText:
      "Definimos los niveles de servicio, el fee por uso o disponibilidad, la duración contractual y el uptime requerido.",
  },
];

/* ================= HELPERS ================= */

function classNames(...xs: Array<string | boolean | undefined>) {
  return xs.filter(Boolean).join(" ");
}

function MetaPill({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-center shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
        {k}
      </p>
      <p className="mt-1 text-sm font-semibold text-zinc-900">{v}</p>
    </div>
  );
}

/* ================= COMPONENT ================= */

export default function BusinessModels() {
  const [active, setActive] = useState<(typeof MODELS)[number]["key"]>("capex");

  const current = useMemo(
    () => MODELS.find((m) => m.key === active) ?? MODELS[0],
    [active]
  );

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-zinc-300 bg-zinc-50 shadow-sm">
      {/* Glow sutil */}
      <div className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-zinc-200/60 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 right-[-6rem] h-72 w-72 rounded-full bg-zinc-200/40 blur-3xl" />

      {/* Contenido real */}
      <div className="relative">
        {/* ================= HEADER ================= */}
        <div className="border-b border-zinc-200 p-6 text-center">
          <p className="text-sm font-medium text-zinc-700">
            Modelos de inversión
          </p>

          <h2 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Elige el modelo de inversión que mejor se adapte a tu estrategia
          </h2>

          {/* Segmented control */}
          <div className="mt-5 flex justify-center">
            <div className="inline-flex rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
              {MODELS.map((m) => {
                const isActive = m.key === active;
                return (
                  <button
                    key={m.key}
                    onClick={() => setActive(m.key)}
                    className={classNames(
                      "whitespace-nowrap inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition",
                      isActive
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "bg-transparent text-zinc-900 hover:bg-zinc-50"
                    )}
                  >
                    <span>{m.icon}</span>
                    <span>{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ================= BODY ================= */}
        <div className="grid gap-10 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
          {/* LEFT */}
          <div>
            <h3 className="mt-1 text-xl font-bold tracking-tight text-zinc-900">
              {current.title}
            </h3>

            {/* Meta */}
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {current.meta.map((x) => (
                <MetaPill key={x.k} k={x.k} v={x.v} />
              ))}
            </div>

            {/* Bullets */}
            <ul className="mt-7 space-y-3">
              {current.bullets.map((b) => (
                <li key={b} className="flex gap-3 text-sm text-zinc-700">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-900">
                    ✓
                  </span>
                  <span className="leading-relaxed">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* RIGHT */}
          <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-gradient-to-b from-white to-zinc-50 p-6 shadow-sm">
            <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-zinc-200/40 blur-3xl" />

            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Recomendación
            </p>
            <p className="mt-3 text-sm font-semibold text-zinc-900">
              {current.note}
            </p>

            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold text-zinc-600">
                Qué definimos con vos
              </p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-700">
                {current.definesText}
              </p>
            </div>

            
          </div>
        </div>
      </div>
    </div>
  );
}
