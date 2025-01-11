CREATE EXTENSION IF NOT EXISTS timescaledb WITH SCHEMA extensions;
CREATE TABLE public.price (
    "asset" TEXT NOT NULL REFERENCES public.asset("symbol") ON DELETE CASCADE,
    "price" NUMERIC NOT NULL CHECK (price >= 0),
    "time" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    PRIMARY KEY ("time", "asset")
);
SELECT create_hypertable('public.price', 'time');
CREATE UNIQUE INDEX unique_asset_time ON public.price(asset, time);
ALTER TABLE public.price ENABLE ROW LEVEL SECURITY;
REVOKE
UPDATE,
    DELETE ON TABLE public.price
FROM anon,
    authenticated;
CREATE POLICY "Prices are viewable for everyone" ON public.price FOR
SELECT USING (true);