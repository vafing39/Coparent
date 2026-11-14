# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Application de coparentalité

## État actuel du dépôt (à lire en premier)

Application **React Native CLI 0.88** (pas Expo), TypeScript strict. Déjà construit : accueil, connexion par email, inscription, reprise de session, textes dans `src/i18n`, et la première connexion complète : vérification de l'email (1), famille (2), enfants (3), rythme de garde et vacances scolaires (4), invitation de l'autre parent (5, facultative). Côté invité : le lien d'invitation ouvre l'app (aperçu, inscription ou connexion, puis acceptation automatique). Ensuite, l'app affiche la barre des 5 onglets (`TabsNavigator`) : Accueil (ce soir et prochain passage d'après `GET /families/{id}/custody`, bannière solo (état du dernier lien, `family.invitation`, et « Inviter l'autre parent » ou « Renvoyer l'invitation » vers `InviterParent` : `InvitationForm` en variante `resend`, prénom repris, un nouveau lien remplace le précédent ; même entrée sur la carte famille de « Compte et famille »), « Aujourd'hui » (événements du jour, un appui ouvre le détail), « À traiter » (`ToDoProvider`, `GET /families/{id}/to-do` : aperçu de deux demandes et « Tout voir (n) » vers son écran, sections « Demandes reçues » et « En attente de … » ; côté « En attente » : ce qui se passe sans réponse et « Relancer » une fois par jour, `POST …/to-do/{id}/nudge`, sans notification envoyée pour l'instant ; une demande d'échange de garde (`targetId`) ouvre `ExchangeDetail`, un rythme à valider ouvre `ScheduleProposal` (`src/features/custody` : aperçu, passage de garde, vacances ; « Valider ce rythme » ou « Proposer une modification » avec les formulaires de l'étape 4 pré-remplis), via `openToDoItem` ; les autres lignes sont sans action), « Sac à préparer » du prochain passage (`BagProvider`, `GET /families/{id}/bag` : liste par enfant partagée, ajout, case cochée, suppression par appui long, « X sur Y cochés » sur l'accueil) ; la roue dentée en haut à droite ouvre « Compte et famille » (`src/screens/account` : carte de la famille ; « Mon compte » avec l'adresse et `ModifierMotDePasse` (actuel + nouveau ; les autres appareils sont déconnectés, ce téléphone reçoit une nouvelle session), `MesDonnees` (fichier JSON envoyé par email, trois fois par jour au plus), `SupprimerCompte` (conséquences du cahier des charges, mot de passe, confirmation, puis déconnexion ; compte désactivé tout de suite, données supprimées sous 30 jours par le backend) ; rubrique « Réglages » de ce téléphone : `Apparence` (Automatique / Clair / Sombre) et `CouleursCalendrier` (« Intervertir les couleurs » des parents, sur ce téléphone seulement) ; « Se déconnecter » avec confirmation)), Calendrier (`CalendarProvider` : garde calculée et événements en vue mois ou semaine, mois et semaine précédents ou suivants, jours de passage coupés en deux avec « J›C », pastille violette pour un événement partagé, cadenas pour un privé, légende, en vue mois un jour touché détaillé sous la grille à la place de « À venir » (garde, événements cliquables, « + » pour créer un événement ce jour-là ; touché à nouveau ou changement de période : désélectionné), « À venir » avec les cinq prochains passages et événements ; « Demander un échange » (deux parents seulement) vers `ExchangeForm` : je prends des nuits de l'autre parent, en option je lui en laisse, avec un message ; `ExchangeDetail` (`src/features/exchanges`) : accepter, refuser ou « Proposer une autre date » (ouvre `NewConversation` avec un sujet pré-rempli, la demande reste en attente) pour l'autre parent, « Annuler la demande » pour le demandeur ; une nuit échangée garde la couleur de son parent avec la mention « Échange » ; bouton « + » vers `EventForm` (création ou modification ; rappel enregistré mais pas encore envoyé ; ligne « Répéter » vers `RepeatForm` : fréquence, « Seulement quand … est chez », hors vacances scolaires, fin, aperçu des prochaines dates par `POST …/events/repeat-preview`, suggestion de suivre la garde pour « Toutes les deux semaines », et « Personnalisé » vers `CustomRepeatForm` : tous les N jours, semaines ou mois, jours de la semaine (celui de l'événement toujours coché) avec un horaire par jour possible, le quantième ou le rang du jour pour un mois) et `EventDetail` (« Ce jour-là » : chez qui sont les enfants ou le passage de garde ce jour-là, via `openDayCustody` de `CustodyProvider` ; règle de la série, modifier, supprimer ; pour une séance, `ScopeSheet` demande « Cet événement seulement », « Celui-ci et les suivants » ou « Toute la série », seule cette dernière pour une séance passée ; en bas, l'historique des modifications de l'événement et de sa série, `EventHistory`) dans `src/features/events` ; prénoms, initiales et couleurs des parents partagés dans `src/features/custody`), Messages (`MessagesProvider` : discussions par sujet avec l'autre parent ; l'onglet liste les discussions (sujet, dernier message, non-lus) avec « + » vers `NewConversation` (sujet + premier message), sous la discussion « Bienvenue » épinglée (`Welcome` : un message de Coparent affiché par l'app, rien en base, sans réponse possible, deux parents seulement) ; une discussion (`Conversation`, `src/features/messages`) s'ouvre en plein écran par-dessus les onglets : pages de messages, envoi, « Envoyé » puis « Lu » avec l'heure, temps réel par WebSocket STOMP (`src/lib/realtime.ts`, `@stomp/stompjs`) au premier plan seulement, aucune action sur un message envoyé ; en solo, écran d'attente ; pas encore de notifications ni de badge sur l'onglet), Famille (priorité 2 : sélecteur « Fil / Enfants / Documents », `FamilySectionSwitcher` ; Fil et Enfants annoncent seulement leur contenu, Documents s'ouvre par défaut. Documents (`DocumentsProvider`, `src/features/documents`) : filtres par catégorie (Tous, École, Assurance, Identité, Jugement, Autre), lignes dépliables (« Catégorie · enfant · ajouté par X, date ») avec « Ouvrir le document » (`POST …/documents/{id}/open` enregistre la consultation et renvoie le chemin d'un lien temporaire de 5 minutes, préfixé par `API_URL` (`documentLinkUrl`) puis ouvert par `Linking.openURL` dans le lecteur du téléphone), « Consultations (n) » (historique des ouvertures et de la suppression, pour les deux parents ; replié au départ, déplié d'un appui) et « Supprimer » pour l'auteur (confirmation ; le document reste listé, « Supprimé par X ») ; « + » vers `DocumentForm` (modal) : « Photographier » (appareil photo ou photothèque, `react-native-image-picker`) ou « Choisir un fichier » (PDF, JPEG, PNG depuis Fichiers, `@react-native-documents/picker`, `src/lib/documentFile.ts`), carte du fichier, nom repris du fichier, catégorie, enfant (un enfant ou « Tous », caché avec un seul enfant), envoi multipart ; marche aussi en solo) et Dépenses (priorité 2, `ExpensesProvider`, `src/features/expenses` : à deux, carte du solde courant (dépenses validées moins virements confirmés) vers `Balance` (« Comment il est calculé », puis « Règlement » : le débiteur déclare son virement, le créancier confirme la réception ou « Je ne l'ai pas encore reçu », le déclarant peut l'annuler ; l'app n'effectue aucun paiement), filtres Toutes / En attente / Contestées / Validées, et la liste : « Accepter » ou « Contester » (vers `ContestExpense` : motif et précision) pour l'autre parent, « Corriger » (`ExpenseForm` avec `expenseId`, la dépense repasse en attente) ou « Retirer » pour l'auteur ; en solo, total « Enregistré en attendant X » et lignes « À proposer à X », proposées à l'autre parent quand il rejoint ; « + » vers `ExpenseForm` : libellé, montant, catégorie, enfants, payeur, date, répartition (`SplitSheet` : 50/50, 60/40, 70/30, 100 %, dans les deux sens), part de l'autre parent affichée à titre indicatif, et en haut le justificatif photo facultatif (`ReceiptField` : « Prendre une photo » ou « Choisir dans la photothèque » via `react-native-image-picker`, `src/lib/receiptPhoto.ts`, réduite à 2000 px en JPEG ; miniature, « Remplacer », « Retirer » ; `saveExpense` envoie la dépense puis la photo en multipart `PUT …/expenses/{id}/receipt` ou `DELETE` ; si seule la photo échoue, `ReceiptUploadError` : le formulaire reste ouvert sur la dépense enregistrée et réessayer la corrige, sans doublon ; le serveur retire GPS et métadonnées). Une dépense avec justificatif (`receiptUpdatedAt`) a un lien « Justificatif » (liste et `ContestExpense`) vers `Receipt` (plein écran, image chargée avec le jeton de session et `?v=receiptUpdatedAt`, `useReceiptSource`). Dans « À traiter », une dépense ouvre l'onglet Dépenses, un virement à confirmer ouvre `Balance`. Les dossiers et bibliothèques listés plus bas qui n'existent pas encore sont la cible.

L'app appelle le backend Spring Boot (`../Coparent backend`) : URL dans `.env` (`API_URL`, voir `.env.example`), par défaut `http://localhost:8080` (iOS) ou `http://10.0.2.2:8080` (émulateur Android). En développement, les emails arrivent dans Mailpit : http://localhost:8025.

Commandes :

```sh
npm start / npm run android / npm run ios   # Metro, builds natifs (Node >= 22.11)
npm run lint                                # ESLint
npm test                                    # Jest
npx jest __tests__/App.test.tsx             # un seul fichier de test
npx jest -t "renders correctly"             # un seul test par nom
npx tsc --noEmit                            # vérification des types
cd ios && bundle exec pod install           # après tout ajout de module natif (bundle install la 1re fois)
```

Liens d'invitation : `coparent://invitation?token=…` ouvre l'app dès maintenant. Le lien envoyé par le backend (`PUBLIC_BASE_URL/invitation?token=…`) mène à une page web qui l'ouvre. Les liens https directs (Universal Links / App Links) demandent un domaine public : `APP_LINKS_DOMAIN` dans `.env` (app et Android), le même domaine dans `ios/AwesomeProject/AwesomeProject.entitlements` (`applinks:…`, à modifier à la main), et les valeurs `app.links.*` du backend (Team ID, identifiants, empreintes). Tester dans le simulateur : `xcrun simctl openurl booted "coparent://invitation?token=<jeton>"`.

## Références

- Cahier des charges : `docs/cahier-des-charges.md` (fonctions, priorités, règles métier). À lire avant toute fonction.
- Maquettes : https://claude.ai/artifact/7W5ZMXa7GBNwFcqooD1aHq#page-dcb81aee8d83 — un écran par fonction, rangés par priorité, avec les règles d'interface en note verte. En cas d'écart entre maquette et cahier des charges, le cahier des charges fait foi ; signaler l'écart.
- Design system : couleurs, typo et espacements dans `src/theme`, issus du design system « Coparentalité ».

## Stack (React Native pur, sans Expo)

- React Native CLI, TypeScript strict
- Navigation : React Navigation (native-stack + bottom-tabs)
- Données : TanStack Query pour tous les appels API, détenus par les contextes (voir « Contextes et hooks ») ; Zustand uniquement pour l'état local léger (session, préférences) + axios
- Formulaires : React Hook Form + Zod
- Styles : NativeWind
- Stockage sécurisé des jetons : react-native-keychain
- Notifications push : @react-native-firebase/messaging (FCM et APNs) + Notifee pour l'affichage local
- Fichiers : @react-native-documents/picker (« Choisir un fichier » d'un document, mode `import` ; simulé dans `jest.setup.js`)
- Photos : react-native-image-picker, puis réencodage avec @bam.tech/react-native-image-resizer (supprime les métadonnées EXIF, dont le GPS)
- Calendrier : react-native-calendars
- Temps réel : @stomp/stompjs (STOMP sur le WebSocket de React Native, JS pur) ; `src/lib/textCodec.ts` ajoute TextEncoder/TextDecoder s'ils manquent au moteur
- Presse-papiers : @react-native-clipboard/clipboard (copie du lien d'invitation ; simulé dans `jest.setup.js`)
- Photos : react-native-image-picker (justificatif de dépense ; `NSCameraUsageDescription` et `NSPhotoLibraryUsageDescription` dans `Info.plist` ; simulé dans `jest.setup.js`, qui installe aussi le `FormData` de React Native pour lire les fichiers envoyés)
- Sélecteur d'heure : @react-native-community/datetimepicker (dialogue natif sur Android, roue dans une feuille sur iOS ; simulé dans `jest.setup.js`)
- Connexion Apple : @invertase/react-native-apple-authentication ; connexion Google : @react-native-google-signin/google-signin
- Abonnement : react-native-purchases (RevenueCat)
- Erreurs : @sentry/react-native
- Variables d'environnement : react-native-config + .env
- Textes : i18next + react-i18next, langue du téléphone via react-native-localize (français par défaut)
- Polices : Nunito (400, 600, 700, 800) intégrée en fichiers dans `assets/fonts`, liée avec react-native-asset

## Dossiers

- `src/navigation` : navigateurs (Auth, Onboarding, Tabs, Child) et types des routes
- `src/screens/<groupe>` : écrans principaux, par groupe (auth, onboarding, tabs, child)
- `src/api` : client HTTP, types, messages d'erreur par domaine (aucun hook). Les requêtes HTTP sont dans leur contexte (`AuthContext`, `FamilyContext`) ; seul le renouvellement des jetons reste dans `src/api/session.ts`, utilisé par le client HTTP
- `src/components` : composants réutilisables
- `src/context` : contextes des fonctionnalités ; ils détiennent les appels d'API et leur état
- `src/hooks` : hooks d'accès aux contextes et utilitaires (`useAuth`, `useFamily`, `useOnboardingDraft`, `useResetOnUnmount`)
- `src/stores` : stores Zustand sans appel d'API : la session (`session.ts`) et les préférences de ce téléphone (`preferences.ts` : `appearance`, `swapParentColors`, rangées dans AsyncStorage avec `persist`, gardées après une déconnexion ; simulé dans `jest.setup.js`). `ThemeProvider` les applique : thème choisi (ou celui du téléphone), `Appearance.setColorScheme` pour les éléments natifs, et variables `parent-a*` / `parent-b*` échangées (`swappedToken` de `tokens.ts`), donc toutes les classes `parent-*` suivent
- `src/test-utils` : jeux de données et `renderWithProviders` pour les tests
- `src/features/<fonction>` : écrans secondaires et composants propres à une fonction
- `src/schemas` : schémas Zod alignés sur le backend
- `src/lib` : Sentry, notifications, RevenueCat, formats de date et de montant en français. Les dates passent par Day.js, configuré une fois dans `src/lib/dayjs.ts` (français, fuseau Europe/Paris) ; un jour « AAAA-MM-JJ » se lit avec `calendarDay` de `src/lib/dates.ts`
- `src/theme` : jetons clair et sombre exposés à NativeWind
- `src/i18n` : configuration i18next et textes de l'app (`locales/fr.json`)

## Contextes et hooks

- Tout appel d'API passe par un contexte de `src/context`, qui détient la mutation ou la requête TanStack Query et son état. Aucun `useMutation`/`useQuery` dans un écran ou un composant.
- Dans le contexte, chaque `useMutation` est déstructuré et renommé, puis exposé à plat : `const { mutate: addChild, isPending: isAddingChild, error: addChildError, reset: resetAddChild } = useMutation(...)`. Les écrans lisent ces noms : `const { login, isLoggingIn, loginError, resetLogin } = useAuth(); login(values)`. Seul `mutate` est exposé (pas `mutateAsync`).
- `AuthProvider` (dans `App.tsx`, via `useAuth`) : session lue dans le store Zustand (`status`, `user`, `authEntry`) et toutes les actions d'authentification (`login`, `signup`, `verifyEmail`, `resendEmailVerification`, `forgotPassword`, `resetPassword`, `signOut`, `restore`). Le store (`src/stores/session.ts`) est un état pur, sans appel d'API. Seule exception : le renouvellement des jetons (`src/api/session.ts`, `refreshSession`), mécanique du client HTTP (rejeu après un 401), réutilisée par `restore`. Hors React (client HTTP), lire le store avec `useSession.getState()`.
- `FamilyProvider` (autour de tout l'espace connecté, dans `SignedInNavigator`, via `useFamily`) : charge la famille une fois et affiche lui-même le chargement et l'erreur ; expose `family` (null si pas encore créée) et ses actions (`saveFamily`, `saveChildren`, `proposeSchedule`, `createInvitation`…). Les écrans qui supposent une famille passent par `RequireFamily`.
- `InvitationProvider` (dans `App.tsx`, via `useInvitation`) : invitation reçue par lien côté invité. Reçoit les liens (`Linking`), garde le jeton dans le trousseau jusqu'à l'acceptation, expose l'aperçu (`preview`) et `acceptInvitation`. Hors connexion, l'`AuthNavigator` s'ouvre sur l'aperçu ; connecté et email vérifié, `SignedInNavigator` affiche l'aperçu (lien ouvert déjà connecté) ou accepte automatiquement (invité passé par l'aperçu).
- `SignedInNavigator` choisit à l'ouverture entre l'app (famille avec au moins un enfant et un rythme) et la première connexion ; pendant celle-ci, c'est la fin de l'étape 5 (`finish` du brouillon) qui ouvre l'app.
- `BagProvider` (à côté de `CustodyProvider`, via `useBag`) : sac du prochain passage et ses actions (`addBagItem`, `deleteBagItem`, `setBagItemChecked`) ; chaque action renvoie le sac entier, mis en cache.
- `ToDoProvider` (à côté de `BagProvider`, via `useToDo`) : « À traiter » (`toDo.mine`, `toDo.theirs`) et `nudgeToDo`.
- `AccountProvider` (autour d'`AppNavigator`, via `useAccount`) : « Mon compte » : `changePassword` (la réponse ouvre la nouvelle session avec `signIn`), `requestDataExport` (`isDataExportSent`), `deleteAccount(password)` (ferme la session, retour à `Bienvenue`). Erreurs dans `src/api/account.ts` : 403 = mot de passe actuel incorrect (sous le champ), 400 = nouveau mot de passe refusé (message du serveur), 429 = trop d'essais ou trop de demandes.
- `CalendarProvider` (via `useCalendar`) : garde et événements de la période affichée et des 60 prochains jours (`periodEvents`, `upcomingEvents`), lus aussi par l'accueil. `EventsProvider` (via `useEvents`) : `createEvent`, `updateEvent` et `deleteEvent` (avec `scope` et `date` pour une séance), qui rechargent les listes d'événements, `previewRepeat(request | null)` / `repeatPreview` pour l'aperçu d'une répétition, et `openHistory(id)` / `closeHistory()` / `history` pour l'historique d'un événement (rechargé après chaque enregistrement). Une séance est identifiée par `eventItemKey` (`id:date`).
- `ExchangesProvider` (à côté de `MessagesProvider`, via `useExchanges`) : `createExchange` et `answerExchange` (`accept`, `decline`, `cancel`) ; l'écran de détail appelle `openExchange(id)` / `closeExchange()` puis lit `exchange`. Après chaque action : `exchangeKeys`, « À traiter » et toute la garde (`custodyKeys.all`) sont rechargés. Les refus du serveur (400, 409) sont affichés tels quels (`exchangeErrorMessage`).
- `ExpensesProvider` (à côté de `MessagesProvider`, via `useExpenses`) : `expenses` et `balance` (deux parents seulement), `saveExpense` (création, ou correction avec `id`), `answerExpense` (`accept`, `contest` avec motif et précision, `withdraw`), `declareSettlement(montant)` et `answerSettlement` (`confirm`, `not-received`, `cancel`). Après chaque action : `expenseKeys.all` et « À traiter » sont rechargés. Montants en centimes, formatés par `formatEuros` et saisis avec `parseAmount` (`src/api/expenses.ts`) ; le serveur calcule la part due. Les refus du serveur (400, 409) sont affichés tels quels (`expenseErrorMessage`).
- `ScheduleProposalProvider` (à côté de `ExchangesProvider`, via `useScheduleProposal`) : rythme à valider, `openSchedule(id)` / `closeSchedule()` puis `schedule`, et `acceptSchedule(id)`, qui recharge la famille, « À traiter » et toute la garde. La contre-proposition passe par `proposeSchedule` (FamilyProvider), qui recharge aussi « À traiter » et la garde.
- `MessagesProvider` (à côté de `ToDoProvider`, via `useMessages`) : `conversations` et `createConversation` ; l'écran d'une discussion appelle `openConversation(id)` / `closeConversation()`, puis lit `messages`, `loadOlderMessages`, `sendMessage`, `markMessagesRead` de cette discussion. L'abonnement temps réel (`subscribeFamilyMessages` de `src/lib/realtime.ts`) ajoute les messages reçus à leur discussion, pose « Lu » et recharge la liste. Dans les tests, `src/lib/realtime` est remplacé partout par `src/test-utils/fakeRealtime` (`jest.setup.js`) : `realtime.emit(...)` simule un événement.
- `OnboardingDraftProvider` (via `useOnboardingDraft`) : choix gardés entre deux écrans avant leur envoi (rythme de l'étape 4) et `finish` (fin de la première connexion).
- L'état d'une mutation étant partagé, chaque formulaire appelle `useResetOnUnmount(resetX, …)` avec les fonctions `reset` de ses actions pour ne pas retrouver une ancienne erreur au retour.
- Les hooks (tout ce qui commence par `use`) vont dans `src/hooks`, un fichier par hook ; exceptions : `useSession` (le store) et `useTheme` (avec son fournisseur).
- Tests d'écran : rendre avec `renderWithProviders(ui, { onboarding: true, onFinishOnboarding })`. Remplacer le client HTTP par `src/test-utils/fakeApiClient` (`authApi.login`, `familyApi.addChild`… une fonction simulée par route). Pas de tests dédiés aux contextes.

## Règles absolues

1. Le front ne décide de rien de sensible : droits, calcul de garde, montants, immuabilité des messages sont vérifiés par le backend.
2. Jetons uniquement dans le trousseau sécurisé (react-native-keychain, via `src/lib/tokenStorage.ts`), jamais AsyncStorage. Aucune clé d'API dans l'app.
3. Un message envoyé ne peut être ni modifié ni supprimé : aucune action ne le propose.
4. Toute photo est réencodée avant envoi pour supprimer les métadonnées (GPS).
5. Dates en français, fuseau Europe/Paris, via les helpers de `src/lib` (« mar. 10 nov. », « 17 h 50 »). Montants en euros (« 42,50 € », espace insécable), reçus en centimes.
6. Chaque écran gère quatre états : chargement (squelettes), vide (phrase + action), erreur (cause + « Réessayer »), contenu.
7. Accessibilité : `accessibilityLabel` en français sur tout élément interactif et toute icône seule, contraste AA, `allowFontScaling` actif (plafond 1,4 seulement sur la barre d'onglets et les cases du calendrier mois), cibles ≥ 44 px.
8. Mode sombre via `useTheme().scheme` (téléphone via `useColorScheme()`, ou choix des Réglages).
9. Ton neutre : vouvoiement, faits plutôt qu'intentions, parents nommés par leur prénom. L'app ne prend jamais parti.
10. Always ask validations before implementing a functionnality and only implement what asked, not more
11. Never commit by yourself, i will do it manually

## Règles de couleur

- Jamais de couleur en dur dans un composant : uniquement les jetons de `src/theme`.
- Deux couleurs de garde (`parent-a`, `parent-b`), toujours accompagnées de l'initiale ou du prénom ; jamais en couleur de texte.
- `shared` (violet) = Partagé ; `pending` (ardoise) + icône pour « En attente » et « Contesté » ; `error` pour les erreurs techniques uniquement.
- `accent` (jaune) réservé au bouton rond « + », sans signification.

## Règles de texte

- Aucun texte visible en dur dans le code : écrans, boutons, `accessibilityLabel`/`accessibilityHint`, messages Zod et messages d'erreur passent par `src/i18n/locales/fr.json`.
- Dans un composant : `const { t } = useTranslation()` puis `t('groupe.cle')`. Hors composant (schémas, `src/api`) : `i18n.t(...)` depuis `src/i18n`, et pour Zod un message en fonction (`{ error: () => i18n.t(...) }`) pour suivre la langue active.
- Phrase avec lien ou gras : une seule clé avec balises (`<terms>…</terms>`, `<bold>…</bold>`) rendue par `<Trans>`, jamais une phrase découpée en morceaux.
- Valeurs variables par interpolation (`{{firstName}}`), jamais par concaténation.
- Clés regroupées par écran ou domaine (`signup.title`, `fields.email.label`, `errors.network`) ; les clés sont typées, une clé inconnue ne compile pas.
- Nouvelle langue : `locales/<code>.json` avec les mêmes clés, puis l'ajouter à `resources` dans `src/i18n/index.ts`.
- Exceptions : noms de marque (Apple, Google) et nom de l'app (`APP_NAME`).

## Règles d'interface

- 5 onglets : Accueil, Calendrier, Messages, Famille, Dépenses. La roue dentée en haut à droite de l'accueil ouvre « Compte et famille ».
- Action principale d'un onglet : bouton rond « + » `accent` avec `accessibilityLabel`.
- Création : Annuler · titre · action à droite. Sous-réglage : retour + OK. Décision : retour + bouton principal en bas.
- Visibilité : trois mots seulement, Privé, Partagé, Famille.
- Tout ce qui attend une réponse apparaît dans « À traiter ».
- Messages : la liste des discussions garde la barre d'onglets ; une discussion s'ouvre par-dessus, sans barre, avec une flèche retour.

## Méthode de travail

- Une seule fonction à la fois, plan validé avant le code, en commençant par la priorité 1.
- Mot de passe oublié (écran `MotDePasse`, un seul écran en trois temps : adresse, code + nouveau mot de passe, confirmation) : écart voulu avec le cahier des charges §1, un code à 8 chiffres valable 30 minutes est envoyé par email au lieu d'un lien. La réponse reste neutre (compte existant ou non). La session n'est pas ouverte après le changement : retour à la connexion avec l'adresse reprise.
- Messagerie (§7) : écart voulu avec le cahier des charges, qui prévoit une conversation unique. Les échanges sont rangés en discussions par sujet (sujet fixe, pas de discussion par défaut, ni clôture ni suppression pour l'instant) pour retrouver un échange sans tout faire défiler ; les règles du §7 (temps réel, Envoyé/Lu, immuabilité) s'appliquent à chaque discussion.
- Avant de coder une fonction : relire sa section du cahier des charges et ses écrans dans les maquettes.
- Une fonction est terminée seulement si les tests (Jest + React Native Testing Library) sont terminés et elle gère les quatre états.
- Parcours critiques en Maestro : inscription, création de famille, envoi de message, ajout de dépense, publication.
- Builds et publication avec EAS ; trois environnements (développement, préproduction, production), chacun avec l'URL de son API.
- renomme la branch sur laquelle je suis pour correspondre à la fonctionnalité

## Style de code

Prettier : guillemets simples, virgules finales, `arrowParens: 'avoid'`.
