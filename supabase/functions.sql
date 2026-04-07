-- ============================================================
-- GLH — Helper RPC Functions
-- Run this AFTER schema.sql in: Supabase Dashboard → SQL Editor
-- ============================================================


-- ── decrement_stock RPC (used by checkout) ───────────────────
create or replace function public.decrement_stock(p_id int, qty int)
returns void as $$
begin
  update public.products
  set stock = stock - qty
  where id = p_id and stock >= qty;

  if not found then
    raise exception 'Insufficient stock for product %', p_id;
  end if;
end;
$$ language plpgsql;

-- Grant execute to authenticated users
grant execute on function public.decrement_stock(int, int) to authenticated;

-- ── Add image_url column to products ────────────────────────

alter table public.products add column if not exists image_url text;

-- Allow authenticated users to upload product images
create policy "authenticated users can upload product images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'product-images');

-- Allow public read of product images
create policy "product images are publicly readable"
on storage.objects for select
using (bucket_id = 'product-images');

-- Allow authenticated users to update/replace images
create policy "authenticated users can update product images"
on storage.objects for update
to authenticated
using (bucket_id = 'product-images');