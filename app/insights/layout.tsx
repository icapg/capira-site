import type { Metadata } from "next";
import { InsightsNav } from "./InsightsNav";
import { InsightsProvider } from "./InsightsContext";

export const metadata: Metadata = {
  title: {
    default: "eMobility Insights",
    template: "%s | eMobility Insights by Capira",
  },
  description:
    "Dashboard de movilidad eléctrica en España. Matriculaciones, infraestructura de carga y análisis de mercado.",
};

export default function InsightsLayout({ children }: { children: React.ReactNode }) {
  return (
    <InsightsProvider>
      <div className="min-h-screen" style={{ background: "#06090f", color: "#f4f4f5" }}>
        <InsightsNav />
        {children}
      </div>
    </InsightsProvider>
  );
}
