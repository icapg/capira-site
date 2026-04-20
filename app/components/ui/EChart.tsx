"use client";

import { useEffect, useRef } from "react";
import * as echarts from "echarts";
type EChartProps = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  option: Record<string, any>;
  style?: React.CSSProperties;
  className?: string;
  theme?: string;
};

export function EChart({ option, style, className, theme }: EChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chartRef.current = theme ? echarts.init(ref.current, theme) : echarts.init(ref.current);
    chartRef.current.setOption(option);

    const handleResize = () => chartRef.current?.resize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chartRef.current?.dispose();
    };
  }, []);

  useEffect(() => {
    chartRef.current?.setOption(option, { notMerge: true });
  }, [option]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ width: "100%", height: 380, ...style }}
    />
  );
}
