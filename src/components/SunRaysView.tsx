import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useGeoStore } from '../store/geoStore';
import { useWorldData } from '../hooks/useWorldData';

const EARTH_RADIUS = 1.5;
const SUN_DISTANCE = 8;
const AXIAL_TILT_DEG = 23.5;
const AXIAL_TILT = AXIAL_TILT_DEG * (Math.PI / 180);

// Calculate solar declination based on day of year
function getSolarDeclination(dayOfYear: number): number {
  return AXIAL_TILT * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81));
}

// Earth with day/night visualization - dynamically oriented based on season
// The sun is fixed at +X, and the Earth's axial tilt orientation changes with orbital position
function Earth() {
  const outerGroupRef = useRef<THREE.Group>(null);
  const earthRef = useRef<THREE.Group>(null);
  const { land } = useWorldData();
  const lastTimeRef = useRef<number>(0);

  // Summer solstice occurs around day 172 (June 21)
  const SUMMER_SOLSTICE_DAY = 172;

  useFrame((state) => {
    // Handle global animation
    const { isAnimating, advanceTime, dayOfYear, hourOfDay } = useGeoStore.getState();
    
    if (isAnimating) {
      const delta = state.clock.elapsedTime - lastTimeRef.current;
      if (delta > 0) {
        advanceTime(delta);
      }
    }
    lastTimeRef.current = state.clock.elapsedTime;

    // Update orbital orientation dynamically
    if (outerGroupRef.current) {
      // The Earth orbits the sun in ~365 days
      // At summer solstice (day 172), the North Pole should lean TOWARD the sun (+X)
      // At winter solstice (day 355), the North Pole should lean AWAY from the sun (-X)
      // We rotate the outer group around Y to simulate orbital position
      // NEGATIVE angle because we want counter-clockwise rotation when viewed from above
      const seasonalAngle = -((dayOfYear - SUMMER_SOLSTICE_DAY) / 365.25) * 2 * Math.PI;
      outerGroupRef.current.rotation.y = seasonalAngle;
    }

    if (earthRef.current) {
      // Rotate Earth based on time of day from store
      earthRef.current.rotation.y = (hourOfDay / 24) * Math.PI * 2;
    }
  });

  // Convert GeoJSON coordinates to 3D points on sphere
  // Using negated longitude for correct globe orientation (East to the right)
  const continentLines = useMemo(() => {
    if (!land) return [];
    
    const lines: THREE.Vector3[][] = [];
    
    land.features.forEach((feature) => {
      const geometry = feature.geometry;
      
      const processCoordinates = (coords: number[][]) => {
        const points: THREE.Vector3[] = [];
        coords.forEach(([lon, lat]) => {
          const latRad = lat * (Math.PI / 180);
          const lonRad = -lon * (Math.PI / 180); // Negate for correct orientation
          const r = EARTH_RADIUS * 1.002;
          const x = r * Math.cos(latRad) * Math.cos(lonRad);
          const y = r * Math.sin(latRad);
          const z = r * Math.cos(latRad) * Math.sin(lonRad);
          points.push(new THREE.Vector3(x, y, z));
        });
        if (points.length > 1) {
          lines.push(points);
        }
      };
      
      if (geometry.type === 'Polygon') {
        geometry.coordinates.forEach((ring: number[][]) => {
          processCoordinates(ring);
        });
      } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates.forEach((polygon: number[][][]) => {
          polygon.forEach((ring: number[][]) => {
            processCoordinates(ring);
          });
        });
      }
    });
    
    return lines;
  }, [land]);

  // Create day/night shader - uses world-space normals for correct lighting with rotations
  const dayNightMaterial = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        sunDirection: { value: new THREE.Vector3(1, 0, 0) },
      },
      vertexShader: `
        varying vec3 vWorldNormal;
        
        void main() {
          // Transform normal to world space using model matrix
          vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 sunDirection;
        varying vec3 vWorldNormal;
        
        void main() {
          vec3 dayColor = vec3(0.055, 0.647, 0.914); // Ocean blue for day
          vec3 nightColor = vec3(0.02, 0.1, 0.15);
          
          // Use world-space normal for lighting
          float intensity = dot(normalize(vWorldNormal), sunDirection);
          float dayNight = smoothstep(-0.1, 0.1, intensity);
          
          vec3 color = mix(nightColor, dayColor, dayNight);
          gl_FragColor = vec4(color, 1.0);
        }
      `,
    });
  }, []);

  return (
    <group ref={outerGroupRef}>
      {/* Inner group for axial tilt - always tilted 23.5° around Z */}
      <group rotation={[0, 0, AXIAL_TILT]}>
      {/* Rotation axis */}
      <Line
        points={[
          new THREE.Vector3(0, -EARTH_RADIUS * 2.2, 0),
          new THREE.Vector3(0, EARTH_RADIUS * 2.2, 0),
        ]}
        color="#06b6d4"
        lineWidth={3}
      />
      
      {/* North pole label */}
      <Text
        position={[0, EARTH_RADIUS * 2.5, 0]}
        fontSize={0.22}
        color="#06b6d4"
        anchorX="center"
      >
        N
      </Text>
      
      {/* South pole label */}
      <Text
        position={[0, -EARTH_RADIUS * 2.5, 0]}
        fontSize={0.22}
        color="#06b6d4"
        anchorX="center"
      >
        S
      </Text>

      <group ref={earthRef}>
        {/* Earth sphere (ocean) */}
        <mesh material={dayNightMaterial}>
          <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        </mesh>

        {/* Continent outlines */}
        {continentLines.map((points, i) => (
          <Line
            key={i}
            points={points}
            color="#22c55e"
            lineWidth={1.5}
          />
        ))}

        {/* Equator line */}
        <Line
          points={Array.from({ length: 65 }, (_, i) => {
            const angle = (i / 64) * Math.PI * 2;
            return new THREE.Vector3(
              Math.cos(angle) * EARTH_RADIUS * 1.01,
              0,
              Math.sin(angle) * EARTH_RADIUS * 1.01
            );
          })}
          color="#f59e0b"
          lineWidth={2}
        />

        {/* Tropics */}
        {[23.5, -23.5].map((lat) => (
          <Line
            key={lat}
            points={Array.from({ length: 65 }, (_, i) => {
              const angle = (i / 64) * Math.PI * 2;
              const r = EARTH_RADIUS * Math.cos(lat * Math.PI / 180) * 1.01;
              const y = EARTH_RADIUS * Math.sin(lat * Math.PI / 180) * 1.01;
              return new THREE.Vector3(
                Math.cos(angle) * r,
                y,
                Math.sin(angle) * r
              );
            })}
            color="#f59e0b"
            lineWidth={1}
            transparent
            opacity={0.5}
          />
        ))}

        {/* Arctic/Antarctic circles */}
        {[66.5, -66.5].map((lat) => (
          <Line
            key={lat}
            points={Array.from({ length: 65 }, (_, i) => {
              const angle = (i / 64) * Math.PI * 2;
              const r = EARTH_RADIUS * Math.cos(lat * Math.PI / 180) * 1.01;
              const y = EARTH_RADIUS * Math.sin(lat * Math.PI / 180) * 1.01;
              return new THREE.Vector3(
                Math.cos(angle) * r,
                y,
                Math.sin(angle) * r
              );
            })}
            color="#94a3b8"
            lineWidth={1}
            transparent
            opacity={0.3}
          />
        ))}
      </group>

      {/* Subsolar point indicator - shows where sun is directly overhead */}
      <SubsolarIndicator />
      </group>
    </group>
  );
}

// Indicator showing where the sun is directly overhead
function SubsolarIndicator() {
  const { dayOfYear } = useGeoStore();
  
  // Calculate subsolar latitude (declination)
  const declination = getSolarDeclination(dayOfYear);
  
  // Position on the sphere facing the sun (at longitude 0 for visualization)
  const y = EARTH_RADIUS * Math.sin(declination);
  const xz = EARTH_RADIUS * Math.cos(declination);
  
  return (
    <group>
      {/* Subsolar point marker */}
      <mesh position={[xz * 1.02, y * 1.02, 0]}>
        <sphereGeometry args={[0.08, 16, 16]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      
      {/* Line from center to subsolar point showing declination */}
      <Line
        points={[
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(xz * 1.1, y * 1.1, 0),
        ]}
        color="#fbbf24"
        lineWidth={2}
        transparent
        opacity={0.6}
      />
    </group>
  );
}

// Sun with rays - rays are parallel and shift with season (coming TOWARD Earth)
// NOTE: This component renders the sun at [SUN_DISTANCE, 0, 0] in a group,
// so all ray coordinates are LOCAL to this group (subtract SUN_DISTANCE to get world coords)
function SunWithRays() {
  const { dayOfYear } = useGeoStore();
  
  // Calculate solar declination to offset rays
  const declination = getSolarDeclination(dayOfYear);
  
  // Generate parallel sun rays that shift with the season
  // Rays start from sun and go TOWARD the Earth
  // Since we're inside a group at [SUN_DISTANCE, 0, 0], local x=0 is at the sun
  const rays = useMemo(() => {
    const rayLines: THREE.Vector3[][] = [];
    const numRays = 15;
    const raySpacing = EARTH_RADIUS * 2.5 / numRays;
    
    // Offset based on declination + axial tilt
    const yOffset = Math.sin(AXIAL_TILT) * Math.sin(declination) * 2;
    
    for (let i = -numRays; i <= numRays; i++) {
      const baseY = i * raySpacing * 0.4;
      const y = baseY + yOffset;
      // LOCAL coordinates: sun is at local (0,0,0), Earth is at local (-SUN_DISTANCE, 0, 0)
      const startX = 0.5; // Just behind sun center (local)
      const endX = -SUN_DISTANCE - EARTH_RADIUS * 1.5; // Past Earth on night side (local)
      
      rayLines.push([
        new THREE.Vector3(startX, y, 0),
        new THREE.Vector3(endX, y, 0),
      ]);
    }
    
    return rayLines;
  }, [declination]);

  // Rays that hit the Earth surface - arrows pointing toward Earth
  const impactRays = useMemo(() => {
    const rays: { start: THREE.Vector3; end: THREE.Vector3; intensity: number }[] = [];
    const numRays = 8;
    
    for (let i = -numRays; i <= numRays; i++) {
      const lat = (i / numRays) * 80; // -80 to +80 degrees
      const latRad = lat * (Math.PI / 180);
      
      // Apply axial tilt
      const tiltedLat = latRad + AXIAL_TILT;
      
      // Earth surface coordinates (in WORLD space, Earth at origin)
      const earthY = EARTH_RADIUS * Math.sin(tiltedLat);
      const earthX = EARTH_RADIUS * Math.cos(tiltedLat);
      
      if (earthX > 0) { // Only rays hitting the day side
        // Intensity based on angle of incidence
        const intensity = Math.max(0, Math.cos(tiltedLat - declination));
        
        // Convert to LOCAL coords (subtract SUN_DISTANCE from x)
        rays.push({
          start: new THREE.Vector3(0, earthY, 0), // At sun (local)
          end: new THREE.Vector3(earthX - SUN_DISTANCE, earthY, 0), // Earth surface (local)
          intensity,
        });
      }
    }
    
    return rays;
  }, [declination]);

  return (
    <group position={[SUN_DISTANCE, 0, 0]}>
      {/* Sun glow */}
      <mesh>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshBasicMaterial color="#fef3c7" transparent opacity={0.2} />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.7, 32, 32]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.3} />
      </mesh>
      
      {/* Sun core */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>

      {/* Background parallel rays */}
      {rays.map((ray, i) => (
        <Line
          key={i}
          points={ray}
          color="#fbbf24"
          lineWidth={1}
          transparent
          opacity={0.25}
        />
      ))}
      
      {/* Impact rays showing where light hits the Earth with arrow heads */}
      {impactRays.map((ray, i) => (
        <group key={`impact-${i}`}>
          <Line
            points={[ray.start, ray.end]}
            color="#f59e0b"
            lineWidth={2}
            transparent
            opacity={ray.intensity * 0.6 + 0.2}
          />
          {/* Arrow head pointing toward Earth (leftward in local coords) */}
          <mesh 
            position={[ray.end.x + 0.15, ray.end.y, ray.end.z]}
            rotation={[0, 0, Math.PI / 2]}
          >
            <coneGeometry args={[0.06, 0.15, 8]} />
            <meshBasicMaterial 
              color="#f59e0b" 
              transparent 
              opacity={ray.intensity * 0.6 + 0.3}
            />
          </mesh>
        </group>
      ))}

      <Text
        position={[0, 1.3, 0]}
        fontSize={0.28}
        color="#fbbf24"
        anchorX="center"
      >
        Soleil
      </Text>
      
      <Text
        position={[0, -1, 0]}
        fontSize={0.15}
        color="#94a3b8"
        anchorX="center"
      >
        (150 M km)
      </Text>
    </group>
  );
}

// Terminator plane visualization
function TerminatorPlane() {
  return (
    <mesh rotation={[0, Math.PI / 2, 0]} position={[0, 0, 0]}>
      <planeGeometry args={[EARTH_RADIUS * 4, EARTH_RADIUS * 4]} />
      <meshBasicMaterial 
        color="#f59e0b" 
        transparent 
        opacity={0.1} 
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

// Labels and annotations
function Annotations() {
  const { dayOfYear } = useGeoStore();
  
  const declination = getSolarDeclination(dayOfYear);
  const sunDeclination = (declination * 180 / Math.PI).toFixed(1);
  
  // Get season info
  const getSeason = () => {
    if (dayOfYear >= 80 && dayOfYear < 172) return { name: 'Printemps', emoji: '🌸' };
    if (dayOfYear >= 172 && dayOfYear < 266) return { name: 'Été', emoji: '☀️' };
    if (dayOfYear >= 266 && dayOfYear < 355) return { name: 'Automne', emoji: '🍂' };
    return { name: 'Hiver', emoji: '❄️' };
  };
  
  const season = getSeason();

  return (
    <group>
      {/* Day side label */}
      <Text
        position={[EARTH_RADIUS + 1.2, EARTH_RADIUS + 0.8, 0]}
        fontSize={0.28}
        color="#fbbf24"
        anchorX="center"
      >
        ☀️ Jour
      </Text>

      {/* Night side label */}
      <Text
        position={[-EARTH_RADIUS - 1.2, EARTH_RADIUS + 0.8, 0]}
        fontSize={0.28}
        color="#64748b"
        anchorX="center"
      >
        🌙 Nuit
      </Text>

      {/* Axial tilt annotation */}
      <Text
        position={[0, -EARTH_RADIUS - 1.8, 0]}
        fontSize={0.16}
        color="#06b6d4"
        anchorX="center"
      >
        {`Inclinaison axiale: ${AXIAL_TILT_DEG}°`}
      </Text>
      
      {/* Solar declination */}
      <Text
        position={[0, -EARTH_RADIUS - 2.2, 0]}
        fontSize={0.16}
        color="#f59e0b"
        anchorX="center"
      >
        {`Déclinaison solaire: ${sunDeclination}° (${season.emoji} ${season.name})`}
      </Text>
      
      {/* Equator label */}
      <Text
        position={[EARTH_RADIUS + 0.5, 0.3, 0]}
        fontSize={0.12}
        color="#f59e0b"
        anchorX="left"
      >
        Équateur
      </Text>
    </group>
  );
}

// Info panel
function InfoPanel() {
  const { dayOfYear } = useGeoStore();

  const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  
  const getDateLabel = (day: number) => {
    const date = new Date(new Date().getFullYear(), 0, 1);
    date.setDate(day);
    return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  };

  const getSeason = () => {
    if (dayOfYear >= 80 && dayOfYear < 172) return '🌸 Printemps';
    if (dayOfYear >= 172 && dayOfYear < 266) return '☀️ Été';
    if (dayOfYear >= 266 && dayOfYear < 355) return '🍂 Automne';
    return '❄️ Hiver';
  };

  const sunDeclination = AXIAL_TILT * Math.sin(((2 * Math.PI) / 365) * (dayOfYear - 81)) * 180 / Math.PI;

  return (
    <div className="absolute top-2 left-2 bg-slate-800/90 p-3 rounded-lg text-xs space-y-2 max-w-[200px]">
      <div className="text-cyan-400 font-semibold">Rayons du Soleil</div>
      <div className="text-slate-300">
        <span className="text-slate-500">Date:</span> {getDateLabel(dayOfYear)}
      </div>
      <div className="text-slate-300">
        <span className="text-slate-500">Saison:</span> {getSeason()}
      </div>
      <div className="text-slate-300">
        <span className="text-slate-500">Déclinaison:</span> {sunDeclination.toFixed(1)}°
      </div>
      <div className="text-slate-400 text-xs mt-2 border-t border-slate-700 pt-2">
        💡 Les rayons du Soleil arrivent parallèlement. L'inclinaison de l'axe terrestre crée les saisons.
      </div>
    </div>
  );
}

// Main component
export function SunRaysView({ className = '' }: { className?: string }) {
  return (
    <div className={`flex flex-col h-full ${className}`}>
      <div className="flex items-center justify-between px-3 py-2 bg-slate-800 border-b border-slate-700">
        <h2 className="text-xs sm:text-sm font-semibold text-cyan-400">Rayons du Soleil</h2>
        <span className="text-xs text-slate-400 hidden sm:inline">Jour & Nuit</span>
      </div>
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [0, 5, 10], fov: 45 }}
          gl={{ antialias: true }}
        >
          <ambientLight intensity={0.1} />
          <Earth />
          <SunWithRays />
          <TerminatorPlane />
          <Annotations />
          <OrbitControls
            enablePan={true}
            minDistance={5}
            maxDistance={20}
            rotateSpeed={0.5}
          />
        </Canvas>
        <InfoPanel />
      </div>
    </div>
  );
}
