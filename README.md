# GlucoApp

Suivi glycémique, composition de repas et rituel du thé régulateur.

Application développée à partir du prototype Google Stitch **GlucoApp Prototype Design**
(projet `10900663085498802054`, 19 écrans, design system « Botanical Health Narrative »).

## Stack

| Couche | Technologie |
|---|---|
| Front | Next.js 15 (App Router) · React 18 · TypeScript |
| Style | Tailwind CSS 3.4 — tokens portés depuis Stitch |
| Back / BDD | Supabase (Postgres + Auth + Row Level Security) |
| Graphiques | Recharts |
| Distribution | PWA installable |

## Prérequis

**Node.js 20 ou supérieur** — actuellement absent de cette machine.

Installation (au choix) :

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash && nvm install 22
```

ou via le paquet officiel : <https://nodejs.org/en/download>

## Installation

```bash
cd glucoapp && npm install
```

```bash
cp .env.local.example .env.local
```

Renseignez ensuite `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
depuis *Supabase → Project Settings → API*.

## Base de données

Dans l'éditeur SQL Supabase, exécutez dans l'ordre :

1. `supabase/migrations/0001_init.sql` — tables, enums, triggers, politiques RLS
2. `supabase/migrations/0002_harden_functions.sql` — révocation d'EXECUTE sur les
   fonctions de trigger, `search_path` figé
3. `supabase/migrations/0003_search_foods.sql` — recherche d'aliments
4. `supabase/migrations/0004_optimize_rls_and_fk_indexes.sql` — RLS en InitPlan,
   index de clés étrangères
5. `supabase/migrations/0005_rate_limiting.sql` — compteur de quotas persistant
6. `supabase/migrations/0006_personal_journal_and_meal_followup.sql` — contexte des mesures, favoris de repas et suivi repas→mesure
6. `supabase/seed.sql` — catalogues aliments / thés / articles

### Convention d'unités

Les maquettes mélangent `g/L`, `mmol/L` et `mg/dL`. La règle retenue :

> **Toute glycémie est stockée en `mg/dL`** (unité canonique, entière, sans perte)
> et convertie à l'affichage selon `profiles.preferred_unit`.

Toute la conversion est centralisée dans [`src/lib/units.ts`](src/lib/units.ts).

## Lancement

```bash
npm run dev
```

## Architecture

```
src/
  app/
    page.tsx              Splash « Lancement de GlucoApp »
    onboarding/           3 slides + profil médical (2 étapes)
    inscription/          Création de compte
    connexion/            Connexion
    auth/                 Actions serveur + callback OAuth
    (app)/                Écrans authentifiés (shell : TopAppBar + BottomNav)
      tableau-de-bord/
      glycemie/           Historique, saisie
      poids/saisie/
      repas/              Liste, composition, impact, compensation
      the/                Espace thé, session, résumé
      conseils/           Bibliothèque, article
      profil/             Profil, rappels
  components/
    shell/  ui/  glucose/  tea/  nutrition/  content/  auth/
  lib/
    supabase/             Clients navigateur et serveur
    units.ts              Conversion g/L ↔ mmol/L ↔ mg/dL, IMC
    glycemia.ts           Statistiques, tendances, contextes
    nutrition.ts          Charge glycémique, modèle de prédiction
    tea.ts                Machine à états de session, effet observé
    articles.ts           Catégories de la bibliothèque
  types/database.ts       Types GÉNÉRÉS depuis la base
supabase/
  migrations/             0001 à 0005
  seed.sql
```

## Points d'attention

- **Le build télécharge Inter et Newsreader depuis Google Fonts**
  (`next/font/google`). Elles sont ensuite servies localement, mais sans accès
  réseau au moment du build, `npm run build` échoue. La police d'icônes
  Material Symbols, elle, est déjà auto-hébergée (`public/fonts/`).
- **La limitation de débit est par processus** tant que
  `SUPABASE_SERVICE_ROLE_KEY` n'est pas définie. En déploiement multi-instances,
  elle est partiellement contournable jusque-là.
- **Pas de tests automatisés** ni de service worker : l'application est
  installable en PWA mais ne fonctionne pas hors ligne.
- **Suppression non branchée** : les actions `supprimerReleve` et
  `supprimerRepas` existent et sont sécurisées, mais aucun écran ne les appelle.
- **Les rappels ne déclenchent pas encore de notification quand l'application est fermée** : un fournisseur Web Push et un service worker restent nécessaires au déploiement.
- Ne jamais lancer `npm run build` pendant que `npm run dev` tourne : les deux
  écrivent dans `.next` et le serveur de dev sert alors des fichiers incohérents.

## Avertissement

GlucoApp est un outil de **suivi personnel**. Les estimations de pic glycémique
et les suggestions de compensation sont des indications générales calculées à
partir de moyennes de population. Elles ne constituent pas un avis médical et ne
remplacent ni un traitement, ni le suivi par un professionnel de santé.
