// Zone couverte par la recherche de magasins (Suisse et proche frontière).
// Mêmes bornes que le serveur (server/routes.ts, /api/stores/nearest).
export function isInSearchArea(lat: number, lon: number): boolean {
  return lat >= 45.0 && lat <= 48.5 && lon >= 5.5 && lon <= 11.0;
}
