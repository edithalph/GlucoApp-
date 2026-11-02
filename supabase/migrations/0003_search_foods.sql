-- =============================================================================
-- Recherche d'aliments — utilisée par l'écran « Composer mon repas ».
-- =============================================================================

-- Insensible aux accents et à la casse. Exploite l'index GIN
-- foods_name_search_idx via public.f_unaccent.
create or replace function public.search_foods(terme text, limite integer default 20)
returns setof public.foods
language sql
stable
security invoker
set search_path = public, extensions, pg_temp
as $$
  select f.*
  from public.foods f
  where
    coalesce(terme, '') = ''
    -- Recherche plein texte (gère les pluriels et la lemmatisation française).
    or to_tsvector('french', public.f_unaccent(f.name))
       @@ plainto_tsquery('french', public.f_unaccent(terme))
    -- Repli sur une correspondance partielle, pour les saisies incomplètes
    -- que le plein texte ne rattrape pas (« brocol » -> « Brocolis vapeur »).
    or public.f_unaccent(f.name) ilike '%' || public.f_unaccent(terme) || '%'
  order by
    -- Les correspondances par préfixe remontent en tête.
    (public.f_unaccent(lower(f.name))
       like public.f_unaccent(lower(coalesce(terme, ''))) || '%') desc,
    f.name
  limit greatest(1, least(coalesce(limite, 20), 50));
$$;

-- Réservée aux utilisateurs connectés, comme la policy de lecture sur foods.
revoke execute on function public.search_foods(text, integer) from anon, public;
grant execute on function public.search_foods(text, integer) to authenticated;
