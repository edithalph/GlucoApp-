-- =============================================================================
-- Optimisation : RLS et index de clés étrangères.
-- Corrige 13 alertes de performance du linter Supabase.
-- =============================================================================

-- `auth.uid()` écrit tel quel est réévalué POUR CHAQUE LIGNE examinée.
-- Enveloppé dans un sous-select, PostgreSQL le traite comme un InitPlan :
-- une seule évaluation par requête. Le comportement est strictement identique,
-- seul le plan d'exécution change.

drop policy if exists "profiles_self" on public.profiles;
create policy "profiles_self" on public.profiles
  for all using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

drop policy if exists "glucose_readings_self" on public.glucose_readings;
create policy "glucose_readings_self" on public.glucose_readings
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "weight_entries_self" on public.weight_entries;
create policy "weight_entries_self" on public.weight_entries
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "meals_self" on public.meals;
create policy "meals_self" on public.meals
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "reminders_self" on public.reminders;
create policy "reminders_self" on public.reminders
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "tea_sessions_self" on public.tea_sessions;
create policy "tea_sessions_self" on public.tea_sessions
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "article_bookmarks_self" on public.article_bookmarks;
create policy "article_bookmarks_self" on public.article_bookmarks
  for all using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "meal_items_via_meal" on public.meal_items;
create policy "meal_items_via_meal" on public.meal_items
  for all
  using (exists (
    select 1 from public.meals m
    where m.id = meal_items.meal_id and m.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.meals m
    where m.id = meal_items.meal_id and m.user_id = (select auth.uid())
  ));

drop policy if exists "meal_predictions_via_meal" on public.meal_predictions;
create policy "meal_predictions_via_meal" on public.meal_predictions
  for all
  using (exists (
    select 1 from public.meals m
    where m.id = meal_predictions.meal_id and m.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.meals m
    where m.id = meal_predictions.meal_id and m.user_id = (select auth.uid())
  ));

drop policy if exists "tea_measurements_via_session" on public.tea_measurements;
create policy "tea_measurements_via_session" on public.tea_measurements
  for all
  using (exists (
    select 1 from public.tea_sessions s
    where s.id = tea_measurements.session_id and s.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.tea_sessions s
    where s.id = tea_measurements.session_id and s.user_id = (select auth.uid())
  ));

-- Clés étrangères sans index couvrant : chaque suppression dans la table
-- référencée impose sinon un balayage complet de la table référençante.
create index if not exists meal_items_food_idx
  on public.meal_items (food_id);

create index if not exists tea_sessions_tea_idx
  on public.tea_sessions (tea_id);

create index if not exists article_bookmarks_article_idx
  on public.article_bookmarks (article_id);
