-- =====================================================================
-- Migration 006 — Options retenues sur une ligne de lead
-- Idempotente. Applique avec :
--   node scripts/migrate.mjs src/lib/migrations/006_lead_line_options.sql
-- =====================================================================

-- Une option cochée sur une ligne de chiffrage. Les montants sont FIGÉS
-- (copiés depuis machine_options au moment de la sélection), pour ne pas
-- réécrire l'historique si le catalogue change ensuite.
-- machine_option_id garde le lien d'origine (facultatif, SET NULL si l'option
-- catalogue est supprimée).
CREATE TABLE IF NOT EXISTS crm_lead_line_options (
  id                 SERIAL PRIMARY KEY,
  line_id            INTEGER NOT NULL REFERENCES crm_lead_lines(id) ON DELETE CASCADE,
  machine_option_id  INTEGER REFERENCES machine_options(id) ON DELETE SET NULL,
  name               VARCHAR(200) NOT NULL,
  sale_price         NUMERIC(12,2) NOT NULL DEFAULT 0, -- ajouté au prix de vente unitaire
  cost_price         NUMERIC(12,2) NOT NULL DEFAULT 0, -- ajouté au coût unitaire
  created_at         TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_lead_line_options_line ON crm_lead_line_options(line_id);

-- Rappel des formules (les options comptent PAR UNITÉ, comme l'acheminement) :
--   PV effectif ligne   = quantity * (unit_price + Σ options.sale_price)
--   Coût effectif ligne = quantity * (unit_cost + Σ options.cost_price + delivery_cost)
--   Marge ligne         = PV effectif - Coût effectif
