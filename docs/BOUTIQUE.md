# Boutique outils de coupe (B2B)

Module e-commerce B2B intégré au site. **Tant que `SHOP_ENABLED` ≠ `true`**, le public qui ouvre l'onglet
« Boutique » (`/outils`, `/panier`, `/commande`, `/compte`, `/cgv`) voit une page « Boutique en construction »
(`src/app/boutique-bientot`, réécriture faite par `src/middleware.ts`, aucune requête en base).
L'admin (`/admin/boutique`, protégé par l'auth existante) reste disponible pour préparer le catalogue.

**Aperçu admin** : `/admin/boutique/apercu` pose un cookie signé (HMAC de `ADMIN_PASSWORD`, ou `SHOP_PREVIEW_SECRET`
si défini) valable 30 jours, qui donne accès à la vraie boutique. `/admin/boutique/apercu?off=1` le retire.
Changer le mot de passe admin invalide tous les aperçus.

## Isolation vis-à-vis du site existant
- Base : uniquement des tables nouvelles `shop_*` (migration `src/lib/migrations/shop/001_shop_core.sql`, idempotente).
  Aucune table existante n'est modifiée. Seul lien : `shop_customers.partner_id → crm_partners` (une fiche société
  est créée dans le CRM quand un compte est validé).
- Code : `src/lib/shop/*`, `src/app/(boutique)/*`, `src/app/admin/boutique/*`, `src/app/api/shop/*`.
  Un seul fichier existant touché : `src/app/admin/AdminNav.tsx` (onglet « Boutique »).
- Dépendance ajoutée : `stripe`.

## Fonctionnement
| Sujet | Règle |
|---|---|
| Stock | `shop_stock` (physique / réservé) + journal `shop_stock_movements`. Disponible = physique − réservé. Mises à jour conditionnelles → pas de survente même en simultané. |
| Paiement en ligne | Commande `pending_payment` → stock **réservé** (45 min, réglable) → webhook Stripe « payé » → stock **sorti**, commande `confirmed`. Expiration/abandon → réservation libérée. SEPA : réservation conservée pendant le prélèvement. |
| Paiement à 30 j | Réservé aux comptes autorisés (admin → client), avec plafond d'encours. Stock sorti immédiatement. |
| Entrées de stock | Achats → bon de commande fournisseur → « réception » (partielle ou totale). Met aussi à jour le coût d'achat. |
| TVA | France 20 % ; UE avec n° TVA valide (VIES) : autoliquidation ; hors UE : export exonéré. |
| Comptes | Inscription avec SIRET (annuaire public), validation manuelle par Rmotion, connexion par lien email (sans mot de passe). |
| Documents | Bon de préparation, bon de livraison, bon de commande fournisseur : pages imprimables → « Enregistrer en PDF ». |
| Factures | **Pas encore** (jalon 6) : `shop_orders.invoice_number` et `shop_returns.credit_note_number` sont prévus pour. |

## Mise en service (le jour J)
1. Appliquer la migration sur Neon : `node --env-file=.env.local scripts/migrate.mjs src/lib/migrations/shop/001_shop_core.sql`
2. Déployer le code (merge dans `main`) — la boutique reste invisible.
3. Admin → Réglages (société, port, minimum), catalogue, fournisseurs, BCF → réception du stock.
4. Stripe : activer carte + prélèvement SEPA (Paramètres → Moyens de paiement), créer le webhook
   `https://www.rmotion.fr/api/shop/stripe` (événements `checkout.session.completed`, `.async_payment_succeeded`,
   `.async_payment_failed`, `.expired`).
5. Variables Vercel : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `SHOP_BASE_URL=https://www.rmotion.fr`,
   (optionnel `SHOP_ADMIN_EMAIL`, `SHOP_MAIL_FROM`), puis `SHOP_ENABLED=true` → Redeploy.
6. Faire relire les CGV (`/cgv`, projet) avant ouverture.

Étapes 1 et 2 faites le 2026-11-17 (tables créées sur Neon, code en ligne, boutique en construction).

## Développement local (sans toucher la prod)
Base de test PGlite isolée : `C:\Users\mrpod\Desktop\rmotion-boutique-testdb`
```
node node_modules/@electric-sql/pglite-socket/dist/scripts/server.js --db=./data --port=55432 --max-connections=20
```
Le `.env.local` du worktree pointe sur `127.0.0.1:55432`. Sans `RESEND_API_KEY`, les emails (dont les liens de
connexion) s'affichent dans la console du serveur. Tests métier : `harness/test.mts` (17 scénarios).
