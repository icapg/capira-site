// Datos de matriculaciones de vehículos eléctricos en España
// Fuente: AEDIVE (via scraper automatizado del dashboard Power BI)
// Última actualización: 2026-04-10

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
  { año: 2009, bev: 3,     phev: 0    },
  { año: 2010, bev: 69,    phev: 0    },
  { año: 2011, bev: 1159,  phev: 49   },
  { año: 2012, bev: 3250,  phev: 91   },
  { año: 2013, bev: 2426,  phev: 94   },
  { año: 2014, bev: 2525,  phev: 332  },
  { año: 2015, bev: 2992,  phev: 766  },
  { año: 2016, bev: 4653,  phev: 1527 },
  { año: 2017, bev: 9671,  phev: 3350 },
  { año: 2018, bev: 15495, phev: 3435 },
  { año: 2019, bev: 24269, phev: 7467 },
];

// Datos reales con desglose mensual desde 2020 — fuente: AEDIVE Power BI (Evolución por Años)
export const matriculacionesPorAño: YearData[] = [
  {
    año: 2020,
    meses: [
      { mes: "Ene", bev: 2844, phev: 1468 },
      { mes: "Feb", bev: 3145, phev: 1211 },
      { mes: "Mar", bev: 2083, phev: 630  },
      { mes: "Abr", bev: 414,  phev: 61   },
      { mes: "May", bev: 2161, phev: 748  },
      { mes: "Jun", bev: 1890, phev: 1452 },
      { mes: "Jul", bev: 4567, phev: 2394 },
      { mes: "Ago", bev: 3460, phev: 1333 },
      { mes: "Sep", bev: 3391, phev: 1968 },
      { mes: "Oct", bev: 2962, phev: 2517 },
      { mes: "Nov", bev: 2717, phev: 3039 },
      { mes: "Dic", bev: 5411, phev: 6762 },
    ],
  },
  {
    año: 2021,
    meses: [
      { mes: "Ene", bev: 1029, phev: 1440 },
      { mes: "Feb", bev: 1650, phev: 2158 },
      { mes: "Mar", bev: 3414, phev: 3562 },
      { mes: "Abr", bev: 2897, phev: 3081 },
      { mes: "May", bev: 3116, phev: 4464 },
      { mes: "Jun", bev: 4545, phev: 4472 },
      { mes: "Jul", bev: 2965, phev: 4045 },
      { mes: "Ago", bev: 2319, phev: 2699 },
      { mes: "Sep", bev: 4181, phev: 3955 },
      { mes: "Oct", bev: 3666, phev: 4221 },
      { mes: "Nov", bev: 4528, phev: 4401 },
      { mes: "Dic", bev: 5365, phev: 4826 },
    ],
  },
  {
    año: 2022,
    meses: [
      { mes: "Ene", bev: 3584, phev: 3223 },
      { mes: "Feb", bev: 3954, phev: 3978 },
      { mes: "Mar", bev: 5051, phev: 3373 },
      { mes: "Abr", bev: 3544, phev: 4389 },
      { mes: "May", bev: 3644, phev: 4833 },
      { mes: "Jun", bev: 5204, phev: 4296 },
      { mes: "Jul", bev: 4110, phev: 3661 },
      { mes: "Ago", bev: 2988, phev: 2780 },
      { mes: "Sep", bev: 4984, phev: 4190 },
      { mes: "Oct", bev: 4491, phev: 3999 },
      { mes: "Nov", bev: 5267, phev: 4833 },
      { mes: "Dic", bev: 5403, phev: 4646 },
    ],
  },
  {
    año: 2023,
    meses: [
      { mes: "Ene", bev: 4742, phev: 4116 },
      { mes: "Feb", bev: 5108, phev: 4833 },
      { mes: "Mar", bev: 6508, phev: 5991 },
      { mes: "Abr", bev: 5316, phev: 4349 },
      { mes: "May", bev: 7082, phev: 6063 },
      { mes: "Jun", bev: 7686, phev: 6532 },
      { mes: "Jul", bev: 5614, phev: 5217 },
      { mes: "Ago", bev: 5300, phev: 3387 },
      { mes: "Sep", bev: 5638, phev: 4950 },
      { mes: "Oct", bev: 7540, phev: 5076 },
      { mes: "Nov", bev: 8213, phev: 5672 },
      { mes: "Dic", bev: 7600, phev: 6652 },
    ],
  },
  {
    año: 2024,
    meses: [
      { mes: "Ene", bev: 4531, phev: 4598 },
      { mes: "Feb", bev: 4971, phev: 5601 },
      { mes: "Mar", bev: 5583, phev: 5665 },
      { mes: "Abr", bev: 5380, phev: 5150 },
      { mes: "May", bev: 6004, phev: 4890 },
      { mes: "Jun", bev: 6803, phev: 5447 },
      { mes: "Jul", bev: 5491, phev: 4471 },
      { mes: "Ago", bev: 3771, phev: 3041 },
      { mes: "Sep", bev: 7442, phev: 4136 },
      { mes: "Oct", bev: 6186, phev: 5252 },
      { mes: "Nov", bev: 7056, phev: 4966 },
      { mes: "Dic", bev: 10743, phev: 6521 },
    ],
  },
  {
    año: 2025,
    meses: [
      { mes: "Ene", bev: 6614,  phev: 5438  },
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
