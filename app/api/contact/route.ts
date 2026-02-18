import { NextResponse } from "next/server";

export async function POST(req: Request) {
  
  try {
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const message = String(body?.message ?? "").trim();

    const company = String(body?.company ?? "").trim();
    const topic = String(body?.topic ?? "").trim();
    const region = String(body?.region ?? "").trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "Faltan campos obligatorios (nombre, email, mensaje)." },
        { status: 400 }
      );
    }

    // Stub listo para conectar a email/CRM (Resend/SendGrid/HubSpot/etc.)
    console.log("[CAPIRA CONTACT]", {
      name,
      email,
      company,
      topic,
      region,
      message,
      at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Error procesando la solicitud." },
      { status: 500 }
    );
  }
}
