"use client";

import { useState, useEffect } from "react";
import { getUtmParams, trackEvent, trackGA4Event } from "@/app/lib/tracking";
import { Button } from "@/app/components/ui/Button";

type FleetSize = "1-10" | "11-50" | "51-200" | "200+";

export function FlotasForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    fleetSize: "" as FleetSize | "",
    city: "",
    message: "",
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

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
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
      !formData.company ||
      !formData.fleetSize ||
      !formData.city ||
      !formData.message
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
          company: formData.company,
          message: formData.message || `Solicitud de electrificación de flota: ${formData.fleetSize} vehículos. Empresa: ${formData.company}. Ubicación: ${formData.city}`,
          topic: "Flotas - Landing",
          country: "Spain",
          utm_source: formData.utm_source,
          utm_medium: formData.utm_medium,
          utm_campaign: formData.utm_campaign,
        }),
      });

      if (response.ok) {
        // Track events
        trackEvent("Lead", { content_name: "Flotas Landing" });
        trackGA4Event("generate_lead", { content_name: "Flotas Landing" });

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
        <label htmlFor="company" className="block text-sm font-medium text-zinc-700">
          Empresa
        </label>
        <input
          type="text"
          id="company"
          name="company"
          value={formData.company}
          onChange={handleChange}
          required
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-500 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          placeholder="Nombre de tu empresa"
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
        <label htmlFor="fleetSize" className="block text-sm font-medium text-zinc-700">
          Tamaño de la flota
        </label>
        <select
          id="fleetSize"
          name="fleetSize"
          value={formData.fleetSize}
          onChange={handleChange}
          required
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
        >
          <option value="">Selecciona una opción</option>
          <option value="1-10">1-10 vehículos</option>
          <option value="11-50">11-50 vehículos</option>
          <option value="51-200">51-200 vehículos</option>
          <option value="200+">200+ vehículos</option>
        </select>
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

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-zinc-700">
          Cuéntanos sobre tu flota y operación
        </label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          required
          rows={4}
          className="mt-2 w-full rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 placeholder-zinc-500 transition focus:border-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-200"
          placeholder="Tipo de vehículos, rutas, si ya tienen eléctricos, qué están evaluando..."
        />
      </div>

      <Button
        type="submit"
        disabled={loading}
        className="w-full"
      >
        {loading ? "Enviando..." : "Solicita tu análisis"}
      </Button>
    </form>
  );
}
