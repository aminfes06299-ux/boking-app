# Plateforme privée de réservation — socle backend

## Mise en route
1. Créez un projet Supabase. Dans Authentication → Providers → Email : **désactivez « Allow new users to sign up »** (accès sur invitation uniquement). Réglez le fuseau/URL de redirection.
2. SQL Editor : exécutez `supabase/migrations/001_init.sql`.
3. Copiez `.env.example` en `.env.local` et remplissez les clés (Supabase → Settings → API ; Resend → API Keys).
4. `npm i next react react-dom @supabase/supabase-js @supabase/ssr resend typescript` puis `npm run dev`.

## Premier administrateur
Authentication → Users → *Invite user* (votre e-mail), acceptez l'invitation, puis en SQL :
`update profiles set role='admin' where email='vous@gmail.com';`
Puis : `update app_settings set notify_email='vous@gmail.com' where id=1;`

## E-mails
Resend : vérifiez votre domaine, renseignez `EMAIL_FROM`. L'envoi part après chaque réservation ; les échecs sont retentés (table `email_outbox`) via `/api/cron/outbox` (Vercel Cron : plan Hobby = 1×/jour max ; sinon un cron externe avec l'en-tête `Authorization: Bearer $CRON_SECRET`).

## Sécurité
Anti-double-réservation : contrainte d'exclusion PostgreSQL + vérification dans `book_slot`. RLS sur toutes les tables. À vérifier avant lancement : loi 09-08 / CNDP (Maroc), mentions légales, politique de confidentialité.

## Pas encore fait
Interface client, calendrier, panneau admin, tests automatisés, e-mails de modification.

## Interface client (ajoutée)
Connexion par lien e-mail (sans mot de passe, comptes invités uniquement). Dans Supabase → Authentication → URL Configuration, ajoutez `http://localhost:3000/auth/callback` et l'URL de production `/auth/callback`.
Lancer : `npm install && npm run dev`.

## Espace administrateur (`/admin`)
Exécutez aussi `supabase/migrations/002_admin.sql`. Ajoutez `SUPABASE_SERVICE_ROLE_KEY` et `NEXT_PUBLIC_SITE_URL` aux variables d'environnement (invitations). Accessible uniquement si `role='admin'` (contrôlé côté serveur et par RLS).
Fonctions : clients (inviter, désactiver), rendez-vous (créer, marquer réalisé/annulé, relancer les e-mails échoués), disponibilités (jours, horaires, congés/blocages/ouvertures), paramètres.
Note : les invitations utilisent l'e-mail de Supabase Auth ; pour un envoi fiable, configurez un SMTP (ex. Resend SMTP) dans Supabase → Authentication → SMTP.

## Tests
`supabase/tests/booking_rules.sql` : à coller dans le SQL Editor (tout est annulé à la fin). Vérifie passé refusé, jour de repos, horizon, durée 60 min, chevauchement, blocages.

## Reste à faire
Vue calendrier admin, arabe (RTL), e-mail de modification, pages confidentialité/mentions légales, tests d'interface (iPhone/Android à vérifier à la main).
