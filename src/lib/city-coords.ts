// Approximate coordinates for Brazilian cities
// Used for geocoding bomba markers when no lat/lng is available on the record.
// Priority cities (São Paulo region — main business area) come first.

export const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  // São Paulo
  'Campinas-SP': { lat: -22.90, lng: -47.05 },
  'São Paulo-SP': { lat: -23.55, lng: -46.63 },
  'Jundiaí-SP': { lat: -23.18, lng: -46.88 },
  'Sorocaba-SP': { lat: -23.50, lng: -47.45 },
  'Limeira-SP': { lat: -22.56, lng: -47.40 },
  'Piracicaba-SP': { lat: -22.72, lng: -47.64 },
  'Ribeirão Preto-SP': { lat: -21.17, lng: -47.81 },
  'São Carlos-SP': { lat: -22.01, lng: -47.89 },
  'Rio Claro-SP': { lat: -22.41, lng: -47.56 },
  'Araras-SP': { lat: -22.35, lng: -47.38 },
  'Bauru-SP': { lat: -22.31, lng: -49.05 },
  'Marília-SP': { lat: -22.21, lng: -49.94 },
  'Presidente Prudente-SP': { lat: -22.12, lng: -51.38 },
  'Araçatuba-SP': { lat: -21.20, lng: -50.43 },
  'São José dos Campos-SP': { lat: -23.17, lng: -45.88 },
  'Santos-SP': { lat: -23.96, lng: -46.33 },
  'Guarulhos-SP': { lat: -23.46, lng: -46.53 },
  'Osasco-SP': { lat: -23.53, lng: -46.79 },
  'Taubaté-SP': { lat: -23.02, lng: -45.55 },
  'Franca-SP': { lat: -20.53, lng: -47.40 },
  'Araraquara-SP': { lat: -21.79, lng: -48.17 },
  'Catanduva-SP': { lat: -21.13, lng: -48.97 },
  'Assis-SP': { lat: -22.65, lng: -50.41 },
  'Barretos-SP': { lat: -20.55, lng: -48.56 },
  'São José do Rio Preto-SP': { lat: -20.81, lng: -49.37 },

  // Rio de Janeiro
  'Rio de Janeiro-RJ': { lat: -22.90, lng: -43.17 },

  // Minas Gerais
  'Belo Horizonte-MG': { lat: -19.91, lng: -43.93 },
  'Uberlândia-MG': { lat: -18.91, lng: -48.27 },
  'Juiz de Fora-MG': { lat: -21.76, lng: -43.34 },
  'Poços de Caldas-MG': { lat: -21.78, lng: -46.56 },
  'Patos de Minas-MG': { lat: -18.57, lng: -46.51 },

  // Paraná
  'Curitiba-PR': { lat: -25.42, lng: -49.27 },
  'Londrina-PR': { lat: -23.30, lng: -51.16 },
  'Maringá-PR': { lat: -23.42, lng: -51.93 },
  'Cascavel-PR': { lat: -24.95, lng: -53.45 },

  // South
  'Porto Alegre-RS': { lat: -30.03, lng: -51.22 },
  'Florianópolis-SC': { lat: -27.59, lng: -48.54 },
  'Joinville-SC': { lat: -26.30, lng: -48.84 },
  'Blumenau-SC': { lat: -26.91, lng: -49.06 },
  'Chapecó-SC': { lat: -27.09, lng: -52.61 },

  // Center-West
  'Brasília-DF': { lat: -15.78, lng: -47.92 },
  'Goiânia-GO': { lat: -16.68, lng: -49.26 },
  'Campo Grande-MS': { lat: -20.44, lng: -54.64 },
  'Cuiabá-MT': { lat: -15.59, lng: -56.09 },
  'Rondonópolis-MT': { lat: -16.47, lng: -54.63 },

  // Northeast
  'Salvador-BA': { lat: -12.97, lng: -38.51 },
  'Fortaleza-CE': { lat: -3.71, lng: -38.52 },
  'Recife-PE': { lat: -8.04, lng: -34.87 },
  'Teresina-PI': { lat: -5.08, lng: -42.80 },
  'Natal-RN': { lat: -5.79, lng: -35.20 },
  'João Pessoa-PB': { lat: -7.11, lng: -34.86 },
  'Maceió-AL': { lat: -9.66, lng: -35.73 },
  'Aracaju-SE': { lat: -10.94, lng: -37.07 },

  // North
  'Manaus-AM': { lat: -3.11, lng: -60.02 },
  'Belém-PA': { lat: -1.45, lng: -48.50 },
  'São Luís-MA': { lat: -2.53, lng: -44.28 },
  'Palmas-TO': { lat: -10.16, lng: -48.33 },
  'Porto Velho-RO': { lat: -8.76, lng: -63.89 },
  'Boa Vista-RR': { lat: 2.82, lng: -60.67 },
  'Macapá-AP': { lat: 0.03, lng: -51.06 },
  'Rio Branco-AC': { lat: -9.97, lng: -67.81 },

  // Espírito Santo
  'Vitória-ES': { lat: -20.31, lng: -40.33 },
  'Vila Velha-ES': { lat: -20.32, lng: -40.29 },
};

/**
 * Look up coordinates for a city+state pair.
 * @param cidade  — city name (e.g. "Campinas")
 * @param estado  — state abbreviation (e.g. "SP")
 * @returns { lat, lng } or null if not found
 */
export function getCityCoords(
  cidade: string,
  estado: string,
): { lat: number; lng: number } | null {
  if (!cidade || !estado) return null;

  const key = `${cidade}-${estado}`;
  // Direct match
  if (CITY_COORDS[key]) return CITY_COORDS[key];

  // Fuzzy: try city name only (for multi-word cities)
  const cidadeNorm = cidade.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
  for (const [fullKey, coords] of Object.entries(CITY_COORDS)) {
    const [kCity, kEstado] = fullKey.split('-');
    const kCityNorm = kCity.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
    if (cidadeNorm === kCityNorm && estado === kEstado) return coords;
  }
  return null;
}

/**
 * Compute average center from a list of coordinates (for map centering).
 */
export function averageCenter(
  coords: { lat: number; lng: number }[],
): [number, number] | null {
  if (coords.length === 0) return null;
  const sum = coords.reduce(
    (acc, c) => ({ lat: acc.lat + c.lat, lng: acc.lng + c.lng }),
    { lat: 0, lng: 0 },
  );
  return [sum.lat / coords.length, sum.lng / coords.length];
}
