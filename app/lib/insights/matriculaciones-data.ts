// Tipos compartidos para datos de matriculaciones EV.
// Los datos reales vienen de DGT (dgt-bev-phev-data.ts) y ANFAC (anfac-data.ts).

export type MonthlyData = {
  mes: string;
  bev: number;   // Battery Electric Vehicle
  phev: number;  // Plug-in Hybrid Electric Vehicle
};

export type YearData = {
  año: number;
  meses: MonthlyData[];
  parcial?: boolean;
};
