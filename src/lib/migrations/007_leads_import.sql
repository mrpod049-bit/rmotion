-- =====================================================================
-- Migration 007 — Champs d'import des prospects scrapés (inbox de leads)
-- Idempotente. Applique avec :
--   node scripts/migrate.mjs src/lib/migrations/007_leads_import.sql
-- =====================================================================

-- Clé naturelle anti-doublon pour la synchro CSV (nom + code postal normalisés).
-- NULL pour les leads/opportunités créés à la main (plusieurs NULL autorisés).
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS import_key   VARCHAR(200);

-- Coordonnées & qualification issues du scraping.
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS sector       VARCHAR(80);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS city         VARCHAR(120);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS department   VARCHAR(10);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS activity     VARCHAR(200);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS website      VARCHAR(200);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS score        INTEGER;

-- Statut de contact (croisé avec sent.csv) — le point clé demandé.
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS contacted    BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS contacted_at TIMESTAMP;

-- Unicité de la clé d'import (permet l'upsert ON CONFLICT ; NULL non contraints).
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_leads_import_key ON crm_leads(import_key);

-- Filtrage rapide de l'inbox (leads bruts non convertis).
CREATE INDEX IF NOT EXISTS idx_crm_leads_type ON crm_leads(type);
