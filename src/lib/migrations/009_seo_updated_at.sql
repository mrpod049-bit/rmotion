-- SEO : colonne updated_at sur machines et articles pour un <lastmod> de sitemap fidèle.
-- Un trigger met la colonne à jour automatiquement à chaque UPDATE.

ALTER TABLE machines ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
ALTER TABLE articles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Backfill : on part des dates existantes les plus pertinentes.
UPDATE machines SET updated_at = COALESCE(updated_at, created_at, NOW());
UPDATE articles SET updated_at = COALESCE(updated_at, published_at, created_at, NOW());

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_machines_updated_at ON machines;
CREATE TRIGGER trg_machines_updated_at
  BEFORE UPDATE ON machines
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_articles_updated_at ON articles;
CREATE TRIGGER trg_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
