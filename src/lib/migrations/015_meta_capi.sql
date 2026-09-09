-- =====================================================================
-- Migration 015 — Identifiants Meta pour l'API de conversions (CAPI)
-- Idempotente et additive (colonnes nullables). Applique avec :
--   node scripts/migrate.mjs src/lib/migrations/015_meta_capi.sql
-- Ces valeurs (clic + cookies navigateur du Pixel) sont capturées au submit
-- du formulaire de devis et servent au matching serveur côté Meta, y compris
-- pour l'événement « gagné » remonté plus tard depuis le CRM.
-- =====================================================================

-- Identifiant de clic Meta (param d'URL fbclid).
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS fbclid VARCHAR(500);

-- Cookies déposés par le Pixel (_fbc reconstruit depuis fbclid si absent, _fbp).
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS fbc VARCHAR(255);
ALTER TABLE devis_requests ADD COLUMN IF NOT EXISTS fbp VARCHAR(255);
