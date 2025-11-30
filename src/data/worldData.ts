// Simplified world map GeoJSON - Natural Earth 110m resolution
// Source: https://github.com/topojson/world-atlas

export const worldGeoJSON = {
  type: "FeatureCollection",
  features: [
    {
      type: "Feature",
      properties: { name: "World" },
      geometry: {
        type: "MultiPolygon",
        coordinates: [
          // This is a simplified representation. We'll fetch the real data.
        ]
      }
    }
  ]
};

// URL to fetch world geometry
export const WORLD_GEOJSON_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';
export const LAND_GEOJSON_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json';
