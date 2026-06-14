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
  (1, 'LaserPro 6040', 'laserpro-6040',
   'La découpe laser CO2 accessible pour les ateliers',
   'Machine laser CO2 60x40cm idéale pour les petites séries. Parfaite pour le bois, l''acrylique, le cuir et le tissu. Pilotage simple via LightBurn.',
   '{"puissance": "80W", "surface_travail": "600x400mm", "vitesse_max": "500mm/s", "logiciel": "LightBurn", "refroidissement": "eau"}',
   '2 500 € – 3 500 €', true),

  (1, 'LaserPro 1390', 'laserpro-1390',
   'Grand format pour production en série',
   'Laser CO2 130x90cm pour les ateliers qui produisent en volume. Tube 130W, tête motorisée, mise au point automatique.',
   '{"puissance": "130W", "surface_travail": "1300x900mm", "vitesse_max": "600mm/s", "logiciel": "LightBurn / RDWorks", "refroidissement": "eau"}',
   '5 500 € – 7 000 €', true),

  (2, 'FibreMax 20W', 'fibremax-20w',
   'Marquage laser fibre compact et précis',
   'Laser fibre 20W pour le marquage permanent sur acier, inox, aluminium et autres métaux. Idéal pour la traçabilité et la personnalisation.',
   '{"puissance": "20W", "surface_travail": "110x110mm", "vitesse_max": "8000mm/s", "logiciel": "EzCad2", "garantie_source": "100 000h"}',
   '3 000 € – 4 000 €', false),

  (3, 'CNC Router 6090', 'cnc-router-6090',
   'Fraiseuse CNC polyvalente pour bois et alu',
   'Fraiseuse CNC 60x90cm robuste, structure acier soudé. Idéale pour la menuiserie, l''enseigne et le prototypage aluminium.',
   '{"surface_travail": "600x900mm", "course_z": "100mm", "broche": "2.2kW air", "precision": "0.1mm", "logiciel": "Mach3 / GRBL"}',
   '3 500 € – 5 000 €', true),

  (4, 'Plasma CNC 1530', 'plasma-cnc-1530',
   'Découpe plasma CNC acier jusqu''à 20mm',
   'Table plasma CNC 150x300cm avec torche Hypertherm. Découpe acier, inox et aluminium. Idéale pour la serrurerie, la carrosserie et la métallerie.',
   '{"surface_travail": "1500x3000mm", "epaisseur_max": "20mm acier", "torche": "Hypertherm 45XP", "logiciel": "SheetCam + Mach3"}',
   '8 000 € – 12 000 €', true);

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
