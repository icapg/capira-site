"use client";

import { useState } from "react";
import Link from "next/link";

type ResourceItem = {
  title: string;
  emoji: string;
  description: string;
  modalType?: "text";
  href?: string;
};

type ResourceRow = {
  key: string;
  label: string;
  items: ResourceItem[];
};

type MotionDirection = "left" | "right";

const rows: ResourceRow[] = [
  {
    key: "general",
    label: "General",
    items: [
      {
        title: "Costos coche gasolina vs electrico",
        emoji: "\u{26FD}",
        description:
          "Comparativa simple de costos de uso, energia y mantenimiento por tipo de vehiculo.",
      },
      {
        title: "Parque automotor por pais",
        emoji: "\u{1F30D}",
        description:
          "Evolucion y distribucion de vehiculos por mercado para entender adopcion electrica.",
      },
      {
        title: "Cargadores por pais",
        emoji: "\u{1F50C}",
        description:
          "Mapa de infraestructura publica y densidad de carga en los principales paises.",
      },
      {
        title: "Curvas de carga coche electrico",
        emoji: "\u{1F4C9}",
        description:
          "Como cambia la velocidad de carga segun SOC y por que importa para planificar tiempos.",
      },
      {
        title: "Que es el OBC - cargador on board del coche?",
        emoji: "\u{1F9E0}",
        description:
          "Explicacion del rol del OBC y su impacto en potencia AC efectiva.",
      },
      {
        title: "Potencia maxima del coche vs cargador",
        emoji: "\u{26A1}",
        description:
          "Guia para evitar sobredimensionamiento y elegir el equipo que realmente aprovecha el vehiculo.",
      },
    ],
  },
  {
    key: "residencial",
    label: "Residencial",
    items: [
      {
        title: "Elige el cargador residencial adecuado",
        emoji: "\u{1F3E0}",
        description:
          "Potencia, protecciones y funcionalidades clave segun uso diario y tipo de vivienda.",
        href: "/recursos/elegir-cargador",
      },
      {
        title: "Presupuesta tu instalacion",
        emoji: "\u{1F4B8}",
        description:
          "Desglose orientativo de materiales, mano de obra y variables que mueven el costo final.",
        href: "/recursos/presupuesto",
      },
      {
        title: "Que potencia contratar?",
        emoji: "\u{1F50B}",
        description:
          "Metodo practico para estimar potencia contratada sin penalizar tu factura.",
      },
      {
        title: "Ayuda y subvenciones",
        emoji: "\u{1F4DD}",
        description:
          "Resumen de incentivos, requisitos y documentacion habitual para solicitar ayudas.",
      },
      {
        title: "Integracion con placas solares",
        emoji: "\u{2600}",
        description:
          "Como priorizar autoconsumo y controlar carga para reducir costo energetico.",
      },
      {
        title: "Garaje comunitario",
        emoji: "\u{1F3E2}",
        description:
          "Alternativas tecnicas y administrativas para instalar en comunidades de propietarios.",
      },
    ],
  },
  {
    key: "comercios",
    label: "Comercios",
    items: [
      {
        title: "Rentabilidad esperada en comercios",
        emoji: "\u{1F4C8}",
        description:
          "Escenarios de ingreso, demanda y retorno para estaciones de carga en ubicaciones comerciales.",
      },
      {
        title: "Cargadores adecuados para mis clientes",
        emoji: "\u{1F3EA}",
        description:
          "Seleccion de potencia y tipo de equipo segun tiempo medio de permanencia.",
      },
      {
        title: "Presupuesta tu instalacion",
        emoji: "\u{1F4B3}",
        description:
          "Estimacion de inversion inicial con variables tecnicas y de obra civil.",
        href: "/recursos/presupuesto",
      },
      {
        title: "Sistema de gestion",
        emoji: "\u{1F4BB}",
        description:
          "Funciones clave del software: monitoreo, precios, usuarios, reportes e integraciones.",
      },
      {
        title: "Cargadores en propiedad o terciarizado con CPO?",
        emoji: "\u{2696}",
        description:
          "Comparativa entre inversion propia y modelo operado por tercero.",
      },
    ],
  },
  {
    key: "flotas",
    label: "Flotas",
    items: [
      {
        title: "Ayuda y subvenciones",
        emoji: "\u{1F69A}",
        description:
          "Programas de incentivo y recomendaciones para estructurar la solicitud de flota.",
      },
      {
        title: "Modelos de inversion",
        emoji: "\u{1F4B0}",
        description:
          "CAPEX, OPEX y opciones mixtas para electrificar sin comprometer caja.",
      },
      {
        title: "Potencia vs CAPEX vs energia",
        emoji: "\u{2699}",
        description:
          "Equilibrio entre infraestructura, costos de demanda y estrategia de recarga.",
      },
    ],
  },
];

function ResourceCard({
  item,
  onOpen,
  compact = false,
}: {
  item: ResourceItem;
  onOpen: (item: ResourceItem) => void;
  compact?: boolean;
}) {
  const classes = compact
    ? "block h-full min-h-[190px] w-52 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    : "block h-full min-h-[190px] w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";

  const content = (
    <div className="flex h-full flex-col">
      <p className="min-h-12 max-h-12 overflow-hidden text-sm font-semibold text-zinc-900">
        {item.emoji} {item.title}
      </p>
      <p className="mt-2 min-h-[5.25rem] max-h-[5.25rem] overflow-hidden text-sm leading-6 text-zinc-600">
        {item.description}
      </p>
    </div>
  );

  if (item.href) {
    return (
      <Link href={item.href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => onOpen(item)} className={classes}>
      {content}
    </button>
  );
}

export default function ResourceRows() {
  const [openItem, setOpenItem] = useState<ResourceItem | null>(null);
  const [wheelIndexByRow, setWheelIndexByRow] = useState<Record<string, number>>({});

  function stepRow(rowKey: string, direction: MotionDirection) {
    const row = rows.find((r) => r.key === rowKey);
    if (!row || row.items.length <= 3) return;

    setWheelIndexByRow((prev) => {
      const current = prev[rowKey] ?? 0;
      const delta = direction === "right" ? 1 : -1;
      const next = (current + delta + row.items.length) % row.items.length;
      return { ...prev, [rowKey]: next };
    });
  }

  function getVisibleItems(row: ResourceRow) {
    if (row.items.length <= 4) return row.items;
    const start = wheelIndexByRow[row.key] ?? 0;
    return Array.from({ length: 4 }, (_, i) => row.items[(start + i) % row.items.length]);
  }

  return (
    <>
      <div className="space-y-8">
        {rows.map((row) => (
          <section
            id={row.key}
            key={row.key}
            className="scroll-mt-24 rounded-3xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{row.label}</h2>
            </div>

            <div className="grid gap-3 md:hidden">
              {row.items.map((item) => (
                <ResourceCard key={item.title} item={item} onOpen={setOpenItem} />
              ))}
            </div>

            <div className="hidden items-stretch gap-3 md:flex">
              <div className="relative flex w-full items-stretch gap-3 overflow-hidden rounded-2xl">
                {getVisibleItems(row).map((item, idx) => {
                  if (idx < 3 || row.items.length <= 3) {
                    return (
                      <div key={`${row.key}-${idx}-${item.title}`} className="min-w-0 flex-1">
                        <ResourceCard item={item} onOpen={setOpenItem} />
                      </div>
                    );
                  }

                  return (
                    <div key={`${row.key}-${idx}-${item.title}`} className="w-24 shrink-0 overflow-hidden">
                      <div className="w-52">
                        <ResourceCard item={item} onOpen={setOpenItem} compact />
                      </div>
                    </div>
                  );
                })}

                {row.items.length > 3 ? (
                  <button
                    type="button"
                    aria-label={`Mover ${row.label} a la izquierda`}
                    onClick={() => stepRow(row.key, "left")}
                    className="absolute bottom-0 left-0 top-0 z-10 w-14 bg-gradient-to-r from-zinc-50/95 to-transparent text-zinc-400 transition hover:text-zinc-900"
                  >
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xl">&lsaquo;</span>
                  </button>
                ) : null}

                {row.items.length > 3 ? (
                  <button
                    type="button"
                    aria-label={`Mover ${row.label} a la derecha`}
                    onClick={() => stepRow(row.key, "right")}
                    className="absolute bottom-0 right-0 top-0 z-10 w-14 bg-gradient-to-l from-zinc-50/95 to-transparent text-zinc-400 transition hover:text-zinc-900"
                  >
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xl">&rsaquo;</span>
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        ))}
      </div>

      {openItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/55 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-semibold tracking-tight text-zinc-900">
                {openItem.emoji} {openItem.title}
              </h3>
              <button
                type="button"
                onClick={() => setOpenItem(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 transition hover:bg-zinc-100"
                aria-label="Cerrar"
              >
                x
              </button>
            </div>

            <p className="mt-4 text-sm leading-7 text-zinc-600">{openItem.description}</p>
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setOpenItem(null)}
                className="inline-flex items-center rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
