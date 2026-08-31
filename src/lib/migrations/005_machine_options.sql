-- =====================================================================
-- Migration 005 — Options par machine (avec prix de vente + coût)
-- Idempotente. Applique avec :
--   node scripts/migrate.mjs src/lib/migrations/005_machine_options.sql
-- =====================================================================

-- Options d'une machine : chaque option ajoute son montant au prix de base
-- (et à son coût) quand elle est retenue sur une opportunité.
CREATE TABLE IF NOT EXISTS machine_options (
  id          SERIAL PRIMARY KEY,
  machine_id  INTEGER NOT NULL REFERENCES machines(id) ON DELETE CASCADE,
  name        VARCHAR(200) NOT NULL,
  sale_price  NUMERIC(12,2) NOT NULL DEFAULT 0,  -- montant ajouté au prix de vente
  cost_price  NUMERIC(12,2) NOT NULL DEFAULT 0,  -- montant ajouté au coût de revient
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_machine_options_machine ON machine_options(machine_id);
