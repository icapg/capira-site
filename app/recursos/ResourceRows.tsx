"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type ResourceItem = {
  title: string;
  emoji: string;
  description: string;
  previewDescription?: string;
  diagramSrc?: string;
  diagramAlt?: string;
  detailedView?:
    | "tco"
    | "power"
    | "commerce-chargers"
    | "commerce-management"
    | "commerce-ownership"
    | "ev-basics"
    | "subsidies"
    | "community-garage"
    | "power-contract"
    | "solar-integration"
    | "load-management"
    | "load-capex";
  modalType?: "text";
  href?: string;
};

type ResourceRow = {
  key: string;
  label: string;
  items: ResourceItem[];
};

type MotionDirection = "left" | "right";

const rows: ResourceRow[] = [
  {
    key: "general",
    label: "🌍 General",
    items: [
      {
        title: "Costos: coche de gasolina vs. eléctrico",
        emoji: "\u{26FD}",
        previewDescription:
          "Comparativa TCO (CAPEX + OPEX) para SUV, reparto urbano y larga distancia, con supuestos y números de referencia.",
        detailedView: "tco",
        description:
          "Guía de TCO (Total Cost of Ownership) para comparar combustión interna vs eléctrico.\n\nFecha de referencia de precios energéticos: 18 de febrero de 2026 (EE. UU.).\n\nMetodología:\nTCO = CAPEX (inversión inicial) + OPEX (energía, mantenimiento y operación).\nEn este resumen calculamos con números públicos de mercado y un escenario base conservador.\n\n1) SUV (combustión vs eléctrico)\nEscenario de referencia:\n- SUV combustión: Toyota RAV4 gasolina (MSRP desde 29.800 USD).\n- SUV eléctrico: Tesla Model Y RWD (precio desde 41.630 USD).\n- Diferencia CAPEX inicial: +11.830 USD a favor de combustión.\n\nSupuestos OPEX energía:\n- Gasolina: 2,924 USD/galón (promedio EE. UU., 18-feb-2026).\n- Electricidad residencial: 17,78 cUSD/kWh (mayo-2025 preliminar, EE. UU.).\n- Consumo SUV combustión: 30 mpg combinados (valor de referencia del RAV4 gasolina).\n- Consumo SUV eléctrico: 30 kWh/100 mi (rango típico EV ligero en uso real de catálogo técnico).\n\nCosto energético por milla:\n- SUV combustión: 2,924 / 30 = 0,097 USD/mi.\n- SUV eléctrico: 0,30 x 0,1778 = 0,053 USD/mi.\n- Ahorro energético EV: 0,044 USD/mi.\n\nPunto de equilibrio simple (solo energía):\n- 11.830 / 0,044 = ~268.000 millas (~431.000 km).\n\nLectura:\n- En SUV de uso particular, la energía favorece al EV, pero la brecha de precio de compra puede alargar bastante el payback si no hay incentivos o financiación ventajosa.\n\n2) Camión de reparto pequeño (diésel vs eléctrico)\nEscenario de referencia:\n- Diésel: Ford Transit Cargo Van (MSRP desde 48.400 USD).\n- Eléctrico: Ford E-Transit Cargo Van (MSRP desde 53.260 USD).\n- Diferencia CAPEX inicial: +4.860 USD en eléctrico.\n\nSupuestos OPEX energía:\n- Diésel: 3,711 USD/galón (promedio EE. UU., 18-feb-2026).\n- Electricidad comercial: 13,19 cUSD/kWh (mayo-2025 preliminar, EE. UU.).\n- Eficiencia diésel furgón grande: 10,1 mpg (promedio de furgones de tamaño completo).\n- Eficiencia E-Transit (estimada por ficha técnica): 89 kWh / 159 mi = 0,56 kWh/mi.\n\nCosto energético por milla:\n- Reparto diésel: 3,711 / 10,1 = 0,367 USD/mi.\n- Reparto eléctrico: 0,56 x 0,1319 = 0,074 USD/mi.\n- Ahorro energético EV: 0,293 USD/mi.\n\nPunto de equilibrio simple (solo energía):\n- 4.860 / 0,293 = ~16.600 millas (~26.700 km).\n\nLectura:\n- En reparto urbano/interurbano, el TCO suele inclinarse antes al eléctrico por uso intensivo y costo energético por milla mucho menor.\n- Además, en muchas flotas el mantenimiento programado del eléctrico tiende a ser más bajo, lo que mejora aún más el TCO.\n\n3) Camión de larga distancia (tractor diésel vs eléctrico)\nEscenario de referencia (orden de magnitud):\n- CAPEX típico usado en estudios sectoriales:\n  - Tractor diésel: ~130.000 USD.\n  - Tractor eléctrico: ~240.000 USD.\n- Diferencia CAPEX inicial: +110.000 USD en eléctrico.\n\nSupuestos OPEX energía:\n- Energía camión eléctrico de larga distancia: 1,7 kWh/mi (valor publicado para Tesla Semi).\n- Electricidad comercial: 13,19 cUSD/kWh.\n- Costo energético BEV: 1,7 x 0,1319 = 0,224 USD/mi.\n\nReferencia diésel de operación real:\n- Costo de combustible en operación de camión de carretera: 0,481 USD/mi (ATRI 2025, dato 2024).\n\nAhorro energético por milla (aprox.):\n- 0,481 - 0,224 = 0,257 USD/mi.\n\nPunto de equilibrio simple (solo energía):\n- 110.000 / 0,257 = ~428.000 millas (~689.000 km).\n- Si el camión recorre ~110.000 millas/año, el equilibrio energético llega en ~3,9 años.\n\nLectura:\n- En larga distancia, el CAPEX del eléctrico sigue siendo alto, pero con kilometraje anual elevado y tarifas de carga competitivas, el diferencial energético empieza a cerrar la brecha.\n- Los estudios de TCO para clase 8 en EE. UU. proyectan que en esta década los eléctricos pueden igualar o superar al diésel en varios corredores y estados.\n\nConclusión ejecutiva:\n- SUV particular: depende mucho del precio de compra y del incentivo.\n- Reparto pequeño: hoy suele ser el caso más favorable para electrificar por TCO.\n- Larga distancia: viable en rutas y operaciones bien diseñadas; el diseño energético (tarifa, potencia, recarga) define el resultado económico.\n\nNota importante:\nEste cálculo es un marco orientativo. El TCO final cambia con kilometraje anual, costo financiero, incentivos locales, tarifa horaria de energía, costo de demanda, peajes, seguro y valor residual.",
      },
      {
        title: "Parque automotor por país",
        emoji: "\u{1F30D}",
        description:
          "Evolución y distribución de vehículos por mercado para entender adopción eléctrica.",
        href: "https://eu-evs.com/marketShare/ES/Brands/Bar/All-time-by-Years",
      },
      {
        title: "Puntos de Carga en España",
        emoji: "\u{1F50C}",
        description:
          "Mapa de infraestructura pública y densidad de carga en los principales países.",
        href: "https://www.mapareve.es/mapa-puntos-recarga",
      },
      {
        title: "Todos los coches eléctricos y sus características",
        emoji: "\u{1F697}",
        description:
          "Todos los datos de todos los coches eléctricos del mercado, incluyendo sus autonomías y curvas de carga.",
        href: "https://ev-database.org/",
      },
      {
        title: "¿Qué es el OBC (cargador on-board del coche)?",
        emoji: "\u{1F9E0}",
        previewDescription:
          "El OBC es el cargador interno del coche y define la potencia máxima real en carga AC.",
        description:
          "El OBC (On-Board Charger) es el cargador interno del vehículo que convierte la corriente alterna (AC) de la red en corriente continua (DC) para cargar la batería.\n\nEs, en la práctica, quien limita la potencia máxima en carga AC. Aunque el cargador de pared pueda entregar más potencia, el coche solo tomará hasta el límite de su OBC.\n\nEjemplo:\nSi el wallbox entrega 22 kW AC y el OBC del vehículo admite 11 kW AC, el coche cargará como máximo a 11 kW.",
        diagramSrc: "/images/OBC.png",
        diagramAlt: "Esquema de flujo de carga: red AC y wallbox hacia OBC del coche y luego batería DC",
      },
      {
        title: "Potencia máxima del coche vs. cargador",
        emoji: "\u{26A1}",
        detailedView: "power",
        previewDescription:
          "Cómo se define la potencia real de carga (AC/DC), límites del coche, del cargador y efecto de temperatura/SOC.",
        description:
          "Guía para evitar sobredimensionamiento y elegir el equipo que realmente aprovecha el vehículo.",
      },
      {
        title: "Características básicas de los coches eléctricos",
        emoji: "\u{1F4D8}",
        detailedView: "ev-basics",
        previewDescription:
          "Terminología esencial: OBC, BMS, SOC, Tipo 2, CCS, autonomía, curva de carga y más.",
        description:
          "Glosario base para entender cómo cargan y operan los coches eléctricos.",
      },
    ],
  },
  {
    key: "residencial",
    label: "🏠 Residencial",
    items: [
      {
        title: "Elige el cargador residencial adecuado",
        emoji: "\u{1F3E0}",
        description:
          "Potencia, protecciones y funcionalidades clave según uso diario y tipo de vivienda.",
        href: "/recursos/elegir-cargador",
      },
      {
        title: "Presupuesta tu instalación",
        emoji: "\u{1F4B8}",
        description:
          "Desglose orientativo de materiales, mano de obra y variables que mueven el costo final.",
        href: "/recursos/presupuesto",
      },
      {
        title: "¿Qué potencia contratar?",
        emoji: "\u{1F50B}",
        detailedView: "power-contract",
        previewDescription:
          "La potencia ideal depende del coche (OBC), uso, instalación, horas de carga disponibles, tarifa y cargador elegido.",
        description:
          "Método práctico para estimar potencia contratada sin penalizar tu factura.",
      },
      {
        title: "Ayuda y subvenciones",
        emoji: "\u{1F4DD}",
        detailedView: "subsidies",
        previewDescription:
          "Resumen por país (Europa + LATAM) con programas de ayudas, beneficios fiscales y estado de vigencia.",
        description:
          "Resumen de incentivos, requisitos y documentación habitual para solicitar ayudas.",
      },
      {
        title: "Integración con placas solares",
        emoji: "\u{2600}\u{FE0F}",
        detailedView: "solar-integration",
        previewDescription:
          "Cómo cargar con solar (excedente o mixto), qué limita la potencia y cómo integrar carga bidireccional.",
        description:
          "Cómo priorizar autoconsumo y controlar carga para reducir costo energético.",
      },
      {
        title: "Garaje comunitario",
        emoji: "\u{1F3E2}",
        detailedView: "community-garage",
        previewDescription:
          "Qué revisar para instalar en comunidad y caso Madrid: en plaza individual no requiere votación, sí comunicación previa.",
        description:
          "Alternativas técnicas y administrativas para instalar en comunidades de propietarios.",
      },
    ],
  },
  {
    key: "comercios",
    label: "🏬 Comercios",
    items: [
      {
        title: "Cargadores adecuados para mis clientes",
        emoji: "\u{1F3EA}",
        detailedView: "commerce-chargers",
        previewDescription:
          "Cómo definir tipo de cargador, potencia y cantidad de puntos según objetivo de negocio, perfil de clientes y ubicación.",
        description:
          "Selección de potencia y tipo de equipo según tiempo medio de permanencia.",
      },
      {
        title: "Presupuesta tu instalación",
        emoji: "\u{1F4B3}",
        description:
          "Estimación de inversión inicial con variables técnicas y de obra civil.",
        href: "/recursos/presupuesto",
      },
      {
        title: "Sistema de gestión",
        emoji: "\u{1F4BB}",
        detailedView: "commerce-management",
        previewDescription:
          "Qué cambia si operas con CPO o por cuenta propia, funciones clave del software y cómo evaluar roaming, facturación y costos.",
        description:
          "Funciones clave del software: monitoreo, precios, usuarios, reportes e integraciones.",
      },
      {
        title: "¿Cargadores en propiedad o tercerizado con CPO?",
        emoji: "⚖️",
        detailedView: "commerce-ownership",
        previewDescription:
          "Comparativa rápida entre colaboración con CPO y proyecto propio: inversión, operación, facturación, ingresos y contrato.",
        description:
          "Comparativa entre inversión propia y modelo operado por tercero.",
      },
    ],
  },
  {
    key: "flotas",
    label: "🚐 Flotas",
    items: [
      {
        title: "Ayuda y subvenciones",
        emoji: "\u{1F69A}",
        detailedView: "subsidies",
        previewDescription:
          "Resumen por país (Europa + LATAM) con programas de ayudas, beneficios fiscales y estado de vigencia.",
        description:
          "Programas de incentivo y recomendaciones para estructurar la solicitud de flota.",
      },
      {
        title: "Modelos de inversión",
        emoji: "\u{1F4B0}",
        description:
          "CAPEX, OPEX y opciones mixtas para electrificar sin comprometer caja.",
        href: "/flotas#modelos-inversion",
      },
      {
        title:
          "Load balancing vs shifting: CAPEX vs OPEX vs Operatividad",
        emoji: "🖥️",
        detailedView: "load-capex",
        previewDescription:
          "Optimización de potencia instalada y costo energético según la cantidad de flota cargando en cada momento.",
        description:
          "Equilibrio entre infraestructura, costos de demanda y estrategia de recarga.",
      },
      {
        title: "Load management en depósitos",
        emoji: "\u{1F4CA}",
        detailedView: "load-management",
        previewDescription:
          "Escenarios operativos para flotas: secuencial, balance dinámico y control por prioridades.",
        description:
          "Cómo evitar picos, asegurar salida de vehículos y reducir costo energético.",
      },
    ],
  },
];

function ResourceCard({
  item,
  onOpen,
  compact = false,
}: {
  item: ResourceItem;
  onOpen: (item: ResourceItem) => void;
  compact?: boolean;
}) {
  const classes = compact
    ? "block h-full min-h-[190px] w-52 overflow-hidden rounded-xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    : "block h-full min-h-[190px] w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md";

  const content = (
    <div className="flex h-full flex-col">
      <p className="min-h-12 max-h-12 overflow-hidden text-sm font-semibold text-zinc-900">
        {item.emoji} {item.title}
      </p>
      <p className="mt-2 min-h-[5.25rem] max-h-[5.25rem] overflow-hidden text-sm leading-6 text-zinc-600">
        {item.previewDescription ?? item.description}
      </p>
    </div>
  );

  if (item.href) {
    const isExternal = item.href.startsWith("http");
    return (
      <Link
        href={item.href}
        className={classes}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noopener noreferrer" : undefined}
      >
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={() => onOpen(item)} className={classes}>
      {content}
    </button>
  );
}

function TcoRichContent() {
  return (
    <div className="mt-4 space-y-4 text-zinc-700">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm leading-6">
          <span className="font-semibold">TCO (Total Cost of Ownership)</span> es el costo total
          de tener y operar un vehículo durante su vida útil.
        </p>
        <p className="mt-2 text-sm leading-6">
          <span className="font-semibold">TCO = CAPEX + OPEX</span>, donde CAPEX incluye precio de
          compra, impuestos, incentivos y valor residual; y OPEX incluye energía, mantenimiento y
          uso. Esta síntesis está basada en el estudio global del Nickel Institute (realizado por
          Avicenne Energy).
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">
          🧮 Modelo del estudio (cómo calcularon)
        </p>
        <p className="mt-2 text-sm leading-6">
          1) Compararon EV vs ICE equivalentes por segmento: pequeño, mediano y lujo.
        </p>
        <p className="text-sm leading-6">
          2) Evaluaron horizontes de propiedad de 3, 7 y 10 años, con escenarios de kilometraje
          alto y bajo.
        </p>
        <p className="text-sm leading-6">
          3) Variables incluidas: precio de adquisición, subsidios, impuestos, cargador, gasolina,
          electricidad, mantenimiento y valor residual.
        </p>
        <p className="text-sm leading-6">
          4) Geografías analizadas: EE. UU. (California, Nueva York, Florida), Europa (Francia,
          Alemania, Reino Unido) y Asia (China, Japón, Corea del Sur).
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🚙 Segmentos pequeño y mediano</p>
          <p className="mt-2 text-sm leading-6">
            Resultado principal: el TCO de EV suele ser favorable frente a ICE en la mayoría de
            mercados y escenarios analizados.
          </p>
          <p className="text-sm leading-6">
            Factores que más pesan: incentivos, valor residual y diferencia entre combustible
            líquido vs electricidad.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🌍 Diferencias regionales</p>
          <p className="mt-2 text-sm leading-6">
            Europa y Asia muestran ventaja económica más clara para EV por combustibles fósiles más
            caros y políticas de incentivo.
          </p>
          <p className="text-sm leading-6">
            El estudio indica que en Europa el petróleo/diésel puede costar entre 1,5x y 2,8x
            frente a EE. UU.
          </p>
          <p className="text-sm leading-6">
            También señala que la carga pública puede costar aproximadamente el doble que la carga
            en casa.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">💎 Segmento lujo</p>
          <p className="mt-2 text-sm leading-6">
            Es el segmento más sensible al precio de compra: en algunos mercados, el EV puede ser
            mucho más caro al inicio.
          </p>
          <p className="text-sm leading-6">
            En este caso el resultado TCO depende más del horizonte de propiedad y del kilometraje
            anual.
          </p>
          <p className="text-sm leading-6">
            En EE. UU., por menor subsidio y gasolina más barata, la ventaja económica de EV puede
            ser menor que en Europa/Asia.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-semibold text-zinc-900">✅ Lectura rápida</p>
        <p className="mt-2 text-sm leading-6">
          La conclusión del estudio es que, para la mayoría de modelos pequeños y medianos, el EV
          ofrece TCO competitivo o mejor que ICE. Las mayores excepciones aparecen en lujo o en
          escenarios de baja utilización y menor apoyo de incentivos.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">Fuente</p>
        <a
          href="https://nickelinstitute.org/en/nickel-applications/nickel-in-batteries/total-cost-of-ownership-tco-for-electric-vehicles-ev-vs-internal-combustion-engine-vehicles-ice/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex text-sm font-medium text-zinc-900 underline underline-offset-2"
        >
          Nickel Institute, estudio TCO EV vs ICE (Avicenne Energy)
        </a>
      </div>
    </div>
  );
}

function PowerRichContent() {
  return (
    <div className="mt-4 space-y-4 text-zinc-700">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm leading-6">
          <span className="font-semibold">Idea clave:</span> la potencia real de carga no la define
          solo el cargador. La limita siempre el elemento más restrictivo del sistema.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">🧮 Fórmula básica</p>
        <p className="mt-2 text-sm leading-6">
          Potencia (kW) = Voltaje (V) x Corriente (A) / 1000
        </p>
        <p className="text-sm leading-6">
          La potencia útil final es el mínimo entre límite del coche, límite del cargador y
          condiciones de batería.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">🔌 Esquema simple de límites</p>
        <pre className="mt-2 overflow-x-auto rounded-lg bg-zinc-100 p-3 text-xs leading-5 text-zinc-700">
{`RED -> CARGADOR -> COCHE -> BATERÍA

AC:
Potencia real = MIN( límite OBC del coche, potencia wallbox, límite instalación )

DC:
Potencia real = MIN( límite DC del coche, potencia cargador, límite por voltaje/corriente, temperatura/SOC )`}
        </pre>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🚗 Nissan Leaf e+ (aprox.)</p>
          <p className="mt-2 text-sm leading-6">AC: hasta 6,6 kW (OBC).</p>
          <p className="text-sm leading-6">DC: pico ~100 kW (CHAdeMO).</p>
          <p className="text-sm leading-6">Arquitectura: ~400 V.</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Si conectas a 150 kW DC, no cargará a 150 kW: el coche limita alrededor de su pico.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🚙 Tesla Model Y RWD (aprox.)</p>
          <p className="mt-2 text-sm leading-6">AC: hasta 11 kW.</p>
          <p className="text-sm leading-6">DC: pico ~170 kW.</p>
          <p className="text-sm leading-6">Arquitectura: ~400 V.</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            En un cargador de 250 kW, la potencia real la marca la curva del vehículo y el SOC.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🚘 Hyundai IONIQ 5 (aprox.)</p>
          <p className="mt-2 text-sm leading-6">AC: hasta 11 kW.</p>
          <p className="text-sm leading-6">DC: pico ~220-230 kW.</p>
          <p className="text-sm leading-6">Arquitectura: ~800 V.</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            Aprovecha mejor cargadores HPC de alta potencia cuando batería y temperatura son óptimas.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-semibold text-zinc-900">
          🌡️ Temperatura y estado de carga (SOC): por qué baja la potencia
        </p>
        <p className="mt-2 text-sm leading-6">
          <span className="font-medium">BMS</span> significa{" "}
          <span className="font-medium">Battery Management System</span> (Sistema de Gestión de
          Batería). Es el sistema que supervisa y protege la batería en tiempo real: controla
          temperatura, voltajes y corrientes para alargar su vida útil y mantenerla en operación
          segura.
        </p>
        <p className="mt-2 text-sm leading-6">
          La batería acepta máxima potencia en una ventana térmica y de SOC concreta. Si está muy
          fría o muy caliente, el BMS reduce corriente para proteger celdas.
        </p>
        <p className="mt-2 text-sm leading-6">
          <span className="font-medium">SOC</span> significa{" "}
          <span className="font-medium">State of Charge</span> (estado de carga): es el porcentaje
          de batería disponible en ese momento.
        </p>
        <p className="text-sm leading-6">
          En DC, típicamente el pico aparece con SOC bajo/medio y luego cae de forma progresiva al
          acercarse al 80-100%.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">
          ⚙️ Voltaje del coche vs voltaje del cargador
        </p>
        <p className="mt-2 text-sm leading-6">
          En DC, para lograr mucha potencia necesitas suficiente voltaje y corriente. Un coche de
          800 V puede alcanzar potencias altas con menos corriente que uno de 400 V.
        </p>
        <p className="text-sm leading-6">
          Si el cargador no entrega el rango de voltaje/corriente que el coche necesita en ese
          instante, la potencia se recorta.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">📌 Ejemplos prácticos</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>
            Wallbox 22 kW AC + coche con OBC 11 kW → cargará a ~11 kW (no a 22 kW).
          </li>
          <li>
            Cargador DC 350 kW + coche con pico DC 100 kW → cargará en torno a su límite del coche.
          </li>
          <li>
            Mismo coche, invierno sin preacondicionamiento → potencia menor hasta calentar batería.
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-semibold text-zinc-900">✅ Cómo elegir bien el cargador</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>AC residencial/comercial: prioriza igualar el OBC del coche objetivo.</li>
          <li>
            DC público/flota: dimensiona por curva de carga real, no solo por potencia pico en ficha.
          </li>
          <li>Considera temperatura local, ciclo operativo y tiempo útil de carga.</li>
        </ul>
      </div>
    </div>
  );
}

function EvBasicsRichContent() {
  return (
    <div className="mt-4 space-y-4 text-zinc-700">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm leading-6">
          Guía rápida con la terminología esencial para entender carga, autonomía y rendimiento en
          vehículos eléctricos.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🔌 OBC (On-Board Charger)</p>
          <p className="mt-2 text-sm leading-6">
            Cargador interno del coche en AC. Marca el límite real de potencia en carga AC.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🧠 BMS (Battery Management System)</p>
          <p className="mt-2 text-sm leading-6">
            Sistema que protege y gestiona la batería: temperatura, voltajes, corrientes y
            seguridad.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🔋 SOC (State of Charge)</p>
          <p className="mt-2 text-sm leading-6">
            Porcentaje de carga actual de la batería. A mayor SOC, normalmente menor potencia DC.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">📉 Curva de carga</p>
          <p className="mt-2 text-sm leading-6">
            Evolución de la potencia con el tiempo/SOC. El pico dura poco; luego la potencia cae.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🔌 Tipo 2 (AC)</p>
          <p className="mt-2 text-sm leading-6">
            Conector estándar en Europa para carga AC (residencial y pública de baja/media
            potencia).
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">⚡ CCS (DC rápida)</p>
          <p className="mt-2 text-sm leading-6">
            Conector combinado para carga rápida en corriente continua en gran parte del mercado.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🛣️ Autonomía</p>
          <p className="mt-2 text-sm leading-6">
            Distancia estimada con una carga. Cambia según velocidad, clima, desnivel y estilo de
            conducción.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🌡️ Preacondicionamiento</p>
          <p className="mt-2 text-sm leading-6">
            Ajuste térmico de batería antes de cargar para mejorar potencia y eficiencia.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🔋 kWh (energía) vs kW (potencia)</p>
          <p className="mt-2 text-sm leading-6">
            kWh = cuánta energía guardas. kW = qué tan rápido cargas/consumes esa energía.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">⚙️ AC vs DC</p>
          <p className="mt-2 text-sm leading-6">
            AC suele ser más lenta y económica; DC permite cargas rápidas, pero depende de curva y
            temperatura.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-semibold text-zinc-900">✅ Regla práctica</p>
        <p className="mt-2 text-sm leading-6">
          Potencia real de carga = mínimo entre coche, cargador y estado de batería.
        </p>
      </div>
    </div>
  );
}

function SubsidiesRichContent() {
  const Flag = ({ code, alt }: { code: string; alt: string }) => (
    <img
      src={`https://flagcdn.com/24x18/${code}.png`}
      alt={`Bandera de ${alt}`}
      className="mr-2 inline-block h-[0.95rem] w-[1.3rem] rounded-[2px] object-cover align-[-1px]"
      loading="lazy"
    />
  );

  return (
    <div className="mt-4 space-y-4 text-zinc-700">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm leading-6">
          Resumen práctico de ayudas e incentivos de electromovilidad por país (Europa + LATAM),
          con foco en programas públicos y beneficios fiscales verificables.
        </p>
        <p className="mt-2 text-xs leading-5 text-zinc-500">
          Fecha de referencia: febrero de 2026. Las convocatorias y cupos pueden cambiar.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">
            <Flag code="es" alt="España" />
            España
          </p>
          <p className="mt-2 text-sm leading-6">
            Programas de apoyo a compra: MOVES III 2025 y Programa Auto+ 2026 (hasta 4.500 EUR,
            con carácter retroactivo desde 1/1/2026).
          </p>
          <p className="text-sm leading-6">
            📉 Qué se paga menos: en muchos municipios hay bonificaciones del IVTM
            (impuesto de circulación/patente), y pueden existir beneficios locales de
            estacionamiento regulado según ordenanza municipal.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">
            <Flag code="ar" alt="Argentina" />
            Argentina
          </p>
          <p className="mt-2 text-sm leading-6">
            Régimen de importación con arancel extrazona 0% para ciertos vehículos eléctricos e
            híbridos (tope FOB y cupo anual), con convocatorias y asignaciones oficiales para 2026.
          </p>
          <p className="text-sm leading-6">
            📉 Qué se paga menos: el beneficio principal es arancelario nacional; patente y
            estacionamiento dependen de provincia/municipio.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">
            <Flag code="cl" alt="Chile" />
            Chile
          </p>
          <p className="mt-2 text-sm leading-6">
            Beneficio en permiso de circulación: para 2026, eléctricos e híbridos enchufables
            (fabricación 2021 en adelante) pagan el 25% del impuesto anual indicado por SII.
          </p>
          <p className="text-sm leading-6">
            📉 Qué se paga menos: permiso de circulación (patente) con rebaja específica para EV/PHEV
            bajo el esquema vigente publicado por SII.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">
            <Flag code="co" alt="Colombia" />
            Colombia
          </p>
          <p className="mt-2 text-sm leading-6">
            Ley 1964: impuesto vehicular con tope de 1% del valor comercial, descuento de 10% en
            SOAT y descuento de 30% en revisión técnico-mecánica.
          </p>
          <p className="text-sm leading-6">
            📉 Qué se paga menos: impuesto vehicular, SOAT y revisión; además hay beneficios de
            circulación y estacionamiento preferencial, con implementación territorial.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">
            <Flag code="cr" alt="Costa Rica" />
            Costa Rica
          </p>
          <p className="mt-2 text-sm leading-6">
            Ley 9518 y reformas: esquema de exoneraciones tributarias para transporte eléctrico con
            aplicación según tramos/condiciones y reglamentación administrativa.
          </p>
          <p className="text-sm leading-6">
            📉 Qué se paga menos: principalmente impuestos de importación/compra bajo el marco de ley;
            beneficios operativos pueden variar por reglamentación vigente.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">
            <Flag code="py" alt="Paraguay" />
            Paraguay
          </p>
          <p className="mt-2 text-sm leading-6">
            Ley 6925 de incentivos al transporte eléctrico: contempla exoneraciones impositivas para
            vehículos eléctricos y equipamientos de carga en el periodo de vigencia legal.
          </p>
          <p className="text-sm leading-6">
            📉 Qué se paga menos: impuestos vinculados al vehículo/equipamiento eléctrico según
            reglamentación; se suman incentivos de adopción a nivel nacional.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">
            <Flag code="uy" alt="Uruguay" />
            Uruguay
          </p>
          <p className="mt-2 text-sm leading-6">
            Incentivos combinados nacionales/municipales (beneficios tributarios y programas
            específicos para segmentos como carga o taxis, según convocatoria vigente).
          </p>
          <p className="text-sm leading-6">
            📉 Qué se paga menos: beneficios tributarios y apoyos programáticos según segmento; algunos
            componentes dependen de intendencia o llamado específico.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">
            <Flag code="mx" alt="México" />
            México
          </p>
          <p className="mt-2 text-sm leading-6">
            Beneficios relevantes suelen ser estatales/municipales (por ejemplo, exenciones
            ambientales y de verificación en CDMX), más que un esquema único nacional de subsidio
            directo a la compra.
          </p>
          <p className="text-sm leading-6">
            📉 Qué se paga menos: en algunas ciudades se reducen costos de verificación/restricciones;
            la patente y otros cargos varían por estado.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-semibold text-zinc-900">📌 Cómo leer este resumen</p>
        <p className="mt-2 text-sm leading-6">
          Hay países con subsidio directo a la compra y otros con beneficios fiscales/operativos.
          Para ejecutar un proyecto conviene validar: vigencia, cupos, autoridad de aplicación y
          compatibilidad con incentivos regionales o municipales.
        </p>
        <p className="mt-2 text-sm leading-6">
          Este contenido funciona como mapa inicial por país. Después realizamos un análisis
          caso a caso para confirmar quién puede aplicar, qué requisitos debe cumplir, si el
          programa tiene cupo disponible y si existen incentivos complementarios que puedan
          combinarse (nacionales, regionales, municipales, fiscales u operativos).
        </p>
        <p className="mt-2 text-sm leading-6">
          Con ese diagnóstico definimos la estrategia de postulación más conveniente para maximizar
          el beneficio económico y reducir riesgos administrativos.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">Fuente</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>
            <a
              href="https://www.mintur.gob.es/es-es/GabinetePrensa/NotasPrensa/2026/Paginas/El-Programa-Auto%2B-ayudara-con-hasta-4.500-euros-a-la-compra-de-vehiculos-electricos-y-europeos.aspx"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              <Flag code="es" alt="España" />
              España (Ministerio de Industria y Turismo) -
              Programa Auto+ 2026
            </a>
          </li>
          <li>
            <a
              href="https://www.idae.es/ayudas-y-financiacion/para-movilidad-y-vehiculos/moves-iii-2025"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              <Flag code="es" alt="España" />
              España (IDAE) - MOVES III 2025
            </a>
          </li>
          <li>
            <a
              href="https://www.sii.cl/noticias/2026/220126noti01pcr.htm"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              <Flag code="cl" alt="Chile" />
              Chile (SII) - Tasación 2026 y permiso de
              circulación para EV/PHEV
            </a>
          </li>
          <li>
            <a
              href="https://www.boletinoficial.gob.ar/detalleAviso/primera/337917/20260129"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              <Flag code="ar" alt="Argentina" />
              Argentina (Boletín Oficial) - Resolución 22/2026
              (cupo/arancel)
            </a>
          </li>
          <li>
            <a
              href="https://www.suin-juriscol.gov.co/viewDocument.asp?id=30038009"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              <Flag code="co" alt="Colombia" />
              Colombia (SUIN) - Ley 1964 de 2019 (impuesto,
              SOAT, revisión y circulación)
            </a>
          </li>
          <li>
            <a
              href="https://www.asamblea.go.cr/sd/Lists/Archivo_Leyes/DispForm.aspx?ContentTypeId=0x010027F4CF5CCAE4F047BABD7F5711AD329C&ID=212"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              <Flag code="cr" alt="Costa Rica" />
              Costa Rica (Asamblea) - Ley 9518
            </a>
          </li>
          <li>
            <a
              href="https://www.bacn.gov.py/leyes-paraguayas/11279/ley-n-6925-de-incentivos-y-promocion-del-transporte-electrico-en-el-paraguay"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              <Flag code="py" alt="Paraguay" />
              Paraguay (BACN) - Ley 6925
            </a>
          </li>
          <li>
            <a
              href="https://www.gub.uy/ministerio-industria-energia-mineria/comunicacion/noticias/subite-cargo-extienden-plazo-para-acceder-beneficios-compra-vehiculos"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              <Flag code="uy" alt="Uruguay" />
              Uruguay (MIEM) - Programa Subite Cargo
            </a>
          </li>
          <li>
            <a
              href="https://www.sedema.cdmx.gob.mx/comunicacion/nota/principales-ajustes-al-programa-de-verificacion-vehicular-2026-entran-en-vigor-en-la-ciudad-de-mexico"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              <Flag code="mx" alt="México" />
              México (SEDEMA CDMX) - Beneficios/exenciones
              ambientales 2026
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

function CommunityGarageRichContent() {
  return (
    <div className="mt-4 space-y-4 text-zinc-700">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm leading-6">
          En garajes comunitarios la regla puede cambiar según país y región. Siempre conviene
          validar normativa local y reglamento interno de la comunidad.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">🇪🇸 Caso Madrid (referencia práctica)</p>
        <p className="mt-2 text-sm leading-6">
          Para una plaza individual en un edificio en régimen de propiedad horizontal, aplica el
          artículo 17.5 de la LPH: no depende de votación de la comunidad para autorizar la
          instalación del punto de recarga.
        </p>
        <p className="text-sm leading-6">
          Lo que corresponde es comunicación previa a la comunidad (presidencia/administración).
        </p>
        <p className="text-sm leading-6">
          El coste de la instalación y del consumo eléctrico lo asume íntegramente el propietario
          interesado.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">📋 Checklist mínimo recomendado</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Comunicar por escrito antes de ejecutar.</li>
          <li>Definir trazado de cableado por elementos comunes con criterio técnico y seguro.</li>
          <li>Instalar con empresa habilitada y conforme al REBT / ITC-BT-52.</li>
          <li>Documentar protecciones, potencia y esquema unifilar.</li>
          <li>Dejar registro de mantenimiento y responsable de la instalación.</li>
        </ul>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-semibold text-zinc-900">⚠️ Cuándo puede haber conflicto</p>
        <p className="mt-2 text-sm leading-6">
          Si el diseño afecta de forma innecesaria o desproporcionada elementos comunes, o genera
          perjuicio técnico a terceros, la comunidad puede impugnar la solución concreta.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">Fuente</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>
            <a
              href="https://www.boe.es/buscar/act.php?id=BOE-A-1960-10906"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              BOE - Ley de Propiedad Horizontal (art. 17.5)
            </a>
          </li>
          <li>
            <a
              href="https://www.poderjudicial.es/cgpj/es/Poder-Judicial/Tribunal-Supremo/Sala-de-Prensa/Notas-de-prensa/El-Tribunal-Supremo-resuelve-que-la-instalacion-del-punto-de-recarga-de-vehiculos-electricos-en-una-plaza-individual-de-un-garaje-comunitario-solo-requiere-comunicarlo-previamente-a-la-comunidad"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Tribunal Supremo (nota de prensa sobre interpretación del art. 17.5 LPH)
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
}

function PowerContractRichContent() {
  return (
    <div className="mt-4 space-y-4 text-zinc-700">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm leading-6">
          La potencia a contratar no se define con una cifra estándar. Debe dimensionarse según el
          vehículo, el patrón real de uso y la instalación disponible.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">🔌 1) Límite del coche: OBC</p>
        <p className="mt-2 text-sm leading-6">
          El <span className="font-medium">OBC (On-Board Charger)</span> es el cargador interno del
          coche en AC y marca su potencia máxima real de carga en alterna.
        </p>
        <p className="text-sm leading-6">
          Ejemplo: si el coche admite 7,4 kW AC, contratar 11 kW solo para ese vehículo no reduce
          tiempos en la misma proporción.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🚗 2) Uso del vehículo</p>
          <p className="mt-2 text-sm leading-6">
            Kilómetros diarios, frecuencia de uso, días de operación y necesidad de recarga rápida.
            No es lo mismo un uso ocasional que un uso intensivo diario.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">⏱️ 3) Horas disponibles de conexión</p>
          <p className="mt-2 text-sm leading-6">
            Cuantas más horas esté conectado el coche, menor potencia instantánea necesitas para
            recuperar la energía diaria.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🏠 4) Instalación eléctrica existente</p>
          <p className="mt-2 text-sm leading-6">
            Capacidad del cuadro, secciones de cable, protecciones, monofásica/trifásica y margen de
            potencia frente a otras cargas de la vivienda o negocio.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">💶 5) Precio de la energía</p>
          <p className="mt-2 text-sm leading-6">
            Tarifa, periodos horarios y término de potencia contratado. Subir potencia mejora tiempo
            de carga, pero puede aumentar el coste fijo mensual.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">⚙️ 6) Cargador elegido y estrategia</p>
        <p className="mt-2 text-sm leading-6">
          El equipo debe ser coherente con el vehículo y la instalación: balanceo dinámico de carga,
          programación horaria y control de potencia para evitar picos y cortes.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-semibold text-zinc-900">🧮 Criterio práctico de dimensionamiento</p>
        <p className="mt-2 text-sm leading-6">
          Potencia objetivo ≈ energía diaria a recuperar (kWh) / horas reales de carga.
        </p>
        <p className="text-sm leading-6">
          Luego se ajusta por límite del OBC, capacidad de instalación y coste de tarifa para elegir
          un punto económicamente eficiente.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">✅ Cómo asesoramos la potencia adecuada</p>
        <p className="mt-2 text-sm leading-6">
          Evaluamos todos estos factores en conjunto y proponemos una potencia que equilibre
          disponibilidad operativa, tiempo de carga y costo total (inversión + factura energética),
          evitando sobredimensionar.
        </p>
      </div>
    </div>
  );
}

function CommerceChargersRichContent() {
  return (
    <div className="mt-4 space-y-4 text-zinc-700">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm leading-6">
          Si tienes un comercio y quieres instalar cargadores, la decisión no empieza por "qué
          marca compro", sino por{" "}
          <span className="font-semibold">qué objetivo de negocio quieres cumplir</span>.
        </p>
        <p className="mt-2 text-sm leading-6">
          En términos simples: primero decides para qué quieres los cargadores; después defines tipo
          de equipo, potencia, cantidad de puntos y modelo de operación.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🎯 1) Objetivo principal: facturar o fidelizar</p>
          <p className="mt-2 text-sm leading-6">
            <span className="font-medium">Facturar con carga:</span> buscas que el cargador sea una
            línea de ingresos.
          </p>
          <p className="text-sm leading-6">
            <span className="font-medium">Fidelizar clientela existente:</span> usas la carga como
            servicio para mejorar experiencia, permanencia y ticket promedio en el local.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🔍 2) Qué cambia según ese objetivo</p>
          <p className="mt-2 text-sm leading-6">
            Si priorizas facturación, importa mucho el flujo de vehículos y la rotación de plazas.
          </p>
          <p className="text-sm leading-6">
            Si priorizas fidelización, importa más que el cliente cargue "lo suficiente" durante su
            visita y perciba valor en volver.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">📍 Variables del local que definen la solución</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Tiempo medio de permanencia del cliente (15 min, 45 min, 2 horas, etc.).</li>
          <li>Ubicación y tráfico del lugar (paso rápido, destino, barrio residencial, ruta).</li>
          <li>Puntos de interés cercanos (restaurantes, cine, supermercado, oficinas, gimnasios).</li>
          <li>Comodidades en sitio (aseos, cafetería, sala de espera, seguridad, iluminación).</li>
          <li>Horarios pico y estacionalidad del negocio.</li>
          <li>Potencia eléctrica disponible y posibilidad de ampliación del suministro.</li>
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🅰️ Estancia corta</p>
          <p className="mt-2 text-sm leading-6">
            Cliente de paso rápido: suele requerir más potencia por punto para que la carga sea
            relevante en pocos minutos.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🅱️ Estancia media</p>
          <p className="mt-2 text-sm leading-6">
            Comercio con permanencia intermedia: conviene equilibrio entre potencia, coste de
            instalación y rotación.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🅲 Estancia larga</p>
          <p className="mt-2 text-sm leading-6">
            Cliente que se queda más tiempo: puede funcionar muy bien con menor potencia por punto y
            más posiciones de carga.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-semibold text-zinc-900">🧮 Cómo se calcula potencia y cantidad de puntos</p>
        <p className="mt-2 text-sm leading-6">
          1) Estimas cuántos coches eléctricos podrían cargar por día y en qué franjas horarias.
        </p>
        <p className="text-sm leading-6">
          2) Defines energía objetivo por visita (cuántos kWh quieres entregar por cliente).
        </p>
        <p className="text-sm leading-6">
          3) Con el tiempo de permanencia, calculas potencia mínima por punto para cumplir esa meta.
        </p>
        <p className="text-sm leading-6">
          4) Determinas cantidad de puntos para evitar colas y mantener experiencia de uso razonable.
        </p>
        <p className="text-sm leading-6">
          5) Validas si la red del local soporta la solución o si necesitas gestión de carga y/o
          ampliación de potencia contratada.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🏗️ Modelo 1: inversión propia</p>
          <p className="mt-2 text-sm leading-6">
            <span className="font-medium">CAPEX inicial mayor</span>, porque tú financias equipos,
            instalación, obra y puesta en marcha.
          </p>
          <p className="text-sm leading-6">
            A cambio, conservas más control de precios, experiencia de cliente, datos y margen
            económico. Suele ser más rentable a largo plazo si la utilización acompaña.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🤝 Modelo 2: colaboración con CPO</p>
          <p className="mt-2 text-sm leading-6">
            Menor carga operativa para el comercio: el CPO normalmente se encarga de la inversión y
            de la operación integral (software, soporte, mantenimiento y cobro).
          </p>
          <p className="text-sm leading-6">
            Tú reduces riesgo y dolores de cabeza, pero también sueles ceder parte de la facturación
            potencial frente al modelo propio.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">💡 CAPEX y OPEX explicados sin tecnicismos</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>CAPEX: lo que pagas al inicio (equipos, obra, ingeniería, legalización).</li>
          <li>OPEX: lo que pagas mes a mes (energía, mantenimiento, software, operación).</li>
          <li>No siempre gana la opción "más barata al inicio": hay que mirar costo total a 3-5 años.</li>
        </ul>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-semibold text-zinc-900">✅ Guía rápida para decidir como comerciante</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Si quieres simplicidad máxima: evalúa CPO.</li>
          <li>Si quieres capturar mayor margen en el tiempo: evalúa modelo propio.</li>
          <li>Si tienes dudas: empieza con fase piloto y escala según demanda real.</li>
        </ul>
      </div>

    </div>
  );
}

function CommerceManagementRichContent() {
  return (
    <div className="mt-4 space-y-4 text-zinc-700">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm leading-6">
          El <span className="font-semibold">sistema de gestión</span> es el "cerebro" de los
          cargadores: muestra estado en tiempo real, permite cobrar, controlar accesos y revisar
          operación.
        </p>
        <p className="mt-2 text-sm leading-6">
          Para un comercio, la primera decisión no es técnica: es{" "}
          <span className="font-semibold">si opera con un CPO o por cuenta propia</span>.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🤝 Si trabajas con CPO (colaboración)</p>
          <p className="mt-2 text-sm leading-6">
            No tienes que preocuparte por montar ni administrar un software desde cero. Lo normal es
            que el CPO te dé acceso a su plataforma para ver disponibilidad, sesiones, energía
            entregada y facturación.
          </p>
          <p className="text-sm leading-6">
            El CPO suele encargarse de operación diaria, soporte, actualizaciones, medios de pago y
            mantenimiento del sistema.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm font-semibold text-zinc-900">🏗️ Si operas por tu cuenta (propio)</p>
          <p className="mt-2 text-sm leading-6">
            Debes elegir un software de gestión (CSMS) y definir qué funciones necesitas según tu
            negocio. El precio varía mucho por modelo comercial, volumen de cargadores y módulos.
          </p>
          <p className="text-sm leading-6">
            Aquí ganas más control y potencial de margen, pero asumes más decisiones técnicas y
            operativas.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">🧩 Funcionalidades que puede incluir un CSMS</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Monitoreo en tiempo real (online/offline, alarmas, fallos, reinicios remotos).</li>
          <li>Facturación y cobros (tarifas por kWh, tiempo, sesión, mínimos y promociones).</li>
          <li>Reservas de punto y gestión de colas.</li>
          <li>Disponibilidad pública y control de acceso por usuarios/grupos.</li>
          <li>Reportes operativos y financieros por estación, punto, período y ubicación.</li>
          <li>Auto-reimbursement para flota interna o empleados (reintegros automáticos).</li>
          <li>Gestión de precios por franja horaria o perfil de cliente.</li>
          <li>Integraciones contables/ERP y exportación de datos.</li>
          <li>Gestión de tickets y SLA de soporte.</li>
          <li>Control de firmware y configuración remota de cargadores.</li>
        </ul>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-900">🎨 White label vs hecho a medida</p>
          <p className="mt-2 text-sm leading-6">
            <span className="font-medium">White label:</span> usas una plataforma existente con tu
            marca, más rápida de lanzar y con menor riesgo de desarrollo.
          </p>
          <p className="text-sm leading-6">
            <span className="font-medium">A medida:</span> máximo control sobre UX, flujos y negocio,
            pero mayor costo inicial, más tiempo y necesidad de equipo técnico.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-sm font-semibold text-zinc-900">🌐 Roaming y visibilidad en otras apps</p>
          <p className="mt-2 text-sm leading-6">
            Si quieres que tus puntos aparezcan en plataformas externas, necesitas acuerdos e
            interoperabilidad (normalmente vía OCPI). Eso puede aumentar alcance y sesiones.
          </p>
          <p className="text-sm leading-6">
            También puede implicar costos de intermediación/comisiones, por lo que conviene modelar
            margen por sesión antes de activarlo.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">💰 Cómo evaluar costo total (sin tecnicismos)</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>CAPEX: implementación inicial, integraciones, hardware y puesta en marcha.</li>
          <li>OPEX: licencias, soporte, comisiones de pago, roaming y operación diaria.</li>
          <li>Costo oculto frecuente: dedicar horas internas para operar incidencias y liquidaciones.</li>
          <li>Criterio práctico: compara escenarios a 36 meses, no solo costo del primer año.</li>
        </ul>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-semibold text-zinc-900">🧭 Ruta recomendada para un comercio tradicional</p>
        <p className="mt-2 text-sm leading-6">1) Define tu objetivo principal: facturación o servicio al cliente.</p>
        <p className="text-sm leading-6">2) Decide nivel de involucramiento: operación propia o CPO.</p>
        <p className="text-sm leading-6">3) Selecciona 6-8 funciones realmente necesarias para fase 1.</p>
        <p className="text-sm leading-6">4) Evalúa roaming desde márgenes, no desde moda.</p>
        <p className="text-sm leading-6">5) Escala por etapas con métricas reales de uso y conversión.</p>
      </div>

    </div>
  );
}

function CommerceOwnershipRichContent() {
  return (
    <div className="mt-4 space-y-4 text-zinc-700">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm leading-6">
          Esta comparación resume, en lenguaje simple, qué cambia entre{" "}
          <span className="font-semibold">colaborar con un CPO</span> o montar un{" "}
          <span className="font-semibold">proyecto propio</span> en tu comercio.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <table className="min-w-full table-fixed text-left text-base">
          <colgroup>
            <col className="w-[40%]" />
            <col className="w-[30%]" />
            <col className="w-[30%]" />
          </colgroup>
          <thead className="bg-zinc-50 text-zinc-700">
            <tr>
              <th className="px-3 py-2 font-semibold"></th>
              <th className="border-l border-zinc-200 px-3 py-2 text-center font-semibold">
                🤝 Colaboración con un CPO
              </th>
              <th className="border-l border-zinc-200 px-3 py-2 text-center font-semibold">
                💰 Proyecto propio
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200">
            <tr>
              <td className="px-3 py-2">💸 Inversión inicial</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">Cero</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">Comercio</td>
            </tr>
            <tr>
              <td className="px-3 py-2">🛠️ Instalación y mantenimiento</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">CPO</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">CAPIRA</td>
            </tr>
            <tr>
              <td className="px-3 py-2">🏗️ Propiedad de la infraestructura</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">CPO</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">Comercio</td>
            </tr>
            <tr>
              <td className="px-3 py-2">⚡ Suministro de energía</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">CPO</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">Comercio</td>
            </tr>
            <tr>
              <td className="px-3 py-2">📄 Burocracia</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">CPO</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">Comercio / CAPIRA</td>
            </tr>
            <tr>
              <td className="px-3 py-2">📊 Gestión de la infraestructura</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">CPO</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">Comercio / CAPIRA</td>
            </tr>
            <tr>
              <td className="px-3 py-2">🙋 Atención al cliente</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">CPO</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">Comercio / CAPIRA</td>
            </tr>
            <tr>
              <td className="px-3 py-2">🧾 Facturación</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">CPO</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">Comercio / CAPIRA</td>
            </tr>
            <tr>
              <td className="px-3 py-2">📈 Ingresos</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">5-15% de la facturación</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">&gt;75% de la facturación</td>
            </tr>
            <tr>
              <td className="px-3 py-2">🗓️ Contrato</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">Mayor a 10 años</td>
              <td className="border-l border-zinc-200 px-3 py-2 text-center">Anual</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SolarIntegrationRichContent() {
  return (
    <div className="mt-4 space-y-4 text-zinc-700">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm leading-6">
          Sí, un coche eléctrico se puede integrar con solar para cargar en las horas de mayor
          generación y aprovechar excedentes de forma automática.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">☀️ Carga solar: dos estrategias típicas</p>
        <p className="mt-2 text-sm leading-6">
          <span className="font-medium">Modo excedente (100% solar):</span> la carga empieza cuando
          hay excedente suficiente. Maximiza autoconsumo y coste energético mínimo.
        </p>
        <p className="text-sm leading-6">
          <span className="font-medium">Modo mixto (solar + red):</span> combina excedente con red
          para no interrumpir la carga y ganar velocidad cuando la producción solar baja.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">⚙️ Qué necesitas para que funcione bien</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Cargador compatible con control energético.</li>
          <li>Medición de potencia en vivienda/instalación para conocer excedente en tiempo real.</li>
          <li>Configuración de límites para no superar potencia contratada.</li>
          <li>Programación horaria según tarifa y perfil de uso.</li>
        </ul>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-semibold text-zinc-900">📉 Qué limita la potencia real</p>
        <p className="mt-2 text-sm leading-6">
          La potencia real depende del mínimo entre: excedente solar disponible, límite del cargador,
          límite del coche (OBC en AC) y capacidad de la instalación.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">🔁 Integración con cargador bidireccional</p>
        <p className="mt-2 text-sm leading-6">
          Con carga bidireccional, el vehículo puede comportarse como almacenamiento energético:
          cargar en horas baratas o con solar, y entregar energía al hogar o a la red según
          estrategia y normativa aplicable.
        </p>
        <p className="text-sm leading-6">
          Esta funcionalidad depende de tres factores: compatibilidad del vehículo, cargador
          bidireccional y regulación local (V2H/V2G).
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">✅ Cómo asesoramos</p>
        <p className="mt-2 text-sm leading-6">
          Evaluamos producción solar, perfil de consumo, uso del coche, horas de conexión, potencia
          de instalación y esquema tarifario para definir la configuración óptima de carga y la
          potencia/tarifa eléctrica más conveniente.
        </p>
      </div>

    </div>
  );
}

function LoadManagementRichContent() {
  return (
    <div className="mt-4 space-y-4 text-zinc-700">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm leading-6">
          El <span className="font-semibold">load management</span> en depósitos de flota coordina
          potencia, horarios y prioridades para evitar sobrecargas, reducir costo y asegurar la
          salida operativa de cada vehículo.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">🎯 Objetivos de operación</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Que todos los vehículos críticos estén listos a la hora de salida.</li>
          <li>Evitar picos de demanda y penalizaciones de potencia.</li>
          <li>Usar energía más barata (ventanas horarias) cuando sea posible.</li>
          <li>Escalar la flota sin rehacer toda la infraestructura en cada fase.</li>
        </ul>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">Escenario 1: Carga secuencial por turnos</p>
        <p className="mt-2 text-sm leading-6">
          Se divide la noche en bloques y se activan grupos de cargadores por turnos. Es simple y
          efectivo cuando los horarios son bastante repetitivos.
        </p>
        <Image
          src="/images/load-management/escenario-1-secuencial.svg"
          alt="Esquema de carga secuencial por turnos"
          width={1200}
          height={520}
          className="mt-3 h-auto w-full rounded-lg border border-zinc-200"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">
          Escenario 2: Balance dinámico con límite de sitio
        </p>
        <p className="mt-2 text-sm leading-6">
          El sistema mide consumo total del depósito en tiempo real y ajusta automáticamente la
          potencia de carga para no superar el límite contratado.
        </p>
        <Image
          src="/images/load-management/escenario-2-balance-dinamico.svg"
          alt="Esquema de balance dinámico con límite de potencia del sitio"
          width={1200}
          height={520}
          className="mt-3 h-auto w-full rounded-lg border border-zinc-200"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">
          Escenario 3: Prioridades por hora de salida y SOC objetivo
        </p>
        <p className="mt-2 text-sm leading-6">
          Cada vehículo recibe potencia según prioridad operativa (hora de salida), energía faltante
          y estado de carga (SOC). Es el enfoque más robusto para flotas mixtas.
        </p>
        <Image
          src="/images/load-management/escenario-3-prioridades.svg"
          alt="Esquema de priorización de carga por hora de salida y SOC objetivo"
          width={1200}
          height={520}
          className="mt-3 h-auto w-full rounded-lg border border-zinc-200"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-semibold text-zinc-900">📌 Variables que gobiernan el diseño</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Potencia disponible del sitio y perfil de demanda no-EV.</li>
          <li>Cantidad de vehículos, batería útil y consumo por ruta.</li>
          <li>Ventana real de conexión (no solo horario teórico).</li>
          <li>Potencia AC/DC por punto y límites del vehículo.</li>
          <li>Tarifa eléctrica (punta/valle), término de potencia y penalizaciones.</li>
        </ul>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">✅ Enfoque de implementación</p>
        <p className="mt-2 text-sm leading-6">
          Definimos una política de carga por fases (inicio, crecimiento y madurez), simulamos
          restricciones de potencia y validamos que la operación cumpla con salida garantizada y
          costo energético controlado.
        </p>
      </div>
    </div>
  );
}

function LoadCapexRichContent() {
  return (
    <div className="mt-4 space-y-4 text-zinc-700">
      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm leading-6">
          En depósitos de flota hay un gran número de variables que afectan el costo total de
          operación. En este caso, analizamos en profundidad tres de las más importantes, que se
          afectan entre sí: <span className="font-semibold">potencia instalada</span> (CAPEX),{" "}
          <span className="font-semibold">precio horario de energía</span> (OPEX) y{" "}
          <span className="font-semibold">cantidad de vehículos cargando en simultáneo</span>.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">Escenario base (problema)</p>
        <p className="mt-2 text-sm leading-6">
          Cuando muchos vehículos llegan juntos y cargan a la vez, el depósito concentra picos de
          demanda justo en ventanas de energía más cara. Eso empuja simultáneamente CAPEX y OPEX.
        </p>
        <Image
          src="/images/load-management/custom/escenario-base-v3.svg"
          alt="Escenario base del depósito con alta simultaneidad de carga"
          width={1200}
          height={560}
          className="mt-3 h-auto w-full rounded-lg border border-zinc-200"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">Solución 1: Load balancing</p>
        <p className="mt-2 text-sm leading-6">
          Reparte la potencia en tiempo real entre cargadores para limitar el pico de sitio y bajar
          la potencia de conexión necesaria. En el ejemplo del material, el requerimiento se reduce
          aproximadamente de <span className="font-semibold">4,6 MW a 1,72 MW</span>.
        </p>
        <Image
          src="/images/load-management/custom/load-balancing.svg"
          alt="Ejemplo de load balancing y reducción de potencia de conexión"
          width={1200}
          height={560}
          className="mt-3 h-auto w-full rounded-lg border border-zinc-200"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">Solución 2: Load shifting</p>
        <p className="mt-2 text-sm leading-6">
          Desplaza carga desde horas caras hacia horas valle sin comprometer la salida de la flota,
          reduciendo el componente energético de la operación.
        </p>
        <Image
          src="/images/load-management/custom/load-shifting.svg"
          alt="Ejemplo de load shifting para mover consumo a horas de menor coste"
          width={1200}
          height={560}
          className="mt-3 h-auto w-full rounded-lg border border-zinc-200"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <p className="text-sm font-semibold text-zinc-900">🧮 Marco de optimización</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6">
          <li>Si aumentas simultaneidad, sube potencia requerida y tiende a subir CAPEX.</li>
          <li>Si desplazas carga a valle, baja OPEX energético.</li>
          <li>Si recortas picos con balance dinámico, reduces coste de conexión y riesgos operativos.</li>
          <li>
            El punto óptimo es cumplir salidas de flota con el menor costo total (infraestructura +
            energía + operación).
          </li>
        </ul>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-4">
        <p className="text-sm font-semibold text-zinc-900">✅ Cómo lo aplicamos</p>
        <p className="mt-2 text-sm leading-6">
          Modelamos perfiles de llegada/salida, energía por ruta y límites de sitio; luego definimos
          política de balanceo y desplazamiento horario para minimizar CAPEX por potencia instalada y
          OPEX por precio de energía, garantizando la disponibilidad diaria de la flota.
        </p>
      </div>
    </div>
  );
}

export default function ResourceRows() {
  const [openItem, setOpenItem] = useState<ResourceItem | null>(null);
  const [wheelIndexByRow, setWheelIndexByRow] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!openItem) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [openItem]);

  function stepRow(rowKey: string, direction: MotionDirection) {
    const row = rows.find((r) => r.key === rowKey);
    if (!row || row.items.length <= 3) return;

    setWheelIndexByRow((prev) => {
      const current = prev[rowKey] ?? 0;
      const delta = direction === "right" ? 1 : -1;
      const next = (current + delta + row.items.length) % row.items.length;
      return { ...prev, [rowKey]: next };
    });
  }

function getVisibleItems(row: ResourceRow) {
    if (row.items.length <= 3) return row.items;
    const start = wheelIndexByRow[row.key] ?? 0;
    return Array.from({ length: 3 }, (_, i) => row.items[(start + i) % row.items.length]);
  }

  return (
    <>
      <div className="space-y-8">
        {rows.map((row) => (
          <section
            id={row.key}
            key={row.key}
            className="scroll-mt-24 rounded-3xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-900">{row.label}</h2>
            </div>

            <div className="grid gap-3 md:hidden">
              {row.items.map((item) => (
                <ResourceCard key={item.title} item={item} onOpen={setOpenItem} />
              ))}
            </div>

            <div className="hidden items-stretch gap-3 md:flex">
              <div className="relative flex w-full items-stretch gap-3 overflow-hidden rounded-2xl">
                {getVisibleItems(row).map((item, idx) => (
                  <div key={`${row.key}-${idx}-${item.title}`} className="min-w-0 flex-1">
                    <ResourceCard item={item} onOpen={setOpenItem} />
                  </div>
                ))}

                {row.items.length > 3 ? (
                  <button
                    type="button"
                    aria-label={`Mover ${row.label} a la izquierda`}
                    onClick={() => stepRow(row.key, "left")}
                    className="absolute bottom-0 left-0 top-0 z-10 w-14 bg-gradient-to-r from-zinc-50 via-zinc-50/90 to-transparent text-zinc-400 transition hover:text-zinc-900"
                  >
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xl">&lsaquo;</span>
                  </button>
                ) : null}

                {row.items.length > 3 ? (
                  <button
                    type="button"
                    aria-label={`Mover ${row.label} a la derecha`}
                    onClick={() => stepRow(row.key, "right")}
                    className="absolute bottom-0 right-0 top-0 z-10 w-14 bg-gradient-to-l from-zinc-50 via-zinc-50/90 to-transparent text-zinc-400 transition hover:text-zinc-900"
                  >
                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xl">&rsaquo;</span>
                  </button>
                ) : null}
              </div>
            </div>
          </section>
        ))}
      </div>

      {openItem ? (
        <div
          className="fixed inset-0 z-50 overflow-y-auto bg-zinc-900/55 p-4"
          onClick={() => setOpenItem(null)}
        >
          <div
            className="mx-auto my-6 w-full max-w-4xl rounded-3xl border border-zinc-200 bg-white p-6 shadow-xl sm:my-10 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-xl font-semibold tracking-tight text-zinc-900">
                {openItem.emoji} {openItem.title}
              </h3>
              <button
                type="button"
                onClick={() => setOpenItem(null)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-zinc-300 text-zinc-700 transition hover:bg-zinc-100"
                aria-label="Cerrar"
              >
                x
              </button>
            </div>

            {openItem.detailedView === "tco" ? (
              <TcoRichContent />
            ) : openItem.detailedView === "power" ? (
              <PowerRichContent />
            ) : openItem.detailedView === "commerce-chargers" ? (
              <CommerceChargersRichContent />
            ) : openItem.detailedView === "commerce-management" ? (
              <CommerceManagementRichContent />
            ) : openItem.detailedView === "commerce-ownership" ? (
              <CommerceOwnershipRichContent />
            ) : openItem.detailedView === "ev-basics" ? (
              <EvBasicsRichContent />
            ) : openItem.detailedView === "subsidies" ? (
              <SubsidiesRichContent />
            ) : openItem.detailedView === "community-garage" ? (
              <CommunityGarageRichContent />
            ) : openItem.detailedView === "power-contract" ? (
              <PowerContractRichContent />
            ) : openItem.detailedView === "solar-integration" ? (
              <SolarIntegrationRichContent />
            ) : openItem.detailedView === "load-management" ? (
              <LoadManagementRichContent />
            ) : openItem.detailedView === "load-capex" ? (
              <LoadCapexRichContent />
            ) : (
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-zinc-600">
                {openItem.description}
              </p>
            )}
            {openItem.diagramSrc ? (
              <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <Image
                  src={openItem.diagramSrc}
                  alt={openItem.diagramAlt ?? "Esquema"}
                  width={1200}
                  height={420}
                  className="h-auto w-full"
                />
              </div>
            ) : null}
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setOpenItem(null)}
                className="inline-flex items-center rounded-md bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-zinc-800"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
