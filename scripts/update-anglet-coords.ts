// Ce script met à jour les coordonnées GPS des spots d'Anglet dans la base de données.
// Pour l'exécuter, utilisez la commande : npx ts-node --require tsconfig-paths/register scripts/update-anglet-coords.ts

import { createServiceClient } from '@/lib/supabase/server';
import { getSpotsByCity, updateSpot } from '@/lib/data/spots';

const angletCoords: { [key: string]: { lat: number; lon: number } } = {
  'VVF': { lat: 43.49625519769531, lon: -1.5466252649571048 },
  'Club': { lat: 43.499463981620785, lon: -1.5447319721464232 },
  'Sables d\'or': { lat: 43.50237878692551, lon: -1.5423801027950756 },
  'Marinella': { lat: 43.50523892780937, lon: -1.5403848756173828 },
  'Madrague': { lat: 43.51173659103159, lon: -1.535315776785489 },
  'Cavaliers': { lat: 43.52255777060211, lon: -1.527499736182744 },
  'Barre': { lat: 43.52562479921003, lon: -1.5260582655715829 },
};

async function runUpdate() {
  console.log('Début de la mise à jour des coordonnées pour Anglet...');

  try {
    const spots = await getSpotsByCity('Anglet');
    if (!spots || spots.length === 0) {
      console.log('Aucun spot trouvé pour Anglet.');
      return;
    }

    for (const spot of spots) {
      const spotNameKey = Object.keys(angletCoords).find(key =>
        spot.name.includes(key)
      );

      if (spotNameKey) {
        const coords = angletCoords[spotNameKey];
        console.log(`Mise à jour de "${spot.name}"...`);
        await updateSpot(spot.id, {
          latitude: coords.lat,
          longitude: coords.lon,
        });
        console.log(` -> Coordonnées mises à jour : lat=${coords.lat}, lon=${coords.lon}`);
      } else {
        console.warn(` -> Aucune coordonnée trouvée pour "${spot.name}". Spot ignoré.`);
      }
    }

    console.log('\nMise à jour terminée avec succès !');
  } catch (error) {
    console.error('\nUne erreur est survenue lors de la mise à jour :', error);
  }
}

runUpdate();
