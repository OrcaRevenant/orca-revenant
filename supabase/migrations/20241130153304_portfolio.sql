create table public.connections (
    "name" text not null primary key,
    "title" varchar(250) not null,
    "type" text not null check (type in ('CEX', 'DEX')),
    "logo" text null check (logo ~ '^https?://.*$'),
    "description" text null,
    "enabled" boolean not null default false,
    "created_at" timestamp with time zone not null default now()
);