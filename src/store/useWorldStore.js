import { useSyncExternalStore } from 'react';
import {
  DOMAINS,
  VIEW_MODES,
  ALL_ITEMS,
  EXTERIOR_ITEMS,
  INTERIOR_ITEMS,
} from '../types/world';
import { soundManager } from '../utils/sound';

const GRID_SIZE = 16;
const INTERIOR_GRID_SIZE = 12;

// Generate the initial Exterior Resort City directly inspired by the user's reference photo!
function createInitialExteriorGrid() {
  const grid = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    const row = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      row.push({
        x,
        y,
        base: 'ground_sand',
        prop: null,
        elevation: 0,
        metadata: {},
      });
    }
    grid.push(row);
  }

  // 1. Surrounding pool and boardwalk
  for (let x = 1; x <= 4; x++) {
    for (let y = 1; y <= 4; y++) {
      grid[y][x].base = 'ground_pool';
    }
  }
  for (let x = 1; x <= 5; x++) {
    grid[5][x].base = 'ground_boardwalk';
  }

  // 2. Center Terrace Patio
  for (let y = 5; y <= 11; y++) {
    for (let x = 5; x <= 11; x++) {
      grid[y][x].base = 'ground_patio';
    }
  }

  // 3. Villa Architecture modules (From Reference Image!)
  // Coral Pink Pavilion (Center-Left)
  grid[7][7].prop = 'arch_pink_pavilion';
  grid[7][7].elevation = 2;
  grid[7][8].prop = 'arch_pink_pavilion';
  grid[7][8].elevation = 2;

  // Aqua Cylindrical Tower (Upper-Right)
  grid[6][9].prop = 'arch_blue_tower';
  grid[6][9].elevation = 3;

  // Sunshine Yellow Curved Terrace (Lower-Right)
  grid[9][9].prop = 'arch_yellow_terrace';
  grid[9][9].elevation = 1;
  grid[9][8].prop = 'arch_yellow_terrace';
  grid[9][8].elevation = 1;

  // Glass Wall Atrium (Ground-Left)
  grid[8][6].prop = 'arch_glass_atrium';
  grid[8][6].elevation = 1;

  // Yellow Architectural Stairs (Center foreground connecting decks)
  grid[10][8].prop = 'arch_yellow_stairs';
  grid[10][8].elevation = 1;

  // 4. Tropical Palm Trees (Matching reference photo background and borders!)
  const palmCoords = [
    [2, 8], [3, 11], [13, 3], [14, 6], [13, 10], [14, 13], [6, 3], [10, 2], [1, 14]
  ];
  palmCoords.forEach(([px, py]) => {
    if (grid[py] && grid[py][px]) {
      grid[py][px].prop = (px % 2 === 0) ? 'flora_royal_palm' : 'flora_coconut_palm';
    }
  });

  // Bougainvillea & White Boulders at the base
  if (grid[10] && grid[10][7]) grid[10][7].prop = 'flora_bougainvillea';
  if (grid[10] && grid[10][9]) grid[10][9].prop = 'flora_white_boulders';
  if (grid[11] && grid[11][7]) grid[11][7].prop = 'flora_white_boulders';

  // Sun cabana near pool
  if (grid[3] && grid[5]) grid[3][5].prop = 'amenity_sun_cabana';

  return grid;
}

// Generate the initial Interior Room
function createInitialInteriorGrid() {
  const grid = [];
  for (let y = 0; y < INTERIOR_GRID_SIZE; y++) {
    const row = [];
    for (let x = 0; x < INTERIOR_GRID_SIZE; x++) {
      row.push({
        x,
        y,
        base: 'int_floor_terrazzo',
        prop: null,
        elevation: 0,
        metadata: {},
      });
    }
    grid.push(row);
  }

  // Back and left walls
  for (let x = 0; x < INTERIOR_GRID_SIZE; x++) {
    grid[0][x].prop = (x > 3 && x < 8) ? 'int_wall_glass' : 'int_wall_pink';
  }
  for (let y = 1; y < INTERIOR_GRID_SIZE - 2; y++) {
    grid[y][0].prop = 'int_wall_glass';
  }

  // Kitchen Area
  grid[3][8].prop = 'int_kitchen_island';
  grid[4][8].prop = 'int_bar_stool';
  grid[2][10].prop = 'int_fridge_retro';

  // Living Area
  grid[5][4].prop = 'int_sofa_curved';
  grid[6][4].prop = 'int_table_coffee';
  grid[6][3].prop = 'int_chair_bubble';
  grid[4][2].prop = 'int_tv_console';
  grid[3][1].prop = 'int_lamp_sunset';

  // Decor & Plants
  grid[1][1].prop = 'int_plant_monstera';
  grid[1][7].prop = 'int_plant_fig';
  grid[1][10].prop = 'int_neon_sign';
  grid[7][2].prop = 'int_record_player';

  return grid;
}

let state = {
  activeDomain: DOMAINS.EXTERIOR, // 'exterior' | 'interior'
  viewMode: VIEW_MODES.ISOMETRIC,
  selectedTool: 'place', // 'place', 'inspect', 'erase', 'elev_up', 'elev_down'
  selectedCategory: 'all',
  selectedItemId: 'flora_royal_palm',
  brushSize: 1,

  // Grids
  exteriorGrid: createInitialExteriorGrid(),
  interiorGrid: createInitialInteriorGrid(),

  // Active inspect
  inspectedTile: { x: 7, y: 7, domain: DOMAINS.EXTERIOR },

  // Camera
  camera: { x: 0, y: 0, zoom: 1.0 },

  // History for Undo/Redo
  history: [],
  redoStack: [],
  soundMuted: false,

  // Simulation
  isSimulating: false,
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

  // Navigation & Tools
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
            // Erase prop first, or reset base
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
              // Building, Prop, Furniture, Wall
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

    state = {
      ...state,
      ...(isExterior ? { exteriorGrid: newGrid } : { interiorGrid: newGrid }),
      inspectedTile: { x: centerX, y: centerY, domain: state.activeDomain },
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

  // Camera
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

  // Undo / Redo
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

  // Reset / Presets
  loadPreset(preset) {
    pushHistory();
    if (preset === 'villa') {
      state = {
        ...state,
        exteriorGrid: createInitialExteriorGrid(),
        interiorGrid: createInitialInteriorGrid(),
      };
    } else if (preset === 'clear') {
      const isExterior = state.activeDomain === DOMAINS.EXTERIOR;
      const size = isExterior ? GRID_SIZE : INTERIOR_GRID_SIZE;
      const emptyGrid = [];
      for (let y = 0; y < size; y++) {
        const row = [];
        for (let x = 0; x < size; x++) {
          row.push({
            x,
            y,
            base: isExterior ? 'ground_sand' : 'int_floor_terrazzo',
            prop: null,
            elevation: 0,
            metadata: {},
          });
        }
        emptyGrid.push(row);
      }
      state = {
        ...state,
        ...(isExterior ? { exteriorGrid: emptyGrid } : { interiorGrid: emptyGrid }),
        inspectedTile: null,
      };
    }
    soundManager.playPlaceTile('crystal');
    emitChange();
  },

  // Simulation
  toggleSimulation() {
    state = { ...state, isSimulating: !state.isSimulating };
    soundManager.playClick();
    emitChange();
  },

  tickSimulation() {
    state = { ...state, simTicks: state.simTicks + 1 };
    emitChange();
  },

  exportWorldJSON() {
    return JSON.stringify({
      version: '2.0',
      timestamp: new Date().toISOString(),
      exteriorGrid: state.exteriorGrid,
      interiorGrid: state.interiorGrid,
    }, null, 2);
  },

  importWorldJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.exteriorGrid || data.interiorGrid) {
        pushHistory();
        state = {
          ...state,
          ...(data.exteriorGrid ? { exteriorGrid: data.exteriorGrid } : {}),
          ...(data.interiorGrid ? { interiorGrid: data.interiorGrid } : {}),
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
