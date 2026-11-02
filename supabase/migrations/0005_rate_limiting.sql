-- =============================================================================
-- Limitation de débit — fenêtre glissante persistée en base.
--
-- Un compteur en mémoire ne tient pas : en environnement serverless chaque
-- instance a sa propre mémoire, et un redémarrage remet tout à zéro. La base
-- est le seul état partagé fiable.
--
-- L'application n'utilise ces fonctions que si `SUPABASE_SERVICE_ROLE_KEY` est
-- définie ; sinon elle retombe sur un compteur local au processus.
-- =============================================================================

create table if not exists public.rate_limits (
  -- Clé composite « action:identifiant » (ex. « signin:a@b.c »).
  cle          text primary key,
  compteur     integer not null default 0,
  fenetre_fin  timestamptz not null,
  updated_at   timestamptz not null default now()
);

create index if not exists rate_limits_fenetre_idx
  on public.rate_limits (fenetre_fin);

-- Table d'infrastructure : aucun accès direct depuis l'API publique.
alter table public.rate_limits enable row level security;
revoke all on table public.rate_limits from anon, authenticated;

/**
 * Incrémente le compteur de `cle` et indique si la limite est franchie.
 * SECURITY DEFINER : la fonction doit écrire dans une table à laquelle
 * l'appelant n'a délibérément aucun droit.
 */
create or replace function public.consommer_quota(
  cle_in           text,
  limite_in        integer,
  fenetre_secondes integer
)
returns table (autorise boolean, restant integer, reprise_dans integer)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  maintenant timestamptz := now();
  ligne      public.rate_limits%rowtype;
begin
  if cle_in is null or length(cle_in) = 0 or length(cle_in) > 200 then
    return query select false, 0, fenetre_secondes;
    return;
  end if;

  insert into public.rate_limits (cle, compteur, fenetre_fin, updated_at)
  values (cle_in, 1, maintenant + make_interval(secs => fenetre_secondes), maintenant)
  on conflict (cle) do update
    set
      -- Fenêtre expirée : on repart de 1. Sinon on incrémente.
      compteur = case
        when public.rate_limits.fenetre_fin < maintenant then 1
        else public.rate_limits.compteur + 1
      end,
      fenetre_fin = case
        when public.rate_limits.fenetre_fin < maintenant
          then maintenant + make_interval(secs => fenetre_secondes)
        else public.rate_limits.fenetre_fin
      end,
      updated_at = maintenant
  returning * into ligne;

  return query
    select
      ligne.compteur <= limite_in,
      greatest(0, limite_in - ligne.compteur),
      greatest(0, ceil(extract(epoch from ligne.fenetre_fin - maintenant))::integer);
end;
$$;

-- Appelée uniquement depuis le serveur applicatif, jamais par le navigateur.
revoke execute on function public.consommer_quota(text, integer, integer)
  from anon, authenticated, public;

/** Purge les fenêtres closes depuis plus d'une heure. */
create or replace function public.purger_rate_limits()
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  delete from public.rate_limits where fenetre_fin < now() - interval '1 hour';
$$;

revoke execute on function public.purger_rate_limits() from anon, authenticated, public;
