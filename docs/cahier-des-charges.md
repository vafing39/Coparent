# Cahier des charges — Fonctionnalités de priorité 1

## 1. Compte et authentification
- Création de compte par email et mot de passe (12 caractères minimum), ou avec Apple ou Google. Apple est obligatoire dès que Google est proposé.
- Vérification de l'adresse email, avec renvoi de l'email et modification de l'adresse.
- Connexion, déconnexion.
- Mot de passe oublié : envoi d'un lien de réinitialisation (valable 30 minutes). La réponse est neutre, que le compte existe ou non.
- Modification du mot de passe.
- Téléchargement de ses données personnelles.
- Suppression du compte depuis l'app (obligatoire sur l'App Store) :
  - les données personnelles sont supprimées sous 30 jours ;
  - les messages déjà envoyés restent visibles par l'autre parent ;
  - la famille, les enfants et le calendrier restent accessibles à l'autre parent ;
  - l'utilisateur est invité à annuler aussi son abonnement dans le store.

## 2. Création de la famille (onboarding en 5 étapes)
1. Vérification de l'email.
2. Famille : nom et zone de vacances scolaires (A, B, C ou Autre).
3. Enfants : prénom et date de naissance, plusieurs enfants possibles.
4. Rythme de garde (voir section 4).
5. Invitation de l'autre parent. Cette étape peut être passée : l'app fonctionne alors en mode solo.

## 3. Invitation et acceptation
- Invitation de l'autre parent par lien, valable 7 jours, à partager ou à copier.
- L'invité voit qui l'invite, les enfants et le rythme proposé, puis crée son compte ou se connecte.
- Rien n'est partagé avec l'invité avant son acceptation.
- Le rythme reste « proposé » tant que l'invité ne l'a pas validé. Il peut en proposer une modification.

## 4. Calendrier de garde
- Rythmes : une semaine sur deux, 2-2-3, 2-2-5-5, week-ends alternés et milieu de semaine, personnalisé.
- Jour et heure de bascule.
- Règles de vacances scolaires :
  - petites vacances partagées par moitié, la première moitié alternant selon l'année paire ou impaire ;
  - été par quinzaines ou par mois.
- Le calendrier est calculé par le backend ; l'app l'affiche.
- Vue mois et vue semaine. Un code couleur par parent, toujours accompagné de l'initiale. Les jours de bascule sont marqués.
- Un séjour chez un tiers (grands-parents) reste attribué au parent concerné, avec un événement par-dessus.
- Chaque parent peut intervertir les deux couleurs, sur son téléphone uniquement.

## 5. Événements
- Création d'un événement :
  - titre et type (rendez-vous, activité, école, autre) ;
  - enfant(s) concerné(s) ;
  - date, heure ou journée entière ;
  - lieu facultatif ;
  - rappel (aucun, 1 h avant, la veille, 2 jours avant).
- Visibilité : Partagé (visible par les deux parents) ou Privé (visible par son auteur seulement). Un événement privé n'est jamais montré à l'autre parent, ni dans l'export, ni dans l'espace enfant.
- Répétition :
  - fréquences : chaque jour, chaque semaine, toutes les deux semaines, chaque mois, ou personnalisée (tous les N jours, semaines ou mois ; choix des jours de la semaine ; horaire différent par jour possible) ;
  - « seulement quand l'enfant est chez » un parent donné, en suivant le calendrier de garde ;
  - exclusion des vacances scolaires (activée par défaut) ;
  - fin : jamais, fin d'année scolaire, ou après N séances ;
  - si « toutes les deux semaines » est choisi sans filtre de parent, l'app suggère le filtre par parent.
- Modification ou suppression d'un événement répété : cet événement seulement, celui-ci et les suivants, ou toute la série. Les séances passées ne sont jamais modifiées.
- Historique des modifications, visible par les deux parents.

## 6. Demande d'échange de garde
- Un parent propose d'échanger des jours ou des week-ends, avec un message.
- L'autre parent accepte, propose une autre date (par la messagerie) ou décline.
- Une fois l'échange accepté, le calendrier est recalculé par le backend pour les deux parents.

## 7. Messagerie entre parents
- Conversation chronologique entre les deux parents.
- Envoi de messages texte et réception en temps réel (WebSocket).
- Indicateur « Envoyé » puis « Lu » avec l'heure.
- Un message envoyé ne peut être ni modifié ni supprimé.
- Les messages sont conservés et horodatés.

## 8. Accueil et « À traiter »
- Accueil :
  - chez qui sont les enfants ce soir ;
  - prochain passage de garde ;
  - événements du jour ;
  - aperçu des demandes à traiter.
- « À traiter » regroupe tout ce qui attend une réponse :
  - à vous de répondre : chaque élément mène à l'écran concerné ;
  - en attente de l'autre parent : depuis quand, et ce qui se passe en l'absence de réponse.
- Relance de l'autre parent : une par jour au maximum, avec un texte neutre envoyé par l'app.

## 9. Mode solo
- Tant que l'autre parent n'a pas rejoint, l'app fonctionne pour un seul parent.
- Le calendrier, les événements et les documents fonctionnent ; l'autre parent les verra à son arrivée.
- La messagerie s'ouvre à son arrivée.
- Les décisions qui demandent l'accord des deux parents lui sont soumises à son arrivée.
- L'invitation peut être renvoyée à tout moment.

## 10. Notifications push
- Nouveau message.
- Passage de garde le lendemain.
- Nouvelle dépense (actif dès la priorité 2).
- Nouvelle publication (actif dès la priorité 2).
- Demande ou réponse en attente (échange, relance).
- Chaque type de notification s'active ou se désactive dans les réglages. Les textes sont neutres et factuels.

## 11. Réglages
- Notifications par type.
- Apparence : automatique, clair ou sombre.
- Inversion des couleurs des parents.

## 12. Navigation
- Cinq onglets : Accueil, Calendrier, Messages, Famille, Dépenses. Famille et Dépenses sont en priorité 2 : il suffit de prévoir les onglets et un état vide.
- L'avatar ouvre « Compte et famille » : réglages, compte, abonnement et accès aux fonctions des autres priorités.
