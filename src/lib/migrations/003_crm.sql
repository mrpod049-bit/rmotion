-- =====================================================================
-- Migration 003 — CRM basique inspiré du modèle Odoo (crm.lead / res.partner)
-- Idempotente : peut être rejouée sans erreur (IF NOT EXISTS partout).
-- Applique avec : node scripts/migrate.mjs src/lib/migrations/003_crm.sql
-- =====================================================================

-- --- Étapes du pipeline (crm.stage) -----------------------------------
CREATE TABLE IF NOT EXISTS crm_stages (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  sequence    INTEGER NOT NULL DEFAULT 10,   -- ordre d'affichage des colonnes
  is_won      BOOLEAN NOT NULL DEFAULT false, -- étape « gagné » (100 % de proba)
  fold        BOOLEAN NOT NULL DEFAULT false, -- colonne repliée par défaut (kanban)
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- --- Partenaires : sociétés & personnes (res.partner) -----------------
CREATE TABLE IF NOT EXISTS crm_partners (
  id           SERIAL PRIMARY KEY,
  name         VARCHAR(200) NOT NULL,
  is_company   BOOLEAN NOT NULL DEFAULT false,      -- true = société, false = personne
  parent_id    INTEGER REFERENCES crm_partners(id) ON DELETE SET NULL, -- société de rattachement
  email        VARCHAR(200),
  phone        VARCHAR(30),
  city         VARCHAR(120),
  is_customer  BOOLEAN NOT NULL DEFAULT false,      -- devenu client (opportunité gagnée)
  notes        TEXT,
  created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_partners_parent ON crm_partners(parent_id);
CREATE INDEX IF NOT EXISTS idx_crm_partners_email  ON crm_partners(email);

-- --- Leads / opportunités (crm.lead) ----------------------------------
-- Objet central : un « lead » brut se qualifie en « opportunity ».
CREATE TABLE IF NOT EXISTS crm_leads (
  id                SERIAL PRIMARY KEY,
  name              VARCHAR(300) NOT NULL,          -- titre de l'opportunité
  type              VARCHAR(20)  NOT NULL DEFAULT 'lead'
                    CHECK (type IN ('lead', 'opportunity')),
  stage_id          INTEGER REFERENCES crm_stages(id) ON DELETE SET NULL,
  partner_id        INTEGER REFERENCES crm_partners(id) ON DELETE SET NULL,

  -- Coordonnées libres (avant rattachement à un partenaire, façon Odoo)
  contact_name      VARCHAR(200),
  company_name      VARCHAR(200),
  email             VARCHAR(200),
  phone             VARCHAR(30),

  expected_revenue  NUMERIC(12,2) DEFAULT 0,        -- montant potentiel (€)
  probability       INTEGER DEFAULT 0 CHECK (probability BETWEEN 0 AND 100),
  source            VARCHAR(50),                    -- 'devis', 'contact', 'bot', 'manuel'...
  assigned_to       VARCHAR(120),                   -- commercial (email ou nom)

  active            BOOLEAN NOT NULL DEFAULT true,  -- false = clôturé (gagné ou perdu)
  won               BOOLEAN NOT NULL DEFAULT false,
  lost_reason       VARCHAR(300),

  -- Traçabilité de l'origine (évite les doublons à l'import)
  origin_table      VARCHAR(40),                    -- 'devis_requests' | 'contacts' | NULL
  origin_id         INTEGER,

  created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
  closed_at         TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_crm_leads_stage  ON crm_leads(stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_active ON crm_leads(active);
-- Empêche d'importer deux fois la même demande de devis/contact.
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_leads_origin
  ON crm_leads(origin_table, origin_id)
  WHERE origin_table IS NOT NULL;

-- --- Activités planifiées (mail.activity) -----------------------------
CREATE TABLE IF NOT EXISTS crm_activities (
  id          SERIAL PRIMARY KEY,
  lead_id     INTEGER NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  type        VARCHAR(20) NOT NULL DEFAULT 'todo'
              CHECK (type IN ('call', 'email', 'meeting', 'todo')),
  summary     VARCHAR(300) NOT NULL,
  due_date    DATE,
  done        BOOLEAN NOT NULL DEFAULT false,
  done_at     TIMESTAMP,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_activities_lead ON crm_activities(lead_id);

-- --- Notes / historique (mail.message) --------------------------------
CREATE TABLE IF NOT EXISTS crm_notes (
  id          SERIAL PRIMARY KEY,
  lead_id     INTEGER NOT NULL REFERENCES crm_leads(id) ON DELETE CASCADE,
  body        TEXT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_crm_notes_lead ON crm_notes(lead_id);

-- --- Étapes par défaut (façon pipeline Odoo) --------------------------
INSERT INTO crm_stages (name, sequence, is_won)
SELECT v.name, v.sequence, v.is_won
FROM (VALUES
  ('Nouveau',      10, false),
  ('Qualifié',     20, false),
  ('Proposition',  30, false),
  ('En réflexion', 35, false),
  ('Gagné',        40, true)
) AS v(name, sequence, is_won)
WHERE NOT EXISTS (SELECT 1 FROM crm_stages);
