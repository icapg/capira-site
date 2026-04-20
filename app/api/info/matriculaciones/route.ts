import { NextResponse } from "next/server";
import {
  matriculacionesPorAño,
  stats,
  getTotalAnual,
} from "../../../lib/insights/matriculaciones-data";

// GET /api/info/matriculaciones
// Devuelve datos de matriculaciones para los dashboards.
// TODO: reemplazar con fetch real a ANFAC/DGT cuando esté disponible.
export async function GET() {
  const totalesAnuales = matriculacionesPorAño.map((y) => ({
    año: y.año,
    ...getTotalAnual(y),
  }));

  return NextResponse.json({
    stats,
    porAño: matriculacionesPorAño,
    totalesAnuales,
    meta: {
      fuente: "ANFAC / DGT",
      actualizacion: "2025-03-01",
      nota: "Datos basados en informes públicos. Pendiente conexión a API oficial.",
    },
  });
}
