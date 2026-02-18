"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Section } from "../components/ui/Section";

type Status = "idle" | "sending" | "sent" | "error";
type CountryOption = { code: string; name: string; dialCode: string };

export default function ContactoPage() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [countryCode, setCountryCode] = useState("");
  const [phone, setPhone] = useState("");
  const [lastDialCode, setLastDialCode] = useState("");
  const [topic, setTopic] = useState("");
  const segmentRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    let active = true;

    async function loadCountries() {
      try {
        const res = await fetch("https://restcountries.com/v3.1/all?fields=name,cca2,idd");
        if (!res.ok) return;

        const data = (await res.json()) as Array<{
          name?: { common?: string };
          cca2?: string;
          idd?: { root?: string; suffixes?: string[] };
        }>;

        const regionNames = new Intl.DisplayNames(["es"], { type: "region" });

        const baseOptions = data
          .map((item) => {
            const code = item.cca2 || "";
            const name = (code ? regionNames.of(code) : "") || item.name?.common || "";
            const root = item.idd?.root || "";
            const suffix = item.idd?.suffixes?.[0] || "";
            const dialCode = root ? `${root}${suffix}` : "";
            return { code, name, dialCode };
          })
          .filter((item) => item.code && item.name)
          .sort((a, b) => a.name.localeCompare(b.name, "es"));

        const options = baseOptions;

        if (active) setCountries(options);
      } catch {
        if (active) setCountries([]);
      }
    }

    loadCountries();
    return () => {
      active = false;
    };
  }, []);

  const selectedCountry = useMemo(
    () => countries.find((item) => item.code === countryCode),
    [countries, countryCode]
  );

  const phonePlaceholder = selectedCountry?.dialCode
    ? `${selectedCountry.dialCode} 600 000 000`
    : "+34 600 000 000";

  function onCountryChange(code: string) {
    setCountryCode(code);
    const country = countries.find((item) => item.code === code);
    const prefix = country?.dialCode || "";

    setPhone((prev) => {
      const current = prev.trim();
      if (!prefix) return prev;
      if (!current) return `${prefix} `;
      if (lastDialCode && current.startsWith(lastDialCode)) {
        return `${prefix}${current.slice(lastDialCode.length)}`;
      }
      if (current.startsWith("+")) {
        return current.replace(/^\+\d+\s*/, `${prefix} `);
      }
      return `${prefix} ${current}`;
    });
    setLastDialCode(prefix);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setErrorMsg("");

    const form = new FormData(e.currentTarget);
    const payload = {
      name: String(form.get("name") || "").trim(),
      email: String(form.get("email") || "").trim(),
      company: String(form.get("company") || "").trim(),
      country: selectedCountry?.name || "",
      phone: String(form.get("phone") || "").trim(),
      topic: String(form.get("topic") || "").trim(),
      message: String(form.get("message") || "").trim(),
    };

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      setStatus("sent");
      e.currentTarget.reset();
      setCountryCode("");
      setPhone("");
      setLastDialCode("");
      setTopic("");
      return;
    }

    const data = await res.json().catch(() => ({}));
    setStatus("error");
    setErrorMsg(data?.error || "No se pudo enviar. Probá de nuevo.");
  }

  return (
    <main>
      <section className="bg-gradient-to-b from-zinc-50 to-white py-8 sm:py-10">
        <div className="mx-auto max-w-6xl px-4 sm:px-8">
          <p className="text-sm font-medium text-zinc-700">Contacto</p>
          <h1 className="mt-3 max-w-4xl text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Hablemos de tu proyecto
          </h1>
        </div>
      </section>

      <Section className="pt-3 sm:pt-5">
        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-base font-semibold text-zinc-900">Cómo contactarnos</h2>
              <p className="mt-3 text-base text-zinc-600">
                Completa el formulario o envíanos un correo a{" "}
                <a href="mailto:contacto@capira.com" className="font-medium text-zinc-900 underline">
                  contacto@capira.com
                </a>
              </p>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
              <h2 className="text-base font-semibold text-zinc-900">Trabaja con nosotros</h2>
              <p className="mt-3 text-sm text-zinc-600">
                Estamos expandiéndonos en Latinoamérica y Europa, y buscamos partners locales en
                cada país para brindar un mejor servicio: instaladores, vendedores, operadores y
                otros perfiles estratégicos.
              </p>
              <p className="mt-3 text-sm text-zinc-600">
                Si querés colaborar con CAPIRA, completá el formulario y en Segmento seleccioná
                la opción <span className="font-medium text-zinc-900">Otro</span>.
              </p>
            </div>
          </div>

          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <div className="grid gap-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-900">Nombre</label>
                  <input
                    name="name"
                    required
                    placeholder="Tu nombre completo"
                    className="mt-2 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-900">Email</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="tu@email.com"
                    className="mt-2 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-900">Empresa (opcional)</label>
                  <input
                    name="company"
                    placeholder="Nombre de la empresa"
                    className="mt-2 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-900">Segmento</label>
                  <select
                    ref={segmentRef}
                    name="topic"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
                  >
                    <option value="" disabled>
                      Selecciona un segmento
                    </option>
                    <option value="Residencial">Residencial</option>
                    <option value="Comercios">Comercios</option>
                    <option value="Flotas">Flotas</option>
                    <option value="CPO / Operadores">CPO / Operadores</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium text-zinc-900">País</label>
                  <select
                    name="countryCode"
                    required
                    value={countryCode}
                    onChange={(e) => onCountryChange(e.target.value)}
                    className="mt-2 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
                  >
                    <option value="" disabled>
                      {countries.length ? "Selecciona un país" : "Cargando países..."}
                    </option>
                    {countries.map((country, index) => (
                      <option key={`${country.code}-${index}`} value={country.code}>
                        {country.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-zinc-900">Teléfono (opcional)</label>
                  <input
                    name="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder={phonePlaceholder}
                    className="mt-2 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-zinc-900">Mensaje</label>
                <textarea
                  name="message"
                  required
                  rows={6}
                  placeholder="Cuéntanos más sobre el proyecto que tienes en mente o cómo podemos ayudarte."
                  className="mt-2 w-full rounded-md border border-zinc-200 px-3 py-2 text-sm outline-none transition focus:border-zinc-400"
                />
              </div>

              <button
                disabled={status === "sending"}
                className="rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
              >
                {status === "sending" ? "Enviando..." : "Enviar"}
              </button>

              {status === "sent" && (
                <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                  Mensaje enviado. ¡Gracias! Te respondemos a la brevedad.
                </div>
              )}

              {status === "error" && (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {errorMsg}
                </div>
              )}

              <p className="text-xs text-zinc-500">
                Al enviar aceptás que usemos tus datos para responderte. (Luego lo conectamos a email/CRM.)
              </p>
            </div>
          </form>
        </div>
      </Section>
    </main>
  );
}
