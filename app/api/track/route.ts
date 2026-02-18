import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Por ahora log (simple). Luego lo conectás a GA/Plausible/DB si querés.
    console.log("[TRACK]", JSON.stringify(body));

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
}
