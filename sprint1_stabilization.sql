-- Sprint 1 estabilizacion SYNCROSFERA
-- Idempotente. Revisar y ejecutar manualmente en Supabase SQL editor.
-- No activa RLS.

alter table public.incidencias
  add column if not exists area text,
  add column if not exists responsable_id text,
  add column if not exists responsable_nombre text,
  add column if not exists informado_responsable text,
  add column if not exists fecha_cierre text,
  add column if not exists cerrado_por_id text,
  add column if not exists cerrado_por_nombre text,
  add column if not exists tiempo_solucion_minutos integer,
  add column if not exists validado_por text,
  add column if not exists validado_ts text,
  add column if not exists comentario_cierre text,
  add column if not exists updated_at text;

alter table public.sala_cash_closures
  add column if not exists fondo_final numeric default 0,
  add column if not exists retiro_caja_fuerte numeric default 0;

-- Nota tecnica Caja Recepcion:
-- Sprint 1 no migra datos entre tablas. El codigo historico sigue leyendo/escribiendo
-- cash_closings en recepcion.js/index.html. La recomendacion funcional para Sprint 2
-- es consolidar en recepcion_cash como tabla principal porque contiene fondos:
-- fondo_recibido, fondo_traspasado, fondo_inicial_siguiente.
-- Si produccion ya usa recepcion_cash o recepcion_cash_closures, migrar con script
-- especifico y pruebas antes de cambiar endpoints en frontend.

-- Nota RLS:
-- RLS esta desactivado actualmente en tablas operativas. No se activa en Sprint 1
-- para evitar romper la app. Sprint 2 debe preparar policies y pruebas.
