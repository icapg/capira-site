"use client";

import { useState } from "react";

export function WhatsAppButton() {
  const [showTooltip, setShowTooltip] = useState(false);

  const whatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "34662414970";
  const whatsappLink = `https://wa.me/${whatsappNumber}`;

  return (
    <div className="fixed bottom-6 right-6 z-50 sm:bottom-5 sm:right-5">
      <button
        type="button"
        onClick={() => window.open(whatsappLink, "_blank")}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="group relative inline-flex items-center justify-center rounded-full bg-green-500 p-4 shadow-lg transition-all duration-300 hover:bg-green-600 hover:shadow-xl sm:p-3 active:scale-95"
        aria-label="Chat con nosotros por WhatsApp"
      >
        {/* WhatsApp Icon */}
        <svg
          className="h-6 w-6 text-white sm:h-5 sm:w-5"
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-3.055 2.364-3.905 6.75-1.896 10.157 1.432 2.329 3.915 3.933 6.722 3.933 1.754 0 3.429-.545 4.851-1.574l.348-.226 3.614.943-1.209-3.542.225-.36a9.964 9.964 0 001.394-5.318c0-5.537-4.506-10.044-10.044-10.044zm8.854 18.021l-.422-1.237c1.367-2.31 2.096-4.954 2.096-7.554 0-8.322-6.77-15.092-15.092-15.092-2.747 0-5.335.797-7.573 2.307l-1.285-.334 1.388 4.072c-1.455 2.253-2.243 4.81-2.243 7.479 0 8.322 6.77 15.092 15.092 15.092 2.767 0 5.383-.837 7.629-2.42" />
        </svg>

        {/* Pulse animation background */}
        <span className="absolute inset-0 rounded-full bg-green-500 animate-pulse opacity-75" />

        {/* Tooltip */}
        {showTooltip && (
          <div className="absolute bottom-full right-0 mb-3 whitespace-nowrap rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-lg">
            Escríbenos por WhatsApp
            <div className="absolute top-full right-3 h-2 w-2 rotate-45 bg-zinc-900" />
          </div>
        )}
      </button>
    </div>
  );
}
