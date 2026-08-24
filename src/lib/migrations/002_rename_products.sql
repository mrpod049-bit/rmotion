-- Renommage des produits : noms commerciaux + slugs d'URL.
-- Les slugs pilotent les URLs /products/<slug> ; les redirections 301
-- (next.config.ts) assurent la continuité depuis les anciennes URLs.

UPDATE machines SET name = 'OL Series',  slug = 'ol-series'  WHERE slug = 'laser-ouvert-30-100w';
UPDATE machines SET name = 'BCL Series', slug = 'bcl-series' WHERE slug = 'laser-ferme-60-100w';
UPDATE machines SET name = 'SCL Series', slug = 'scl-series' WHERE slug = 'laser-ferme-20-30w';
UPDATE machines SET name = 'MCS Series', slug = 'mcs-series' WHERE slug = 'centre-usinage-vmc540t';
UPDATE machines SET name = 'MR Series',  slug = 'mr-series'  WHERE slug = 'ms-series-router';
UPDATE machines SET name = 'SCS Series', slug = 'scs-series' WHERE slug = 'centre-usinage-xh7115';
