-- =============================================================================
-- Ajoute « AFRAthé » au catalogue des thés.
--
-- NOTE POUR LA MAINTENANCE : la description et le type ci-dessous sont des
-- valeurs de remplissage, en attente du texte définitif. Rien n'indique cela
-- dans l'interface — l'entrée s'y présente comme n'importe quel autre thé.
--
-- `teas.name` porte un index unique : `on conflict do nothing` rend ce script
-- rejouable sans créer de doublon.
--
-- `expected_effect_pct` ne sert qu'à ordonner les suggestions, de l'effet
-- attendu le plus marqué au plus faible. Ce n'est pas une promesse
-- thérapeutique — voir l'avertissement affiché dans l'application.
-- =============================================================================

insert into public.teas (name, kind, description, expected_effect_pct)
values
  ('AFRAthé', 'green',
   'Thé vert infusé aux plantes, à boire après le repas.',
   -18.0)
on conflict (name) do nothing;
