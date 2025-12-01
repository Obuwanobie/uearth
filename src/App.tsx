import { Link } from 'react-router-dom';
import { Globe3D } from './components/Globe3D';
import { MapProjection } from './components/MapProjection';
import { ControlPanel } from './components/ControlPanel';
import { SolarSystem } from './components/SolarSystem';
import { SunRaysView } from './components/SunRaysView';
import { useGeoStore } from './store/geoStore';

function App() {
  const { views } = useGeoStore();

  // Count visible views
  const visibleViews = [
    views.globe.visible,
    views.mercator.visible,
    views.azimuthal.visible,
    views.solarSystem.visible,
    views.sunRays.visible,
  ].filter(Boolean).length;

  // Calculate grid layout based on visible views
  const getGridClass = () => {
    if (visibleViews === 0) return '';
    if (visibleViews === 1) return 'grid-cols-1';
    if (visibleViews === 2) return 'grid-cols-1 md:grid-cols-2';
    if (visibleViews === 3) return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 md:grid-cols-2';
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100">
      {/* Left Sidebar - Control Panel */}
      <ControlPanel />

      {/* Main Content - Maps Grid */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-12 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-4 lg:px-6 shrink-0">
          <div className="ml-10 lg:ml-0">
            <h1 className="text-base lg:text-lg font-semibold">
              <span className="text-cyan-400">U-</span>
              <span className="text-white">Earth</span>
              <span className="text-slate-500 text-xs lg:text-sm ml-2 font-normal hidden sm:inline">
                — Visualisation du système Terre-Soleil
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 hidden md:inline">Modèle actuel:</span>
            <div className="flex rounded-lg overflow-hidden border border-slate-700">
              <span className="px-3 py-1.5 bg-cyan-500/30 text-cyan-400 text-sm font-medium">
                Globe
              </span>
              <Link 
                to="/flat-earth" 
                className="px-3 py-1.5 bg-slate-700/50 text-slate-400 text-sm hover:bg-amber-500/20 hover:text-amber-400 transition-colors"
              >
                Terre Plate
              </Link>
            </div>
          </div>
        </header>

        {/* Maps Grid */}
        <div className={`flex-1 grid ${getGridClass()} gap-1 p-1 bg-slate-900 overflow-auto`}>
          {/* Globe 3D */}
          {views.globe.visible && (
            <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 min-h-[300px] md:min-h-0">
              <Globe3D />
            </div>
          )}

          {/* Mercator */}
          {views.mercator.visible && (
            <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 relative min-h-[300px] md:min-h-0">
              <MapProjection projectionType="mercator" title="Vue Mercator" />
            </div>
          )}

          {/* Azimuthal Equidistant */}
          {views.azimuthal.visible && (
            <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 relative min-h-[300px] md:min-h-0">
              <MapProjection 
                projectionType="azimuthal" 
                title="Vue 'Terre Plate'" 
              />
            </div>
          )}

          {/* Solar System */}
          {views.solarSystem.visible && (
            <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 min-h-[300px] md:min-h-0">
              <SolarSystem />
            </div>
          )}

          {/* Sun Rays View */}
          {views.sunRays.visible && (
            <div className="bg-slate-800 rounded-lg overflow-hidden border border-slate-700 min-h-[300px] md:min-h-0">
              <SunRaysView />
            </div>
          )}

          {/* Empty state */}
          {visibleViews === 0 && (
            <div className="col-span-full flex items-center justify-center h-full">
              <div className="text-center text-slate-500">
                <p className="text-lg mb-2">Aucune vue sélectionnée</p>
                <p className="text-sm">Activez des vues depuis le panneau latéral</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
