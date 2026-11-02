-- Journal personnel enrichi et suivi repas -> mesure.
-- Toutes les données ajoutées sont privées et restent couvertes par les
-- politiques RLS existantes sur glucose_readings et meals.

alter table public.glucose_readings
  add column if not exists meal_id uuid references public.meals(id) on delete set null,
  add column if not exists activity_minutes smallint check (activity_minutes between 0 and 1440),
  add column if not exists sleep_hours numeric(3, 1) check (sleep_hours between 0 and 24),
  add column if not exists stress_level smallint check (stress_level between 1 and 5),
  add column if not exists medication_taken boolean,
  add column if not exists symptoms text check (char_length(symptoms) <= 500);

create index if not exists glucose_readings_user_meal_idx
  on public.glucose_readings (user_id, meal_id)
  where meal_id is not null;

-- Un favori pointe vers un repas existant de l'utilisateur. On conserve ainsi
-- exactement ses portions et ses aliments sans recopier de données sensibles.
create table if not exists public.favorite_meals (
  user_id uuid not null references public.profiles(id) on delete cascade,
  meal_id uuid not null references public.meals(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, meal_id)
);

alter table public.favorite_meals enable row level security;

drop policy if exists "favorite_meals_self" on public.favorite_meals;
create policy "favorite_meals_self" on public.favorite_meals
  for all to authenticated
  using (
    (select auth.uid()) = user_id
    and exists (select 1 from public.meals m where m.id = meal_id and m.user_id = (select auth.uid()))
  )
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.meals m where m.id = meal_id and m.user_id = (select auth.uid()))
  );

