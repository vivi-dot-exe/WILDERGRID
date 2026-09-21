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
import {
  DEFAULT_AVATAR_CONFIG,
  PRIMARY_GAME_MODES,
  GAME_MODES,
  isCreativeMode,
} from '../types/avatar';
import { DEFAULT_HOTBAR_SLOTS } from '../types/hotbar';
import { multiplayerManager } from '../utils/multiplayer';

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
  soundVolume: 0.8,
  mouseSensitivity: 1.0,
  cameraSmoothing: true,
  headBobbing: true,

  // Avatar & Initial Modals
  avatarConfig: DEFAULT_AVATAR_CONFIG,
  showOnboarding: false,
  showLoginModal: true,
  showLoadingScreen: false,
  showAvatarStudio: false,
  showSettingsModal: false,

  // Simulation
  isSimulating: true,
  simTicks: 0,

  // 3D Lego Voxel Construction - Pristine world with open building canvas
  legoBricks: [],
  legoSelectedColor: '#ff6b8b',

  // 9-Slot Hotbar & Inventory
  hotbarSlots: [...DEFAULT_HOTBAR_SLOTS],
  selectedHotbarIndex: 0,
  isInventoryOpen: false,

  // Survival Vitals
  playerHealth: 20, // 10 hearts
  playerStamina: 20, // 10 stamina units
  isFlying: false, // Creative flight mode

  // Live Multiplayer Sync Layer
  multiplayer: {
    status: 'disconnected', // 'disconnected' | 'connecting' | 'connected' | 'error'
    isHost: false,
    roomCode: '',
    peerId: null,
    error: null,
    remotePlayers: {}, // { [peerId]: { id, username, avatarConfig, position, targetPosition, yaw, targetYaw, isMoving, isFlying } }
  },
  showMultiplayerModal: false,
  showSaveLoadModal: false,
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
    state = { ...state, showAvatarStudio: true };
    emitChange();
  },

  closeOnboarding() {
    state = { ...state, showAvatarStudio: false, showOnboarding: false };
    emitChange();
  },

  openLoginModal() {
    state = { ...state, showLoginModal: true };
    emitChange();
  },

  closeLoginModal() {
    state = { ...state, showLoginModal: false };
    emitChange();
  },

  startWorldGeneration(config) {
    const isCreative = isCreativeMode(config?.gameMode);
    const modeObj =
      PRIMARY_GAME_MODES[config?.gameMode] ||
      GAME_MODES[config?.gameMode] ||
      PRIMARY_GAME_MODES.creative;

    const isSpectator =
      config?.gameMode === 'spectator' || config?.gameMode === 'chronicler';

    const cleanSeed = (config?.seed || state.seed || 'sunlit-archipelago').trim();
    const freshExterior = generateSeededExteriorGrid(GRID_SIZE, cleanSeed);
    const freshInterior = generateSeededInteriorGrid(INTERIOR_GRID_SIZE, cleanSeed + '-room');

    state = {
      ...state,
      avatarConfig: { ...state.avatarConfig, ...config },
      seed: cleanSeed,
      exteriorGrid: freshExterior,
      interiorGrid: freshInterior,
      viewMode: VIEW_MODES.WALK_3D, // Direct 3D Minecraft Walk & Build
      showLoginModal: false,
      showLoadingScreen: true,
      playerHealth: 20,
      playerStamina: 20,
      isFlying: isSpectator ? true : isCreative ? state.isFlying : false,
      activityLogs: [
        `✨ World Generated! Welcome ${config.username || 'Builder'} (${modeObj.name.toUpperCase()} - ${modeObj.subtitle.toUpperCase()}) to ${cleanSeed}`,
        ...state.activityLogs.slice(0, 6),
      ],
    };
    emitChange();
  },

  completeWorldLoading() {
    state = {
      ...state,
      showLoadingScreen: false,
      viewMode: VIEW_MODES.WALK_3D,
    };
    soundManager.playPlaceTile('meadow');
    emitChange();
  },

  openAvatarStudio() {
    state = { ...state, showAvatarStudio: true };
    emitChange();
  },

  closeAvatarStudio() {
    state = { ...state, showAvatarStudio: false };
    emitChange();
  },

  toggleAvatarStudio() {
    state = { ...state, showAvatarStudio: !state.showAvatarStudio };
    emitChange();
  },

  saveAvatarConfig(newConfig) {
    state = {
      ...state,
      avatarConfig: { ...state.avatarConfig, ...newConfig },
      showAvatarStudio: false,
      showOnboarding: false,
    };
    soundManager.playPlaceTile('terrace');
    emitChange();
  },

  addHotbarItemCount(itemIdOrColor, count = 1) {
    const slots = [...state.hotbarSlots];
    let found = false;

    // Check if slot with this id or color exists
    for (let i = 0; i < slots.length; i++) {
      if (
        slots[i].id === itemIdOrColor ||
        slots[i].color === itemIdOrColor ||
        slots[i].propId === itemIdOrColor ||
        (itemIdOrColor === 'brick_wood_log' && slots[i].id === 'brick_wood_log') ||
        (itemIdOrColor === 'brick_wood_plank' && slots[i].id === 'brick_wood_plank')
      ) {
        slots[i] = { ...slots[i], count: slots[i].count + count };
        found = true;
        break;
      }
    }

    // If not found in active hotbar, put into first 0-count slot or replace last slot
    if (!found) {
      let emptyIdx = slots.findIndex((s) => s.count === 0);
      if (emptyIdx === -1) emptyIdx = slots.length - 1;

      if (itemIdOrColor === 'brick_wood_log' || itemIdOrColor === '#6f4e37') {
        slots[emptyIdx] = {
          id: 'brick_wood_log',
          name: 'Lego Wood Log',
          type: 'brick',
          color: '#795548',
          icon: 'Box',
          count: count,
        };
      } else if (itemIdOrColor === 'brick_wood_plank' || itemIdOrColor === '#d4a373') {
        slots[emptyIdx] = {
          id: 'brick_wood_plank',
          name: 'Lego Wood Planks',
          type: 'brick',
          color: '#d4a373',
          icon: 'Box',
          count: count,
        };
      } else {
        slots[emptyIdx] = {
          ...slots[emptyIdx],
          count: slots[emptyIdx].count + count,
        };
      }
    }

    state = {
      ...state,
      hotbarSlots: slots,
      activityLogs: [
        `🪵 Harvested resources! (+${count} added to hotbar)`,
        ...state.activityLogs.slice(0, 5),
      ],
    };
    soundManager.playPlaceTile('meadow');
    emitChange();
  },

  saveAndEnterWorld(newConfig) {
    const isCreative = isCreativeMode(newConfig?.gameMode);
    const modeObj =
      PRIMARY_GAME_MODES[newConfig?.gameMode] ||
      GAME_MODES[newConfig?.gameMode] ||
      PRIMARY_GAME_MODES.creative;

    const isSpectator =
      newConfig?.gameMode === 'spectator' || newConfig?.gameMode === 'chronicler';

    state = {
      ...state,
      avatarConfig: newConfig,
      showOnboarding: false,
      showAvatarStudio: false,
      playerHealth: 20,
      playerStamina: 20,
      isFlying: isSpectator ? true : isCreative ? state.isFlying : false,
      activityLogs: [
        `✨ Welcome ${newConfig.username} (${modeObj.name.toUpperCase()} MODE - ${modeObj.subtitle.toUpperCase()}) to Wildergrid!`,
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

  // 3D Lego Voxel Actions
  placeLegoBrick(x, y, z, color, propId = null, broadcast = true) {
    const key = `${x},${y},${z}`;
    const brickColor = color || state.legoSelectedColor || '#ff6b8b';
    const existingIndex = state.legoBricks.findIndex(b => b.x === x && b.y === y && b.z === z);
    const newBrick = { id: key, x, y, z, color: brickColor, propId };
    let newBricks;
    if (existingIndex >= 0) {
      newBricks = [...state.legoBricks];
      newBricks[existingIndex] = newBrick;
    } else {
      newBricks = [...state.legoBricks, newBrick];
    }
    state = { ...state, legoBricks: newBricks };
    soundManager.playPop();
    emitChange();

    if (broadcast) {
      multiplayerManager.sendPlaceBlock(x, y, z, brickColor, propId);
    }
  },

  removeLegoBrick(x, y, z, broadcast = true) {
    const newBricks = state.legoBricks.filter(b => !(b.x === x && b.y === y && b.z === z));
    if (newBricks.length !== state.legoBricks.length) {
      state = { ...state, legoBricks: newBricks };
      soundManager.playClick();
      emitChange();

      if (broadcast) {
        multiplayerManager.sendRemoveBlock(x, y, z);
      }
    }
  },

  setLegoSelectedColor(color) {
    state = { ...state, legoSelectedColor: color };
    emitChange();
  },

  clearLegoBricks() {
    state = { ...state, legoBricks: [] };
    emitChange();
  },

  // Live Multiplayer Sync Actions
  setMultiplayerStatus(status, details = {}) {
    state = {
      ...state,
      multiplayer: {
        ...state.multiplayer,
        status,
        ...details,
      },
    };
    emitChange();
  },

  toggleMultiplayerModal(forcedOpen = null) {
    const nextOpen = forcedOpen !== null ? forcedOpen : !state.showMultiplayerModal;
    state = { ...state, showMultiplayerModal: nextOpen };
    soundManager.playClick();
    emitChange();
  },

  addRemotePlayer(peerId, player) {
    const remotePlayers = { ...state.multiplayer.remotePlayers };
    remotePlayers[peerId] = {
      id: player.id || peerId,
      username: player.username || 'Traveler',
      avatarConfig: player.avatarConfig || DEFAULT_AVATAR_CONFIG,
      position: player.position || { x: 4.5, y: 1.5, z: 4.5 },
      targetPosition: player.position || { x: 4.5, y: 1.5, z: 4.5 },
      yaw: player.yaw || 0,
      targetYaw: player.yaw || 0,
      isMoving: false,
      isFlying: false,
    };
    state = {
      ...state,
      multiplayer: {
        ...state.multiplayer,
        remotePlayers,
      },
    };
    emitChange();
  },

  removeRemotePlayer(peerId) {
    const remotePlayers = { ...state.multiplayer.remotePlayers };
    const p = remotePlayers[peerId];
    delete remotePlayers[peerId];
    state = {
      ...state,
      multiplayer: {
        ...state.multiplayer,
        remotePlayers,
      },
      activityLogs: p
        ? [`👋 ${p.username} left the room.`, ...state.activityLogs.slice(0, 5)]
        : state.activityLogs,
    };
    emitChange();
  },

  updateRemotePlayerPosition(peerId, moveData) {
    const remotePlayers = state.multiplayer.remotePlayers;
    const existing = remotePlayers[peerId];
    if (!existing) return;

    const updated = {
      ...existing,
      targetPosition: { x: moveData.x, y: moveData.y, z: moveData.z },
      targetYaw: moveData.yaw !== undefined ? moveData.yaw : existing.targetYaw,
      isMoving: !!moveData.isMoving,
      isFlying: !!moveData.isFlying,
    };

    state = {
      ...state,
      multiplayer: {
        ...state.multiplayer,
        remotePlayers: {
          ...remotePlayers,
          [peerId]: updated,
        },
      },
    };
    emitChange();
  },

  clearRemotePlayers() {
    state = {
      ...state,
      multiplayer: {
        ...state.multiplayer,
        remotePlayers: {},
      },
    };
    emitChange();
  },

  syncFullLegoWorld(bricks) {
    if (!Array.isArray(bricks)) return;
    state = {
      ...state,
      legoBricks: [...bricks],
      activityLogs: [
        `📥 Synchronized ${bricks.length} Lego structures from host!`,
        ...state.activityLogs.slice(0, 5),
      ],
    };
    soundManager.playPlaceTile('crystal');
    emitChange();
  },

  // Hotbar & Survival Management
  setSelectedHotbarIndex(idx) {
    const clamped = Math.max(0, Math.min(8, idx));
    state = { ...state, selectedHotbarIndex: clamped };
    const item = state.hotbarSlots[clamped];
    if (item && item.color) {
      state.legoSelectedColor = item.color;
    }
    soundManager.playClick();
    emitChange();
  },

  setHotbarSlot(idx, item) {
    const newSlots = [...state.hotbarSlots];
    newSlots[idx] = item;
    state = { ...state, hotbarSlots: newSlots };
    emitChange();
  },

  toggleInventory(forcedOpen = null) {
    const nextOpen = forcedOpen !== null ? forcedOpen : !state.isInventoryOpen;
    state = { ...state, isInventoryOpen: nextOpen };
    soundManager.playClick();
    emitChange();
  },

  setSelectedHotbarIndex(index) {
    state = { ...state, selectedHotbarIndex: Math.max(0, Math.min(8, index)) };
    soundManager.playClick();
    emitChange();
  },

  cycleHotbar(direction) {
    const currentIdx = state.selectedHotbarIndex;
    const nextIdx = (currentIdx + direction + 9) % 9;
    state = { ...state, selectedHotbarIndex: nextIdx };
    soundManager.playClick();
    emitChange();
  },

  damagePlayer(amount) {
    const mode = state.avatarConfig?.gameMode || 'creative';
    // Immunity in creative-type modes (Creative, Peaceful, Spectator, Architect)
    if (isCreativeMode(mode)) {
      return;
    }

    // Hardcore mode: 1.5x damage and permadeath
    const isHardcore = mode === 'hardcore' || mode === 'iron_thread';
    const effectiveDamage = isHardcore ? Math.ceil(amount * 1.5) : amount;
    const nextHealth = Math.max(0, state.playerHealth - effectiveDamage);

    if (nextHealth === 0) {
      if (isHardcore) {
        state = {
          ...state,
          playerHealth: 0,
          activityLogs: [
            '⚡ PERMADEATH: Your single iron thread has snapped! The story of your world has ended.',
            ...state.activityLogs.slice(0, 5),
          ],
        };
        soundManager.playPlaceTile('marsh');
      } else {
        state = {
          ...state,
          playerHealth: 20,
          playerStamina: 20,
          activityLogs: [
            '💀 You succumbed to fall damage and woke up safe at camp!',
            ...state.activityLogs.slice(0, 5),
          ],
        };
        soundManager.playPlaceTile('marsh');
      }
    } else {
      state = { ...state, playerHealth: nextHealth };
      soundManager.playPlaceTile('peak');
    }
    emitChange();
  },

  healPlayer(amount) {
    const nextHealth = Math.min(20, state.playerHealth + amount);
    state = { ...state, playerHealth: nextHealth };
    emitChange();
  },

  consumeStamina(amount) {
    const mode = state.avatarConfig?.gameMode || 'creative';
    if (isCreativeMode(mode) || mode === 'peaceful' || mode === 'zen') {
      return; // Infinite stamina
    }
    const nextStamina = Math.max(0, state.playerStamina - amount);
    state = { ...state, playerStamina: nextStamina };
    emitChange();
  },

  recoverStamina(amount) {
    const nextStamina = Math.min(20, state.playerStamina + amount);
    state = { ...state, playerStamina: nextStamina };
    emitChange();
  },

  consumeCurrentHotbarItem() {
    const idx = state.selectedHotbarIndex;
    const current = state.hotbarSlots[idx];
    if (!current) return false;
    const newSlots = [...state.hotbarSlots];
    newSlots[idx] = { ...current, count: Math.max(0, current.count - 1) };
    state = { ...state, hotbarSlots: newSlots };
    emitChange();
    return true;
  },

  addHotbarItemCount(identifier, count = 1) {
    const newSlots = [...state.hotbarSlots];
    const existing = newSlots.find(
      (s) => s.id === identifier || s.color === identifier || s.propId === identifier
    );
    if (existing) {
      existing.count += count;
    } else {
      const activeSlot = newSlots[state.selectedHotbarIndex];
      if (activeSlot) {
        activeSlot.count += count;
      }
    }
    state = { ...state, hotbarSlots: newSlots };
    soundManager.playPlaceTile('meadow');
    emitChange();
  },

  setFlying(flying) {
    state = { ...state, isFlying: flying };
    emitChange();
  },

  toggleSound() {
    const muted = !state.soundMuted;
    soundManager.setMuted(muted);
    state = { ...state, soundMuted: muted };
    emitChange();
  },

  setSoundMuted(muted) {
    soundManager.setMuted(muted);
    state = { ...state, soundMuted: !!muted };
    emitChange();
  },

  setSoundVolume(volume) {
    const clamped = Math.max(0, Math.min(1, volume));
    soundManager.setVolume(clamped);
    state = { ...state, soundVolume: clamped };
    emitChange();
  },

  setMouseSensitivity(sens) {
    const clamped = Math.max(0.2, Math.min(3.0, sens));
    state = { ...state, mouseSensitivity: clamped };
    emitChange();
  },

  setCameraSmoothing(smoothing) {
    state = { ...state, cameraSmoothing: !!smoothing };
    emitChange();
  },

  setHeadBobbing(bobbing) {
    state = { ...state, headBobbing: !!bobbing };
    emitChange();
  },

  toggleSettingsModal(force) {
    const nextVal = force !== undefined ? !!force : !state.showSettingsModal;
    state = { ...state, showSettingsModal: nextVal };
    soundManager.playClick();
    emitChange();
  },

  closeSettingsModal() {
    state = { ...state, showSettingsModal: false };
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

  setTheme(themeId) {
    const nextTheme = themeId === 'midnight_dark' ? 'cyber_dark' : themeId === 'soft_retro' ? 'cozy_sunset' : themeId;
    state = {
      ...state,
      avatarConfig: {
        ...state.avatarConfig,
        theme: nextTheme,
      },
      activityLogs: [
        `🎨 Switched world theme to "${nextTheme.replace('_', ' ').toUpperCase()}"!`,
        ...state.activityLogs.slice(0, 5),
      ],
    };
    soundManager.playClick();
    emitChange();
  },

  toggleSaveLoadModal(forcedOpen = null) {
    const nextOpen = forcedOpen !== null ? forcedOpen : !state.showSaveLoadModal;
    state = { ...state, showSaveLoadModal: nextOpen };
    soundManager.playClick();
    emitChange();
  },

  // World Persistence & Export (v4.0 Compact Production Schema)
  exportWorldData(name = null) {
    const worldName = name || `World-${state.seed}-${new Date().toLocaleDateString()}`;
    return {
      version: '4.0',
      name: worldName,
      timestamp: new Date().toISOString(),
      seed: state.seed,
      theme: state.avatarConfig?.theme || 'pastel_dream',
      gameMode: state.avatarConfig?.gameMode || 'creative',
      player: {
        health: state.playerHealth,
        stamina: state.playerStamina,
        isFlying: state.isFlying,
      },
      stats: {
        totalBricks: state.legoBricks.length,
        exteriorTiles: state.exteriorGrid.length * state.exteriorGrid[0].length,
      },
      legoBricks: state.legoBricks.map((b) => ({
        x: b.x,
        y: b.y,
        z: b.z,
        color: b.color,
        propId: b.propId || null,
      })),
      exteriorGrid: state.exteriorGrid,
      interiorGrid: state.interiorGrid,
      chronicledLore: state.chronicledLore,
    };
  },

  exportWorldJSON(name = null) {
    const data = this.exportWorldData(name);
    return JSON.stringify(data, null, 2);
  },

  loadWorldData(data) {
    if (!data) return false;
    pushHistory();

    const rawTheme = data.theme || state.avatarConfig?.theme || 'pastel_dream';
    const newTheme = rawTheme === 'midnight_dark' ? 'cyber_dark' : rawTheme === 'soft_retro' ? 'cozy_sunset' : rawTheme;

    const newBricks = Array.isArray(data.legoBricks)
      ? data.legoBricks.map((b) => ({
          id: `${b.x},${b.y},${b.z}`,
          x: b.x,
          y: b.y,
          z: b.z,
          color: b.color || '#ff6b8b',
          propId: b.propId || null,
        }))
      : state.legoBricks;

    state = {
      ...state,
      seed: data.seed || state.seed,
      legoBricks: newBricks,
      avatarConfig: {
        ...state.avatarConfig,
        theme: newTheme,
        gameMode: data.gameMode || data.player?.gameMode || state.avatarConfig?.gameMode || 'creative',
      },
      playerHealth: data.player?.health ?? 20,
      playerStamina: data.player?.stamina ?? 20,
      isFlying: !!data.player?.isFlying,
      ...(data.exteriorGrid ? { exteriorGrid: data.exteriorGrid } : {}),
      ...(data.interiorGrid ? { interiorGrid: data.interiorGrid } : {}),
      ...(data.chronicledLore ? { chronicledLore: data.chronicledLore } : {}),
      inspectedTile: null,
      activityLogs: [
        `💾 World "${data.name || data.seed || 'Loaded World'}" successfully loaded!`,
        ...state.activityLogs.slice(0, 5),
      ],
    };
    soundManager.playPlaceTile('crystal');
    emitChange();
    return true;
  },

  importWorldJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      return this.loadWorldData(data);
    } catch (e) {
      console.error('Invalid JSON world data', e);
      return false;
    }
  },
};

export function useWorldStore() {
  return useSyncExternalStore(worldStore.subscribe, worldStore.getState);
}
