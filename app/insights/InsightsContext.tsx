"use client";

import { createContext, useContext, useState } from "react";

export type Fuente = "aedive" | "dgt" | "anfac";

export const FUENTE_OPTIONS: { value: Fuente; label: string; color: string }[] = [
  { value: "aedive", label: "AEDIVE", color: "#38bdf8" },
  { value: "dgt",    label: "DGT",    color: "#34d399" },
  { value: "anfac",  label: "ANFAC",  color: "#fb923c" },
];

interface InsightsCtx {
  fuente: Fuente;
  setFuente: (f: Fuente) => void;
  isAdmin: boolean;
}

const InsightsContext = createContext<InsightsCtx>({ fuente: "dgt", setFuente: () => {}, isAdmin: false });

export function InsightsProvider({ children, isAdmin }: { children: React.ReactNode; isAdmin: boolean }) {
  const [fuente, setFuente] = useState<Fuente>("dgt");
  return (
    <InsightsContext.Provider value={{ fuente, setFuente, isAdmin }}>
      {children}
    </InsightsContext.Provider>
  );
}

export function useInsights() {
  return useContext(InsightsContext);
}
