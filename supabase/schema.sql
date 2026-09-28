-- Run this once in your Supabase project's SQL editor.

create extension if not exists "pgcrypto";

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  area text not null,
  type text not null,
  price integer not null,
  description text not null,
  contact text not null,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists listing_photos (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references listings(id) on delete cascade,
  url text not null,
  sort_order integer not null default 0
);

-- Row Level Security
alter table listings enable row level security;
alter table listing_photos enable row level security;

-- MVP policies: anyone can read and add listings/photos.
-- This is intentionally open so a stranger can list a room without an
-- account. Before a public launch, tighten "insert" (e.g. require auth,
-- or route new listings into a moderation queue) — this is the same
-- gap the verification feature is meant to eventually close.
create policy "Public read listings" on listings for select using (true);
create policy "Public insert listings" on listings for insert with check (true);

create policy "Public read photos" on listing_photos for select using (true);
create policy "Public insert photos" on listing_photos for insert with check (true);

-- Storage bucket for listing photos (public read, public upload — same
-- caveat as above applies here).
insert into storage.buckets (id, name, public)
values ('listing-photos', 'listing-photos', true)
on conflict (id) do nothing;

create policy "Public read listing photos bucket"
on storage.objects for select
using (bucket_id = 'listing-photos');

create policy "Public upload listing photos bucket"
on storage.objects for insert
with check (bucket_id = 'listing-photos');

-- Optional: seed a few sample rows so the app isn't empty on first run.
insert into listings (title, area, type, price, description, contact, verified) values
  ('Backroom near Dobsonville Mall', 'Dobsonville', 'Backroom', 1400, 'Private entrance, shared yard, 5 min walk to taxi rank.', '082 000 0001', true),
  ('Shared room, female only', 'Orlando East', 'Shared room', 1100, 'Two beds, close to Orlando Stadium, own key.', '073 000 0002', false),
  ('1-bedroom cottage, Diepkloof Ext 9', 'Diepkloof', 'Cottage', 3200, 'Self-contained, own kitchenette, small garden.', '084 000 0003', true);
