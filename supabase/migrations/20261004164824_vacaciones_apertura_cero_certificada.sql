-- Permitir aperturas certificadas de cero dias sin alterar consumos,
-- permisos, RLS ni el historial append-only.
alter table public.vacaciones_movimientos
  drop constraint vacaciones_movimientos_signo;
alter table public.vacaciones_movimientos
  add constraint vacaciones_movimientos_signo check (
    tipo = 'apertura'
    or (tipo in ('devengo', 'devolucion', 'ajuste', 'arrastre') and dias <> 0)
    or (tipo = 'consumo' and dias < 0)
  );

