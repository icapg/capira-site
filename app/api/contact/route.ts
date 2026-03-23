import { NextResponse } from "next/server";

// Resend se importa dinámicamente para no romper si no está instalado aún
async function sendEmail(params: {
  from: string;
  to: string;
  replyTo: string;
  subject: string;
  html: string;
}) {
  try {
    const { Resend } = await import("resend");
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send(params);
    return true;
  } catch (err) {
    console.error("[CAPIRA EMAIL ERROR]", err);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const name = String(body?.name ?? "").trim();
    const email = String(body?.email ?? "").trim();
    const message = String(body?.message ?? "").trim();

    const company = String(body?.company ?? "").trim();
    const topic = String(body?.topic ?? "").trim();
    const region = String(body?.region ?? "").trim();
    const phone = String(body?.phone ?? "").trim();
    const country = String(body?.country ?? "").trim();
    const utm_source = String(body?.utm_source ?? "").trim();
    const utm_medium = String(body?.utm_medium ?? "").trim();
    const utm_campaign = String(body?.utm_campaign ?? "").trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "Faltan campos obligatorios (nombre, email, mensaje)." },
        { status: 400 }
      );
    }

    const contactEmail = process.env.CONTACT_EMAIL || "contacto@capirapower.com";
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@capirapower.com";

    // Log (backup)
    console.log("[CAPIRA CONTACT]", {
      name,
      email,
      phone,
      company,
      topic,
      region,
      country,
      message,
      utm_source,
      utm_medium,
      utm_campaign,
      at: new Date().toISOString(),
    });

    // Enviar email via Resend (graceful)
    if (process.env.RESEND_API_KEY) {
      await sendEmail({
        from: `CAPIRA Leads <${fromEmail}>`,
        to: contactEmail,
        replyTo: email,
        subject: `[CAPIRA Lead] ${topic || "Nueva solicitud"} - ${name}`,
        html: generateEmailHTML({
          name,
          email,
          phone,
          company,
          topic,
          region,
          country,
          message,
          utm_source,
          utm_medium,
          utm_campaign,
        }),
      });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Error procesando la solicitud." },
      { status: 500 }
    );
  }
}

interface EmailParams {
  name: string;
  email: string;
  phone: string;
  company: string;
  topic: string;
  region: string;
  country: string;
  message: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
}

function generateEmailHTML(params: EmailParams): string {
  const {
    name,
    email,
    phone,
    company,
    topic,
    region,
    country,
    message,
    utm_source,
    utm_medium,
    utm_campaign,
  } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .header h1 { margin: 0 0 10px 0; color: #1a1a1a; font-size: 24px; }
    .section { margin-bottom: 20px; }
    .section-title { font-weight: 600; color: #1a1a1a; margin-bottom: 10px; border-bottom: 2px solid #e5e5e5; padding-bottom: 8px; }
    .field { margin-bottom: 12px; }
    .field-label { font-weight: 500; color: #666; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
    .field-value { color: #1a1a1a; margin-top: 4px; }
    .message-box { background-color: #f9f9f9; padding: 12px; border-left: 4px solid #0066cc; border-radius: 4px; }
    .footer { color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Nueva Solicitud CAPIRA</h1>
      <p>Lead recibido de ${escapeHtml(name)}</p>
    </div>

    <div class="section">
      <div class="section-title">Contacto</div>
      <div class="field">
        <div class="field-label">Nombre</div>
        <div class="field-value">${escapeHtml(name)}</div>
      </div>
      <div class="field">
        <div class="field-label">Email</div>
        <div class="field-value"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></div>
      </div>
      ${phone ? `<div class="field"><div class="field-label">Teléfono</div><div class="field-value">${escapeHtml(phone)}</div></div>` : ""}
    </div>

    <div class="section">
      <div class="section-title">Detalles</div>
      ${topic ? `<div class="field"><div class="field-label">Segmento</div><div class="field-value">${escapeHtml(topic)}</div></div>` : ""}
      ${company ? `<div class="field"><div class="field-label">Empresa</div><div class="field-value">${escapeHtml(company)}</div></div>` : ""}
      ${country ? `<div class="field"><div class="field-label">País</div><div class="field-value">${escapeHtml(country)}</div></div>` : ""}
      ${region ? `<div class="field"><div class="field-label">Región</div><div class="field-value">${escapeHtml(region)}</div></div>` : ""}
    </div>

    <div class="section">
      <div class="section-title">Mensaje</div>
      <div class="message-box">${escapeHtml(message).replace(/\n/g, "<br>")}</div>
    </div>

    ${
      utm_source || utm_medium || utm_campaign
        ? `
    <div class="section">
      <div class="section-title">Campaña</div>
      ${utm_source ? `<div class="field"><div class="field-label">Fuente</div><div class="field-value">${escapeHtml(utm_source)}</div></div>` : ""}
      ${utm_medium ? `<div class="field"><div class="field-label">Medio</div><div class="field-value">${escapeHtml(utm_medium)}</div></div>` : ""}
      ${utm_campaign ? `<div class="field"><div class="field-label">Campaña</div><div class="field-value">${escapeHtml(utm_campaign)}</div></div>` : ""}
    </div>
    `
        : ""
    }

    <div class="footer">
      <p>Email automático del sistema de contacto CAPIRA.</p>
      <p>${new Date().toLocaleString("es-ES", { timeZone: "Europe/Madrid" })}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}
