import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Link } from 'react-router-dom';
import { ArrowLeft, Info, Clock, Calendar, Play, Pause } from 'lucide-react';
import { useGeoStore } from '../store/geoStore';
import { useWorldData } from '../hooks/useWorldData';

// Constants for the Flat Earth model
const EARTH_RADIUS = 3; // Radius of the flat disc
const DOME_RADIUS = 4; // Radius of the firmament dome
const DOME_HEIGHT = 3; // Height of the dome
const SUN_ALTITUDE = 2.5; // Height of the sun above the disc
const SUN_ORBIT_RADIUS = 2; // Radius of sun's circular path
const MOON_ALTITUDE = 2.3;
const MOON_ORBIT_RADIUS = 2.2;
const SUN_SIZE = 0.15;
const MOON_SIZE = 0.12;

// The Flat Earth disc with continents
function FlatEarthDisc() {
  const { land } = useWorldData();
  
  // Convert lat/lon to flat earth coordinates (azimuthal equidistant from North Pole)
  const continentLines = useMemo(() => {
    if (!land) return [];
    
    const lines: THREE.Vector3[][] = [];
    
    land.features.forEach((feature) => {
      const geometry = feature.geometry;
      
      const processCoordinates = (coords: number[][]) => {
        const points: THREE.Vector3[] = [];
        coords.forEach(([lon, lat]) => {
          // Azimuthal equidistant projection from North Pole
          const latRad = (90 - lat) * (Math.PI / 180);
          const lonRad = lon * (Math.PI / 180);
          const r = (latRad / Math.PI) * EARTH_RADIUS * 2;
          const x = r * Math.sin(lonRad);
          const z = -r * Math.cos(lonRad);
          points.push(new THREE.Vector3(x, 0.01, z));
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

  return (
    <group>
      {/* Earth disc - ocean */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <circleGeometry args={[EARTH_RADIUS, 128]} />
        <meshStandardMaterial color="#0e83ca" side={THREE.DoubleSide} />
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
      
      {/* Ice wall (Antarctica) at the edge */}
      <mesh position={[0, 0.15, 0]}>
        <torusGeometry args={[EARTH_RADIUS, 0.15, 16, 128]} />
        <meshStandardMaterial color="#e2e8f0" />
      </mesh>
      
      {/* North Pole marker */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 16]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>
      
      {/* Concentric circles for latitudes */}
      {[30, 60].map((lat) => {
        const r = ((90 - lat) / 90) * EARTH_RADIUS;
        return (
          <Line
            key={lat}
            points={Array.from({ length: 65 }, (_, i) => {
              const angle = (i / 64) * Math.PI * 2;
              return new THREE.Vector3(
                Math.cos(angle) * r,
                0.02,
                Math.sin(angle) * r
              );
            })}
            color="#f59e0b"
            lineWidth={1}
            transparent
            opacity={0.5}
          />
        );
      })}
      
      {/* Equator */}
      <Line
        points={Array.from({ length: 65 }, (_, i) => {
          const angle = (i / 64) * Math.PI * 2;
          const r = EARTH_RADIUS / 2;
          return new THREE.Vector3(
            Math.cos(angle) * r,
            0.02,
            Math.sin(angle) * r
          );
        })}
        color="#f59e0b"
        lineWidth={2}
      />
    </group>
  );
}

// The Firmament dome
function Firmament() {
  return (
    <group>
      {/* Dome mesh - wireframe style */}
      <mesh>
        <sphereGeometry args={[DOME_RADIUS, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial 
          color="#1e3a5f" 
          transparent 
          opacity={0.3} 
          side={THREE.DoubleSide}
          wireframe
        />
      </mesh>
      
      {/* Solid inner dome for stars */}
      <mesh>
        <sphereGeometry args={[DOME_RADIUS - 0.01, 64, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial 
          color="#0f172a" 
          side={THREE.BackSide}
          transparent
          opacity={0.8}
        />
      </mesh>
      
      {/* Stars on the dome */}
      <Stars />
      
      {/* Label */}
      <Text
        position={[0, DOME_HEIGHT + 0.5, 0]}
        fontSize={0.25}
        color="#64748b"
        anchorX="center"
      >
        Firmament
      </Text>
    </group>
  );
}

// Stars on the firmament
function Stars() {
  const stars = useMemo(() => {
    const starPositions: THREE.Vector3[] = [];
    for (let i = 0; i < 200; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI / 2;
      const r = DOME_RADIUS - 0.05;
      starPositions.push(new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.cos(phi),
        r * Math.sin(phi) * Math.sin(theta)
      ));
    }
    return starPositions;
  }, []);

  return (
    <group>
      {stars.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      ))}
    </group>
  );
}

// Sun that orbits above the flat earth
function FlatEarthSun() {
  const sunRef = useRef<THREE.Group>(null);
  const { dayOfYear, hourOfDay } = useGeoStore();
  
  useFrame(() => {
    if (sunRef.current) {
      // Sun position based on time of day
      const hourAngle = (hourOfDay / 24) * Math.PI * 2 - Math.PI / 2;
      
      // Sun orbit radius changes with seasons (closer to center in summer, farther in winter)
      // In flat earth model, sun is closer to North Pole in June, farther in December
      const seasonalOffset = Math.cos((dayOfYear - 172) / 365.25 * Math.PI * 2);
      const orbitRadius = SUN_ORBIT_RADIUS - seasonalOffset * 0.8;
      
      sunRef.current.position.x = Math.cos(hourAngle) * orbitRadius;
      sunRef.current.position.z = Math.sin(hourAngle) * orbitRadius;
      sunRef.current.position.y = SUN_ALTITUDE;
    }
  });

  return (
    <group ref={sunRef}>
      {/* Sun glow */}
      <mesh>
        <sphereGeometry args={[SUN_SIZE * 2, 32, 32]} />
        <meshBasicMaterial color="#fef3c7" transparent opacity={0.3} />
      </mesh>
      <mesh>
        <sphereGeometry args={[SUN_SIZE * 1.5, 32, 32]} />
        <meshBasicMaterial color="#fde68a" transparent opacity={0.5} />
      </mesh>
      {/* Sun core */}
      <mesh>
        <sphereGeometry args={[SUN_SIZE, 32, 32]} />
        <meshBasicMaterial color="#fbbf24" />
      </mesh>
      {/* Light cone - spotlight effect */}
      <spotLight
        position={[0, 0, 0]}
        angle={0.6}
        penumbra={0.5}
        intensity={2}
        color="#fff5e6"
        target-position={[0, -SUN_ALTITUDE, 0]}
      />
      <Text
        position={[0, SUN_SIZE + 0.15, 0]}
        fontSize={0.12}
        color="#fbbf24"
        anchorX="center"
      >
        Soleil
      </Text>
    </group>
  );
}

// Moon that orbits above the flat earth
function FlatEarthMoon() {
  const moonRef = useRef<THREE.Group>(null);
  const { hourOfDay } = useGeoStore();
  
  useFrame(() => {
    if (moonRef.current) {
      // Moon is roughly opposite to sun
      const hourAngle = (hourOfDay / 24) * Math.PI * 2 + Math.PI / 2;
      
      moonRef.current.position.x = Math.cos(hourAngle) * MOON_ORBIT_RADIUS;
      moonRef.current.position.z = Math.sin(hourAngle) * MOON_ORBIT_RADIUS;
      moonRef.current.position.y = MOON_ALTITUDE;
    }
  });

  return (
    <group ref={moonRef}>
      <mesh>
        <sphereGeometry args={[MOON_SIZE, 32, 32]} />
        <meshStandardMaterial color="#d1d5db" />
      </mesh>
      <Text
        position={[0, MOON_SIZE + 0.1, 0]}
        fontSize={0.1}
        color="#94a3b8"
        anchorX="center"
      >
        Lune
      </Text>
    </group>
  );
}

// Orbit paths visualization
function OrbitPaths() {
  const { dayOfYear } = useGeoStore();
  
  // Sun orbit radius based on season
  const seasonalOffset = Math.cos((dayOfYear - 172) / 365.25 * Math.PI * 2);
  const sunOrbitRadius = SUN_ORBIT_RADIUS - seasonalOffset * 0.8;
  
  return (
    <group>
      {/* Sun orbit path */}
      <Line
        points={Array.from({ length: 65 }, (_, i) => {
          const angle = (i / 64) * Math.PI * 2;
          return new THREE.Vector3(
            Math.cos(angle) * sunOrbitRadius,
            SUN_ALTITUDE,
            Math.sin(angle) * sunOrbitRadius
          );
        })}
        color="#fbbf24"
        lineWidth={1}
        transparent
        opacity={0.3}
        dashed
        dashSize={0.1}
        gapSize={0.05}
      />
      
      {/* Moon orbit path */}
      <Line
        points={Array.from({ length: 65 }, (_, i) => {
          const angle = (i / 64) * Math.PI * 2;
          return new THREE.Vector3(
            Math.cos(angle) * MOON_ORBIT_RADIUS,
            MOON_ALTITUDE,
            Math.sin(angle) * MOON_ORBIT_RADIUS
          );
        })}
        color="#94a3b8"
        lineWidth={1}
        transparent
        opacity={0.2}
        dashed
        dashSize={0.1}
        gapSize={0.05}
      />
    </group>
  );
}

// Distance markers
function DistanceMarkers() {
  return (
    <group>
      {/* Altitude markers */}
      <Line
        points={[
          new THREE.Vector3(EARTH_RADIUS + 0.5, 0, 0),
          new THREE.Vector3(EARTH_RADIUS + 0.5, SUN_ALTITUDE, 0),
        ]}
        color="#64748b"
        lineWidth={1}
        dashed
        dashSize={0.1}
        gapSize={0.05}
      />
      <Text
        position={[EARTH_RADIUS + 0.8, SUN_ALTITUDE / 2, 0]}
        fontSize={0.12}
        color="#64748b"
        anchorX="left"
      >
        ~5000 km
      </Text>
      <Text
        position={[EARTH_RADIUS + 0.8, SUN_ALTITUDE / 2 - 0.2, 0]}
        fontSize={0.08}
        color="#94a3b8"
        anchorX="left"
      >
        (modèle FE)
      </Text>
      
      {/* Earth diameter */}
      <Line
        points={[
          new THREE.Vector3(-EARTH_RADIUS, -0.3, 0),
          new THREE.Vector3(EARTH_RADIUS, -0.3, 0),
        ]}
        color="#64748b"
        lineWidth={1}
      />
      <Text
        position={[0, -0.5, 0]}
        fontSize={0.12}
        color="#64748b"
        anchorX="center"
      >
        ~40 000 km (diamètre)
      </Text>
    </group>
  );
}

// Animation controller
function AnimationController() {
  const lastTimeRef = useRef<number>(0);
  
  useFrame((state) => {
    const { isAnimating, advanceTime } = useGeoStore.getState();
    
    if (isAnimating) {
      const delta = state.clock.elapsedTime - lastTimeRef.current;
      if (delta > 0) {
        advanceTime(delta);
      }
    }
    lastTimeRef.current = state.clock.elapsedTime;
  });
  
  return null;
}

// Info panel component
function FlatEarthInfoPanel() {
  const { dayOfYear, hourOfDay, setHourOfDay, setDayOfYear, isAnimating, toggleAnimation, animationSpeed, setAnimationSpeed } = useGeoStore();
  
  const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
  
  const getDateLabel = (day: number) => {
    const date = new Date(new Date().getFullYear(), 0, 1);
    date.setDate(day);
    return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  };

  const formatHour = (hour: number) => {
    const h = Math.floor(hour);
    const m = Math.floor((hour % 1) * 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  return (
    <div className="absolute top-4 left-4 bg-slate-800/95 p-4 rounded-lg text-xs space-y-3 max-w-[300px] border border-slate-700">
      <div className="text-amber-400 font-semibold text-sm flex items-center gap-2">
        <Info className="w-4 h-4" />
        Modèle Terre Plate
      </div>
      
      {/* Time Controls */}
      <div className="space-y-3 border-t border-slate-700 pt-3">
        {/* Hour slider */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Heure
            </label>
            <span className="font-mono text-amber-400">{formatHour(hourOfDay)} UTC</span>
          </div>
          <input
            type="range"
            min="0"
            max="24"
            step="0.25"
            value={hourOfDay}
            onChange={(e) => setHourOfDay(parseFloat(e.target.value))}
            className="w-full accent-amber-400"
          />
        </div>
        
        {/* Day slider */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-400 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              Jour
            </label>
            <span className="font-mono text-amber-400">{getDateLabel(dayOfYear)}</span>
          </div>
          <input
            type="range"
            min="1"
            max="365"
            step="1"
            value={dayOfYear}
            onChange={(e) => setDayOfYear(parseInt(e.target.value))}
            className="w-full accent-amber-400"
          />
        </div>
        
        {/* Animation */}
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Animation</span>
          <button
            onClick={toggleAnimation}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${
              isAnimating
                ? 'bg-red-500/20 text-red-400'
                : 'bg-amber-500/20 text-amber-400'
            }`}
          >
            {isAnimating ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            {isAnimating ? 'Pause' : 'Lancer'}
          </button>
        </div>
        
        {/* Speed */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-slate-400">Vitesse</label>
            <span className="font-mono text-amber-400 text-xs">
              {animationSpeed >= 24 ? `${(animationSpeed / 24).toFixed(1)} j/s` : `${animationSpeed.toFixed(1)} h/s`}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="1"
            value={Math.log10(animationSpeed + 0.1) / Math.log10(87600) * 100}
            onChange={(e) => {
              const sliderValue = parseFloat(e.target.value);
              const speed = Math.pow(87600, sliderValue / 100) - 0.1;
              setAnimationSpeed(Math.max(0.1, Math.min(87600, speed)));
            }}
            className="w-full accent-amber-400"
          />
        </div>
      </div>
      
      <div className="border-t border-slate-700 pt-3 space-y-2">
        <div className="text-slate-400 font-medium">Caractéristiques du modèle :</div>
        <ul className="text-slate-400 space-y-1 list-disc list-inside">
          <li>Terre = disque plat</li>
          <li>Pôle Nord au centre</li>
          <li>Antarctique = mur de glace</li>
          <li>Soleil à ~5000 km d'altitude</li>
          <li>Firmament = dôme solide</li>
          <li>Soleil tourne au-dessus</li>
        </ul>
      </div>
      
      <div className="border-t border-slate-700 pt-3 text-amber-400/80 text-xs">
        ⚠️ Ce modèle ne correspond pas aux observations scientifiques
      </div>
    </div>
  );
}

// Main Flat Earth Page component
export function FlatEarthPage() {
  return (
    <div className="h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* Header with navigation */}
      <header className="h-14 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 lg:px-6 shrink-0">
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="flex items-center gap-2 text-slate-400 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Retour</span>
          </Link>
          <div className="h-6 w-px bg-slate-700" />
          <h1 className="text-base lg:text-lg font-semibold">
            <span className="text-amber-400">Modèle</span>
            <span className="text-white ml-1">Terre Plate</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            to="/" 
            className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 rounded text-sm hover:bg-cyan-500/30 transition-colors"
          >
            Modèle Globe
          </Link>
        </div>
      </header>

      {/* 3D View */}
      <div className="flex-1 relative">
        <Canvas
          camera={{ position: [6, 4, 6], fov: 50 }}
          gl={{ antialias: true }}
        >
          <ambientLight intensity={0.2} />
          <pointLight position={[0, 10, 0]} intensity={0.5} />
          
          <AnimationController />
          <FlatEarthDisc />
          <Firmament />
          <FlatEarthSun />
          <FlatEarthMoon />
          <OrbitPaths />
          <DistanceMarkers />
          
          <OrbitControls
            enablePan={true}
            minDistance={3}
            maxDistance={15}
            maxPolarAngle={Math.PI / 2 - 0.1}
          />
        </Canvas>
        
        <FlatEarthInfoPanel />
        
        {/* Controls hint */}
        <div className="absolute bottom-4 right-4 bg-slate-800/80 px-3 py-2 rounded text-xs text-slate-400">
          🖱️ Clic-glisser pour tourner • Molette pour zoomer
        </div>
      </div>
    </div>
  );
}
