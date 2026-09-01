-- =====================================================================
-- Migration 010 — Journal d'audit des actions du CRM
-- Idempotente. Applique avec :
--   node scripts/migrate.mjs src/lib/migrations/010_activity_log.sql
-- =====================================================================

-- Trace chaque action utilisateur (conversion, non intéressé, étape, perdu,
-- suppression…). entity_label est FIGÉ (nom au moment de l'action) pour rester
-- lisible même si le lead est supprimé ensuite.
CREATE TABLE IF NOT EXISTS crm_activity_log (
  id            SERIAL PRIMARY KEY,
  entity_type   VARCHAR(30)  NOT NULL DEFAULT 'lead',
  entity_id     INTEGER,                       -- NULL si l'entité a été supprimée
  entity_label  VARCHAR(300),                  -- nom figé (survit à la suppression)
  action        VARCHAR(50)  NOT NULL,         -- code : convert, not_interested, stage…
  detail        TEXT,                          -- précision lisible (ex. « Nouveau → Gagné »)
  actor         VARCHAR(120),                  -- qui (utilisateur admin) ; 'bot' pour le bot
  created_at    TIMESTAMP    NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_activity_log_created ON crm_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crm_activity_log_entity  ON crm_activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_activity_log_action  ON crm_activity_log(action);
