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
  ('Gravure laser fibre', 'gravure-laser-fibre', 'Lasers fibre pour marquage et gravure', 'laser'),      -- id 1
  ('Usinage tout matériaux', 'usinage-tout-materiaux', 'Centres d''usinage polyvalents', 'cnc'),          -- id 2
  ('Fraisage grand surface', 'fraisage-grand-surface', 'Fraisage sur grandes surfaces', 'cnc'),          -- id 3
  ('Fraisage tout matériaux', 'fraisage-tout-materiaux', 'Fraisage plastiques et métaux', 'cnc');         -- id 4

INSERT INTO machines (category_id, name, slug, tagline, description, specs, price_range, featured) VALUES
  (1, 'OL Series', 'laser-ouvert-30-100w',
   'La découpe laser CO2 accessible pour les ateliers',
   E'La machine de gravure laser OL Series est une machine très versatile, extrêmement compacte et pouvant offrir des niveaux de puissance très élevés. Sont disponibles en option :\n\n- 3eme axe\n- Source laser JPT\n- Jeu de lentilles F-Theta de 70x70mm à 200x200 mm',
   '[{"label":"Logiciel","value":"EzCAD / Lightburn"},{"label":"Puissance","value":"de 20 à 100W"},{"label":"Vitesse","value":"8000 mm/s"},{"label":"Longueur d''onde","value":"1064 nm"},{"label":"Fréquence","value":"30 à 60 kHz (tube Raycus)"},{"label":"Fréquence","value":"1 à 600 kHz (tube JPT)"},{"label":"Surface de gravure","value":"70x70mm à 200x200mm"},{"label":"Puissance totale","value":"200W"},{"label":"Refroidissement","value":"Air"},{"label":"Poids total","value":"25 kg"}]',
   NULL, true),

  (1, 'BCL Series', 'laser-ferme-60-100w',
   'Grand format pour production en série',
   E'Les machines de gravure laser BCL Series sont conçues pour des productions en moyenne série de pièces volumineuses. Sont disponibles en option :\n\n- 3eme axe rotatif\n- Tube laser JPT\n- Jeu de lentilles F=Theta, de 70x70mm à 300x300mm',
   '[{"label":"Logiciel","value":"EzCAD / Lightburn"},{"label":"Puissance","value":"20W à 100W"},{"label":"Vitesse max","value":"9000 mm/s"},{"label":"Longueur d''onde","value":"1064 nm"},{"label":"Fréquence","value":"30 à 60 kHz (tube Raycus)"},{"label":"Fréquence","value":"1 à 600 kHz (tube JPT)"},{"label":"Puissance totale","value":"200W à 800W"},{"label":"Surface de gravure","value":"70x70mm à 300x300mm"},{"label":"Refroidissement","value":"Air"},{"label":"Poids total","value":"120 kg"}]',
   NULL, true),

  (1, 'SCL20 / SLC30', 'laser-ferme-20-30w',
   'Marquage laser fibre compact et précis',
   'Machine de gravure laser fibre, puissance de 20W ou 30W sur demande. Idéale pour le marquage en série de petites pièces en acier, aluminium, plastique, bois et cuir.',
   '[{"label":"Logiciel","value":"EzCad / Lightburn"},{"label":"Puissance","value":"20/30W"},{"label":"Vitesse max","value":"15000 mm/s"},{"label":"Longueur d''onde","value":"1064 nm"},{"label":"Fréquence","value":"30 à 60 kHz (tube Raycus)"},{"label":"Fréquence","value":"1 à 600 kHz (tube JPT)"},{"label":"Surface de gravure","value":"70x70mm à 175x175mm"},{"label":"Puissance totale","value":"200W"},{"label":"Refroidissement","value":"Air"},{"label":"Poids total","value":"60 kg"}]',
   NULL, false),

  (4, 'SCS Series', 'centre-usinage-xh7115',
   'Fraiseuse plastique / métaux compacte',
   'Fraiseuse CNC 60x90cm robuste, structure acier soudé. Idéale pour la menuiserie, l''enseigne et le prototypage aluminium.',
   '[{"label":"Surface de travail","value":"600x900x200"},{"label":"Puissance broche","value":"2.2 kW"},{"label":"Vitesse broche","value":"24k RPM"},{"label":"Refroidissement","value":"eau"},{"label":"Vitesse avance rapide","value":"12000 mm/min"},{"label":"Construction","value":"châssis en fonte rectifiée"},{"label":"Bridage","value":"étau ou brides simples"},{"label":"Poids total","value":"600 kg"},{"label":"Roulements linéaires","value":"à billes à recirculation"}]',
   NULL, true),

  (3, 'MR Series', 'ms-series-router',
   'Découpe grande surface sur bois, plastiques et aluminium',
   'Table plasma CNC 150x300cm avec torche Hypertherm. Découpe acier, inox et aluminium. Idéale pour la serrurerie, la carrosserie et la métallerie.',
   '[{"label":"Surface de travail","value":"1300x2500x300mm"},{"label":"Puissance broche","value":"3.2 kW"},{"label":"Refroidissement","value":"eau"},{"label":"Vitesse avance rapide","value":"15000 mm/min"},{"label":"Construction","value":"acier mécano-soudé"},{"label":"Bridage","value":"rails T-slot"},{"label":"Poids total","value":"1000 kg"},{"label":"Roulements linéaires","value":"à bille à recirculation"}]',
   NULL, true),

  (2, 'MCS Series', 'centre-usinage-vmc540t',
   'Centre d''usinage petit format',
   E'Le centre d''usinage miniature MCS Series est une machine polyvalente et facile à intégrer de part ses dimensions réduites.\n\nElle saura aisément traiter les plastiques techniques, ainsi que les métaux mêmes ferreux.\n\nOptions disponibles sur demande :\n- 4eme axe\n- Broche ISO 20\n- Contrôleur Keyuan 1000MC',
   '[{"label":"Surface de travail","value":"230x130x260mm"},{"label":"Puissance broche","value":"2.2 kW"},{"label":"Vitesse broche","value":"24k RPM"},{"label":"Refroidissement","value":"eau"},{"label":"Taille broche","value":"ISO20-ER16"},{"label":"Vitesse avance rapide","value":"8000 mm/min"},{"label":"Construction","value":"Fonte granitique rectifiée"},{"label":"Bridage","value":"T-Slots M8"},{"label":"Précision","value":"±0.01 mm"},{"label":"Répétabilité","value":"±0.015 mm"},{"label":"Puissance totale","value":"3.5kW"},{"label":"Poids total","value":"370 kg"}]',
   NULL, false);

-- Photos des machines
UPDATE machines SET images = ARRAY['/gammes/laser-1.jpg']::text[] WHERE slug = 'laser-ferme-20-30w';
UPDATE machines SET images = ARRAY['/gammes/laser-2.jpg']::text[] WHERE slug = 'laser-ferme-60-100w';
UPDATE machines SET images = ARRAY['/gammes/laser-4.jpg']::text[] WHERE slug = 'laser-ouvert-30-100w';
UPDATE machines SET images = ARRAY['/gammes/cnc-3.jpg']::text[] WHERE slug = 'centre-usinage-vmc540t';
UPDATE machines SET images = ARRAY['/gammes/cnc-1.jpg']::text[] WHERE slug = 'ms-series-router';
UPDATE machines SET images = ARRAY['/gammes/cnc-2.jpg']::text[] WHERE slug = 'centre-usinage-xh7115';

INSERT INTO articles (title, slug, excerpt, category, published, published_at) VALUES
  ('CO2, fibre, UV, quel laser choisir ?', 'co2-fibre-uv-quel-laser-choisir',
   'CO2, fibre ou UV : comprendre les trois grandes familles de laser et choisir celui qui correspond à votre activité.',
   'Technologie laser', true, NOW()),

  ('CNC bois ou CNC métal : les critères de choix', 'cnc-bois-vs-metal',
   'Broche, vitesse, rigidité de bâti : ce qui change vraiment entre une fraiseuse bois et une machine métal.',
   'Technologie CNC', true, NOW()),

  ('Comment calculer son ROI sur une machine laser', 'roi-machine-laser',
   'Méthode simple pour estimer le retour sur investissement d''une machine laser en atelier TPE/PME.',
   'Conseils', false, NULL);
