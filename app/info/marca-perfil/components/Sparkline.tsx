"use client";

import { useId } from "react";

type Props = {
  values: number[];
  color?: string;
  width?: number;
  height?: number;
  /** Rellenar área bajo la curva. Default true. */
  fill?: boolean;
  /** Ancho del trazo en px. Default 1.4. */
  strokeWidth?: number;
  /** Etiqueta ARIA. */
  label?: string;
};

/**
 * Sparkline minimalista con SVG puro — sin librerías.
 * Renderiza una polilínea escalada al rango de los valores,
 * con opcional área bajo la curva. Robusto a arrays vacíos o uniformes.
 */
export function Sparkline({
  values,
  color = "#38bdf8",
  width = 80,
  height = 24,
  fill = true,
  strokeWidth = 1.4,
  label,
}: Props) {
  const gradId = useId();

  if (!values.length) {
    return <div style={{ width, height }} aria-label={label} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = values.length > 1 ? width / (values.length - 1) : 0;

  const points = values.map((v, i) => {
    const x = i * step;
    const y = height - ((v - min) / range) * height;
    return [x, y] as const;
  });

  const linePath = points.map(([x, y], i) => (i === 0 ? `M${x},${y}` : `L${x},${y}`)).join(" ");
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      aria-label={label}
      role="img"
      style={{ display: "block", overflow: "visible" }}
    >
      {fill && (
        <>
          <defs>
            <linearGradient id={gradId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%"  stopColor={color} stopOpacity="0.45" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill={`url(#${gradId})`} stroke="none" />
        </>
      )}
      <path d={linePath} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
