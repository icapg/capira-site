"use client";

import { useEffect, useState } from "react";
import type { MarcaPerfil } from "./types";

/**
 * Fetch del perfil de una marca desde /data/marca-perfil/<slug>.json.
 * Cache en memoria compartida entre renders para evitar refetch al volver a la misma marca.
 */
const cache = new Map<string, MarcaPerfil>();
const pending = new Map<string, Promise<MarcaPerfil>>();
const errors  = new Map<string, string>();

async function fetchPerfil(slug: string): Promise<MarcaPerfil> {
  const cached = cache.get(slug);
  if (cached) return cached;
  const inFlight = pending.get(slug);
  if (inFlight) return inFlight;

  const p = (async () => {
    const res = await fetch(`/data/marca-perfil/${slug}.json`, { cache: "force-cache" });
    if (!res.ok) throw new Error(`Perfil no encontrado: ${slug} (${res.status})`);
    const json = (await res.json()) as MarcaPerfil;
    cache.set(slug, json);
    pending.delete(slug);
    return json;
  })();
  pending.set(slug, p);
  return p;
}

export function useMarcaData(slug: string | null) {
  const [, forceRender] = useState(0);

  useEffect(() => {
    if (!slug) return;
    if (cache.has(slug)) return;
    if (errors.has(slug)) return;
    let cancelled = false;
    fetchPerfil(slug)
      .then(() => { if (!cancelled) forceRender((x) => x + 1); })
      .catch((e: Error) => {
        if (cancelled) return;
        errors.set(slug, e.message);
        forceRender((x) => x + 1);
      });
    return () => { cancelled = true; };
  }, [slug]);

  const data  = slug ? cache.get(slug) ?? null : null;
  const error = slug ? errors.get(slug) ?? null : null;
  const loading = !!slug && !data && !error;

  return { data, loading, error };
}
