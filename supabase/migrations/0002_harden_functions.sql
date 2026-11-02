-- =============================================================================
-- Durcissement des fonctions — corrige 4 alertes du linter de sécurité Supabase.
-- =============================================================================

-- Les fonctions de trigger n'ont pas à être appelables via l'API REST.
-- `handle_new_user` est SECURITY DEFINER : exposée en RPC, elle s'exécuterait
-- avec les droits du propriétaire pour n'importe quel appelant, y compris `anon`.
--
-- Révoquer EXECUTE ne casse pas les triggers : PostgreSQL contrôle ce droit à la
-- CRÉATION du trigger, pas à chaque déclenchement (vérifié après application).
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.touch_updated_at() from anon, authenticated, public;
revoke execute on function public.recompute_meal_totals() from anon, authenticated, public;

-- search_path figé : sans cela, un schéma placé en tête du search_path de
-- l'appelant peut détourner la résolution des noms d'objets. Les corps de ces
-- fonctions ne référencent que des objets qualifiés (public.*) ou du pg_catalog.
alter function public.touch_updated_at() set search_path = '';
alter function public.recompute_meal_totals() set search_path = '';
