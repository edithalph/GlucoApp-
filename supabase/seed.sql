-- =============================================================================
-- Données de référence GlucoApp (catalogues publics).
-- À exécuter après 0001_init.sql. Idempotent.
--
-- Sources des valeurs d'IG : tables internationales de l'index glycémique
-- (Atkinson, Foster-Powell & Brand-Miller). Valeurs moyennes, indicatives.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Aliments
-- ---------------------------------------------------------------------------
insert into public.foods
  (name, category, glycemic_index, carbs_per_100g, kcal_per_100g, protein_per_100g, fat_per_100g, fiber_per_100g, is_verified)
values
  -- Féculents et céréales
  ('Riz basmati blanc (cuit)',  'Féculents', 58,  28.0, 130, 2.7,  0.3, 0.4, true),
  ('Riz complet (cuit)',        'Féculents', 50,  23.0, 111, 2.6,  0.9, 1.8, true),
  ('Pâtes complètes (cuites)',  'Féculents', 42,  27.0, 124, 5.3,  0.5, 3.9, true),
  ('Pain complet',              'Féculents', 51,  41.0, 247, 10.0, 3.4, 6.8, true),
  ('Pain blanc (baguette)',     'Féculents', 75,  55.0, 274, 9.0,  1.3, 2.7, true),
  ('Quinoa (cuit)',             'Féculents', 53,  21.3, 120, 4.4,  1.9, 2.8, true),
  ('Pomme de terre vapeur',     'Féculents', 78,  17.0,  87, 2.0,  0.1, 1.8, true),
  ('Patate douce (cuite)',      'Féculents', 63,  20.0,  90, 2.0,  0.1, 3.3, true),
  ('Lentilles vertes (cuites)', 'Légumineuses', 30, 20.0, 116, 9.0, 0.4, 7.9, true),
  ('Pois chiches (cuits)',      'Légumineuses', 28, 27.4, 164, 8.9, 2.6, 7.6, true),

  -- Légumes
  ('Brocolis vapeur',           'Légumes', 15,  7.0,  35, 2.4, 0.4, 3.3, true),
  ('Haricots verts',            'Légumes', 15,  7.0,  31, 1.8, 0.2, 3.4, true),
  ('Courgette',                 'Légumes', 15,  3.1,  17, 1.2, 0.3, 1.0, true),
  ('Carotte crue',              'Légumes', 16,  9.6,  41, 0.9, 0.2, 2.8, true),
  ('Épinards',                  'Légumes', 15,  3.6,  23, 2.9, 0.4, 2.2, true),
  ('Avocat',                    'Légumes', 10,  8.5, 160, 2.0, 14.7, 6.7, true),

  -- Protéines
  ('Saumon grillé',             'Poissons', 0,   0.0, 208, 20.4, 13.4, 0.0, true),
  ('Filet de poulet grillé',    'Viandes',  0,   0.0, 165, 31.0,  3.6, 0.0, true),
  ('Œuf entier',                'Œufs',     0,   1.1, 143, 12.6,  9.5, 0.0, true),
  ('Tofu ferme',                'Végétal',  15,  1.9, 144, 15.8,  8.7, 2.3, true),

  -- Fruits
  ('Pomme',                     'Fruits', 36, 13.8,  52, 0.3, 0.2, 2.4, true),
  ('Banane',                    'Fruits', 51, 22.8,  89, 1.1, 0.3, 2.6, true),
  ('Citron',                    'Fruits', 20,  9.3,  29, 1.1, 0.3, 2.8, true),
  ('Fraises',                   'Fruits', 40,  7.7,  32, 0.7, 0.3, 2.0, true),

  -- Oléagineux et produits laitiers
  ('Amandes',                   'Oléagineux', 15, 21.6, 579, 21.2, 49.9, 12.5, true),
  ('Noix',                      'Oléagineux', 15, 13.7, 654, 15.2, 65.2,  6.7, true),
  ('Yaourt nature',             'Produits laitiers', 35, 4.7, 61, 3.5, 3.3, 0.0, true),
  ('Fromage blanc 0%',          'Produits laitiers', 30, 4.0, 47, 7.5, 0.2, 0.0, true)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Thés
--
-- expected_effect_pct : effet moyen observé sur le pic post-prandial dans la
-- littérature. Valeur INDICATIVE, utilisée uniquement pour ordonner les
-- suggestions — jamais présentée comme une promesse thérapeutique.
-- ---------------------------------------------------------------------------
insert into public.teas (name, kind, description, expected_effect_pct)
values
  ('AFRAthé',              'green',  'Thé vert infusé aux plantes, à boire après le repas.',                          -18.0),
  ('Thé vert Matcha',      'matcha', 'Riche en catéchines (EGCG). Le plus étudié pour la sensibilité à l''insuline.', -18.0),
  ('Thé vert Sencha',      'green',  'Thé vert japonais classique, léger et végétal.',                                -14.0),
  ('Thé Oolong',           'oolong', 'Semi-oxydé, traditionnellement consommé après les repas riches.',               -15.0),
  ('Thé noir',             'black',  'Théaflavines ; effet modéré sur l''absorption des glucides.',                   -10.0),
  ('Tisane Camomille',     'herbal', 'Sans théine. Rituel du soir, favorise la détente.',                              -5.0),
  ('Tisane Cannelle',      'herbal', 'Sans théine, notes chaudes.',                                                    -8.0),
  ('Thé blanc',            'white',  'Peu oxydé, très doux en bouche.',                                               -12.0)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Articles — bibliothèque de conseils
-- ---------------------------------------------------------------------------
insert into public.articles
  (slug, title, category, excerpt, content_md, read_minutes, is_dietitian_validated)
values
  (
    'fibres-et-pics-glycemiques',
    'Comprendre l''impact des fibres sur les pics de glycémie',
    'glycemia',
    'Pourquoi un même plat fait grimper la glycémie différemment selon sa teneur en fibres.',
    E'## Les fibres ralentissent tout\n\nLes fibres solubles forment un gel dans l''intestin qui ralentit la vidange gastrique et l''absorption du glucose. Concrètement : un même nombre de grammes de glucides produit un pic plus bas et plus étalé.\n\n## En pratique\n\n- Commencez le repas par les légumes, pas par le féculent.\n- Préférez les céréales complètes aux céréales raffinées.\n- Visez 25 à 30 g de fibres par jour.\n\n> Ces informations sont générales et ne remplacent pas l''avis de votre médecin ou de votre diététicien.',
    4,
    true
  ),
  (
    'the-vert-resistance-insuline',
    'Le Thé Vert : allié contre la résistance à l''insuline',
    'tea_therapy',
    'Ce que la recherche montre — et ne montre pas — sur les catéchines du thé vert.',
    E'## Ce que dit la recherche\n\nPlusieurs méta-analyses associent une consommation régulière de thé vert à une amélioration modeste de la sensibilité à l''insuline. Le composé le plus étudié est l''EGCG, une catéchine.\n\n## Les limites\n\nLes effets observés sont **modestes et variables** d''une personne à l''autre. Le thé ne remplace en aucun cas un traitement.\n\n## Le rituel compte aussi\n\nUne pause thé après le repas, c''est aussi 10 minutes assis au calme — un facteur de réduction du stress qui joue également sur la glycémie.\n\n> Ces informations sont générales et ne remplacent pas l''avis de votre médecin.',
    5,
    true
  ),
  (
    'petit-dejeuner-sale-vs-sucre',
    'Petit-déjeuner salé vs sucré : le test',
    'nutrition',
    'Deux petits-déjeuners isocaloriques, deux courbes glycémiques très différentes.',
    E'## Le protocole\n\nMême nombre de calories, composition opposée : d''un côté tartines-confiture-jus, de l''autre œufs-avocat-pain complet.\n\n## Le résultat typique\n\nLe petit-déjeuner sucré produit un pic précoce et marqué, suivi d''une hypoglycémie réactionnelle vers 11 h — celle qui déclenche le grignotage.\n\nLe petit-déjeuner salé, riche en protéines et lipides, produit une courbe nettement plus plate.\n\n## Testez sur vous\n\nUtilisez GlucoApp pour mesurer votre propre réponse : à jeun, puis à +1 h et +2 h.',
    4,
    true
  ),
  (
    'stress-et-glycemie',
    'Gérer son stress pour stabiliser sa glycémie',
    'cardiovascular',
    'Le cortisol fait monter la glycémie même à jeun. Ce qui aide vraiment.',
    E'## Le mécanisme\n\nSous stress, le cortisol et l''adrénaline libèrent du glucose stocké dans le foie. La glycémie monte **sans que vous ayez mangé**.\n\n## Ce qui fonctionne\n\n- La cohérence cardiaque : 5 minutes, 3 fois par jour.\n- La marche, même lente, après les repas.\n- Un sommeil régulier : une seule nuit courte dégrade la tolérance au glucose dès le lendemain.\n\n> En cas de glycémies durablement élevées, consultez votre médecin.',
    6,
    true
  ),
  (
    'marche-digestive-15-minutes',
    'La marche digestive de 15 minutes',
    'physical_activity',
    'Le geste le plus rentable de la journée pour lisser un pic post-prandial.',
    E'## Pourquoi ça marche\n\nLe muscle en contraction capte le glucose sanguin **sans avoir besoin d''insuline**. C''est immédiat.\n\n## Le bon timing\n\nEntre 15 et 30 minutes après la fin du repas, au moment où la glycémie commence à monter.\n\n## Combien\n\n10 à 15 minutes d''allure tranquille suffisent à réduire sensiblement le pic. Nul besoin de transpirer.',
    3,
    true
  )
on conflict (slug) do nothing;
