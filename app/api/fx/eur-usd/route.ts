import { NextResponse } from "next/server";

const FALLBACK_RATE = 1.1;

export async function GET() {
  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=EUR&to=USD", {
      next: { revalidate: 60 * 60 },
    });

    if (!res.ok) {
      throw new Error(`FX upstream failed: ${res.status}`);
    }

    const data = (await res.json()) as {
      amount?: number;
      base?: string;
      date?: string;
      rates?: { USD?: number };
    };

    const rate = Number(data?.rates?.USD);
    if (!Number.isFinite(rate) || rate <= 0) {
      throw new Error("Invalid EUR/USD rate");
    }

    return NextResponse.json({
      ok: true,
      base: data.base ?? "EUR",
      quote: "USD",
      rate,
      date: data.date ?? null,
      source: "Frankfurter (ECB reference data)",
    });
  } catch {
    return NextResponse.json({
      ok: false,
      base: "EUR",
      quote: "USD",
      rate: FALLBACK_RATE,
      date: null,
      source: "fallback",
    });
  }
}

