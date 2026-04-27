// Datos de matriculaciones de vehículos eléctricos en España
// Fuente: AEDIVE (via scraper automatizado del dashboard Power BI)
// Última actualización: 2026-04-27

export type MonthlyData = {
  mes: string;
  bev: number;   // Battery Electric Vehicle
  phev: number;  // Plug-in Hybrid Electric Vehicle
};

export type YearData = {
  año: number;
  meses: MonthlyData[];
  parcial?: boolean;  // true si el año no está completo todavía
};

// Totales anuales 2009–2019 — fuente: AEDIVE Power BI (Evolución Histórica)
// Sin desglose mensual disponible en AEDIVE para estos años
export type HistoricalAnualEntry = {
  año: number;
  bev: number;
  phev: number;
};

export const historicoPre2020: HistoricalAnualEntry[] = [
  {
    año: 2025,
    meses: [
      { mes: "Ene", bev: 6614, phev: 5438 },
      { mes: "Feb", bev: 7463, phev: 7085 },
      { mes: "Mar", bev: 9719, phev: 8586 },
      { mes: "Abr", bev: 8667, phev: 9648 },
      { mes: "May", bev: 10723, phev: 13649 },
      { mes: "Jun", bev: 13877, phev: 14244 },
      { mes: "Jul", bev: 10951, phev: 12901 },
      { mes: "Ago", bev: 8326, phev: 8310 },
      { mes: "Sep", bev: 11913, phev: 10868 },
      { mes: "Oct", bev: 11349, phev: 13378 },
      { mes: "Nov", bev: 11897, phev: 12521 },
      { mes: "Dic", bev: 13197, phev: 13459 },
    ],
  },
      { mes: "Feb", bev: 7463,  phev: 7085  },
      { mes: "Mar", bev: 9719,  phev: 8586  },
      { mes: "Abr", bev: 8667,  phev: 9648  },
      { mes: "May", bev: 10723, phev: 13649 },
      { mes: "Jun", bev: 13877, phev: 14244 },
      { mes: "Jul", bev: 10951, phev: 12901 },
      { mes: "Ago", bev: 8326,  phev: 8310  },
      { mes: "Sep", bev: 11913, phev: 10868 },
      { mes: "Oct", bev: 11349, phev: 13378 },
      { mes: "Nov", bev: 11897, phev: 12521 },
      { mes: "Dic", bev: 13197, phev: 13459 },
    ],
  },
  {
    año: 2026,
    parcial: true,
    meses: [
      { mes: "Ene", bev: 7811,  phev: 9193  },
      { mes: "Feb", bev: 10803, phev: 12666 },
    ],
  },
];

export function getTotalAnual(year: YearData) {
  return {
    bev: year.meses.reduce((s, m) => s + m.bev, 0),
    phev: year.meses.reduce((s, m) => s + m.phev, 0),
  };
}

export type Stats = {
  año: number;
  totalBev: number;
  totalPhev: number;
  totalElectricos: number;
  cuotaMercado: number;
  variacionBevYoY: number;
};

// Stats 2025 — fuente AEDIVE
// BEV 2025: 124.696 | PHEV 2025: 130.087 | Total: 254.783
// Variación BEV vs 2024: +68,6% (2024 BEV: 73.961)
export const stats: Stats = {
  año: 2025,
  totalBev: 124696,
  totalPhev: 130087,
  totalElectricos: 254783,
  cuotaMercado: 19.8,
  variacionBevYoY: +68.6,
};
