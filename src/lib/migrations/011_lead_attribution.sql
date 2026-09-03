-- =====================================================================
-- Migration 011 — Attribution des demandes de devis (source du lead)
-- Idempotente et additive (colonnes nullables). Applique avec :
--   node scripts/migrate.mjs src/lib/migrations/011_lead_attribution.sql
-- Donnée first-party : capturée à l'arrivée du visiteur, enregistrée
-- uniquement lorsqu'il soumet le formulaire de devis.
-- =====================================================================

-- Identifiants de clic publicitaire Google (gclid = Search/Display, g/wbraid = iOS/YouTube).
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS gclid        VARCHAR(300);
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS gbraid       VARCHAR(300);
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS wbraid       VARCHAR(300);

-- Paramètres de campagne (UTM) — source / support / campagne / mot-clé / variante.
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS utm_source   VARCHAR(200);
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS utm_medium   VARCHAR(200);
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS utm_campaign VARCHAR(200);
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS utm_term     VARCHAR(200);
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS utm_content  VARCHAR(200);

-- Contexte de la première visite.
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS landing_page VARCHAR(300);
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS referrer     VARCHAR(300);

-- Filtrage rapide des leads issus d'un clic payant.
CREATE INDEX IF NOT EXISTS idx_devis_requests_gclid ON devis_requests(gclid) WHERE gclid IS NOT NULL;
