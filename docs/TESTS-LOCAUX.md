# Tests fonctionnels locaux

Le script `scripts/qa-local.mjs` teste l'interface réelle avec Playwright et Google Chrome. Il utilise le projet Supabase configuré dans `.env.local` et un compte de démonstration dédié. Les identifiants, cookies et captures sont conservés dans un dossier temporaire privé, pas dans Git.

## Préparation

Installer les dépendances avec `npm ci`. Google Chrome doit être installé. Avec le navigateur Chromium de Playwright, utiliser `npx playwright install chromium`, puis définir `GLUCO_QA_BROWSER=chromium`.

Lancer l'application. Pour des temps représentatifs : arrêter `npm run dev`, exécuter `npm run build`, puis `npm run start -- --hostname 127.0.0.1`.

Le serveur doit écouter sur `http://127.0.0.1:3000`. `GLUCO_QA_URL` permet de choisir un autre port local. Le script refuse les hôtes distants.

## Compte dédié

```sh
npm run qa:local -- signup
```

Le compte est créé par le formulaire d'inscription. Si la confirmation d'e-mail est requise, confirmer **ce compte de test uniquement** depuis l'administration Supabase avant de continuer. Ne pas désactiver globalement la confirmation pour un test.

Les identifiants sont dans `account.json` du dossier indiqué par `npm run qa:local -- account`. Le dossier par défaut est `glucoapp-qa` dans le répertoire temporaire du système ; `GLUCO_QA_OUTPUT` permet de fixer un autre dossier privé **hors dépôt**. Garder ce dossier pour toutes les étapes d'une même campagne.

## Campagne

Exécuter les étapes dans l'ordre, une par une :

```sh
npm run qa:local -- onboard
npm run qa:local -- screens
npm run qa:local -- actions
npm run qa:local -- regressions
npm run qa:local -- routing
npm run qa:local -- performance
npm run qa:local -- public
```

- `onboard` vérifie la connexion et les deux étapes du profil. À lancer une seule fois sur un nouveau compte.
- `screens` contrôle les écrans principaux aux largeurs 320, 390, 768 et 1440 px : chargement, erreurs, débordements et captures.
- `actions` crée des données fictives : relevés, repas, pesée, rappel et sessions de thé. Il teste aussi les unités, favoris, duplications, suppressions avec confirmation et articles.
- `regressions` vérifie les liens repas→mesure en base, la conservation du contexte et du profil, les filtres, la navigation et l'isolation des données dans sept tables.
- `routing` vérifie les pages introuvables (repas, session, article), le retour à l'accueil et le retour OAuth incomplet.
- `performance` mesure les navigations complètes avec données Supabase et le délai visuel du pavé numérique. Cela ne remplace pas un test de charge ni une mesure INP sur de vrais appareils.
- `public` vérifie les routes privées sans session, l'introduction, les erreurs de connexion et la déconnexion.

Des fichiers JSON consignent les résultats, durées et erreurs JavaScript. Les tests peuvent modifier ou supprimer les **données du compte dédié** et conservent des exemples pour une exploration manuelle. Ne jamais fournir les identifiants d'un utilisateur réel à ce script.

Pour rejouer uniquement un contrôle déjà identifié, définir `GLUCO_QA_FILTER` avec un fragment de son nom. Le résultat est enregistré séparément dans un fichier `*-filtered.json`.

## Chargement du design dans Safari et Chrome

Sur le serveur de production local, contrôler les styles, polices, icônes,
couleurs, débordements et le bouton d'affichage du mot de passe :

```sh
npx playwright install webkit
node scripts/qa-design.mjs
```

Google Chrome doit également être installé. Ce contrôle sans compte utilise
WebKit et Chrome sur les pages de connexion et d'inscription, à 390 et 1440 px.
Les captures sont enregistrées dans le dossier temporaire affiché.
`GLUCO_QA_URL` permet de tester un autre port local.

La CSP ne doit pas envoyer `upgrade-insecure-requests` ni HSTS sur le serveur
HTTP local, même avec `NODE_ENV=production`. Safari tenterait autrement de
charger les ressources en HTTPS et afficherait une page sans styles. Ces
protections restent actives pour les pages servies en HTTPS en production.

## Limites

La campagne fonctionnelle couvre les parcours locaux sur Chrome ; le contrôle du design ajoute WebKit, avec affichages mobile et ordinateur. Ils ne simulent pas un vrai appareil iOS/Android, un réseau mobile dégradé, une charge multi-utilisateur ou le parcours OAuth Google/Apple. Les notifications push nécessitent encore leur propre implémentation et un test sur appareil.
