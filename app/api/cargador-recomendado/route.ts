import { NextResponse } from "next/server";
import matriz from "../../../data/matriz_cargador.json";

type Input = {
  tipoCoche: string;
  kmSemana: string;
  instalacion: string;
  potenciaCoche: string;
  solar: string;
};

function makeKey(i: Input) {
  return [i.tipoCoche, i.kmSemana, i.instalacion, i.potenciaCoche, i.solar].join(
    "|"
  );
}

function normCell(s: string) {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "") // ignora espacios
    .replace(/\./g, ","); // por si algún día aparece 7.4 vs 7,4
}

function normKey(key: string) {
  return key.split("|").map(normCell).join("|");
}

export async function POST(req: Request) {
  const body = (await req.json()) as Input;
  const target = normKey(makeKey(body));

  const entries = Object.entries(matriz as Record<string, string>);

  for (const [k, v] of entries) {
    if (normKey(k) === target) {
      return NextResponse.json({ ok: true, recommendation: v });
    }
  }

  return NextResponse.json(
    {
      ok: false,
      error:
        "No encontramos una recomendación para esta combinación. Probá otra opción o hablá con un especialista.",
    },
    { status: 404 }
  );
}
