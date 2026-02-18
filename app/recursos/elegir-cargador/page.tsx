"use client";

import { useId, useMemo, useRef, useState } from "react";
import Link from "next/link";

type CarType = "Híbrido enchufable" | "100% eléctrico";
type KmSemana = "0-50" | "50-150" | "150-300" | ">300";
type Instalacion = "Monofásica" | "Trifásica" | "No lo sé";
type Potencia = "No lo sé" | "7,4 kW" | "11 kW" | "22 kW";
type Solar = "Sí" | "No";

type FormState = {
  tipoCoche: CarType | "";
  kmSemana: KmSemana | "";
  instalacion: Instalacion | "";
  potenciaCoche: Potencia | "";
  solar: Solar | "";
};

type RecommendationParsed = {
  power: "7.4" | "11" | null;
  solar: boolean;
  raw: string;
};

function parseRecommendation(raw: string): RecommendationParsed {
  const r = (raw || "").trim();
  const solar = r.toLowerCase().includes("is");
  // soporta "7,4 kW", "7,4kW", etc.
  const power =
    r.includes("11") ? "11" : r.includes("7,4") || r.includes("7.4") ? "7.4" : null;
  return { power, solar, raw: r };
}

function buildModelosHref(parsed: RecommendationParsed) {
  const params = new URLSearchParams();
  if (parsed.power) params.set("potencia", parsed.power);
  if (parsed.solar) params.set("solar", "true");
  return `/cargadores?${params.toString()}`;
}

function humanCopy(parsed: RecommendationParsed, form: FormState) {
  const base =
    parsed.power === "11"
      ? "Un cargador de 11 kW"
      : parsed.power === "7.4"
      ? "Un cargador de 7,4 kW"
      : "Un cargador residencial";

  const solar = parsed.solar ? " con integración solar (IS)" : "";
  const inst =
    form.instalacion === "Trifásica"
      ? "En instalación trifásica es la opción recomendada."
      : "Equilibra velocidad, coste y compatibilidad para la mayoría de hogares.";

  return `${base}${solar}. ${inst}`;
}

export default function ElegirCargadorPage() {
  const [form, setForm] = useState<FormState>({
    tipoCoche: "",
    kmSemana: "",
    instalacion: "",
    potenciaCoche: "",
    solar: "",
  });

  const [resultado, setResultado] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const resultRef = useRef<HTMLDivElement | null>(null);

  const kmMarks = useMemo(
    () => [
      { pos: 0, label: "0" },
      { pos: 1, label: "50" },
      { pos: 2, label: "150" },
      { pos: 3, label: "300" },
      { pos: 4, label: ">300" },
    ],
    []
  );

  const kmLabelByPos: Record<number, KmSemana> = {
    0: "0-50",
    1: "0-50",
    2: "50-150",
    3: "150-300",
    4: ">300",
  };

  const kmPosFromLabel: Record<KmSemana, number> = {
    "0-50": 1,
    "50-150": 2,
    "150-300": 3,
    ">300": 4,
  };

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleKmPosChange(pos: number) {
    const label = kmLabelByPos[pos] ?? "0-50";
    setField("kmSemana", label);
  }

  const allAnswered = Object.values(form).every(Boolean);

  async function track(event: string, payload: Record<string, unknown>) {
    // no bloquea UX: intentamos y listo
    try {
      const body = JSON.stringify({ event, ...payload, ts: Date.now() });

      // sendBeacon es ideal, si no existe hacemos fetch
      if (navigator.sendBeacon) {
        const blob = new Blob([body], { type: "application/json" });
        navigator.sendBeacon("/api/track", blob);
      } else {
        fetch("/api/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        }).catch(() => {});
      }
    } catch {
      // nada
    }
  }

  async function handleCalcular() {
    if (!allAnswered || loading) return;

    setLoading(true);
    setResultado(null);

    const start = performance.now();

    try {
      const res = await fetch("/api/cargador-recomendado", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json().catch(() => null);

      const durationMs = Math.round(performance.now() - start);

      if (!res.ok || !data?.ok) {
        await track("charger_reco_failed", {
          form,
          status: res.status,
          durationMs,
          error: data?.error ?? "unknown",
        });

        setResultado(
          "No pudimos calcular una recomendación. Hablá con un especialista."
        );
        return;
      }

      await track("charger_reco_success", {
        form,
        status: res.status,
        durationMs,
        recommendation: data.recommendation,
      });

      setResultado(data.recommendation);

      // UX: auto-scroll al resultado
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 50);
    } catch (e) {
      await track("charger_reco_error", { form, error: String(e) });
      setResultado("Error al calcular. Probá de nuevo o hablá con un especialista.");
    } finally {
      setLoading(false);
    }
  }

  const parsed = resultado ? parseRecommendation(resultado) : null;
  const modelosHref = parsed ? buildModelosHref(parsed) : "/cargadores";

  return (
    <main>
      {/* HERO */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
          <p className="text-xs font-medium text-zinc-700">Herramienta residencial</p>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">
            Elige el cargador ideal para tu residencia
          </h1>

          <p className="mt-3 max-w-3xl text-base text-zinc-600">
            Responde estas 5 preguntas y te recomendamos los modelos más adecuados según tu uso y tu instalación.
          </p>
        </div>
      </section>

      {/* FORM */}
      <section className="bg-zinc-50 border-t border-zinc-200">
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-8 sm:py-12">
          <div className="grid gap-4 lg:grid-cols-2">
            <RadioRow
              number={1}
              emoji="🚗"
              title="¿Qué tipo de coche tienes o quieres comprar?"
              options={["Híbrido enchufable", "100% eléctrico"]}
              value={form.tipoCoche}
              onChange={(v) => setField("tipoCoche", v as CarType)}
              compact
            />

            <RadioRow
              number={3}
              emoji="🏠"
              title="¿Cómo es tu instalación eléctrica?"
              options={["Monofásica", "Trifásica", "No lo sé"]}
              value={form.instalacion}
              onChange={(v) => setField("instalacion", v as Instalacion)}
              compact
            />

            <RadioRow
              number={4}
              emoji="⚡"
              title="¿Qué potencia de carga admite tu coche en corriente alterna?"
              options={["No lo sé", "7,4 kW", "11 kW", "22 kW"]}
              value={form.potenciaCoche}
              onChange={(v) => setField("potenciaCoche", v as Potencia)}
              compact
            />

            <RadioRow
              number={5}
              emoji="☀️"
              title="¿Requiere integrarlo con placas solares?"
              options={["Sí", "No"]}
              value={form.solar}
              onChange={(v) => setField("solar", v as Solar)}
              compact
            />

            <div className="lg:col-span-2">
              <KmSlider
                number={2}
                emoji="🛣️"
                title="¿Cuántos km realizas por semana aproximadamente?"
                marks={kmMarks}
                valuePos={form.kmSemana === "" ? 0 : kmPosFromLabel[form.kmSemana]}
                onChangePos={handleKmPosChange}
                selectedLabel={form.kmSemana}
                compact
              />
            </div>

            <div className="lg:col-span-2 space-y-4">
              <button
                onClick={handleCalcular}
                disabled={!allAnswered || loading}
                className={`w-full rounded-md px-5 py-3 text-sm font-medium transition
                  ${
                    allAnswered && !loading
                      ? "bg-zinc-900 text-white hover:bg-zinc-800"
                      : "bg-zinc-300 text-zinc-500 cursor-not-allowed"
                  }`}
              >
                {loading ? "Calculando..." : "Calcular recomendación"}
              </button>

              {/* RESULTADO */}
              <div
                ref={resultRef}
                className={`overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all duration-300
                  ${resultado ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0 border-transparent"}`}
              >
                {resultado && parsed && (
                  <div className="p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        
                        <h2 className="mt-2 text-base font-semibold text-zinc-900">
                          ✅ Recomendación
                        </h2>
                      </div>

                      <div className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-900">
                        {parsed.raw}
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-zinc-700">
                      {humanCopy(parsed, form)}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href={modelosHref}
                        className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                      >
                        Ver modelos
                      </Link>

                      <Link
                        href="/recursos/presupuesto"
                        className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
                      >
                        Presupuestar instalación
                      </Link>

                      <Link
                        href="/contacto"
                        className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                      >
                        Hablar con especialista
                      </Link>
                    </div>

                    <p className="mt-3 text-xs text-zinc-500">
                      Nota: la potencia recomendada puede ajustarse según distancia de cableado y cuadro eléctrico.
                    </p>
                  </div>
                )}
              </div>

              {/* Si falla, mostramos el mismo contenedor (pero con texto) */}
              {resultado &&
                !parsed?.power && (
                  <div className="rounded-xl border border-zinc-200 bg-white p-4">
                    <h2 className="text-base font-semibold text-zinc-900">Recomendación</h2>
                    <p className="mt-2 text-sm text-zinc-700">{resultado}</p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      <Link
                        href="/cargadores"
                        className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                      >
                        Ver modelos
                      </Link>

                      <Link
                        href="/recursos/presupuesto"
                        className="rounded-md bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
                      >
                        Presupuestar instalación
                      </Link>

                      <Link
                        href="/contacto"
                        className="rounded-md border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
                      >
                        Hablar con especialista
                      </Link>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

/* -------------------- RadioRow -------------------- */
function RadioRow({
  number,
  emoji,
  title,
  options,
  value,
  onChange,
  compact,
}: {
  number: number;
  emoji: string;
  title: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
  compact?: boolean;
}) {
  const groupId = useId();

  return (
    <div className={`rounded-2xl border border-zinc-200 bg-white ${compact ? "p-4" : "p-6"}`}>
      <p className={`font-medium text-zinc-500 ${compact ? "text-[11px]" : "text-xs"}`}>
        {number}. {emoji}
      </p>
      <h2 className={`mt-1 font-semibold text-zinc-900 ${compact ? "text-sm" : "text-base"}`}>
        {title}
      </h2>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <label
              key={opt}
              className={`shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs transition
                ${active ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"}`}
            >
              <input
                type="radio"
                name={groupId}
                value={opt}
                checked={active}
                onChange={() => onChange(opt)}
                className="hidden"
              />
              {opt}
            </label>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------- KmSlider -------------------- */
function KmSlider({
  number,
  emoji,
  title,
  marks,
  valuePos,
  onChangePos,
  selectedLabel,
  compact,
}: {
  number: number;
  emoji: string;
  title: string;
  marks: { pos: number; label: string }[];
  valuePos: number;
  onChangePos: (pos: number) => void;
  selectedLabel: string;
  compact?: boolean;
}) {
  return (
    <div className={`rounded-2xl border border-zinc-200 bg-white ${compact ? "p-4" : "p-6"}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`font-medium text-zinc-500 ${compact ? "text-[11px]" : "text-xs"}`}>
            {number}. {emoji}
          </p>
          <h2 className={`mt-1 font-semibold text-zinc-900 ${compact ? "text-sm" : "text-base"}`}>
            {title}
          </h2>
        </div>

        <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-700">
          {selectedLabel || "—"}
        </span>
      </div>

      <div className={`${compact ? "mt-4" : "mt-6"}`}>
        <input
          type="range"
          min={0}
          max={4}
          step={1}
          value={valuePos}
          onChange={(e) => onChangePos(parseInt(e.target.value, 10))}
          className="w-full accent-zinc-900"
        />

        <div className="mt-2 grid grid-cols-5 text-[11px] text-zinc-500">
          {marks.map((m) => (
            <div
              key={m.pos}
              className={`text-center ${m.pos === 0 ? "text-left" : m.pos === 4 ? "text-right" : ""}`}
            >
              {m.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
