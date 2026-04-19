-- Tabla de automatizaciones sociales
-- Ejecutar una vez en el SQL editor de Supabase:
-- https://supabase.com/dashboard/project/jspbiyerpkpslfvksvqc/sql/new

create table if not exists public.social_automations (
  id               uuid primary key default gen_random_uuid(),
  nombre           text        not null,
  descripcion      text,
  trigger_type     text        not null default 'day-15-monthly',
  tipos            jsonb       not null default '[]'::jsonb,
  plataformas      text[]      not null default '{linkedin,instagram,twitter}',
  activa           boolean     not null default true,
  ultima_ejecucion timestamptz,
  ultimo_periodo   text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Trigger para mantener updated_at
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_updated_at on public.social_automations;
create trigger set_updated_at
  before update on public.social_automations
  for each row execute function public.set_updated_at();

-- Seed inicial
insert into public.social_automations (nombre, descripcion, tipos, plataformas)
select
  'Bundle mensual DGT',
  'Genera Matriculaciones, Bajas y Parque activo del último mes publicado por DGT.',
  '[
    {"typeId": "matriculaciones-mes", "filters": {"tec":"ambos","tiposVehiculo":["todos"],"fuente":"dgt"}},
    {"typeId": "bajas-mes",           "filters": {"tec":"ambos","tiposVehiculo":["todos"],"fuente":"dgt"}},
    {"typeId": "parque-activo",       "filters": {"tec":"ambos","tiposVehiculo":["todos"],"fuente":"dgt"}}
  ]'::jsonb,
  '{linkedin,instagram,twitter}'
where not exists (select 1 from public.social_automations);
