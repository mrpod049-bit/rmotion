-- Categories
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  type VARCHAR(20) NOT NULL CHECK (type IN ('laser', 'cnc', 'autre'))
);

-- Machines
CREATE TABLE machines (
  id SERIAL PRIMARY KEY,
  category_id INTEGER REFERENCES categories(id),
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  tagline VARCHAR(300),
  description TEXT,
  specs JSONB,
  price_range VARCHAR(100),
  images TEXT[],
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Articles
CREATE TABLE articles (
  id SERIAL PRIMARY KEY,
  title VARCHAR(300) NOT NULL,
  slug VARCHAR(300) NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  category VARCHAR(100),
  cover_image TEXT,
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Demandes de devis
CREATE TABLE devis_requests (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  societe VARCHAR(200),
  email VARCHAR(200) NOT NULL,
  telephone VARCHAR(30),
  machine_id INTEGER REFERENCES machines(id),
  machine_name VARCHAR(200),
  message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Contacts
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(200) NOT NULL,
  email VARCHAR(200) NOT NULL,
  sujet VARCHAR(300),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Données d'exemple
INSERT INTO categories (name, slug, description, type) VALUES
  ('Découpe laser CO2', 'decoupe-laser-co2', 'Machines laser CO2 pour bois, acrylique, cuir et matériaux non métalliques', 'laser'),
  ('Gravure laser fibre', 'gravure-laser-fibre', 'Lasers fibre pour marquage et gravure sur métaux', 'laser'),
  ('Fraiseuses CNC', 'fraiseuses-cnc', 'Fraiseuses CNC pour bois, aluminium et matériaux composites', 'cnc'),
  ('Plasmas CNC', 'plasmas-cnc', 'Découpe plasma CNC pour métaux jusqu''à 25mm', 'cnc');

INSERT INTO machines (category_id, name, slug, tagline, description, specs, price_range, featured) VALUES
  (1, 'OL Series', 'laser-ouvert-30-100w',
   'La découpe laser CO2 accessible pour les ateliers',
   'Machine laser CO2 60x40cm idéale pour les petites séries. Parfaite pour le bois, l''acrylique, le cuir et le tissu. Pilotage simple via LightBurn.',
   '{"puissance": "80W", "surface_travail": "600x400mm", "vitesse_max": "500mm/s", "logiciel": "LightBurn", "refroidissement": "eau"}',
   NULL, true),

  (1, 'BCL Series', 'laser-ferme-60-100w',
   'Grand format pour production en série',
   'Laser CO2 130x90cm pour les ateliers qui produisent en volume. Tube 130W, tête motorisée, mise au point automatique.',
   '{"puissance": "130W", "surface_travail": "1300x900mm", "vitesse_max": "600mm/s", "logiciel": "LightBurn / RDWorks", "refroidissement": "eau"}',
   NULL, true),

  (2, 'SCL20 / SLC30', 'laser-ferme-20-30w',
   'Marquage laser fibre compact et précis',
   'Machine de gravure laser fibre, puissance de 20W ou 30W sur demande. Idéale pour le marquage en série de petites pièces en acier, aluminium, plastique, bois et cuir.',
   '{"Logiciel": "EzCad / Lightburn", "Puissance": "20/30W", "Vitesse max": "15000 mm/s", "Longueur d''onde": "1064 nm"}',
   NULL, false),

  (3, 'SCS Series', 'centre-usinage-xh7115',
   'Centre d''usinage ultra compact',
   'Fraiseuse CNC 60x90cm robuste, structure acier soudé. Idéale pour la menuiserie, l''enseigne et le prototypage aluminium.',
   '{"surface_travail": "600x900mm", "course_z": "100mm", "broche": "2.2kW air", "precision": "0.1mm", "logiciel": "Mach3 / GRBL"}',
   NULL, true),

  (4, 'MR Series', 'ms-series-router',
   'Découpe grande surface sur bois, plastiques et aluminium',
   'Table plasma CNC 150x300cm avec torche Hypertherm. Découpe acier, inox et aluminium. Idéale pour la serrurerie, la carrosserie et la métallerie.',
   '{"surface_travail": "1500x3000mm", "epaisseur_max": "20mm acier", "torche": "Hypertherm 45XP", "logiciel": "SheetCam + Mach3"}',
   NULL, true),

  (3, 'MCS Series', 'centre-usinage-vmc540t',
   'Centre d''usinage vertical compact pour l''atelier',
   'Centre d''usinage vertical miniature, adapté aux petites séries et au prototypage en atelier.',
   '{}',
   NULL, false);

-- Photos des machines
UPDATE machines SET images = ARRAY['/gammes/laser-1.jpg']::text[] WHERE slug = 'laser-ferme-20-30w';
UPDATE machines SET images = ARRAY['/gammes/laser-2.jpg']::text[] WHERE slug = 'laser-ferme-60-100w';
UPDATE machines SET images = ARRAY['/gammes/laser-4.jpg']::text[] WHERE slug = 'laser-ouvert-30-100w';
UPDATE machines SET images = ARRAY['/gammes/cnc-3.jpg']::text[] WHERE slug = 'centre-usinage-vmc540t';
UPDATE machines SET images = ARRAY['/gammes/cnc-1.jpg']::text[] WHERE slug = 'ms-series-router';
UPDATE machines SET images = ARRAY['/gammes/cnc-2.jpg']::text[] WHERE slug = 'centre-usinage-xh7115';

INSERT INTO articles (title, slug, excerpt, category, published, published_at) VALUES
  ('Laser CO2 vs Laser Fibre : lequel choisir ?', 'laser-co2-vs-fibre',
   'Comprendre les différences techniques et savoir quel laser correspond à votre activité.',
   'Technologie laser', true, NOW()),

  ('CNC bois ou CNC métal : les critères de choix', 'cnc-bois-vs-metal',
   'Broche, vitesse, rigidité de bâti : ce qui change vraiment entre une fraiseuse bois et une machine métal.',
   'Technologie CNC', true, NOW()),

  ('Comment calculer son ROI sur une machine laser', 'roi-machine-laser',
   'Méthode simple pour estimer le retour sur investissement d''une machine laser en atelier TPE/PME.',
   'Conseils', false, NULL);
