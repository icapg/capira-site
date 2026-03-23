"use client";

import { useState, useEffect } from "react";
import { getUtmParams, trackEvent, trackGA4Event } from "@/app/lib/tracking";
import { Button } from "@/app/components/ui/Button";

export function ComerciosForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    businessName: "",
    city: "",
    utm_source: "",
    utm_medium: "",
    utm_campaign: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const utmParams = getUtmParams();
    setFormData((prev) => ({
      ...prev,
      utm_source: utmParams.utm_source || "",
      utm_medium: utmParams.utm_medium || "",
      utm_campaign: utmParams.utm_campaign || "",
    }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !formData.name ||
      !formData.email ||
      !formData.phone ||
      !formData.businessName ||
      !formData.city
    ) {
      alert("Por favor completa todos los campos");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          company: formData.businessName,
          message: `Solicitud de información para cargadores en comercio: ${formData.businessName} en ${formData.city}`,
          topic: "Comercios - Landing",
          country: "Spain",
          utm_source: formData.utm_source,
          utm_medium: formData.utm_medium,
          utm_campaign: formData.utm_campaign,
        }),
      });

      if (response.ok) {
        // Track events
        trackEvent("Lead", { content_name: "Comercios Landing" });
        trackGA4Event("generate_lead", { content_name: "Comercios Landing" });

        setSubmitted(true);
        window.location.href = "/landing/gracias";
      } else {
        alert("Error al enviar el formulario. Intenta de nuevo.");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al enviar el formulario. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return null;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
          Nombre completo
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-500 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          placeholder="Tu nombre"
        />
      </div>

      <div>
        <label htmlFor="businessName" className="block text-sm font-medium text-zinc-700">
          Nombre del negocio
        </label>
        <input
          type="text"
          id="businessName"
          name="businessName"
          value={formData.businessName}
          onChange={handleChange}
          required
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-500 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          placeholder="Tu comercio o negocio"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-zinc-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-500 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          placeholder="tu@email.com"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-zinc-700">
          Teléfono
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          required
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-500 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          placeholder="+34 XXX XX XX XX"
        />
      </div>

      <div>
        <label htmlFor="city" className="block text-sm font-medium text-zinc-700">
          Ciudad
        </label>
        <input
          type="text"
          id="city"
          name="city"
          value={formData.city}
          onChange={handleChange}
          required
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-500 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          placeholder="Tu ciudad"
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? "Enviando..." : "Quiero más información"}
      </Button>
    </form>
  );
}
