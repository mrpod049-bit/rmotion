-- Inscriptions à la newsletter (popup déclenchée pour le trafic issu des pubs Meta).
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id SERIAL PRIMARY KEY,
  email VARCHAR(200) NOT NULL UNIQUE,
  source VARCHAR(50),           -- ex. 'popup-meta'
  product_slug VARCHAR(200),    -- fiche produit où l'inscription a eu lieu
  fbclid TEXT,                  -- identifiant de clic Meta (rapprochement pub)
  consent BOOLEAN DEFAULT true, -- consentement RGPD explicite coché
  created_at TIMESTAMP DEFAULT NOW()
);
