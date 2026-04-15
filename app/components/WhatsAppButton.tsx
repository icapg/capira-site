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
        {/* Pulse animation background */}
        <span className="absolute inset-0 rounded-full bg-green-500 animate-pulse opacity-75" />

        {/* WhatsApp Icon */}
        <svg
          className="relative z-10 h-6 w-6 text-white sm:h-5 sm:w-5"
          fill="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2zm0 1.67c2.2 0 4.26.86 5.82 2.42a8.22 8.22 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23-1.48 0-2.93-.39-4.19-1.15l-.3-.17-3.12.82.83-3.04-.2-.32A8.19 8.19 0 0 1 3.8 11.91c.01-4.54 3.7-8.24 8.24-8.24zM8.53 7.33c-.16 0-.43.06-.66.31C7.65 7.9 7 8.5 7 9.71c0 1.22.89 2.39 1 2.56.14.17 1.76 2.67 4.25 3.73.59.27 1.05.42 1.41.53.59.19 1.13.16 1.56.1.48-.07 1.46-.6 1.67-1.18.21-.58.21-1.08.15-1.18-.07-.1-.23-.16-.48-.27-.25-.14-1.47-.74-1.69-.82-.23-.08-.37-.12-.56.13-.18.24-.64.8-.78.96-.15.17-.29.19-.53.07-.25-.13-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.12-.24-.01-.39.11-.5.11-.11.27-.29.37-.44.13-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.11-.56-1.35-.77-1.84-.2-.48-.4-.42-.56-.43-.15 0-.31-.01-.48-.01z" />
        </svg>

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
