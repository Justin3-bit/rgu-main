-- ============================================================
-- GLH — Helper RPC Functions
-- Run this AFTER schema.sql in: Supabase Dashboard → SQL Editor
-- ============================================================

-- Safely decrements product stock without going below zero
create or replace function public.decrement_stock(p_id int, qty int)
returns void language plpgsql security definer as $$
begin
  update public.products
  set stock = greatest(0, stock - qty)
  where id = p_id;
end;
$$;

-- Grant execute to authenticated users
grant execute on function public.decrement_stock(int, int) to authenticated;
