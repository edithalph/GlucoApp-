-- =============================================================================
-- GlucoApp — schéma initial
--
-- Convention : toute glycémie est stockée en mg/dL (numeric). La conversion
-- vers g/L ou mmol/L se fait côté application selon la préférence du profil.
-- =============================================================================

-- gen_random_uuid() fait partie du cœur de PostgreSQL depuis la v13 :
-- pgcrypto n'est pas nécessaire.
create extension if not exists unaccent with schema extensions;

-- `unaccent()` est déclarée STABLE (elle dépend d'un dictionnaire configurable),
-- donc inutilisable telle quelle dans une expression d'index — erreur 42P17.
-- On l'enveloppe dans une fonction IMMUTABLE, motif recommandé par Supabase.
create or replace function public.f_unaccent(txt text)
returns text
language sql
immutable
parallel safe
strict
set search_path = extensions, public, pg_temp
as $$
  select unaccent('unaccent', txt)
$$;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------
do $$ begin
  create type biological_sex as enum ('male', 'female');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type glucose_unit as enum ('g_l', 'mmol_l', 'mg_dl');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type medical_condition as enum (
  'type1',        -- Diabétique Type 1, insulinodépendant
  'type2',        -- Diabétique Type 2
  'prediabetic',  -- Prédiabétique
  'prevention',   -- En prévention
  'other'         -- Autre situation
);
exception when duplicate_object then null;
end $$;

do $$ begin
  create type reading_context as enum (
  'fasting',    -- À jeun
  'pre_meal',   -- Avant repas
  'post_meal',  -- Après repas
  'pre_tea',    -- Avant thé
  'post_tea',   -- Après thé
  'other'
);
exception when duplicate_object then null;
end $$;

do $$ begin
  create type risk_level as enum ('low', 'moderate', 'high');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type tea_kind as enum ('green', 'black', 'oolong', 'herbal', 'matcha', 'white', 'other');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type tea_session_status as enum ('active', 'completed', 'abandoned');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type article_category as enum ('glycemia', 'tea_therapy', 'low_gi_recipes', 'physical_activity', 'nutrition', 'cardiovascular');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type reminder_kind as enum ('glucose', 'tea', 'meal', 'custom');
exception when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- profiles — extension de auth.users
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                    uuid primary key references auth.users (id) on delete cascade,
  first_name            text,
  last_name             text,
  avatar_url            text,
  age                   integer check (age between 1 and 120),
  sex                   biological_sex,
  weight_kg             numeric(5, 2) check (weight_kg between 20 and 400),
  height_cm             numeric(5, 1) check (height_cm between 50 and 260),
  condition             medical_condition,
  preferred_unit        glucose_unit not null default 'g_l',
  -- Cible thérapeutique, en mg/dL. Défaut : 0,70–1,40 g/L.
  target_min_mgdl       numeric(6, 2) not null default 70,
  target_max_mgdl       numeric(6, 2) not null default 140,
  onboarding_completed  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint target_range_valid check (target_min_mgdl < target_max_mgdl)
);

comment on column public.profiles.target_min_mgdl is 'Borne basse de la zone cible, en mg/dL.';

-- ---------------------------------------------------------------------------
-- glucose_readings — relevés de glycémie
-- ---------------------------------------------------------------------------
create table if not exists public.glucose_readings (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  value_mgdl   numeric(6, 2) not null check (value_mgdl between 20 and 600),
  context      reading_context not null default 'other',
  measured_at  timestamptz not null default now(),
  note         text,
  created_at   timestamptz not null default now()
);

create index if not exists glucose_readings_user_measured_idx
  on public.glucose_readings (user_id, measured_at desc);

-- ---------------------------------------------------------------------------
-- weight_entries — suivi du poids (action rapide du tableau de bord)
-- ---------------------------------------------------------------------------
create table if not exists public.weight_entries (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.profiles (id) on delete cascade,
  weight_kg    numeric(5, 2) not null check (weight_kg between 20 and 400),
  measured_at  timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create index if not exists weight_entries_user_measured_idx
  on public.weight_entries (user_id, measured_at desc);

-- ---------------------------------------------------------------------------
-- foods — catalogue d'aliments (lecture publique)
-- ---------------------------------------------------------------------------
create table if not exists public.foods (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  category          text,
  glycemic_index    smallint check (glycemic_index between 0 and 150),
  carbs_per_100g    numeric(6, 2) not null default 0,
  kcal_per_100g     numeric(6, 2) not null default 0,
  protein_per_100g  numeric(6, 2) not null default 0,
  fat_per_100g      numeric(6, 2) not null default 0,
  fiber_per_100g    numeric(6, 2) not null default 0,
  is_verified       boolean not null default false,
  created_at        timestamptz not null default now()
);

-- Le seed s'appuie sur `on conflict do nothing` : sans contrainte unique,
-- une seconde exécution dupliquerait tout le catalogue.
create unique index if not exists foods_name_unique on public.foods (name);

-- Recherche insensible aux accents et à la casse : « poelee » trouve « Poêlée ».
create index if not exists foods_name_search_idx
  on public.foods using gin (to_tsvector('french', public.f_unaccent(name)));

-- ---------------------------------------------------------------------------
-- meals / meal_items — composition du repas
-- ---------------------------------------------------------------------------
create table if not exists public.meals (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles (id) on delete cascade,
  name            text,
  eaten_at        timestamptz not null default now(),
  -- Totaux dénormalisés, recalculés par trigger à chaque changement d'item.
  total_kcal      numeric(8, 2) not null default 0,
  total_carbs_g   numeric(8, 2) not null default 0,
  glycemic_load   numeric(8, 2) not null default 0,
  created_at      timestamptz not null default now()
);

create index if not exists meals_user_eaten_idx on public.meals (user_id, eaten_at desc);

create table if not exists public.meal_items (
  id          uuid primary key default gen_random_uuid(),
  meal_id     uuid not null references public.meals (id) on delete cascade,
  food_id     uuid not null references public.foods (id) on delete restrict,
  quantity_g  numeric(7, 2) not null check (quantity_g > 0),
  created_at  timestamptz not null default now()
);

create index if not exists meal_items_meal_idx on public.meal_items (meal_id);

-- ---------------------------------------------------------------------------
-- meal_predictions — écran « Prédiction d'impact »
-- ---------------------------------------------------------------------------
create table if not exists public.meal_predictions (
  id                     uuid primary key default gen_random_uuid(),
  meal_id                uuid not null references public.meals (id) on delete cascade,
  baseline_mgdl          numeric(6, 2) not null,
  predicted_peak_mgdl    numeric(6, 2) not null,
  predicted_peak_minutes smallint not null,
  risk                   risk_level not null,
  created_at             timestamptz not null default now()
);

create index if not exists meal_predictions_meal_idx on public.meal_predictions (meal_id);

-- ---------------------------------------------------------------------------
-- teas / tea_sessions / tea_measurements — espace thé régulateur
-- ---------------------------------------------------------------------------
create table if not exists public.teas (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  kind         tea_kind not null,
  description  text,
  -- Effet moyen attendu sur le pic post-prandial, en % (valeur indicative).
  expected_effect_pct numeric(4, 1),
  created_at   timestamptz not null default now()
);

create unique index if not exists teas_name_unique on public.teas (name);

create table if not exists public.tea_sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.profiles (id) on delete cascade,
  tea_id         uuid references public.teas (id) on delete set null,
  status         tea_session_status not null default 'active',
  started_at     timestamptz not null default now(),
  tea_taken_at   timestamptz,
  ended_at       timestamptz,
  baseline_mgdl  numeric(6, 2),
  note           text,
  created_at     timestamptz not null default now()
);

create index if not exists tea_sessions_user_started_idx
  on public.tea_sessions (user_id, started_at desc);

-- Une seule session active à la fois par utilisateur.
create unique index if not exists tea_sessions_one_active_per_user
  on public.tea_sessions (user_id)
  where status = 'active';

create table if not exists public.tea_measurements (
  id              uuid primary key default gen_random_uuid(),
  session_id      uuid not null references public.tea_sessions (id) on delete cascade,
  offset_minutes  smallint not null check (offset_minutes >= 0),
  value_mgdl      numeric(6, 2) not null check (value_mgdl between 20 and 600),
  measured_at     timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  unique (session_id, offset_minutes)
);

create index if not exists tea_measurements_session_idx
  on public.tea_measurements (session_id, offset_minutes);

-- ---------------------------------------------------------------------------
-- articles — bibliothèque de conseils (lecture publique)
-- ---------------------------------------------------------------------------
create table if not exists public.articles (
  id                      uuid primary key default gen_random_uuid(),
  slug                    text not null unique,
  title                   text not null,
  category                article_category not null,
  excerpt                 text,
  content_md              text not null,
  read_minutes            smallint not null default 3,
  is_dietitian_validated  boolean not null default false,
  cover_url               text,
  published_at            timestamptz not null default now()
);

create index if not exists articles_category_idx on public.articles (category, published_at desc);

create table if not exists public.article_bookmarks (
  user_id     uuid not null references public.profiles (id) on delete cascade,
  article_id  uuid not null references public.articles (id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (user_id, article_id)
);

-- ---------------------------------------------------------------------------
-- reminders — rappels programmés (écran Profil)
-- ---------------------------------------------------------------------------
create table if not exists public.reminders (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles (id) on delete cascade,
  label         text not null,
  kind          reminder_kind not null default 'custom',
  time_of_day   time not null,
  -- ISO-8601 : 1 = lundi … 7 = dimanche. Tableau vide = tous les jours.
  days_of_week  smallint[] not null default '{}',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now()
);

create index if not exists reminders_user_idx on public.reminders (user_id) where is_active;

-- =============================================================================
-- Triggers
-- =============================================================================

-- updated_at automatique sur profiles.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists profiles_touch_updated_at on public.profiles;
create trigger profiles_touch_updated_at
  before update on public.profiles
  for each row execute function public.touch_updated_at();

-- Création automatique du profil à l'inscription.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, first_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name',
             new.raw_user_meta_data ->> 'full_name',
             split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Recalcul des totaux du repas dès qu'un item change.
create or replace function public.recompute_meal_totals()
returns trigger
language plpgsql
as $$
declare
  target_meal uuid := coalesce(new.meal_id, old.meal_id);
begin
  update public.meals m
  set
    total_kcal    = coalesce(agg.kcal, 0),
    total_carbs_g = coalesce(agg.carbs, 0),
    -- Charge glycémique = Σ (IG × glucides disponibles) / 100
    glycemic_load = coalesce(agg.gl, 0)
  from (
    select
      sum(f.kcal_per_100g  * mi.quantity_g / 100)                            as kcal,
      sum(f.carbs_per_100g * mi.quantity_g / 100)                            as carbs,
      sum(coalesce(f.glycemic_index, 0) * f.carbs_per_100g * mi.quantity_g / 10000) as gl
    from public.meal_items mi
    join public.foods f on f.id = mi.food_id
    where mi.meal_id = target_meal
  ) agg
  where m.id = target_meal;

  return null;
end;
$$;

drop trigger if exists meal_items_recompute on public.meal_items;
create trigger meal_items_recompute
  after insert or update or delete on public.meal_items
  for each row execute function public.recompute_meal_totals();

-- =============================================================================
-- Row Level Security
-- =============================================================================

alter table public.profiles          enable row level security;
alter table public.glucose_readings  enable row level security;
alter table public.weight_entries    enable row level security;
alter table public.meals             enable row level security;
alter table public.meal_items        enable row level security;
alter table public.meal_predictions  enable row level security;
alter table public.tea_sessions      enable row level security;
alter table public.tea_measurements  enable row level security;
alter table public.article_bookmarks enable row level security;
alter table public.reminders         enable row level security;
alter table public.foods             enable row level security;
alter table public.teas              enable row level security;
alter table public.articles          enable row level security;

-- Données strictement personnelles : l'utilisateur ne voit que ses lignes.
drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "glucose_readings_self" on public.glucose_readings;
create policy "glucose_readings_self" on public.glucose_readings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "weight_entries_self" on public.weight_entries;
create policy "weight_entries_self" on public.weight_entries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "meals_self" on public.meals;
create policy "meals_self" on public.meals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reminders_self" on public.reminders;
create policy "reminders_self" on public.reminders
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "tea_sessions_self" on public.tea_sessions;
create policy "tea_sessions_self" on public.tea_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "article_bookmarks_self" on public.article_bookmarks;
create policy "article_bookmarks_self" on public.article_bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Tables filles : on remonte au propriétaire via la table parente.
drop policy if exists "meal_items_via_meal" on public.meal_items;
create policy "meal_items_via_meal" on public.meal_items
  for all
  using (exists (
    select 1 from public.meals m
    where m.id = meal_items.meal_id and m.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.meals m
    where m.id = meal_items.meal_id and m.user_id = auth.uid()
  ));

drop policy if exists "meal_predictions_via_meal" on public.meal_predictions;
create policy "meal_predictions_via_meal" on public.meal_predictions
  for all
  using (exists (
    select 1 from public.meals m
    where m.id = meal_predictions.meal_id and m.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.meals m
    where m.id = meal_predictions.meal_id and m.user_id = auth.uid()
  ));

drop policy if exists "tea_measurements_via_session" on public.tea_measurements;
create policy "tea_measurements_via_session" on public.tea_measurements
  for all
  using (exists (
    select 1 from public.tea_sessions s
    where s.id = tea_measurements.session_id and s.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.tea_sessions s
    where s.id = tea_measurements.session_id and s.user_id = auth.uid()
  ));

-- Catalogues : lecture pour tout utilisateur authentifié, écriture réservée
-- au service_role (qui contourne la RLS).
drop policy if exists "foods_read" on public.foods;
create policy "foods_read" on public.foods
  for select to authenticated using (true);

drop policy if exists "teas_read" on public.teas;
create policy "teas_read" on public.teas
  for select to authenticated using (true);

drop policy if exists "articles_read" on public.articles;
create policy "articles_read" on public.articles
  for select to authenticated using (true);
