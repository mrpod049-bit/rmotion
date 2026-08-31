-- =====================================================================
-- Migration 009 — Statut « non intéressé » pour les leads
-- Idempotente. Applique avec :
--   node scripts/migrate.mjs src/lib/migrations/009_not_interested.sql
-- =====================================================================

-- Marque un prospect comme « non intéressé ». Il sort de la liste à qualifier
-- et rejoint la liste dédiée, sans être supprimé (réintégrable à tout moment).
-- La synchro CSV n'y touche JAMAIS (comme contacted_phone) -> le statut tient.
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS not_interested    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS not_interested_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_crm_leads_not_interested ON crm_leads(not_interested);
