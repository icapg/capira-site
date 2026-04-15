import type { Metadata } from "next";
import { cookies } from "next/headers";
import { InsightsNav } from "./InsightsNav";
import { InsightsFuente } from "./InsightsFuente";
import { InsightsProvider } from "./InsightsContext";

export const metadata: Metadata = {
  title: {
    default: "eMobility Insights",
    template: "%s | eMobility Insights by Capira",
  },
  description:
    "Dashboard de movilidad eléctrica en España. Matriculaciones, infraestructura de carga y análisis de mercado.",
};

export default async function InsightsLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get("insights_auth");
  const isAdmin = !!authCookie?.value && authCookie.value === process.env.ADMIN_TOKEN;

  return (
    <InsightsProvider isAdmin={isAdmin}>
      <div className="min-h-screen" style={{ background: "#06090f", color: "#f4f4f5" }}>
        <InsightsNav />
        <div style={{ flex: 1 }}>{children}</div>
        <InsightsFuente />
      </div>
    </InsightsProvider>
  );
}
