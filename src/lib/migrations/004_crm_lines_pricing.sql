-- =====================================================================
-- Migration 004 — Chiffrage : prix/coût par machine + lignes par lead
-- Idempotente. Applique avec :
--   node scripts/migrate.mjs src/lib/migrations/004_crm_lines_pricing.sql
-- =====================================================================

-- --- Prix de vente & coût de revient sur le catalogue machines --------
-- sale_price : prix de vente HT unitaire conseillé (€)
-- cost_price : coût de revient d'IMPORT en France, unitaire (€)
--              (achat + import ; hors acheminement final / mise à dispo,
--               qui se saisit par ligne de lead)
ALTER TABLE machines ADD COLUMN IF NOT EXISTS sale_price NUMERIC(12,2);
ALTER TABLE machines ADD COLUMN IF NOT EXISTS cost_price NUMERIC(12,2);

-- --- Lignes de chiffrage d'un lead (façon sale.order.line d'Odoo) ------
-- Chaque ligne fige ses montants au moment de l'ajout (copiés depuis la
-- machine mais modifiables), pour ne pas réécrire l'historique quand le
-- catalogue change.
CREATE TABLE IF NOT EXISTS crm_lead_lines (
  id             SERIAL PRIMARY KEY,
  lead_id        INTEGER NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  machine_id     INTEGER REFERENCES machines(id) ON DELETE SET NULL,
  label          VARCHAR(200) NOT NULL,          -- nom figé (machine ou libre)
  quantity       INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  unit_price     NUMERIC(12,2) NOT NULL DEFAULT 0, -- prix de vente unitaire HT
  unit_cost      NUMERIC(12,2) NOT NULL DEFAULT 0, -- coût import unitaire
  delivery_cost  NUMERIC(12,2) NOT NULL DEFAULT 0, -- acheminement + mise à dispo, PAR UNITÉ
  created_at     TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_lead_lines_lead ON crm_lead_lines(lead_id);

-- Rappel des formules (calculées à la lecture, pas stockées) :
--   CA ligne     = quantity * unit_price
--   Coût ligne   = quantity * (unit_cost + delivery_cost)
--   Marge ligne  = CA ligne - Coût ligne
