import { useState, useEffect } from 'react';
import { feature } from 'topojson-client';
import type { Topology, GeometryCollection } from 'topojson-specification';
import type { FeatureCollection, Geometry } from 'geojson';

const LAND_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/land-110m.json';
const COUNTRIES_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

interface UseWorldDataReturn {
  land: FeatureCollection<Geometry> | null;
  countries: FeatureCollection<Geometry> | null;
  loading: boolean;
  error: Error | null;
}

export function useWorldData(): UseWorldDataReturn {
  const [land, setLand] = useState<FeatureCollection<Geometry> | null>(null);
  const [countries, setCountries] = useState<FeatureCollection<Geometry> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [landResponse, countriesResponse] = await Promise.all([
          fetch(LAND_URL),
          fetch(COUNTRIES_URL),
        ]);

        if (!landResponse.ok || !countriesResponse.ok) {
          throw new Error('Failed to fetch world data');
        }

        const landTopo = await landResponse.json() as Topology<{ land: GeometryCollection }>;
        const countriesTopo = await countriesResponse.json() as Topology<{ countries: GeometryCollection }>;

        const landGeoJSON = feature(landTopo, landTopo.objects.land) as FeatureCollection<Geometry>;
        const countriesGeoJSON = feature(countriesTopo, countriesTopo.objects.countries) as FeatureCollection<Geometry>;

        setLand(landGeoJSON);
        setCountries(countriesGeoJSON);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setLoading(false);
      }
    };

    loadData();
  }, []);

  return { land, countries, loading, error };
}
