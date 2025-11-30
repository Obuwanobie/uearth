import type { GeoCoordinates } from '../store/geoStore';

// GeoJSON types
interface GeoJSONPolygon {
  type: 'Polygon';
  coordinates: [number, number][][];
}

interface GeoJSONFeature {
  type: 'Feature';
  properties: Record<string, unknown>;
  geometry: GeoJSONPolygon;
}

// Earth's axial tilt in radians
const AXIAL_TILT = 23.5 * (Math.PI / 180);

/**
 * Calculate the subsolar point (where the sun is directly overhead)
 * based on the date and time
 */
export function calculateSubsolarPoint(date: Date): GeoCoordinates {
  // Day of year (0-365)
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const oneDay = 1000 * 60 * 60 * 24;
  const dayOfYear = Math.floor(diff / oneDay);

  // Calculate solar declination (latitude of subsolar point)
  // Maximum declination at summer solstice (day ~172), minimum at winter solstice (day ~355)
  const declination =
    AXIAL_TILT * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));
  const lat = declination * (180 / Math.PI);

  // Calculate hour angle (longitude of subsolar point)
  // At 12:00 UTC, the subsolar point is at 0° longitude
  const hours = date.getUTCHours() + date.getUTCMinutes() / 60;
  const lon = -15 * (hours - 12); // 15° per hour, negative because sun moves west

  return { lat, lon };
}

/**
 * Calculate the terminator circle (day/night boundary)
 * Returns an array of [lon, lat] points forming the terminator
 */
export function calculateTerminator(
  date: Date,
  numPoints: number = 360
): [number, number][] {
  const subsolar = calculateSubsolarPoint(date);
  const points: [number, number][] = [];

  // The terminator is a great circle 90° away from the subsolar point
  for (let i = 0; i <= numPoints; i++) {
    const angle = (i / numPoints) * 2 * Math.PI;

    // Calculate point on terminator using spherical geometry
    const subsolarLatRad = subsolar.lat * (Math.PI / 180);
    const subsolarLonRad = subsolar.lon * (Math.PI / 180);

    // Point at 90° from subsolar point along the given azimuth
    const lat = Math.asin(
      Math.sin(subsolarLatRad) * Math.cos(Math.PI / 2) +
        Math.cos(subsolarLatRad) * Math.sin(Math.PI / 2) * Math.cos(angle)
    );

    const lon =
      subsolarLonRad +
      Math.atan2(
        Math.sin(angle) * Math.sin(Math.PI / 2) * Math.cos(subsolarLatRad),
        Math.cos(Math.PI / 2) - Math.sin(subsolarLatRad) * Math.sin(lat)
      );

    points.push([
      ((lon * 180) / Math.PI + 540) % 360 - 180, // Normalize to -180 to 180
      (lat * 180) / Math.PI,
    ]);
  }

  return points;
}

/**
 * Check if a point is in daylight
 */
export function isInDaylight(
  coords: GeoCoordinates,
  date: Date
): boolean {
  const subsolar = calculateSubsolarPoint(date);
  
  // Calculate angular distance from subsolar point
  const lat1 = coords.lat * (Math.PI / 180);
  const lat2 = subsolar.lat * (Math.PI / 180);
  const dLon = (coords.lon - subsolar.lon) * (Math.PI / 180);

  const angularDist = Math.acos(
    Math.sin(lat1) * Math.sin(lat2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.cos(dLon)
  );

  // Point is in daylight if within 90° of subsolar point
  return angularDist < Math.PI / 2;
}

/**
 * Generate the night polygon for 2D maps
 * Returns a GeoJSON polygon covering the night side
 */
export function generateNightPolygon(
  date: Date,
  numPoints: number = 180
): GeoJSONFeature {
  const subsolar = calculateSubsolarPoint(date);
  const terminator = calculateTerminator(date, numPoints);

  // Sort terminator points by longitude for proper polygon construction
  const sortedTerminator = [...terminator].sort((a, b) => a[0] - b[0]);

  // Determine if we need to close via north or south pole
  // If subsolar latitude is positive (northern hemisphere summer), night is in south
  const nightInSouth = subsolar.lat > 0;

  // Build the polygon
  const coordinates: [number, number][] = [];

  if (nightInSouth) {
    // Start from west, go along terminator, close via south pole
    coordinates.push([-180, sortedTerminator[0][1]]);
    coordinates.push(...sortedTerminator);
    coordinates.push([180, sortedTerminator[sortedTerminator.length - 1][1]]);
    coordinates.push([180, -90]);
    coordinates.push([-180, -90]);
  } else {
    // Close via north pole
    coordinates.push([-180, sortedTerminator[0][1]]);
    coordinates.push(...sortedTerminator);
    coordinates.push([180, sortedTerminator[sortedTerminator.length - 1][1]]);
    coordinates.push([180, 90]);
    coordinates.push([-180, 90]);
  }

  coordinates.push(coordinates[0]); // Close the ring

  return {
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
  };
}

/**
 * Convert lat/lon to 3D cartesian coordinates on a unit sphere
 * Convention: X+ = lon 0° (Greenwich), Y+ = North Pole, Z+ = viewer facing globe
 * This uses negated longitude to match the "looking at a globe from outside" convention
 * where East is to the right when viewing from in front
 */
export function latLonToCartesian(
  lat: number,
  lon: number,
  radius: number = 1
): [number, number, number] {
  const latRad = lat * (Math.PI / 180);
  const lonRad = -lon * (Math.PI / 180); // Negate longitude for correct orientation

  const x = radius * Math.cos(latRad) * Math.cos(lonRad);
  const y = radius * Math.sin(latRad);
  const z = radius * Math.cos(latRad) * Math.sin(lonRad);

  return [x, y, z];
}

/**
 * Convert 3D cartesian to lat/lon
 * Inverse of latLonToCartesian - accounts for negated longitude convention
 */
export function cartesianToLatLon(
  x: number,
  y: number,
  z: number
): GeoCoordinates {
  const radius = Math.sqrt(x * x + y * y + z * z);
  const lat = Math.asin(y / radius) * (180 / Math.PI);
  const lon = -Math.atan2(z, x) * (180 / Math.PI); // Negate to match latLonToCartesian

  return { lat, lon };
}

/**
 * Calculate great circle points between two coordinates
 */
export function greatCirclePoints(
  start: GeoCoordinates,
  end: GeoCoordinates,
  numPoints: number = 100
): GeoCoordinates[] {
  const points: GeoCoordinates[] = [];

  const lat1 = start.lat * (Math.PI / 180);
  const lon1 = start.lon * (Math.PI / 180);
  const lat2 = end.lat * (Math.PI / 180);
  const lon2 = end.lon * (Math.PI / 180);

  // Calculate angular distance
  const d = Math.acos(
    Math.sin(lat1) * Math.sin(lat2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.cos(lon2 - lon1)
  );

  for (let i = 0; i <= numPoints; i++) {
    const f = i / numPoints;

    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);

    const x =
      A * Math.cos(lat1) * Math.cos(lon1) + B * Math.cos(lat2) * Math.cos(lon2);
    const y =
      A * Math.cos(lat1) * Math.sin(lon1) + B * Math.cos(lat2) * Math.sin(lon2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);

    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) * (180 / Math.PI);
    const lon = Math.atan2(y, x) * (180 / Math.PI);

    points.push({ lat, lon });
  }

  return points;
}

/**
 * Calculate haversine distance between two points in km
 */
export function haversineDistance(
  start: GeoCoordinates,
  end: GeoCoordinates
): number {
  const R = 6371; // Earth's radius in km

  const lat1 = start.lat * (Math.PI / 180);
  const lat2 = end.lat * (Math.PI / 180);
  const dLat = (end.lat - start.lat) * (Math.PI / 180);
  const dLon = (end.lon - start.lon) * (Math.PI / 180);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Get sun direction vector for 3D lighting (normalized)
 */
export function getSunDirection(date: Date): [number, number, number] {
  const subsolar = calculateSubsolarPoint(date);
  return latLonToCartesian(subsolar.lat, subsolar.lon, 1);
}

/**
 * Calculate Earth-Sun distance based on day of year
 * Uses Kepler's laws for elliptical orbit
 * Returns distance in millions of km
 */
export function calculateEarthSunDistance(dayOfYear: number): number {
  // Earth's orbital parameters
  const PERIHELION_DISTANCE = 147.1; // million km (around Jan 3)
  const APHELION_DISTANCE = 152.1; // million km (around Jul 4)
  const SEMI_MAJOR_AXIS = (PERIHELION_DISTANCE + APHELION_DISTANCE) / 2;
  const ECCENTRICITY = (APHELION_DISTANCE - PERIHELION_DISTANCE) / (APHELION_DISTANCE + PERIHELION_DISTANCE);
  
  // Perihelion occurs around day 3
  const PERIHELION_DAY = 3;
  
  // Calculate mean anomaly (angle from perihelion)
  const meanAnomaly = ((dayOfYear - PERIHELION_DAY) / 365.25) * 2 * Math.PI;
  
  // Solve Kepler's equation iteratively for eccentric anomaly
  let eccentricAnomaly = meanAnomaly;
  for (let i = 0; i < 10; i++) {
    eccentricAnomaly = meanAnomaly + ECCENTRICITY * Math.sin(eccentricAnomaly);
  }
  
  // Calculate true anomaly
  const trueAnomaly = 2 * Math.atan2(
    Math.sqrt(1 + ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
    Math.sqrt(1 - ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
  );
  
  // Calculate distance using the orbit equation
  const distance = SEMI_MAJOR_AXIS * (1 - ECCENTRICITY * ECCENTRICITY) / 
    (1 + ECCENTRICITY * Math.cos(trueAnomaly));
  
  return distance;
}

/**
 * Get the current season based on day of year (Northern Hemisphere)
 */
export function getSeason(dayOfYear: number): string {
  if (dayOfYear >= 80 && dayOfYear < 172) return 'Printemps';
  if (dayOfYear >= 172 && dayOfYear < 266) return 'Été';
  if (dayOfYear >= 266 && dayOfYear < 355) return 'Automne';
  return 'Hiver';
}

/**
 * Calculate the orbital angle (true anomaly) for positioning Earth
 */
export function calculateOrbitalAngle(dayOfYear: number): number {
  const PERIHELION_DAY = 3;
  const ECCENTRICITY = 0.0167;
  
  // Mean anomaly
  const meanAnomaly = ((dayOfYear - PERIHELION_DAY) / 365.25) * 2 * Math.PI;
  
  // Eccentric anomaly (iterative solution)
  let eccentricAnomaly = meanAnomaly;
  for (let i = 0; i < 10; i++) {
    eccentricAnomaly = meanAnomaly + ECCENTRICITY * Math.sin(eccentricAnomaly);
  }
  
  // True anomaly
  const trueAnomaly = 2 * Math.atan2(
    Math.sqrt(1 + ECCENTRICITY) * Math.sin(eccentricAnomaly / 2),
    Math.sqrt(1 - ECCENTRICITY) * Math.cos(eccentricAnomaly / 2)
  );
  
  return trueAnomaly;
}
