# Vérification fonctionnelle — 2 novembre 2026

La campagne se termine avec **120 contrôles distincts validés**, aucun échec restant dans les contrôles acceptés, aucune erreur JavaScript/hydratation/CSP et aucune réponse HTTP 500 observée dans les suites finales. Le build, TypeScript et ESLint passent. Ces résultats décrivent les parcours ci-dessous ; ils ne constituent pas une garantie exhaustive sur tous les appareils ou toutes les situations.

## Environnement et compte

- Application locale en mode production : `http://127.0.0.1:3000`.
- Next.js 15.5.28, navigateur Google Chrome piloté par Playwright 1.62.1.
- Projet Supabase réel : `dtaojjlotgwjrdcpvuhs`, organisation « nathanmasanka5-3250's projects ».
- Compte dédié, confirmé, nommé « Compte Test ». Ses données sont fictives : mesures, repas, poids, rappels et sessions.
- Les identifiants sont conservés dans `COMPTES-DEV.md`, exclu de Git. Les cookies et captures restent dans un dossier temporaire privé.

La création du compte a été vérifiée par sa redirection réelle vers le profil et par sa présence confirmée dans Supabase. Les 120 contrôles ci-dessous sont distincts de cette vérification initiale. Les contrôles retestés après correction sont comptés une seule fois, avec leur dernier résultat accepté.

## Couverture

| Suite | Contrôles | Vérification |
| --- | ---: | --- |
| Connexion et profil initial | 3 | Connexion, âge, sexe, poids, taille, IMC, situation médicale et accueil |
| Écrans responsives | 44 | 11 écrans × 320, 390, 768 et 1440 px, erreurs et débordements horizontaux |
| Actions fonctionnelles | 17 | Mesures, validations et alertes, notes/contexte, filtres, poids, repas, portions, favoris, duplication, suppression, rappels, unités, conseils et thé |
| Régressions et isolation | 10 | Conservation du contexte et du profil, lien repas→mesure vérifié en base, filtres, navigation et lecture RLS dans 7 tables |
| Routes particulières | 2 | Repas/session/article inexistants, retour à l'accueil, callback OAuth sans code |
| Performance et boutons | 38 | 36 navigations, 10 clics sur le pavé, état d'attente et désactivation pendant l'enregistrement |
| Parcours public | 6 | Lancement, fournisseurs sociaux, routes protégées, introduction, connexion invalide/valide et déconnexion |
| **Total** | **120** | **Tous validés après corrections** |

Les écrans principaux sont : accueil, historique glycémique, saisie glycémique, saisie du poids, repas, composition, thé, nouvelle session, conseils, profil et rappels. Les actions couvrent également les écrans d'impact/stratégies du repas, les deux étapes du profil, la session de thé en cours, son résumé et les cinq articles disponibles.

Les sessions de thé ont été testées avec trois saisies anticipées, ce que l'interface autorise explicitement. Les délais de 30/60/120 minutes n'ont pas été attendus en temps réel. Les sessions terminées de test ont été supprimées via les boutons de confirmation ; leurs relevés restent dans l'historique, conformément au fonctionnement de l'app.

## Temps mesurés

| Mesure | Résultat local |
| --- | ---: |
| Chargement d'un écran : médiane de 36 navigations | **849 ms** |
| Chargement d'un écran : 95e percentile | **1 264 ms** |
| Chargement d'un écran : minimum / maximum | 763 / 1 313 ms |
| Pavé numérique : retour visuel médian sur 10 clics | **27 ms** |
| Pavé numérique : maximum observé | 30 ms |
| Bouton de pesée : affichage de l'état d'attente et désactivation | **37 ms** |
| Pesée enregistrée et retour à l'accueil | 1 857 ms |
| Enregistrer une mesure : échantillon chronométré | 1 533 ms |
| Recherche d'aliments : échantillon chronométré | 1 806 ms |
| Créer un repas et afficher son impact : échantillon chronométré | 4 231 ms |

Les temps de navigation correspondent au chargement du document et de ses données avec Supabase réel, jusqu'à la disponibilité des éléments et des polices attendus par le test. La mesure des touches utilise deux trames d'affichage après le clic : ce n'est pas une mesure INP. Les temps d'actions sont des échantillons, pas des percentiles. La composition de repas reste l'action la plus lente observée.

Ces mesures sont prises sur cette machine, en production locale, sans émulation d'un réseau mobile ni charge concurrente. Le mode développement avait aussi montré des premières visites plus lentes à cause de la compilation ; ces chiffres ne sont pas utilisés dans la médiane ci-dessus.

## Corrections issues des essais

1. Lier une mesure au repas même si le panneau de contexte reste fermé ; sélectionner le contexte « après repas » dans ce parcours.
2. Conserver les champs du contexte quand le panneau est refermé avant l'enregistrement.
3. Recharger l'âge, le sexe, le poids, la taille et la situation médicale lors de la modification du profil.
4. Rendre le bouton « Ignorer » fonctionnel pour poursuivre sans compléter le profil facultatif.
5. Corriger le débordement du champ glycémique des sessions de thé à 320 px.
6. Attendre les actions asynchrones dans les transitions des repas et du thé pour maintenir les boutons en attente et limiter les doubles clics.
7. Réinitialiser l'indicateur de recherche quand le texte devient trop court et adapter la barre de totaux à la navigation latérale.
8. Fiabiliser les changements de période et les filtres en production : pas de préchargement des liens de filtre, retrait du chargement intermédiaire qui intervenait pendant ces navigations.
9. Afficher les boutons Google/Apple uniquement si ces fournisseurs sont activés dans Supabase.
10. Forcer le rendu dynamique du layout racine pour que l'introduction reçoive le nonce CSP de la requête. Sa pré-génération statique bloquait son JavaScript en production. Cette exigence est expliquée dans la [documentation Next.js sur les nonces et le rendu dynamique](https://nextjs.org/docs/app/guides/content-security-policy#dynamic-rendering-requirement).
11. Passer Next.js de 15.5.22 à 15.5.28 et reconstruire l'application ; l'audit npm ne signale plus de vulnérabilité critique sur la configuration installée.

## Limites et travaux encore nécessaires

- Les rappels sont enregistrés et activables, mais **aucune notification push n'est envoyée**.
- Google et Apple ne sont pas configurés sur le projet ; les boutons sont maintenant masqués. Leurs parcours externes ne sont pas validés.
- La PWA ne dispose toujours pas d'un mode de suivi hors ligne.
- Il reste des alertes npm sur les dépendances de production : **5 hautes, 1 modérée, 0 critique** au moment du contrôle, notamment Zod et des dépendances CSS/image. Elles nécessitent une revue et, pour Zod, une migration majeure distincte avant une mise en ligne publique.
- Les essais d'affichage mobile utilisent des fenêtres Chrome de bureau. Pas de validation sur appareil iOS/Android réel, Safari, réseau dégradé ou charge multi-utilisateur.
- Les alertes et estimations médicales n'ont pas fait l'objet d'une validation clinique.

## Rejouer les tests

Voir [TESTS-LOCAUX.md](TESTS-LOCAUX.md). Les résultats détaillés, sans mots de passe ni jetons, sont dans [qa-resultats-2026-11-02.json](qa-resultats-2026-11-02.json).

Le serveur de production local reste lancé pour permettre l'exploration manuelle. Les changements de cette campagne et de la palette sont locaux ; aucun nouveau push GitHub ni déploiement public n'a été effectué pendant cette campagne.
