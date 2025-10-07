-- Ajoute les colonnes SHOM et met à jour les données des spots

-- 1. Ajoute les colonnes pour les données de marée du SHOM
ALTER TABLE public.spots
ADD COLUMN IF NOT EXISTS shom_station TEXT,
ADD COLUMN IF NOT EXISTS shom_url TEXT;

-- 2. Met à jour les spots avec les données de marée du SHOM

-- Anglet
UPDATE public.spots SET shom_station = 'Biarritz', shom_url = 'https://maree.shom.fr/harbor/biarritz' WHERE slug IN ('anglet-plage-des-cavaliers', 'anglet-plage-de-la-barre', 'anglet-madrague-ocean-dunes', 'anglet-plage-du-vvf', 'anglet-plage-du-club', 'anglet-plage-des-sables-d-or', 'anglet-plage-de-marinella-sables-d-or');

-- Biarritz
UPDATE public.spots SET shom_station = 'Biarritz', shom_url = 'https://maree.shom.fr/harbor/biarritz' WHERE slug IN ('biarritz-la-grande-plage', 'biarritz-la-grande-plage-vue-du-phare-et-de-la-roche-plate', 'biarritz-vue-du-casino-et-de-l-hotel-du-palais', 'biarritz-la-cote-des-basques');

-- Bidart
UPDATE public.spots SET shom_station = 'Saint-Jean-de-Luz - Socoa', shom_url = 'https://maree.shom.fr/harbor/saint-jean-de-luz-socoa' WHERE slug IN ('bidart-parlementia', 'bidart-plage-du-centre');

-- Hendaye
UPDATE public.spots SET shom_station = 'Hendaye', shom_url = 'https://maree.shom.fr/harbor/hendaye' WHERE slug IN ('hendaye-plage-d-ondarraitz', 'hendaye-plage-du-casino-et-des-jumeaux');

-- Lacanau / La Teste / Contis / Mimizan / Biscarrosse
UPDATE public.spots SET shom_station = 'Arcachon - Eyrac', shom_url = 'https://maree.shom.fr/harbor/arcachon-eyrac' WHERE slug IN ('lacanau-plage-de-lacanau-ocean', 'la-teste-de-buch-plage-nord', 'la-teste-de-buch-plage-sud', 'contis-plage-de-contis', 'mimizan-plage-nord', 'mimizan-plage-centrale', 'mimizan-plage-sud', 'biscarrosse-plage-de-la-centrale');

-- Moliets / Vieux-Boucau / Ondres / Seignosse / Capbreton / Hossegor
UPDATE public.spots SET shom_station = 'Capbreton', shom_url = 'https://maree.shom.fr/harbor/capbreton' WHERE slug IN ('moliets-plage-nord', 'moliets-plage-centrale', 'moliets-plage-sud', 'vieux-boucau-plage-de-vieux-boucau', 'ondres-plage-centrale', 'seignosse-plage-du-penon', 'seignosse-plage-des-bourdaines-plage-des-estagnots', 'capbreton-plage-du-prevent', 'capbreton-plage-du-santosha-de-la-piste', 'hossegor-la-centrale', 'hossegor-plage-de-la-nord');

-- Autres
UPDATE public.spots SET shom_station = 'Diélette', shom_url = 'https://maree.shom.fr/harbor/dielette' WHERE slug = 'la-hague-sciotot';
UPDATE public.spots SET shom_station = 'Saint-Jean-de-Luz - Socoa', shom_url = 'https://maree.shom.fr/harbor/saint-jean-de-luz-socoa' WHERE slug = 'ciboure-plage-de-la-bougie';
UPDATE public.spots SET shom_station = 'Boulogne-sur-Mer', shom_url = 'https://maree.shom.fr/harbor/boulogne-sur-mer' WHERE slug = 'neufchatel-hardelot-plage-d-hardelot';
UPDATE public.spots SET shom_station = 'Le Verdon-sur-Mer', shom_url = 'https://maree.shom.fr/harbor/le-verdon-sur-mer' WHERE slug = 'montalivet-plage-centrale';
UPDATE public.spots SET shom_station = 'Bénodet', shom_url = 'https://maree.shom.fr/harbor/benodet' WHERE slug = 'benodet-la-grande-plage';
UPDATE public.spots SET shom_station = 'Camaret-sur-Mer', shom_url = 'https://maree.shom.fr/harbor/camaret-sur-mer' WHERE slug = 'crozon-plage-du-morgat';
UPDATE public.spots SET shom_station = 'Quiberon - Port Haliguen', shom_url = 'https://maree.shom.fr/harbor/quiberon-port-haliguen' WHERE slug = 'quiberon-penthievre-plage-de-l-isthme-baie-de-quiberon';
UPDATE public.spots SET shom_station = 'Audierne', shom_url = 'https://maree.shom.fr/harbor/audierne' WHERE slug IN ('pouldreuzic-la-plage', 'pouldreuzic-plage-de-penhors');
UPDATE public.spots SET shom_station = 'Les Sables-d''Olonne', shom_url = 'https://maree.shom.fr/harbor/les-sables-d-olonne' WHERE slug IN ('saint-gilles-croix-de-vie-grande-plage', 'bretignolles-sur-mer-plage-de-la-sauzaie', 'les-sables-d-olonne-spot-de-la-baie', 'les-sables-d-olonne-plage-de-tanchet', 'les-sables-d-olonne-baie-des-sables', 'les-sables-d-olonne-zone-surf', 'les-sables-d-olonne-panoramique-video');
UPDATE public.spots SET shom_station = 'Royan', shom_url = 'https://maree.shom.fr/harbor/royan' WHERE slug = 'saint-palais-plage-de-la-grande-cote';
UPDATE public.spots SET shom_station = 'Saint-Malo', shom_url = 'https://maree.shom.fr/harbor/saint-malo' WHERE slug = 'saint-malo-plage-de-la-hoguette';
UPDATE public.spots SET shom_station = 'La Trinité-sur-Mer', shom_url = 'https://maree.shom.fr/harbor/la-trinite-sur-mer' WHERE slug = 'saint-philibert-base-nautique';
UPDATE public.spots SET shom_station = 'Saint-Nazaire', shom_url = 'https://maree.shom.fr/harbor/saint-nazaire' WHERE slug = 'saint-brevin-plage-de-l-ocean';
UPDATE public.spots SET shom_station = 'Cherbourg', shom_url = 'https://maree.shom.fr/harbor/cherbourg' WHERE slug IN ('la-hague-nacqueville', 'maupertus-anse-du-brick');
UPDATE public.spots SET shom_station = 'Le Havre', shom_url = 'https://maree.shom.fr/harbor/le-havre' WHERE slug = 'le-havre-plage-du-havre';
