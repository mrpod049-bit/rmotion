-- Image de partage (Open Graph) dédiée par article, prioritaire sur cover_image.
-- Format attendu : 1200x630 (ratio 1,91:1), pour Facebook / LinkedIn / X.
ALTER TABLE articles ADD COLUMN IF NOT EXISTS og_image TEXT;

UPDATE articles SET og_image = '/og/securite-laser.jpg' WHERE slug = 'securite-atelier-laser';
