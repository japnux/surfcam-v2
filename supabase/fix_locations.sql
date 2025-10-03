-- =================================================================
-- SCRIPT DE CORRECTION DES VILLES ET RÉGIONS
-- =================================================================
-- Objectif: Nettoyer et standardiser les noms de villes et de régions
-- dans la table 'spots'.
--
-- Instructions:
-- 1. Faites une sauvegarde (backup) de votre table 'spots' avant d'exécuter ce script.
-- 2. Copiez et collez le contenu de ce script dans l'éditeur SQL de Supabase.
-- 3. Exécutez le script.
-- =================================================================

-- 1. Correction des villes avec des noms composés
UPDATE spots SET city = 'Brétignolles-sur-Mer' WHERE name ILIKE 'Brétignolles - Sur Mer%';
UPDATE spots SET city = 'Canet-en-Roussillon' WHERE name ILIKE 'Canet - en Roussillon%';
UPDATE spots SET city = 'Costa da Caparica' WHERE name ILIKE 'Costa - Caparica%';
UPDATE spots SET city = 'Figueira da Foz' WHERE name ILIKE 'Figueira - da Foz%';
UPDATE spots SET city = 'Fonte da Telha' WHERE name ILIKE 'Fonte - da Telha%';
UPDATE spots SET city = 'La Hague' WHERE name ILIKE 'La - Hague%';
UPDATE spots SET city = 'La Teste-de-Buch' WHERE name ILIKE 'La - Teste de Buch%';
UPDATE spots SET city = 'La Tremblade' WHERE name ILIKE 'La - Tremblade%';
UPDATE spots SET city = 'Le Havre' WHERE name ILIKE 'Le - Havre%';
UPDATE spots SET city = 'Les Sables-d''Olonne' WHERE name ILIKE 'Les - Sables d''Olonne%';
UPDATE spots SET city = 'Palavas-les-Flots' WHERE name ILIKE 'Palavas-les-Flots%';
UPDATE spots SET city = 'Saint-Brevin-les-Pins' WHERE name ILIKE 'Saint - Brévin%';
UPDATE spots SET city = 'Saint-Philibert' WHERE name ILIKE 'Saint - Philibert%';

-- 2. Correction des villes restantes et standardisation
UPDATE spots SET city = 'Saint-Jean-de-Luz' WHERE city = 'Saint' AND name ILIKE '%Saint-Jean-de-Luz%';
UPDATE spots SET city = 'Siouville-Hague' WHERE city = 'Siouville';
UPDATE spots SET city = 'Vauville' WHERE city = 'Vauville';
UPDATE spots SET city = 'Stella-Plage' WHERE city = 'Stella';

-- Espagne
UPDATE spots SET city = 'San Sebastián', region = 'Pays Basque', country = 'Espagne' WHERE city = 'San';
UPDATE spots SET region = 'Pays Basque', country = 'Espagne' WHERE city IN ('Zarautz', 'Hondarribia');

-- 2. Standardisation des régions

-- France
UPDATE spots SET region = 'Nouvelle-Aquitaine' WHERE city IN ('Anglet', 'Biarritz', 'Bidart', 'Capbreton', 'Contis', 'Hendaye', 'Hossegor', 'Lacanau', 'Mimizan', 'Moliets', 'Montalivet', 'Ondres', 'Seignosse', 'Vieux-Boucau', 'La Teste-de-Buch');
UPDATE spots SET region = 'Bretagne' WHERE city IN ('Bénodet', 'Crozon', 'Pouldreuzic', 'Quiberon', 'Saint-Philibert');
UPDATE spots SET region = 'Pays de la Loire' WHERE city IN ('Brétignolles-sur-Mer', 'Les Sables-d''Olonne', 'Saint-Brevin-les-Pins');
UPDATE spots SET region = 'Normandie' WHERE city IN ('La Hague', 'Le Havre', 'Maupertus', 'Pourville', 'Siouville-Hague', 'Vauville');
UPDATE spots SET region = 'Hauts-de-France' WHERE city IN ('Dunkerque', 'Merlimont', 'Neufchâtel-Hardelot', 'Stella-Plage');
UPDATE spots SET region = 'Occitanie' WHERE city IN ('Canet-en-Roussillon', 'Leucate', 'Palavas-les-Flots');
UPDATE spots SET region = 'Charente-Maritime' WHERE city IN ('Royan', 'La Tremblade');

-- Portugal
UPDATE spots SET region = 'Algarve' WHERE city IN ('Albufeira', 'Alvor', 'Amoreira', 'Carvoeiro', 'Ferragudo', 'Galé', 'Lagos', 'Portimao');
UPDATE spots SET region = 'Lisbonne' WHERE city IN ('Carcavelos', 'Cascais', 'Caxias', 'Costa da Caparica', 'Estoril', 'Fonte da Telha', 'Oeiras');
UPDATE spots SET region = 'Centre' WHERE city IN ('Barra', 'Costa Nova', 'Figueira da Foz', 'Mira');
UPDATE spots SET region = 'Madère' WHERE city = 'Madeira';

-- 3. Vérification finale
-- Exécutez cette requête après les mises à jour pour vérifier les changements.
SELECT 
  name,
  city,
  region,
  country
FROM spots
ORDER BY country, region, city, name;

