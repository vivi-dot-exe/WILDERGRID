import { useSyncExternalStore } from 'react';
import {
  DOMAINS,
  VIEW_MODES,
  ALL_ITEMS,
} from '../types/world';
import {
  generateSeededExteriorGrid,
  generateSeededInteriorGrid,
} from '../utils/procedural';
import { soundManager } from '../utils/sound';
import { createInitialEntities, ENTITY_CONFIGS } from '../types/entities';
import { WEATHER_EVENTS, INITIAL_TICKER_LOGS } from '../utils/events';
import { DEFAULT_AVATAR_CONFIG } from '../types/avatar';

const DEFAULT_SEED = 'sunny-resort-villa';
const GRID_SIZE = 16;
const INTERIOR_GRID_SIZE = 12;

let state = {
  activeDomain: DOMAINS.EXTERIOR, // 'exterior' | 'interior'
  viewMode: VIEW_MODES.ISOMETRIC,
  selectedTool: 'place',
  selectedCategory: 'all',
  selectedItemId: 'flora_royal_palm',
  brushSize: 1,

  // Seed
  seed: DEFAULT_SEED,

  // Grids
  exteriorGrid: generateSeededExteriorGrid(GRID_SIZE, DEFAULT_SEED),
  interiorGrid: generateSeededInteriorGrid(INTERIOR_GRID_SIZE, 'cozy-penthouse'),

  // Autonomous NPCs
  entities: createInitialEntities(GRID_SIZE),

  // Weather & Events
  currentWeather: WEATHER_EVENTS[0],
  weatherIndex: 0,
  weatherCountdown: 60,
  activityLogs: [...INITIAL_TICKER_LOGS],

  // AI Chronicler Lore Cache
  chronicledLore: {},

  // Active inspect (null by default so screen is clean)
  inspectedTile: null,

  // Camera
  camera: { x: 0, y: 0, zoom: 1.0 },

  // History for Undo/Redo
  history: [],
  redoStack: [],
  soundMuted: false,

  // Avatar & Onboarding
  avatarConfig: DEFAULT_AVATAR_CONFIG,
  showOnboarding: true,

  // Simulation
  isSimulating: true,
  simTicks: 0,
};

const listeners = new Set();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function pushHistory() {
  const currentGrid = state.activeDomain === DOMAINS.EXTERIOR ? state.exteriorGrid : state.interiorGrid;
  const snapshot = {
    domain: state.activeDomain,
    grid: currentGrid.map(row => row.map(tile => ({ ...tile, metadata: { ...tile.metadata } }))),
  };
  state = {
    ...state,
    history: [...state.history.slice(-19), snapshot],
    redoStack: [],
  };
}

export const worldStore = {
  getState() {
    return state;
  },

  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },

  // Onboarding & Avatar
  openOnboarding() {
    state = { ...state, showOnboarding: true };
    emitChange();
  },

  closeOnboarding() {
    state = { ...state, showOnboarding: false };
    emitChange();
  },

  saveAndEnterWorld(newConfig) {
    state = {
      ...state,
      avatarConfig: newConfig,
      showOnboarding: false,
      activityLogs: [
        `✨ Welcome ${newConfig.username} (${newConfig.gameMode.toUpperCase()} MODE) to Wildergrid!`,
        ...state.activityLogs.slice(0, 6),
      ],
    };
    soundManager.playPlaceTile('meadow');
    emitChange();
  },

  // Seed Management
  loadFromSeed(seedStr) {
    pushHistory();
    const cleanSeed = (seedStr || 'paradise-haven').trim();
    const freshExterior = generateSeededExteriorGrid(GRID_SIZE, cleanSeed);
    const freshInterior = generateSeededInteriorGrid(INTERIOR_GRID_SIZE, cleanSeed + '-room');

    state = {
      ...state,
      seed: cleanSeed,
      exteriorGrid: freshExterior,
      interiorGrid: freshInterior,
      entities: createInitialEntities(GRID_SIZE),
      inspectedTile: null,
      chronicledLore: {},
      activityLogs: [
        `🌱 World synthesized from seed "${cleanSeed}"!`,
        ...state.activityLogs.slice(0, 5),
      ],
    };
    soundManager.playPlaceTile('crystal');
    emitChange();
  },

  // Domain Switching: City Exterior vs Room Interior
  setDomain(domain) {
    if (state.activeDomain === domain) return;
    const defaultItem = domain === DOMAINS.EXTERIOR ? 'flora_royal_palm' : 'int_sofa_curved';
    state = {
      ...state,
      activeDomain: domain,
      selectedCategory: 'all',
      selectedItemId: defaultItem,
      inspectedTile: null,
      camera: { x: 0, y: 0, zoom: 1.0 },
    };
    soundManager.playClick();
    emitChange();
  },

  setSelectedTool(tool) {
    state = { ...state, selectedTool: tool };
    soundManager.playClick();
    emitChange();
  },

  setSelectedCategory(catId) {
    state = { ...state, selectedCategory: catId };
    soundManager.playClick();
    emitChange();
  },

  setSelectedItem(itemId) {
    state = {
      ...state,
      selectedItemId: itemId,
      selectedTool: 'place',
    };
    soundManager.playClick();
    emitChange();
  },

  setBrushSize(size) {
    state = { ...state, brushSize: size };
    soundManager.playClick();
    emitChange();
  },

  setViewMode(mode) {
    state = { ...state, viewMode: mode };
    soundManager.playClick();
    emitChange();
  },

  toggleSound() {
    const muted = !state.soundMuted;
    soundManager.setMuted(muted);
    state = { ...state, soundMuted: muted };
    emitChange();
  },

  // Weather & Activity Events
  triggerNextWeather() {
    const nextIdx = (state.weatherIndex + 1) % WEATHER_EVENTS.length;
    const event = WEATHER_EVENTS[nextIdx];

    state = {
      ...state,
      weatherIndex: nextIdx,
      currentWeather: event,
      weatherCountdown: 60,
      activityLogs: [
        event.narrative,
        ...state.activityLogs.slice(0, 8),
      ],
    };
    soundManager.playPlaceTile('peak');
    emitChange();
  },

  decrementWeatherTimer() {
    if (state.weatherCountdown <= 1) {
      this.triggerNextWeather();
    } else {
      state = { ...state, weatherCountdown: state.weatherCountdown - 1 };
      emitChange();
    }
  },

  addActivityLog(message) {
    state = {
      ...state,
      activityLogs: [message, ...state.activityLogs.slice(0, 8)],
    };
    emitChange();
  },

  // NPC Movement & Pathfinding Tick
  updateEntities() {
    const speedMult = state.currentWeather?.creatureSpeedMultiplier || 1.0;
    const isExterior = state.activeDomain === DOMAINS.EXTERIOR;
    const currentGrid = isExterior ? state.exteriorGrid : state.interiorGrid;
    const maxCoord = isExterior ? GRID_SIZE : INTERIOR_GRID_SIZE;

    const updated = state.entities.map((npc) => {
      let { x, y, targetX, targetY, t, speed, bouncePhase, altitude } = npc;

      t += speed * speedMult;
      bouncePhase += 0.05;

      if (t >= 1) {
        // Arrived at target, choose new neighboring coordinate
        x = targetX;
        y = targetY;
        t = 0;

        const dirs = [
          [0, 1], [1, 0], [0, -1], [-1, 0],
          [1, 1], [-1, -1], [1, -1], [-1, 1]
        ];
        const validDirs = dirs.filter(([dx, dy]) => {
          const nx = x + dx;
          const ny = y + dy;
          return nx >= 0 && nx < maxCoord && ny >= 0 && ny < maxCoord;
        });

        if (validDirs.length > 0) {
          const [pickDx, pickDy] = validDirs[Math.floor(Math.random() * validDirs.length)];
          targetX = x + pickDx;
          targetY = y + pickDy;
        }
      }

      return {
        ...npc,
        x,
        y,
        targetX,
        targetY,
        t,
        bouncePhase,
      };
    });

    state = { ...state, entities: updated };
    emitChange();
  },

  // AI Chronicler Lore Cache
  setChronicledLore(key, lore) {
    state = {
      ...state,
      chronicledLore: {
        ...state.chronicledLore,
        [key]: lore,
      },
    };
    emitChange();
  },

  // Tile Placement & Mutation
  placeItem(centerX, centerY) {
    const isExterior = state.activeDomain === DOMAINS.EXTERIOR;
    const currentGrid = isExterior ? state.exteriorGrid : state.interiorGrid;
    const maxCoord = isExterior ? GRID_SIZE : INTERIOR_GRID_SIZE;

    if (centerX < 0 || centerX >= maxCoord || centerY < 0 || centerY >= maxCoord) return;

    pushHistory();
    const newGrid = currentGrid.map(row => row.map(t => ({ ...t, metadata: { ...t.metadata } })));
    const radius = state.brushSize === 1 ? 0 : 1;
    const activeItem = ALL_ITEMS[state.selectedItemId];

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const tx = centerX + dx;
        const ty = centerY + dy;
        if (tx >= 0 && tx < maxCoord && ty >= 0 && ty < maxCoord) {
          if (state.selectedTool === 'erase') {
            if (newGrid[ty][tx].prop) {
              newGrid[ty][tx].prop = null;
            } else {
              newGrid[ty][tx].base = isExterior ? 'ground_sand' : 'int_floor_terrazzo';
              newGrid[ty][tx].elevation = 0;
            }
          } else if (state.selectedTool === 'elev_up') {
            newGrid[ty][tx].elevation = Math.min(5, (newGrid[ty][tx].elevation || 0) + 1);
          } else if (state.selectedTool === 'elev_down') {
            newGrid[ty][tx].elevation = Math.max(0, (newGrid[ty][tx].elevation || 0) - 1);
          } else if (activeItem) {
            if (activeItem.type === 'terrain' || activeItem.type === 'floor') {
              newGrid[ty][tx].base = activeItem.id;
            } else {
              newGrid[ty][tx].prop = activeItem.id;
              if (activeItem.elevation !== undefined) {
                newGrid[ty][tx].elevation = activeItem.elevation;
              }
            }
          }
        }
      }
    }

    if (state.selectedTool === 'erase') {
      soundManager.playErase();
    } else {
      soundManager.playPlaceTile(isExterior ? 'meadow' : 'crystal');
    }

    // Invalidate cached lore for this sector
    const coordKey = `[${centerX}, ${centerY}]`;
    const newLore = { ...state.chronicledLore };
    delete newLore[coordKey];

    state = {
      ...state,
      ...(isExterior ? { exteriorGrid: newGrid } : { interiorGrid: newGrid }),
      chronicledLore: newLore,
      inspectedTile: state.selectedTool === 'inspect' ? { x: centerX, y: centerY, domain: state.activeDomain } : state.inspectedTile,
    };
    emitChange();
  },

  inspectTile(x, y) {
    const isExterior = state.activeDomain === DOMAINS.EXTERIOR;
    const maxCoord = isExterior ? GRID_SIZE : INTERIOR_GRID_SIZE;
    if (x < 0 || x >= maxCoord || y < 0 || y >= maxCoord) return;

    state = {
      ...state,
      inspectedTile: { x, y, domain: state.activeDomain },
    };
    soundManager.playInspect();
    emitChange();
  },

  closeInspector() {
    state = { ...state, inspectedTile: null };
    emitChange();
  },

  updateTileProperty(x, y, key, val) {
    const isExterior = state.activeDomain === DOMAINS.EXTERIOR;
    const currentGrid = isExterior ? state.exteriorGrid : state.interiorGrid;
    pushHistory();

    const newGrid = currentGrid.map(row => row.map(t => ({ ...t, metadata: { ...t.metadata } })));
    if (newGrid[y] && newGrid[y][x]) {
      newGrid[y][x][key] = val;
    }

    state = {
      ...state,
      ...(isExterior ? { exteriorGrid: newGrid } : { interiorGrid: newGrid }),
    };
    emitChange();
  },

  setCamera(x, y, zoom) {
    state = {
      ...state,
      camera: {
        x: Math.round(x),
        y: Math.round(y),
        zoom: Math.min(2.8, Math.max(0.4, Number(zoom.toFixed(2)))),
      },
    };
    emitChange();
  },

  resetCamera() {
    state = {
      ...state,
      camera: { x: 0, y: 0, zoom: 1.0 },
    };
    soundManager.playClick();
    emitChange();
  },

  undo() {
    if (state.history.length === 0) return;
    const previous = state.history[state.history.length - 1];
    const isExterior = previous.domain === DOMAINS.EXTERIOR;
    const currentGrid = isExterior ? state.exteriorGrid : state.interiorGrid;

    state = {
      ...state,
      activeDomain: previous.domain,
      ...(isExterior ? { exteriorGrid: previous.grid } : { interiorGrid: previous.grid }),
      history: state.history.slice(0, -1),
      redoStack: [{ domain: previous.domain, grid: currentGrid }, ...state.redoStack],
    };
    soundManager.playClick();
    emitChange();
  },

  redo() {
    if (state.redoStack.length === 0) return;
    const next = state.redoStack[0];
    const isExterior = next.domain === DOMAINS.EXTERIOR;
    const currentGrid = isExterior ? state.exteriorGrid : state.interiorGrid;

    state = {
      ...state,
      activeDomain: next.domain,
      ...(isExterior ? { exteriorGrid: next.grid } : { interiorGrid: next.grid }),
      history: [...state.history, { domain: next.domain, grid: currentGrid }],
      redoStack: state.redoStack.slice(1),
    };
    soundManager.playClick();
    emitChange();
  },

  exportWorldJSON() {
    return JSON.stringify({
      version: '3.0',
      seed: state.seed,
      timestamp: new Date().toISOString(),
      exteriorGrid: state.exteriorGrid,
      interiorGrid: state.interiorGrid,
      chronicledLore: state.chronicledLore,
    }, null, 2);
  },

  importWorldJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.exteriorGrid || data.interiorGrid) {
        pushHistory();
        state = {
          ...state,
          seed: data.seed || 'imported-haven',
          ...(data.exteriorGrid ? { exteriorGrid: data.exteriorGrid } : {}),
          ...(data.interiorGrid ? { interiorGrid: data.interiorGrid } : {}),
          ...(data.chronicledLore ? { chronicledLore: data.chronicledLore } : {}),
          inspectedTile: null,
        };
        soundManager.playPlaceTile('meadow');
        emitChange();
        return true;
      }
    } catch (e) {
      console.error('Invalid JSON world data', e);
    }
    return false;
  }
};

export function useWorldStore() {
  return useSyncExternalStore(worldStore.subscribe, worldStore.getState);
}
