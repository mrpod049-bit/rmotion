-- =====================================================================
-- Migration 014 — Demandes de fiche technique (aimant à leads par produit)
-- Idempotente. Applique avec :
--   node --env-file=.env.local scripts/migrate.mjs src/lib/migrations/014_ft_requests.sql
-- Le visiteur demande la fiche technique d'une machine contre son email ;
-- l'envoi de la fiche se fait manuellement (pour l'instant).
-- =====================================================================

CREATE TABLE IF NOT EXISTS ft_requests (
  id            SERIAL PRIMARY KEY,
  email         VARCHAR(200) NOT NULL,
  nom           VARCHAR(200),
  machine_id    INTEGER REFERENCES machines(id),
  machine_name  VARCHAR(200),
  machine_slug  VARCHAR(200),

  -- Attribution first-party (même schéma que devis_requests).
  gclid         VARCHAR(300),
  utm_source    VARCHAR(200),
  utm_medium    VARCHAR(200),
  utm_campaign  VARCHAR(200),
  utm_term      VARCHAR(200),
  utm_content   VARCHAR(200),
  landing_page  VARCHAR(300),
  referrer      VARCHAR(300),

  sent          BOOLEAN NOT NULL DEFAULT false,   -- fiche envoyée manuellement ?
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ft_requests_created ON ft_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ft_requests_machine ON ft_requests(machine_id);
