CREATE EXTENSION IF NOT EXISTS timescaledb with schema extensions;
create table public.price (
    "asset" text not null references public.asset("symbol") on delete cascade,
    "price" numeric not null check (price >= 0),
    "time" timestamp with time zone not null default now(),
    primary key ("time", "asset")
);
SELECT create_hypertable('public.price', 'time');
create unique index unique_asset_time on public.price(asset, time);
alter table "public"."price" enable row level security;
revoke
update,
    delete on table "public"."price"
from anon,
    authenticated;
create policy "Prices are viewable for everyone" on public.price for
select using (true);