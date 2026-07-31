-- Ajout des colonnes de traduction anglaise (idempotent, non destructif).
-- À appliquer sur les bases créées avant l'introduction du bilingue.

ALTER TABLE categories ADD COLUMN IF NOT EXISTS name_en VARCHAR(100);

ALTER TABLE machines ADD COLUMN IF NOT EXISTS name_en VARCHAR(200);
ALTER TABLE machines ADD COLUMN IF NOT EXISTS tagline_en VARCHAR(300);
ALTER TABLE machines ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS specs_en JSONB;
ALTER TABLE machines ADD COLUMN IF NOT EXISTS options_en TEXT[];

ALTER TABLE articles ADD COLUMN IF NOT EXISTS title_en VARCHAR(300);
ALTER TABLE articles ADD COLUMN IF NOT EXISTS excerpt_en TEXT;
ALTER TABLE articles ADD COLUMN IF NOT EXISTS content_en TEXT;
