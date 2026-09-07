-- Élargit newsletter_subscribers pour accueillir les leads issus des formulaires
-- publicitaires (Google Ads lead form, Meta lead ads), qui remontent par webhook
-- et n'ont pas la même forme qu'une inscription popup (nom + téléphone + gclid).
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS name     VARCHAR(200);
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS phone    VARCHAR(50);
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS gclid    TEXT;         -- identifiant de clic Google (rapprochement pub)
ALTER TABLE newsletter_subscribers ADD COLUMN IF NOT EXISTS campaign VARCHAR(200); -- campagne/formulaire d'origine
