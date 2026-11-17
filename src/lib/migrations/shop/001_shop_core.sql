-- Boutique outils de coupe (B2B) — schéma initial.
--
-- Isolation : uniquement des tables NOUVELLES préfixées shop_ ; aucune table
-- existante n'est modifiée. Seul lien avec l'existant : shop_customers.partner_id
-- -> crm_partners (clé étrangère ON DELETE SET NULL, sans effet sur le CRM).
-- Idempotent (IF NOT EXISTS / ON CONFLICT) : rejouable sans risque.

-- ─── Réglages & compteurs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_settings (
  key        VARCHAR(80) PRIMARY KEY,
  value      JSONB NOT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Numérotation continue par type de document et par année (CMD, BCF, RET…).
CREATE TABLE IF NOT EXISTS shop_counters (
  name  VARCHAR(20) NOT NULL,
  year  INTEGER     NOT NULL,
  value INTEGER     NOT NULL DEFAULT 0,
  PRIMARY KEY (name, year)
);

-- ─── Catalogue ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_categories (
  id          SERIAL PRIMARY KEY,
  parent_id   INTEGER REFERENCES shop_categories(id) ON DELETE SET NULL,
  name        VARCHAR(150) NOT NULL,
  slug        VARCHAR(160) NOT NULL UNIQUE,
  description TEXT,
  position    INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS shop_products (
  id          SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES shop_categories(id) ON DELETE SET NULL,
  name        VARCHAR(250) NOT NULL,
  slug        VARCHAR(260) NOT NULL UNIQUE,
  brand       VARCHAR(120),
  description TEXT,
  -- Caractéristiques communes à toutes les déclinaisons [{label, value}]
  specs       JSONB NOT NULL DEFAULT '[]',
  images      TEXT[] NOT NULL DEFAULT '{}',
  published   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shop_products_category ON shop_products(category_id);

-- Déclinaison vendable = une référence (SKU). Le prix s'entend par unité de
-- vente (ex. boîte de 10 plaquettes : pack_qty = 10).
CREATE TABLE IF NOT EXISTS shop_variants (
  id                SERIAL PRIMARY KEY,
  product_id        INTEGER NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  sku               VARCHAR(80) NOT NULL UNIQUE,
  label             VARCHAR(250),               -- ex. « CNMG 120408-PM 4325 »
  iso_code          VARCHAR(80),                -- désignation ISO (CNMG 120408…)
  grade             VARCHAR(80),                -- nuance
  material_groups   VARCHAR(12),                -- groupes ISO usinables : « PMK », « N »…
  attributes        JSONB NOT NULL DEFAULT '{}',-- diamètre, longueur, revêtement…
  pack_qty          INTEGER NOT NULL DEFAULT 1 CHECK (pack_qty > 0),
  price_ht          NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price_ht >= 0),
  cost_price        NUMERIC(12,2),
  weight_g          INTEGER NOT NULL DEFAULT 0 CHECK (weight_g >= 0),
  ean               VARCHAR(20),
  reorder_threshold INTEGER NOT NULL DEFAULT 0,
  active            BOOLEAN NOT NULL DEFAULT true,
  position          INTEGER NOT NULL DEFAULT 0,
  created_at        TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shop_variants_product ON shop_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_shop_variants_iso ON shop_variants(LOWER(iso_code));

-- Compatibilités (plaquette <-> porte-outil…), symétriques à la lecture.
CREATE TABLE IF NOT EXISTS shop_product_compat (
  product_id    INTEGER NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  compatible_id INTEGER NOT NULL REFERENCES shop_products(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, compatible_id),
  CHECK (product_id <> compatible_id)
);

-- ─── Stock ───────────────────────────────────────────────────────────────
-- Niveau courant (une ligne par déclinaison). Disponible = on_hand - reserved.
CREATE TABLE IF NOT EXISTS shop_stock (
  variant_id INTEGER PRIMARY KEY REFERENCES shop_variants(id) ON DELETE CASCADE,
  on_hand    INTEGER NOT NULL DEFAULT 0 CHECK (on_hand >= 0),
  reserved   INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  location   VARCHAR(60),                       -- emplacement (allée/étagère)
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (reserved <= on_hand)
);

-- Journal immuable : toute variation de on_hand y est tracée.
CREATE TABLE IF NOT EXISTS shop_stock_movements (
  id         SERIAL PRIMARY KEY,
  variant_id INTEGER NOT NULL REFERENCES shop_variants(id) ON DELETE CASCADE,
  qty_delta  INTEGER NOT NULL,
  kind       VARCHAR(20) NOT NULL
             CHECK (kind IN ('receipt','sale','return','adjust','inventory','cancel')),
  ref_type   VARCHAR(20),                        -- 'order' | 'purchase_order' | 'return'
  ref_id     INTEGER,
  note       VARCHAR(300),
  actor      VARCHAR(120),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shop_mov_variant ON shop_stock_movements(variant_id, created_at DESC);

-- ─── Comptes clients B2B ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_customers (
  id              SERIAL PRIMARY KEY,
  partner_id      INTEGER REFERENCES crm_partners(id) ON DELETE SET NULL,
  company_name    VARCHAR(250) NOT NULL,
  siret           VARCHAR(14),
  vat_number      VARCHAR(20),
  vat_valid       BOOLEAN,
  vat_checked_at  TIMESTAMP,
  country         CHAR(2) NOT NULL DEFAULT 'FR',
  naf_code        VARCHAR(10),
  status          VARCHAR(12) NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending','approved','rejected','suspended')),
  discount_pct    NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (discount_pct BETWEEN 0 AND 100),
  payment_terms   VARCHAR(10) NOT NULL DEFAULT 'prepaid'
                  CHECK (payment_terms IN ('prepaid','net30')),
  credit_limit    NUMERIC(12,2),                 -- plafond d'encours (net30)
  notes           TEXT,
  created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
  approved_at     TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_shop_customers_siret ON shop_customers(siret) WHERE siret IS NOT NULL;

CREATE TABLE IF NOT EXISTS shop_users (
  id            SERIAL PRIMARY KEY,
  customer_id   INTEGER NOT NULL REFERENCES shop_customers(id) ON DELETE CASCADE,
  email         VARCHAR(200) NOT NULL,
  name          VARCHAR(200),
  phone         VARCHAR(30),
  role          VARCHAR(10) NOT NULL DEFAULT 'buyer' CHECK (role IN ('owner','buyer')),
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_shop_users_email ON shop_users(LOWER(email));

-- Liens de connexion à usage unique (on ne stocke que le hash du jeton).
CREATE TABLE IF NOT EXISTS shop_login_tokens (
  token_hash CHAR(64) PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  used_at    TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shop_tokens_user ON shop_login_tokens(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS shop_sessions (
  id_hash    CHAR(64) PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_addresses (
  id          SERIAL PRIMARY KEY,
  customer_id INTEGER NOT NULL REFERENCES shop_customers(id) ON DELETE CASCADE,
  kind        VARCHAR(10) NOT NULL CHECK (kind IN ('billing','shipping')),
  company     VARCHAR(250) NOT NULL,
  contact     VARCHAR(200),
  line1       VARCHAR(250) NOT NULL,
  line2       VARCHAR(250),
  postal_code VARCHAR(20) NOT NULL,
  city        VARCHAR(120) NOT NULL,
  country     CHAR(2) NOT NULL DEFAULT 'FR',
  phone       VARCHAR(30),
  is_default  BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shop_addresses_customer ON shop_addresses(customer_id);

-- Panier persistant (par utilisateur).
CREATE TABLE IF NOT EXISTS shop_cart_items (
  user_id    INTEGER NOT NULL REFERENCES shop_users(id) ON DELETE CASCADE,
  variant_id INTEGER NOT NULL REFERENCES shop_variants(id) ON DELETE CASCADE,
  qty        INTEGER NOT NULL CHECK (qty > 0),
  added_at   TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, variant_id)
);

-- ─── Commandes ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_orders (
  id                   SERIAL PRIMARY KEY,
  number               VARCHAR(30) NOT NULL UNIQUE,
  customer_id          INTEGER NOT NULL REFERENCES shop_customers(id),
  user_id              INTEGER REFERENCES shop_users(id) ON DELETE SET NULL,
  status               VARCHAR(20) NOT NULL DEFAULT 'pending_payment'
                       CHECK (status IN ('pending_payment','confirmed','preparing','shipped','delivered','cancelled')),
  payment_method       VARCHAR(12) NOT NULL CHECK (payment_method IN ('stripe','net30')),
  payment_status       VARCHAR(12) NOT NULL DEFAULT 'unpaid'
                       CHECK (payment_status IN ('unpaid','processing','paid','failed','refunded')),
  due_date             DATE,
  customer_po          VARCHAR(80),             -- n° de commande interne du client
  -- Photographies figées au moment de la commande
  customer_snapshot    JSONB NOT NULL,           -- raison sociale, SIRET, TVA
  billing_address      JSONB NOT NULL,
  shipping_address     JSONB NOT NULL,
  subtotal_ht          NUMERIC(12,2) NOT NULL,
  shipping_ht          NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_ht             NUMERIC(12,2) NOT NULL,
  vat_regime           VARCHAR(12) NOT NULL CHECK (vat_regime IN ('fr','eu_reverse','export')),
  vat_rate             NUMERIC(5,2) NOT NULL,
  vat_amount           NUMERIC(12,2) NOT NULL,
  total_ttc            NUMERIC(12,2) NOT NULL,
  total_weight_g       INTEGER NOT NULL DEFAULT 0,
  reserved_until       TIMESTAMP,               -- réservation de stock en attente de paiement
  stripe_session_id    VARCHAR(255) UNIQUE,
  stripe_payment_intent VARCHAR(255),
  carrier              VARCHAR(60),
  tracking_number      VARCHAR(120),
  invoice_number       VARCHAR(40),             -- rempli au jalon 6 (facturation)
  notes                TEXT,                    -- note interne
  customer_note        TEXT,
  created_at           TIMESTAMP NOT NULL DEFAULT NOW(),
  confirmed_at         TIMESTAMP,
  paid_at              TIMESTAMP,
  shipped_at           TIMESTAMP,
  delivered_at         TIMESTAMP,
  cancelled_at         TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_shop_orders_customer ON shop_orders(customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_shop_orders_status ON shop_orders(status);

CREATE TABLE IF NOT EXISTS shop_order_lines (
  id            SERIAL PRIMARY KEY,
  order_id      INTEGER NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  variant_id    INTEGER REFERENCES shop_variants(id) ON DELETE SET NULL,
  sku           VARCHAR(80) NOT NULL,
  label         VARCHAR(400) NOT NULL,
  pack_qty      INTEGER NOT NULL DEFAULT 1,
  qty           INTEGER NOT NULL CHECK (qty > 0),
  list_price_ht NUMERIC(12,2) NOT NULL,          -- prix catalogue
  discount_pct  NUMERIC(5,2) NOT NULL DEFAULT 0,
  unit_price_ht NUMERIC(12,2) NOT NULL,          -- prix net appliqué
  line_total_ht NUMERIC(12,2) NOT NULL,
  unit_cost     NUMERIC(12,2),
  weight_g      INTEGER NOT NULL DEFAULT 0,
  qty_returned  INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_shop_order_lines_order ON shop_order_lines(order_id);

-- Historique de la commande (affiché dans l'admin).
CREATE TABLE IF NOT EXISTS shop_order_events (
  id         SERIAL PRIMARY KEY,
  order_id   INTEGER NOT NULL REFERENCES shop_orders(id) ON DELETE CASCADE,
  kind       VARCHAR(40) NOT NULL,
  detail     VARCHAR(500),
  actor      VARCHAR(120),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_shop_order_events_order ON shop_order_events(order_id, created_at);

-- ─── Retours ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_returns (
  id          SERIAL PRIMARY KEY,
  number      VARCHAR(30) NOT NULL UNIQUE,
  order_id    INTEGER NOT NULL REFERENCES shop_orders(id),
  status      VARCHAR(12) NOT NULL DEFAULT 'open' CHECK (status IN ('open','received','cancelled')),
  reason      VARCHAR(500),
  restock     BOOLEAN NOT NULL DEFAULT true,     -- remettre en stock à réception
  credit_note_number VARCHAR(40),                -- avoir (jalon 6)
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  received_at TIMESTAMP
);
CREATE TABLE IF NOT EXISTS shop_return_lines (
  id            SERIAL PRIMARY KEY,
  return_id     INTEGER NOT NULL REFERENCES shop_returns(id) ON DELETE CASCADE,
  order_line_id INTEGER NOT NULL REFERENCES shop_order_lines(id),
  qty           INTEGER NOT NULL CHECK (qty > 0)
);

-- ─── Achats fournisseurs ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS shop_suppliers (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(250) NOT NULL,
  contact       VARCHAR(200),
  email         VARCHAR(200),
  phone         VARCHAR(40),
  address       TEXT,
  country       CHAR(2) NOT NULL DEFAULT 'FR',
  vat_number    VARCHAR(30),
  currency      CHAR(3) NOT NULL DEFAULT 'EUR',
  payment_terms VARCHAR(120),
  notes         TEXT,
  active        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS shop_purchase_orders (
  id          SERIAL PRIMARY KEY,
  number      VARCHAR(30) NOT NULL UNIQUE,
  supplier_id INTEGER NOT NULL REFERENCES shop_suppliers(id),
  status      VARCHAR(12) NOT NULL DEFAULT 'draft'
              CHECK (status IN ('draft','sent','partial','received','cancelled')),
  expected_at DATE,
  notes       TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  sent_at     TIMESTAMP,
  received_at TIMESTAMP
);
CREATE TABLE IF NOT EXISTS shop_purchase_order_lines (
  id           SERIAL PRIMARY KEY,
  po_id        INTEGER NOT NULL REFERENCES shop_purchase_orders(id) ON DELETE CASCADE,
  variant_id   INTEGER NOT NULL REFERENCES shop_variants(id),
  supplier_ref VARCHAR(80),
  qty_ordered  INTEGER NOT NULL CHECK (qty_ordered > 0),
  qty_received INTEGER NOT NULL DEFAULT 0 CHECK (qty_received >= 0),
  unit_cost    NUMERIC(12,2) NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_shop_po_lines_po ON shop_purchase_order_lines(po_id);

-- ─── Frais de port (grille au poids par zone) ────────────────────────────
CREATE TABLE IF NOT EXISTS shop_shipping_rates (
  id           SERIAL PRIMARY KEY,
  zone         VARCHAR(6) NOT NULL CHECK (zone IN ('FR','EU','WORLD')),
  max_weight_g INTEGER NOT NULL CHECK (max_weight_g > 0),
  price_ht     NUMERIC(10,2) NOT NULL CHECK (price_ht >= 0),
  UNIQUE (zone, max_weight_g)
);

-- Valeurs par défaut (modifiables dans l'admin → Réglages).
INSERT INTO shop_settings (key, value) VALUES
  ('min_order_ht', '0'),
  ('free_shipping_ht', '300'),
  ('reservation_minutes', '45'),
  ('net30_days', '30'),
  ('company', '{"name":"Rmotion","address":"","postal_code":"","city":"","country":"France","siret":"","vat_number":"","email":"contact@rmotion.fr","phone":"","iban":"","bic":""}')
ON CONFLICT (key) DO NOTHING;

INSERT INTO shop_shipping_rates (zone, max_weight_g, price_ht) VALUES
  ('FR', 1000, 9.90), ('FR', 5000, 14.90), ('FR', 30000, 29.90),
  ('EU', 1000, 19.90), ('EU', 5000, 34.90), ('EU', 30000, 69.90)
ON CONFLICT (zone, max_weight_g) DO NOTHING;
