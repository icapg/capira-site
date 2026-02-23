import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Section } from "../components/ui/Section";
import BusinessModels from "./BusinessModels";


export const metadata: Metadata = {
  title: "Flotas | Capira",
  description:
    "Electrificación de flotas a escala. Reducimos TCO y riesgo operativo con ingeniería eléctrica, estrategia energética y carga inteligente.",
};

/* ---------- UI helpers ---------- */

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-800 shadow-sm">
      {children}
    </span>
  );
}

function StatCard({
  title,
  value,
  description,
}: {
  title: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-zinc-500">{title}</p>
        <p className="text-xl font-bold text-zinc-900">{value}</p>
      </div>
      <p className="mt-2 text-sm font-medium text-zinc-900">{description}</p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm transition hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-50 text-lg">
          {icon}
        </div>
        <h3 className="text-base font-semibold text-zinc-900">{title}</h3>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-zinc-700">
        {description}
      </p>
    </div>
  );
}

/* ---------- PAGE ---------- */

export default function FlotasPage() {
  return (
    <>
      {/* ================= HERO ================= */}
      <section className="border-b border-zinc-200 bg-gradient-to-b from-zinc-50 to-white py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
            {/* LEFT */}
            <div>
              <p className="text-sm font-medium text-zinc-700">
                Flotas
              </p>

              <h1 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
                Electrificación de flotas
                <span className="block text-zinc-700">
                  con control de coste y operación
                </span>
              </h1>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-zinc-700 sm:text-lg">
                Reducimos el TCO y el riesgo operativo combinando ingeniería
                eléctrica, estrategia energética y carga inteligente.
                Solución integral o por módulos, según tu madurez.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <Pill>📉 TCO & CAPEX/OPEX</Pill>
                <Pill>⚡ Energía & Potencia</Pill>
                <Pill>🧠 Carga inteligente</Pill>
                <Pill>🛠️ Uptime</Pill>
              </div>

              
              
            </div>

            {/* RIGHT */}
            <div className="flex flex-col gap-4">
              <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
                <Image
                  src="/images/fleets/vans1.png"
                  alt="Flota eléctrica y hub de carga"
                  width={1200}
                  height={800}
                  className="aspect-[16/10] w-full object-cover"
                  priority
                />
                <div className="border-t border-zinc-200 bg-white p-4">
                  <p className="text-sm font-medium text-zinc-900">
                    ⚙️ De flota a sistema energético operativo
                  </p>
                </div>
              </div>

            
            </div>
          </div>
        </div>
      </section>

     

      {/* ================= EXPERTISE ================= */}
      <Section>
        <p className="text-sm font-medium text-zinc-700">Expertise</p>
        <h2 className="mt-3 max-w-3xl text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
          Ingeniería, energía y operación pensadas como un sistema
        </h2>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard
            icon="💰"
            title="TCO eléctrico vs combustión"
            description="Modelo económico completo por flota, uso y crecimiento."
          />
          <FeatureCard
            icon="⚡"
            title="Optimización energética"
            description="Potencia, picos y factura eléctrica bajo control."
          />
          <FeatureCard
            icon="🧠"
            title="Carga inteligente"
            description="Estrategias secuenciales, paralelas y peak shaving."
          />
          <FeatureCard
            icon="🏗️"
            title="Infraestructura & CT"
            description="Punto de conexión, centro de transformación y layouts."
          />
          <FeatureCard
            icon="🔋"
            title="Baterías"
            description="Reducción de picos y mejora directa del TCO."
          />
          <FeatureCard
            icon="🛠️"
            title="Operación & mantenimiento"
            description="SLAs, repuestos críticos y continuidad operativa."
          />
        </div>
      </Section>

{/* ================= CONTEXTO / INCONVENIENTES ================= */}
<Section className="border-t border-zinc-200">
  {/* 1) Encabezado en una sola columna */}
  <div className="max-w-3xl">
    <p className="text-sm font-medium text-zinc-700">Contexto</p>

    <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
      Electrificar una flota no es cambiar vehículos
    </h2>

    <p className="mt-4 text-base leading-relaxed text-zinc-700">
      Es rediseñar energía, potencia, operación y mantenimiento para garantizar
      disponibilidad diaria, costes previsibles y crecimiento sin decisiones
      irreversibles.
    </p>
  </div>

  {/* 2) Bloque 2 columnas: boxes vs imagen (misma altura) */}
  <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-stretch">
    {/* Columna 1: boxes */}
    <div className="flex h-full flex-col gap-3">
  {[
    "Sobrecostes por potencia mal dimensionada",
    "Paradas operativas por falta de capacidad",
    "CAPEX innecesario por sobredimensionamiento",
    "Rehacer infraestructura al crecer la flota",
  ].map((t) => (
    <div
      key={t}
      className="flex items-center gap-4 rounded-xl bg-white px-5 py-4 shadow-sm"
    >
      <div className="h-5 w-1.5 rounded-full bg-amber-400" />
      <p className="text-sm font-semibold text-zinc-900">{t}</p>
    </div>
  ))}
</div>


    {/* Columna 2: imagen (misma altura que la columna de boxes) */}
    <div className="relative h-full overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-sm">
      <Image
        src="/images/fleets/vans3.png"
        alt="Infraestructura de carga para flotas"
        fill
        className="object-cover"
        sizes="(min-width: 1024px) 50vw, 100vw"
        priority={false}
      />
    </div>
  </div>
</Section>

{/* ================= MODELOS DE NEGOCIO ================= */}
<Section className="border-t border-zinc-200">
  <BusinessModels />
</Section>


      {/* ================= CTA ================= */}
      <Section className="border-t border-zinc-200 bg-zinc-50">
        <div className="rounded-[2rem] border border-zinc-200 bg-white p-8 sm:p-10">
          <p className="text-sm font-medium text-zinc-700">Siguiente paso</p>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Hablemos de tu flota
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-700">
            Analizamos tu operación y definimos un roadmap de electrificación
            viable, escalable y con costes claros.
          </p>

          <div className="mt-6">
            <Link
              href="/contacto"
              className="inline-block rounded-2xl bg-zinc-900 px-7 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              Hablar con CAPIRA
            </Link>
          </div>
        </div>
      </Section>
    </>
  );
}
