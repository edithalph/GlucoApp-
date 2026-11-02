-- =============================================================================
-- 0007 — Aliments et plats congolais.
--
-- SOURCES (deux documents fournis par l'équipe produit)
--   A. « Composition calorique des aliments et plats congolais »
--      -> énergie et macronutriments, appuyés sur USDA FoodData Central et
--         les tables FAO/INFOODS adaptées aux aliments africains.
--   B. « Indice glycémique des aliments congolais »
--      -> IG, appuyé sur la base de l'Université de Sydney et sur la
--         littérature consacrée aux produits du manioc.
--
-- CONVENTIONS RETENUES
--
-- 1. Les deux documents donnent des FOURCHETTES (« 110–160 kcal », « IG 45–65 »).
--    La table ne stocke qu'une valeur : on retient le MILIEU de la fourchette,
--    pour l'énergie comme pour l'IG. L'incertitude réelle reste de l'ordre de
--    ±20 % sur les préparations — c'est la nature de ces aliments, pas un
--    défaut de la base.
--
-- 2. « Très faible » (légumes non féculents, huiles, mayonnaise, lait de coco)
--    est traduit par IG 15. Ces aliments apportent trop peu de glucides pour
--    qu'un IG soit mesurable ; à cette teneur la charge glycémique reste
--    négligeable quelle que soit la valeur retenue dans cette plage.
--
-- 3. Un aliment SANS glucides a un IG de 0 : il ne peut pas porter de charge
--    glycémique. Le document B le formule « 0 ou non applicable » pour les
--    viandes, poissons et œufs.
--
-- 4. `is_verified` distingue deux natures de données :
--      true  — composition corroborée par les tables internationales
--              (riz, haricots, huiles, viandes, mangue…) ;
--      false — préparation dont la valeur dépend surtout du cuisinier :
--              quantité d'huile, friture, fumage, séchage, degré de cuisson.
--              L'application affiche « Estimation » sur celles-ci.
--
-- 5. Valeurs pour 100 g D'ALIMENT PRÊT À CONSOMMER, sauf « Farine de manioc »,
--    « Farine de maïs », « Riz blanc cru », « Gari » et « Tapioca », qui sont
--    des ingrédients secs — leur nom le dit.
--
-- 6. Le plantain et le foufou sont dédoublés parce que les documents leur
--    donnent des IG franchement différents selon la recette :
--      plantain vert 40–55 contre plantain mûr 55–70 ;
--      foufou de manioc 65–85 contre foufou manioc-plantain 45–60.
--    Les confondre ferait perdre l'essentiel de l'information.
--
-- 7. Les PLATS COMPOSÉS (section 6 du document B) ne sont PAS repris : la table
--    modélise un aliment pour 100 g, ces plats sont décrits par assiette. Ils se
--    composent dans « Composer mon repas » à partir des ingrédients ci-dessous.
--
-- 8. « Riz basmati blanc (cuit) » garde son IG de 58, hors de la fourchette
--    60–80 que le document B donne au riz blanc : le document précise lui-même
--    que les bases internationales distinguent le basmati des autres variétés.
--
-- `do update` plutôt que `do nothing` : la migration reste idempotente tout en
-- permettant de corriger une valeur en la rejouant.
-- =============================================================================

-- Le plantain bouilli a été scindé en « vert » et « mûr ». Renomme l'ancienne
-- ligne si une version antérieure de cette migration a déjà été appliquée,
-- plutôt que de la supprimer — des repas peuvent la référencer.
update public.foods
   set name = 'Banane plantain verte bouillie'
 where name = 'Banane plantain bouillie'
   and not exists (
     select 1 from public.foods where name = 'Banane plantain verte bouillie'
   );

-- Idem pour le foufou, devenu « Foufou de manioc ».
update public.foods
   set name = 'Foufou de manioc'
 where name = 'Foufou (pâte de manioc)'
   and not exists (
     select 1 from public.foods where name = 'Foufou de manioc'
   );

insert into public.foods
  (name, category, glycemic_index, carbs_per_100g, kcal_per_100g,
   protein_per_100g, fat_per_100g, fiber_per_100g, is_verified)
values
  -- Féculents
  ('Manioc bouilli',                     'Féculents',                       55,  31.50, 135.00,  1.50,   0.30,  1.80, true),
  ('Manioc très cuit ou en purée',       'Féculents',                       70,  33.00, 140.00,  1.50,   0.30,  1.60, false),
  ('Farine de manioc',                   'Féculents',                       75,  87.50, 355.00,  2.00,   1.00,  3.70, false),
  ('Foufou de manioc',                   'Féculents',                       75,  35.00, 150.00,  2.00,   0.50,  1.50, false),
  ('Foufou manioc-plantain',             'Féculents',                       53,  34.00, 150.00,  1.80,   0.50,  2.00, false),
  ('Chikwangue (kwanga)',                'Féculents',                       60,  50.00, 220.00,  2.50,   0.50,  1.50, false),
  ('Gari (semoule de manioc)',           'Féculents',                       83,  84.00, 365.00,  1.50,   0.50,  3.50, false),
  ('Abacha (manioc râpé préparé)',       'Féculents',                       80,  40.00, 200.00,  2.00,   3.00,  2.00, false),
  ('Tapioca',                            'Féculents',                       78,  88.00, 365.00,  0.20,   0.10,  0.90, true),
  ('Maïs cuit',                          'Féculents',                       58,  25.00, 118.00,  3.50,   1.50,  2.40, true),
  ('Bouillie de maïs',                   'Féculents',                       60,  20.00,  95.00,  2.20,   1.00,  1.50, false),
  ('Farine de maïs',                     'Féculents',                       75,  78.50, 365.00,  8.50,   4.00,  7.30, true),
  ('Riz blanc cuit',                     'Féculents',                       70,  29.50, 138.00,  2.50,   0.50,  0.40, true),
  ('Riz blanc cru',                      'Féculents',                       70,  77.50, 355.00,  7.00,   1.00,  1.30, true),
  ('Riz étuvé cuit',                     'Féculents',                       58,  29.00, 138.00,  2.80,   0.40,  0.80, true),
  ('Banane plantain verte bouillie',     'Féculents',                       48,  32.50, 128.00,  1.50,   0.50,  2.30, true),
  ('Banane plantain mûre bouillie',      'Féculents',                       63,  34.00, 135.00,  1.30,   0.40,  2.00, true),
  ('Banane plantain frite',              'Féculents',                       63,  42.50, 300.00,  2.00,  14.00,  2.20, false),
  ('Igname cuite',                       'Féculents',                       60,  27.50, 120.00,  2.00,   0.30,  4.10, true),
  ('Taro ou macabo cuit',                'Féculents',                       60,  30.00, 130.00,  2.00,   0.30,  3.50, true),
  -- Légumes
  ('Feuilles de manioc',                 'Légumes',                         15,   7.00,  70.00,  6.90,   1.00,  3.70, false),
  ('Saka-saka (pondu) peu d''huile',     'Légumes',                         15,   7.00,  90.00,  5.00,   4.50,  3.50, false),
  ('Saka-saka à l''huile de palme',      'Légumes',                         15,   7.00, 190.00,  5.00,  16.00,  3.50, false),
  ('Gombo cuit',                         'Légumes',                         15,   7.00,  35.00,  1.90,   0.20,  3.20, true),
  ('Aubergine cuite',                    'Légumes',                         15,   6.00,  50.00,  1.00,   2.00,  2.50, false),
  ('Tomate cuite',                       'Légumes',                         15,   4.50,  30.00,  1.00,   0.50,  1.20, false),
  ('Feuilles de patate douce',           'Légumes',                         15,   6.00,  52.00,  4.00,   0.50,  2.50, false),
  ('Poireau ou ciboule',                 'Légumes',                         15,   8.00,  42.00,  1.50,   0.30,  1.80, false),
  -- Fruits
  ('Safou (prune africaine)',            'Fruits',                          15,   8.00, 180.00,  3.00,  15.00,  4.50, false),
  ('Mangue',                             'Fruits',                          55,  15.00,  62.00,  0.80,   0.40,  1.60, true),
  ('Ananas',                             'Fruits',                          60,  13.00,  52.00,  0.50,   0.10,  1.40, true),
  -- Légumineuses
  ('Haricots cuits',                     'Légumineuses',                    33,  21.00, 130.00,  8.50,   0.50,  7.00, true),
  ('Haricots secs',                      'Légumineuses',                    33,  60.00, 335.00, 22.00,   1.50, 21.00, true),
  ('Haricots en sauce (madesu)',         'Légumineuses',                    45,  20.00, 185.00,  8.00,   8.00,  6.50, false),
  ('Niébé cuit',                         'Légumineuses',                    38,  21.00, 130.00,  8.50,   0.60,  6.50, true),
  -- Oléagineux
  ('Arachides grillées',                 'Oléagineux',                      15,  16.00, 590.00, 26.00,  49.00,  8.50, true),
  ('Pâte d''arachide',                   'Oléagineux',                      15,  20.00, 605.00, 25.00,  50.00,  6.00, true),
  ('Graines de courge',                  'Oléagineux',                      15,  11.00, 550.00, 30.00,  49.00,  6.00, true),
  ('Noix de coco fraîche',               'Oléagineux',                      45,  15.00, 350.00,  3.30,  33.00,  9.00, true),
  -- Poissons
  ('Poisson maigre cuit',                'Poissons',                         0,   0.00, 125.00, 22.50,   3.50,  0.00, true),
  ('Poisson gras cuit',                  'Poissons',                         0,   0.00, 215.00, 22.50,  13.50,  0.00, true),
  ('Poisson fumé',                       'Poissons',                         0,   0.00, 240.00, 45.00,   8.00,  0.00, false),
  ('Poisson séché',                      'Poissons',                         0,   0.00, 325.00, 57.50,  10.00,  0.00, false),
  ('Sardine ou chinchard frit',          'Poissons',                         0,   0.00, 270.00, 21.50,  19.00,  0.00, false),
  -- Viandes
  ('Poulet sans peau cuit',              'Viandes',                          0,   0.00, 190.00, 28.50,   8.00,  0.00, true),
  ('Poulet avec peau cuit',              'Viandes',                          0,   0.00, 260.00, 26.50,  17.00,  0.00, true),
  ('Bœuf maigre cuit',                   'Viandes',                          0,   0.00, 240.00, 27.50,  14.00,  0.00, true),
  ('Bœuf gras cuit',                     'Viandes',                          0,   0.00, 330.00, 24.00,  25.00,  0.00, true),
  ('Chèvre cuite',                       'Viandes',                          0,   0.00, 230.00, 27.50,  13.00,  0.00, true),
  ('Porc cuit',                          'Viandes',                          0,   0.00, 295.00, 25.00,  21.00,  0.00, true),
  ('Chenilles séchées',                  'Viandes',                          0,   0.00, 475.00, 50.00,  30.00,  0.00, false),
  -- Huiles et matières grasses
  ('Huile de palme',                     'Huiles et matières grasses',       0,   0.00, 884.00,  0.00, 100.00,  0.00, true),
  ('Huile d''arachide',                  'Huiles et matières grasses',       0,   0.00, 884.00,  0.00, 100.00,  0.00, true),
  ('Huile de tournesol',                 'Huiles et matières grasses',       0,   0.00, 884.00,  0.00, 100.00,  0.00, true),
  ('Margarine',                          'Huiles et matières grasses',      15,   0.70, 700.00,  0.20,  78.00,  0.00, true),
  ('Lait de coco',                       'Huiles et matières grasses',      15,   4.00, 190.00,  2.00,  19.00,  1.50, true),
  ('Lait concentré sucré',               'Huiles et matières grasses',      70,  54.50, 325.00,  7.90,   8.70,  0.00, true),
  ('Mayonnaise',                         'Huiles et matières grasses',      15,   1.50, 680.00,  1.00,  75.00,  0.00, true),
  ('Sucre',                              'Huiles et matières grasses',      65, 100.00, 400.00,  0.00,   0.00,  0.00, true),
  -- Boissons
  ('Jus de bissap sucré',                'Boissons',                        75,  15.00,  60.00,  0.20,   0.00,  0.00, false),
  ('Jus de bissap sans sucre',           'Boissons',                        15,   1.00,   4.00,  0.00,   0.00,  0.00, false),
  ('Jus de gingembre sucré',             'Boissons',                        75,  15.00,  60.00,  0.20,   0.00,  0.00, false),
  ('Jus de gingembre sans sucre',        'Boissons',                        15,   1.00,   4.00,  0.00,   0.00,  0.00, false)
on conflict (name) do update set
  category         = excluded.category,
  glycemic_index   = excluded.glycemic_index,
  carbs_per_100g   = excluded.carbs_per_100g,
  kcal_per_100g    = excluded.kcal_per_100g,
  protein_per_100g = excluded.protein_per_100g,
  fat_per_100g     = excluded.fat_per_100g,
  fiber_per_100g   = excluded.fiber_per_100g,
  is_verified      = excluded.is_verified;
