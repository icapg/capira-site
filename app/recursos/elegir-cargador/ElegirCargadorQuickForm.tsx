"use client";

import { useId, useMemo, useState } from "react";

type CarType = "Hibrido enchufable" | "100% electrico";
type KmSemana = "0-50" | "50-150" | "150-300" | ">300";
type Instalacion = "Monofasica" | "Trifasica" | "No lo se";
type Potencia = "No lo se" | "7,4 kW" | "11 kW" | "22 kW";
type Solar = "Si" | "No";

type FormState = {
  tipoCoche: CarType | "";
  kmSemana: KmSemana | "";
  instalacion: Instalacion | "";
  potenciaCoche: Potencia | "";
  solar: Solar | "";
};

function RadioRow({
  number,
  emoji,
  title,
  options,
  value,
  onChange,
}: {
  number: number;
  emoji: string;
  title: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const groupId = useId();

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <p className="text-[11px] font-medium text-zinc-500">
        {number}. {emoji}
      </p>
      <h4 className="mt-1 text-sm font-semibold text-zinc-900">{title}</h4>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {options.map((opt) => {
          const active = value === opt;
          return (
            <label
              key={opt}
              className={`shrink-0 cursor-pointer rounded-full border px-3 py-1.5 text-xs transition ${
                active
                  ? "border-zinc-900 bg-zinc-900 text-white"
                  : "border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50"
              }`}
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

function KmSlider({
  number,
  emoji,
  title,
  marks,
  valuePos,
  onChangePos,
  selectedLabel,
}: {
  number: number;
  emoji: string;
  title: string;
  marks: { pos: number; label: string }[];
  valuePos: number;
  onChangePos: (pos: number) => void;
  selectedLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-zinc-500">
            {number}. {emoji}
          </p>
          <h4 className="mt-1 text-sm font-semibold text-zinc-900">{title}</h4>
        </div>

        <span className="shrink-0 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[11px] font-medium text-zinc-700">
          {selectedLabel || "-"}
        </span>
      </div>

      <div className="mt-4">
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

export default function ElegirCargadorQuickForm() {
  const [form, setForm] = useState<FormState>({
    tipoCoche: "",
    kmSemana: "",
    instalacion: "",
    potenciaCoche: "",
    solar: "",
  });

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

  return (
    <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
      <div className="grid gap-4 lg:grid-cols-2">
        <RadioRow
          number={1}
          emoji="🚗"
          title="Que tipo de coche tienes o quieres comprar?"
          options={["Hibrido enchufable", "100% electrico"]}
          value={form.tipoCoche}
          onChange={(v) => setField("tipoCoche", v as CarType)}
        />

        <RadioRow
          number={3}
          emoji="🏠"
          title="Como es tu instalacion electrica?"
          options={["Monofasica", "Trifasica", "No lo se"]}
          value={form.instalacion}
          onChange={(v) => setField("instalacion", v as Instalacion)}
        />

        <RadioRow
          number={4}
          emoji="⚡"
          title="Que potencia de carga admite tu coche en corriente alterna?"
          options={["No lo se", "7,4 kW", "11 kW", "22 kW"]}
          value={form.potenciaCoche}
          onChange={(v) => setField("potenciaCoche", v as Potencia)}
        />

        <RadioRow
          number={5}
          emoji="☀️"
          title="Requiere integrarlo con placas solares?"
          options={["Si", "No"]}
          value={form.solar}
          onChange={(v) => setField("solar", v as Solar)}
        />

        <div className="lg:col-span-2">
          <KmSlider
            number={2}
            emoji="🛣️"
            title="Cuantos km realizas por semana aproximadamente?"
            marks={kmMarks}
            valuePos={form.kmSemana === "" ? 0 : kmPosFromLabel[form.kmSemana]}
            onChangePos={handleKmPosChange}
            selectedLabel={form.kmSemana}
          />
        </div>

        <div className="lg:col-span-2">
          <button
            type="button"
            disabled={!allAnswered}
            className={`w-full rounded-md px-5 py-3 text-sm font-medium transition ${
              allAnswered
                ? "bg-zinc-900 text-white hover:bg-zinc-800"
                : "cursor-not-allowed bg-zinc-300 text-zinc-500"
            }`}
          >
            Calcular recomendacion
          </button>
        </div>
      </div>
    </div>
  );
}
