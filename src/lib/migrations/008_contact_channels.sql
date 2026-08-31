-- =====================================================================
-- Migration 008 — Canaux de contact séparés (email auto / téléphone manuel)
-- Idempotente. Applique avec :
--   node scripts/migrate.mjs src/lib/migrations/008_contact_channels.sql
-- =====================================================================

-- Email : renseigné automatiquement par la synchro (croisement sent.csv).
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS contacted_email    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS contacted_email_at TIMESTAMP;

-- Téléphone : déclaré à la main dans l'inbox. La synchro n'y touche JAMAIS.
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS contacted_phone    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS contacted_phone_at TIMESTAMP;

-- Reprise de l'existant : l'ancien champ "contacted" provenait des emails.
UPDATE crm_leads
   SET contacted_email = true, contacted_email_at = contacted_at
 WHERE contacted = true AND contacted_email = false;
