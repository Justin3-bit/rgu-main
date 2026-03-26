-- ============================================================
-- GLH Co-operative Farms — Supabase Schema
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- ── Extensions ──────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── 1. Farmers (no dependencies) ────────────────────────────
create table if not exists public.farmers (
  id             serial primary key,
  name           text not null,
  region         text not null,
  bio            text,
  hectares       numeric,
  joined_year    int,
  photo_initials text,
  crops          text[],
  created_at     timestamptz not null default now()
);

-- ── 2. Profiles (references auth.users + farmers) ───────────
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  phone       text,
  address     text,
  city        text,
  postcode    text,
  role        text not null default 'customer' check (role in ('customer', 'producer')),
  farmer_id   int references public.farmers(id),
  created_at  timestamptz not null default now()
);

-- ── 3. Products (references farmers) ────────────────────────
create table if not exists public.products (
  id          serial primary key,
  farmer_id   int not null references public.farmers(id) on delete cascade,
  name        text not null,
  description text,
  category    text not null,
  price       numeric(10,2) not null,
  unit        text not null default 'kg',
  stock       int not null default 0,
  emoji       text default '🌿',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ── 4. Orders (references auth.users) ───────────────────────
create table if not exists public.orders (
  id            text primary key default ('ORD-' || upper(substring(gen_random_uuid()::text, 1, 8))),
  customer_id   uuid not null references auth.users(id),
  customer_name text not null,
  address       text not null,
  city          text not null,
  postcode      text not null,
  phone         text,
  notes         text,
  status        text not null default 'Processing' check (status in ('Processing','Shipped','Delivered','Cancelled')),
  total         numeric(10,2) not null default 0,
  created_at    timestamptz not null default now()
);

-- ── 5. Order Items (references orders + products + farmers) ─
create table if not exists public.order_items (
  id          serial primary key,
  order_id    text not null references public.orders(id) on delete cascade,
  product_id  int not null references public.products(id),
  farmer_id   int not null references public.farmers(id),
  qty         int not null check (qty > 0),
  unit_price  numeric(10,2) not null
);

-- ── Row Level Security ───────────────────────────────────────
alter table public.farmers     enable row level security;
alter table public.profiles    enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- Farmers: public read, producers update their own record
create policy "farmers: public read"
  on public.farmers for select using (true);

create policy "farmers: producer update"
  on public.farmers for update
  using (id = (select farmer_id from public.profiles where id = auth.uid()));

-- Profiles: users manage only their own row
create policy "profiles: own read"
  on public.profiles for select using (auth.uid() = id);

create policy "profiles: own insert"
  on public.profiles for insert with check (auth.uid() = id);

create policy "profiles: own update"
  on public.profiles for update using (auth.uid() = id);

-- Products: public read of active products; producers manage their own
create policy "products: public read"
  on public.products for select using (active = true);

create policy "products: producer insert"
  on public.products for insert
  with check (farmer_id = (select farmer_id from public.profiles where id = auth.uid()));

create policy "products: producer update"
  on public.products for update
  using (farmer_id = (select farmer_id from public.profiles where id = auth.uid()));

-- Orders: customers see/create their own
create policy "orders: customer read"
  on public.orders for select using (auth.uid() = customer_id);

create policy "orders: customer insert"
  on public.orders for insert with check (auth.uid() = customer_id);

-- Producers see orders that contain their produce
create policy "orders: producer read"
  on public.orders for select
  using (
    id in (
      select distinct oi.order_id
      from public.order_items oi
      where oi.farmer_id = (select farmer_id from public.profiles where id = auth.uid())
    )
  );

-- Producers can update status on those orders
create policy "orders: producer update"
  on public.orders for update
  using (
    id in (
      select distinct oi.order_id
      from public.order_items oi
      where oi.farmer_id = (select farmer_id from public.profiles where id = auth.uid())
    )
  );

-- Order items: customers read their own; producers read theirs; customers insert
create policy "order_items: customer read"
  on public.order_items for select
  using (order_id in (select id from public.orders where customer_id = auth.uid()));

create policy "order_items: producer read"
  on public.order_items for select
  using (farmer_id = (select farmer_id from public.profiles where id = auth.uid()));

create policy "order_items: customer insert"
  on public.order_items for insert
  with check (order_id in (select id from public.orders where customer_id = auth.uid()));

-- ── Trigger: auto-create profile row on signup ───────────────
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── Seed Data ────────────────────────────────────────────────
insert into public.farmers (name, region, bio, hectares, joined_year, photo_initials, crops) values
  ('James Hartley', 'Yorkshire',          'Third-generation arable farmer from the Yorkshire Dales with 18 years of sustainable grain growing.', 120, 2019, 'JH', array['Wheat','Barley','Potatoes']),
  ('Priya Patel',   'Kent',               'Pioneer of organic greenhouse vegetable farming in the Garden of England.',                            28,  2020, 'PP', array['Tomatoes','Courgettes','Peppers']),
  ('Fiona MacLeod', 'Scottish Highlands', 'Award-winning soft fruit and vegetable grower supplying premium quality Scottish produce.',             45,  2018, 'FM', array['Raspberries','Strawberries','Kale']),
  ('Owen Davies',   'Pembrokeshire',      'Advocate for regenerative farming practices across the Welsh countryside.',                             80,  2021, 'OD', array['Leeks','Carrots','Oats'])
on conflict do nothing;

insert into public.products (farmer_id, name, description, category, price, unit, stock, emoji) values
  (1, 'Milling Wheat',        'Premium Grade 1 milling wheat, low moisture, ideal for bread flour.',          'Grains',     4.20, 'kg',     850, '🌾'),
  (1, 'Rooster Potatoes',     'Firm, floury Rooster potatoes — perfect for roasting or mashing.',             'Vegetables', 1.80, 'kg',     620, '🥔'),
  (1, 'Pearl Barley',         'Hulled and polished pearl barley, great for soups, stews and risottos.',       'Grains',     2.90, 'kg',     480, '🌰'),
  (2, 'Vine Tomatoes',        'Greenhouse-grown vine tomatoes, pesticide-free and full of flavour.',          'Vegetables', 2.40, 'kg',      90, '🍅'),
  (2, 'Mixed Peppers',        'Red, yellow and orange peppers grown in poly-tunnels, no chemicals.',          'Vegetables', 3.10, 'kg',      55, '🫑'),
  (2, 'Courgettes',           'Tender courgettes harvested young for the best flavour and texture.',          'Vegetables', 2.20, 'kg',     110, '🥒'),
  (3, 'Scottish Raspberries', 'Hand-picked Scottish raspberries, intensely sweet with a short season.',       'Fruits',     3.50, 'punnet', 140, '🫐'),
  (3, 'Strawberries',         'Juicy Scottish strawberries — sweet, fragrant, and seasonally available.',     'Fruits',     3.20, 'punnet',  75, '🍓'),
  (3, 'Curly Kale',           'Fresh-cut Highland kale, tender leaves with a mild, earthy flavour.',          'Vegetables', 1.60, 'bag',    200, '🥬'),
  (4, 'Welsh Leeks',          'Traditional Welsh leeks — sweet and tender, grown in Pembrokeshire soil.',     'Vegetables', 1.20, 'bunch',  310, '🫛'),
  (4, 'Chantenay Carrots',    'Baby Chantenay carrots from Welsh fields, sweet and tender whole.',            'Vegetables', 1.50, 'kg',     430, '🥕'),
  (4, 'Rolled Oats',          'Stone-milled rolled oats from Pembrokeshire, great for porridge and baking.', 'Grains',     2.10, 'kg',     360, '🌾')
on conflict do nothing;


-- ── Add image_url column to products ────────────────────────
-- Run this if your products table already exists:
-- alter table public.products add column if not exists image_url text;
