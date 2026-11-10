# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Application de coparentalité

## État actuel du dépôt (à lire en premier)
Le dépôt est encore le template **React Native CLI 0.88 nu** (`AwesomeProject`), **pas Expo**. La stack et les dossiers décrits plus bas sont la cible, pas l'existant. La première étape est la migration vers Expo + Expo Router (TypeScript strict) ; d'ici là :

```sh
npm start / npm run android / npm run ios   # Metro, builds natifs (Node >= 22.11)
npm run lint                                # ESLint
npm test                                    # Jest
npx jest __tests__/App.test.tsx             # un seul fichier de test
npx jest -t "renders correctly"             # un seul test par nom
npx tsc --noEmit                            # vérification des types
cd ios && bundle exec pod install           # après tout ajout de module natif (bundle install la 1re fois)
```

Le nom `AwesomeProject` est dupliqué dans `app.json`, `MainActivity.kt` (`getMainComponentName`), `ios/AwesomeProject/SceneDelegate.swift` (`withModuleName`), `android/settings.gradle` et l'`applicationId` `com.awesomeproject` : tout renommer ensemble. Mettre à jour cette section une fois Expo en place (commandes `npx expo start`, EAS, etc.).

## Références
- Cahier des charges : `docs/cahier-des-charges.md` (fonctions, priorités, règles métier). À lire avant toute fonction.
- Maquettes : [LIEN DU CANVAS] — un écran par fonction, rangés par priorité, avec les règles d'interface en note verte. En cas d'écart entre maquette et cahier des charges, le cahier des charges fait foi ; signaler l'écart.
- Design system : couleurs, typo et espacements dans `src/theme`, issus du design system « Coparentalité ».

## Stack
- React Native + Expo, TypeScript strict
- Expo Router · TanStack Query (tous les appels API) · Zustand (état local léger uniquement)
- React Hook Form + Zod · NativeWind
- expo-secure-store, expo-notifications, expo-image-picker, expo-image-manipulator
- react-native-calendars · react-native-purchases (RevenueCat) · Sentry
- Types de l'API générés depuis l'OpenAPI du backend, jamais écrits à la main

## Dossiers
- `app/(auth)`, `app/(onboarding)`, `app/(tabs)`, `app/(child)`
- `src/api` : client HTTP, types générés, hooks par domaine
- `src/components` : composants réutilisables
- `src/features/<fonction>` : écrans secondaires et composants propres
- `src/schemas` : schémas Zod alignés sur le backend
- `src/lib` : Sentry, notifications, RevenueCat, formats français
- `src/theme` : jetons clair et sombre exposés à NativeWind

## Règles absolues
1. Le front ne décide de rien de sensible : droits, calcul de garde, montants, immuabilité des messages sont vérifiés par le backend.
2. Jetons uniquement dans expo-secure-store, jamais AsyncStorage. Aucune clé d'API dans l'app.
3. Un message envoyé ne peut être ni modifié ni supprimé : aucune action ne le propose.
4. Toute photo est réencodée avant envoi pour supprimer les métadonnées (GPS).
5. Dates en français, fuseau Europe/Paris, via les helpers de `src/lib` (« mar. 10 nov. », « 17 h 50 »). Montants en euros (« 42,50 € », espace insécable), reçus en centimes.
6. Chaque écran gère quatre états : chargement (squelettes), vide (phrase + action), erreur (cause + « Réessayer »), contenu.
7. Accessibilité : `accessibilityLabel` en français sur tout élément interactif et toute icône seule, contraste AA, `allowFontScaling` actif (plafond 1,4 seulement sur la barre d'onglets et les cases du calendrier mois), cibles ≥ 44 px.
8. Mode sombre via `useColorScheme()`.
9. Ton neutre : vouvoiement, faits plutôt qu'intentions, parents nommés par leur prénom. L'app ne prend jamais parti.

## Règles de couleur
- Jamais de couleur en dur dans un composant : uniquement les jetons de `src/theme`.
- Deux couleurs de garde (`parent-a`, `parent-b`), toujours accompagnées de l'initiale ou du prénom ; jamais en couleur de texte.
- `shared` (violet) = Partagé ; `pending` (ardoise) + icône pour « En attente » et « Contesté » ; `error` pour les erreurs techniques uniquement.
- `accent` (jaune) réservé au bouton rond « + », sans signification.

## Règles d'interface
- 5 onglets : Accueil, Calendrier, Messages, Famille, Dépenses. L'avatar en haut à droite ouvre « Compte et famille ».
- Action principale d'un onglet : bouton rond « + » `accent` avec `accessibilityLabel`.
- Création : Annuler · titre · action à droite. Sous-réglage : retour + OK. Décision : retour + bouton principal en bas.
- Visibilité : trois mots seulement, Privé, Partagé, Famille.
- Tout ce qui attend une réponse apparaît dans « À traiter ».

## Méthode de travail
- Une seule fonction à la fois, plan validé avant le code, en commençant par la priorité 1.
- Avant de coder une fonction : relire sa section du cahier des charges et ses écrans dans les maquettes.
- Un commit Git après chaque étape qui fonctionne.
- Une fonction est terminée seulement si elle a ses tests (Jest + React Native Testing Library) et gère les quatre états.
- Parcours critiques en Maestro : inscription, création de famille, envoi de message, ajout de dépense, publication.
- Builds et publication avec EAS ; trois environnements (développement, préproduction, production), chacun avec l'URL de son API.

## Style de code
Prettier : guillemets simples, virgules finales, `arrowParens: 'avoid'`.
