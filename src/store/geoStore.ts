import { create } from 'zustand';
import { haversineDistance } from '../utils/solarCalculations';

// Types
export interface GeoCoordinates {
  lat: number;
  lon: number;
}

export interface LineSegment {
  id: string;
  start: GeoCoordinates;
  end: GeoCoordinates;
  sourceView: 'globe' | 'mercator' | 'azimuthal' | 'solar';
  color: string;
  distance: number; // in km
}

export type DrawingMode = 'none' | 'drawing' | 'pan';

export interface ViewSettings {
  visible: boolean;
  zoom: number;
  center: GeoCoordinates;
}

interface GeoTruthState {
  // Hover coordinates (synchronized across all views)
  hoverCoords: GeoCoordinates | null;
  setHoverCoords: (coords: GeoCoordinates | null) => void;

  // Selected point (for drawing)
  selectedPoint: GeoCoordinates | null;
  setSelectedPoint: (coords: GeoCoordinates | null) => void;

  // Active view for drawing
  activeDrawingView: 'globe' | 'mercator' | 'azimuthal' | null;
  setActiveDrawingView: (view: 'globe' | 'mercator' | 'azimuthal' | null) => void;

  // Drawing mode
  drawingMode: DrawingMode;
  setDrawingMode: (mode: DrawingMode) => void;

  // Drawn lines
  lines: LineSegment[];
  addLine: (line: Omit<LineSegment, 'id' | 'distance'>) => void;
  removeLine: (id: string) => void;
  clearLines: () => void;

  // Time controls
  dateTime: Date;
  setDateTime: (date: Date) => void;
  hourOfDay: number; // 0-24
  setHourOfDay: (hour: number) => void;
  dayOfYear: number; // 1-365
  setDayOfYear: (day: number) => void;

  // Sun visibility
  showSun: boolean;
  toggleSun: () => void;

  // View visibility
  views: {
    globe: ViewSettings;
    mercator: ViewSettings;
    azimuthal: ViewSettings;
    solarSystem: ViewSettings;
    sunRays: ViewSettings;
  };
  toggleViewVisibility: (view: 'globe' | 'mercator' | 'azimuthal' | 'solarSystem' | 'sunRays') => void;
  setViewZoom: (view: 'globe' | 'mercator' | 'azimuthal' | 'solarSystem' | 'sunRays', zoom: number) => void;
  setViewCenter: (view: 'globe' | 'mercator' | 'azimuthal', center: GeoCoordinates) => void;

  // Globe rotation (for 3D view camera position synced to interactions)
  globeRotation: [number, number];
  setGlobeRotation: (rotation: [number, number]) => void;

  // Mobile sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;

  // Animation speed for solar system
  animationSpeed: number;
  setAnimationSpeed: (speed: number) => void;
  isAnimating: boolean;
  toggleAnimation: () => void;
  advanceTime: (deltaSeconds: number) => void;

  // Solar system view center (sun or earth)
  solarSystemCenter: 'sun' | 'earth';
  setSolarSystemCenter: (center: 'sun' | 'earth') => void;
}

// Helper to compute date from day of year and hour (using UTC to avoid DST issues)
const computeDateTime = (dayOfYear: number, hourOfDay: number): Date => {
  const year = new Date().getFullYear();
  // Use UTC to avoid daylight saving time issues
  const date = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  date.setUTCDate(dayOfYear);
  date.setUTCHours(Math.floor(hourOfDay), Math.floor((hourOfDay % 1) * 60), 0, 0);
  return date;
};

// Generate unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Color palette for lines - will cycle through these
const LINE_COLORS = [
  '#06b6d4', // cyan
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#f59e0b', // amber
  '#10b981', // emerald
  '#ef4444', // red
  '#3b82f6', // blue
  '#f97316', // orange
  '#14b8a6', // teal
  '#a855f7', // violet
];

export const useGeoStore = create<GeoTruthState>((set, get) => ({
  // Hover coordinates
  hoverCoords: null,
  setHoverCoords: (coords) => set({ hoverCoords: coords }),

  // Selected point
  selectedPoint: null,
  setSelectedPoint: (coords) => set({ selectedPoint: coords }),

  // Active drawing view
  activeDrawingView: null,
  setActiveDrawingView: (view) => set({ activeDrawingView: view }),

  // Drawing mode
  drawingMode: 'pan',
  setDrawingMode: (mode) => set({ drawingMode: mode, selectedPoint: null, activeDrawingView: null }),

  // Lines - color is automatically assigned based on line count
  lines: [],
  addLine: (line) =>
    set((state) => {
      // Get the next color based on current line count
      const colorIndex = state.lines.length % LINE_COLORS.length;
      const autoColor = LINE_COLORS[colorIndex];
      
      return {
        lines: [...state.lines, { 
          ...line,
          color: autoColor, // Override with auto color
          id: generateId(),
          distance: haversineDistance(line.start, line.end)
        }],
        selectedPoint: null,
        activeDrawingView: null,
      };
    }),
  removeLine: (id) =>
    set((state) => ({
      lines: state.lines.filter((l) => l.id !== id),
    })),
  clearLines: () => set({ lines: [] }),

  // Time controls - initialize to current date
  dateTime: new Date(),
  setDateTime: (date) => set({ dateTime: date }),
  hourOfDay: new Date().getHours() + new Date().getMinutes() / 60,
  setHourOfDay: (hour) => {
    const { dayOfYear } = get();
    set({
      hourOfDay: hour,
      dateTime: computeDateTime(dayOfYear, hour),
    });
  },
  dayOfYear: Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  ),
  setDayOfYear: (day) => {
    const { hourOfDay } = get();
    set({
      dayOfYear: day,
      dateTime: computeDateTime(day, hourOfDay),
    });
  },

  // Sun
  showSun: true,
  toggleSun: () => set((state) => ({ showSun: !state.showSun })),

  // Views - all 5 views visible by default
  views: {
    globe: { visible: true, zoom: 1, center: { lat: 0, lon: 0 } },
    mercator: { visible: true, zoom: 1, center: { lat: 0, lon: 0 } },
    azimuthal: { visible: true, zoom: 1, center: { lat: 90, lon: 0 } },
    solarSystem: { visible: true, zoom: 1, center: { lat: 0, lon: 0 } },
    sunRays: { visible: true, zoom: 1, center: { lat: 0, lon: 0 } },
  },
  toggleViewVisibility: (view) =>
    set((state) => ({
      views: {
        ...state.views,
        [view]: { ...state.views[view], visible: !state.views[view].visible },
      },
    })),
  setViewZoom: (view, zoom) =>
    set((state) => ({
      views: {
        ...state.views,
        [view]: { ...state.views[view], zoom },
      },
    })),
  setViewCenter: (view, center) =>
    set((state) => ({
      views: {
        ...state.views,
        [view]: { ...state.views[view], center },
      },
    })),

  // Globe rotation
  globeRotation: [0, 0],
  setGlobeRotation: (rotation) => set({ globeRotation: rotation }),

  // Mobile sidebar
  sidebarOpen: false,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  // Animation
  animationSpeed: 1,
  setAnimationSpeed: (speed) => set({ animationSpeed: speed }),
  isAnimating: false,
  toggleAnimation: () => set((state) => ({ isAnimating: !state.isAnimating })),
  advanceTime: (deltaSeconds) => {
    const { hourOfDay, dayOfYear, animationSpeed } = get();
    // animationSpeed = heures simulées par seconde réelle
    // 1x = 1 heure simulée par seconde réelle
    // 24x = 1 jour par seconde
    // 365x = ~15 jours par seconde
    // 8760x = 1 an par seconde
    const hoursToAdd = deltaSeconds * animationSpeed;
    let newHour = hourOfDay + hoursToAdd;
    let newDay = dayOfYear;
    
    while (newHour >= 24) {
      newHour -= 24;
      newDay += 1;
    }
    while (newHour < 0) {
      newHour += 24;
      newDay -= 1;
    }
    while (newDay > 365) {
      newDay -= 365;
    }
    while (newDay < 1) {
      newDay += 365;
    }
    
    set({
      hourOfDay: newHour,
      dayOfYear: newDay,
      dateTime: computeDateTime(newDay, newHour),
    });
  },

  // Solar system center
  solarSystemCenter: 'sun',
  setSolarSystemCenter: (center) => set({ solarSystemCenter: center }),
}));
