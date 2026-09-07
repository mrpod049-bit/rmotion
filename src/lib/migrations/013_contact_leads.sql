-- Demandes de contact / rappel issues des formulaires publicitaires (Google Ads
-- lead form). Distinct de newsletter_subscribers (inscriptions newsletter, Meta) :
-- ici le prospect demande à être recontacté, pas à recevoir la newsletter.
CREATE TABLE IF NOT EXISTS contact_leads (
  id SERIAL PRIMARY KEY,
  lead_id  VARCHAR(255) UNIQUE,  -- id du lead Google : anti-doublon si le webhook est rejoué
  email    VARCHAR(200),
  name     VARCHAR(200),
  phone    VARCHAR(50),
  message  TEXT,                 -- réponses aux questions libres du formulaire, le cas échéant
  source   VARCHAR(50),          -- ex. 'google-ads'
  gclid    TEXT,                 -- identifiant de clic Google (rapprochement pub)
  campaign VARCHAR(200),         -- campagne/formulaire d'origine
  created_at TIMESTAMP DEFAULT NOW()
);
