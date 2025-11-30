import {
  Sun,
  Moon,
  Calendar,
  Clock,
  Pencil,
  Trash2,
  MapPin,
  Globe,
  Eye,
  EyeOff,
  Menu,
  X,
  Map,
  Orbit,
  Info,
  Hand,
  Lightbulb,
  Ruler,
  Play,
  Pause,
} from 'lucide-react';
import { useGeoStore } from '../store/geoStore';

const MONTHS = [
  'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun',
  'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'
];

function getDayOfYearLabel(dayOfYear: number): string {
  const date = new Date(new Date().getFullYear(), 0, 1);
  date.setDate(dayOfYear);
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function formatHour(hour: number): string {
  const h = Math.floor(hour);
  const m = Math.floor((hour % 1) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} UTC`;
}

export function ControlPanel() {
  const {
    hourOfDay,
    setHourOfDay,
    dayOfYear,
    setDayOfYear,
    showSun,
    toggleSun,
    drawingMode,
    setDrawingMode,
    lines,
    removeLine,
    clearLines,
    hoverCoords,
    selectedPoint,
    views,
    toggleViewVisibility,
    sidebarOpen,
    toggleSidebar,
    activeDrawingView,
    isAnimating,
    toggleAnimation,
    animationSpeed,
    setAnimationSpeed,
  } = useGeoStore();

  const visibleViewsCount = Object.values(views).filter(v => v.visible).length;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={toggleSidebar}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-slate-800 rounded-lg border border-slate-700"
      >
        {sidebarOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5 text-cyan-400" />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed lg:relative inset-y-0 left-0 z-40
        w-72 bg-slate-800 border-r border-slate-700 flex flex-col h-full overflow-hidden
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="px-4 py-4 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-cyan-400" />
            <h1 className="text-xl font-bold text-white">U-Earth</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visualisation du système Terre-Soleil
          </p>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">
          {/* View Controls */}
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              Vues ({visibleViewsCount}/5)
            </h3>

            <div className="space-y-2">
              {[
                { key: 'globe' as const, label: 'Globe 3D', icon: Globe, desc: 'Vue sphérique' },
                { key: 'mercator' as const, label: 'Mercator', icon: Map, desc: 'Carte rectangulaire' },
                { key: 'azimuthal' as const, label: 'Terre Plate', icon: Map, desc: 'Azimutale équidistante' },
                { key: 'solarSystem' as const, label: 'Système Solaire', icon: Orbit, desc: 'Vue orbitale' },
                { key: 'sunRays' as const, label: 'Rayons du Soleil', icon: Sun, desc: 'Visualisation jour/nuit' },
              ].map(({ key, label, icon: Icon, desc }) => (
                <button
                  key={key}
                  onClick={() => toggleViewVisibility(key)}
                  className={`w-full px-3 py-2 rounded text-sm text-left flex items-center gap-2 transition-colors ${
                    views[key].visible
                      ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                      : 'bg-slate-700/50 text-slate-400 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <div className="flex-1">
                    <div className="font-medium">{label}</div>
                    <div className="text-xs opacity-75">{desc}</div>
                  </div>
                  {views[key].visible ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Time Controls */}
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              Contrôle Temporel
            </h3>

            {/* Sun Toggle */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-400">Afficher le Soleil</span>
              <button
                onClick={toggleSun}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  showSun ? 'bg-cyan-500' : 'bg-slate-600'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    showSun ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
                {showSun ? (
                  <Sun className="absolute right-1 top-1 w-4 h-4 text-yellow-300" />
                ) : (
                  <Moon className="absolute left-1 top-1 w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>

            {/* Hour Slider */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Heure
                </label>
                <span className="text-xs font-mono text-cyan-400">
                  {formatHour(hourOfDay)}
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="24"
                step="0.25"
                value={hourOfDay}
                onChange={(e) => setHourOfDay(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Day Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Jour
                </label>
                <span className="text-xs font-mono text-cyan-400">
                  {getDayOfYearLabel(dayOfYear)}
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="365"
                step="1"
                value={dayOfYear}
                onChange={(e) => setDayOfYear(parseInt(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Quick date presets */}
            <div className="mt-3 flex flex-wrap gap-1">
              {[
                { label: 'Été', day: 172 },
                { label: 'Hiver', day: 355 },
                { label: 'Éq. Mars', day: 80 },
                { label: 'Éq. Sept', day: 266 },
              ].map(({ label, day }) => (
                <button
                  key={day}
                  onClick={() => setDayOfYear(day)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${
                    Math.abs(dayOfYear - day) < 5
                      ? 'bg-cyan-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Animation Controls */}
            <div className="mt-4 pt-4 border-t border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-slate-400">Animation</span>
                <button
                  onClick={toggleAnimation}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm transition-colors ${
                    isAnimating
                      ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                  }`}
                >
                  {isAnimating ? (
                    <>
                      <Pause className="w-4 h-4" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      Lancer
                    </>
                  )}
                </button>
              </div>

              {/* Speed control - exponential scale */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-slate-400">Vitesse</label>
                  <span className="text-xs font-mono text-cyan-400">
                    {animationSpeed >= 8760 
                      ? `${(animationSpeed / 8760).toFixed(1)} an/s`
                      : animationSpeed >= 24 
                        ? `${(animationSpeed / 24).toFixed(1)} jour/s`
                        : `${animationSpeed.toFixed(1)} h/s`}
                  </span>
                </div>
                {/* Slider value 0-100 maps to speed 0.1 to 87600 (10 ans/s) exponentially */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.log10(animationSpeed + 0.1) / Math.log10(87600) * 100}
                  onChange={(e) => {
                    // Convert slider (0-100) to exponential speed (0.1 to 87600 h/s)
                    const sliderValue = parseFloat(e.target.value);
                    const speed = Math.pow(87600, sliderValue / 100) - 0.1;
                    setAnimationSpeed(Math.max(0.1, Math.min(87600, speed)));
                  }}
                  className="w-full"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>1h/s</span>
                  <span>1j/s</span>
                  <span>1an/s</span>
                  <span>10an/s</span>
                </div>
              </div>
            </div>
          </div>

          {/* Drawing Tools */}
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <Pencil className="w-4 h-4 text-cyan-400" />
              Outils de Navigation
            </h3>

            <div className="flex gap-2 mb-3">
              <button
                onClick={() => setDrawingMode('pan')}
                className={`flex-1 px-3 py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors ${
                  drawingMode === 'pan' || drawingMode === 'none'
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Hand className="w-4 h-4" />
                Main
              </button>
              <button
                onClick={() => setDrawingMode(drawingMode === 'drawing' ? 'pan' : 'drawing')}
                className={`flex-1 px-3 py-2 rounded text-sm flex items-center justify-center gap-2 transition-colors ${
                  drawingMode === 'drawing'
                    ? 'bg-purple-500 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                <Pencil className="w-4 h-4" />
                Tracé
              </button>
            </div>

            {drawingMode === 'drawing' && (
              <div className="mt-3 p-2 bg-slate-700/50 rounded text-xs text-slate-300">
                <Info className="w-3 h-3 inline mr-1 text-cyan-400" />
                Cliquez 2 points sur n'importe quelle vue. La ligne sera droite sur cette vue et projetée sur les autres.
              </div>
            )}

            {selectedPoint && (
              <div className="mt-3 p-2 bg-cyan-500/10 border border-cyan-500/30 rounded text-xs">
                <span className="text-slate-400">Point de départ ({activeDrawingView}): </span>
                <span className="text-cyan-400 font-mono">
                  {selectedPoint.lat.toFixed(2)}°, {selectedPoint.lon.toFixed(2)}°
                </span>
              </div>
            )}

            {lines.length > 0 && (
              <>
                <div className="mt-3 text-xs text-slate-400 mb-2">
                  {lines.length} ligne(s) tracée(s)
                </div>
                <div className="max-h-40 overflow-y-auto space-y-1 mb-2">
                  {lines.map((line, idx) => (
                    <div
                      key={line.id}
                      className="flex items-center gap-2 p-2 bg-slate-700/50 rounded text-xs group"
                    >
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: line.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <Ruler className="w-3 h-3 text-slate-400" />
                          <span className="font-mono text-cyan-400">
                            {line.distance >= 1000 
                              ? `${(line.distance / 1000).toFixed(1)}k km`
                              : `${line.distance.toFixed(0)} km`
                            }
                          </span>
                        </div>
                        <div className="text-slate-500 truncate text-xs">
                          {line.sourceView === 'globe' ? '🌍 Globe' : line.sourceView === 'mercator' ? '🗺️ Mercator' : '📍 Azimutale'} 
                          {' '}• Ligne #{idx + 1}
                        </div>
                      </div>
                      <button
                        onClick={() => removeLine(line.id)}
                        className="p-1 rounded hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        title="Supprimer cette ligne"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={clearLines}
                  className="w-full px-3 py-2 bg-red-500/20 text-red-400 rounded text-sm flex items-center justify-center gap-2 hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Effacer tout
                </button>
              </>
            )}
          </div>

          {/* Current Position */}
          <div className="p-4">
            <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-cyan-400" />
              Position du Curseur
            </h3>

            {hoverCoords ? (
              <div className="bg-slate-700/50 rounded p-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs">Latitude</span>
                    <div className="font-mono text-cyan-400">
                      {Math.abs(hoverCoords.lat).toFixed(4)}°
                      {hoverCoords.lat >= 0 ? ' N' : ' S'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs">Longitude</span>
                    <div className="font-mono text-emerald-400">
                      {Math.abs(hoverCoords.lon).toFixed(4)}°
                      {hoverCoords.lon >= 0 ? ' E' : ' W'}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500 italic">
                Survolez une carte pour voir les coordonnées
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4 border-t border-slate-700">
            <div className="bg-slate-700/30 rounded p-3 text-xs text-slate-400">
              <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Lightbulb className="w-3 h-3 text-yellow-400" />
                Astuce
              </p>
              <p>
                Tracez une ligne droite sur la vue "Terre Plate" et observez comment elle devient courbe sur le globe réel !
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}
