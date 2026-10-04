-- Reversion conservadora: se detiene si existen aperturas cero.
do $$
begin
  if exists (
    select 1 from public.vacaciones_movimientos
    where tipo = 'apertura' and dias = 0
  ) then
    raise exception 'Rollback detenido: existen aperturas cero certificadas; conservar datos e historial.';
  end if;
end $$;
alter table public.vacaciones_movimientos
  drop constraint vacaciones_movimientos_signo;
alter table public.vacaciones_movimientos
  add constraint vacaciones_movimientos_signo check (
    (tipo in ('apertura','devengo','devolucion','ajuste','arrastre') and dias <> 0)
    or (tipo = 'consumo' and dias < 0)
  );

