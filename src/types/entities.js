// Phase 3: Autonomous Whimsical NPCs
export const ENTITY_TYPES = {
  STAR_SPRITE: 'star_sprite',
  BUBBLE_WHALE: 'bubble_whale',
  SUN_GLIDER: 'sun_glider',
  CORAL_SCUTTLER: 'coral_scuttler',
};

export const ENTITY_CONFIGS = {
  [ENTITY_TYPES.STAR_SPRITE]: {
    type: ENTITY_TYPES.STAR_SPRITE,
    name: 'Star-Sprite',
    colors: { main: '#ffffff', glow: '#ff6b8b', trail: 'rgba(255, 107, 139, 0.4)' },
    baseSpeed: 0.035,
    altitude: 18,
    scale: 0.8,
  },
  [ENTITY_TYPES.BUBBLE_WHALE]: {
    type: ENTITY_TYPES.BUBBLE_WHALE,
    name: 'Bubble-Whale',
    colors: { main: '#80e5ff', glow: '#00bbf9', trail: 'rgba(0, 187, 249, 0.35)' },
    baseSpeed: 0.02,
    altitude: 26,
    scale: 1.2,
  },
  [ENTITY_TYPES.SUN_GLIDER]: {
    type: ENTITY_TYPES.SUN_GLIDER,
    name: 'Sun-Glider',
    colors: { main: '#fee440', glow: '#ffd166', trail: 'rgba(255, 209, 102, 0.4)' },
    baseSpeed: 0.028,
    altitude: 22,
    scale: 1.0,
  },
  [ENTITY_TYPES.CORAL_SCUTTLER]: {
    type: ENTITY_TYPES.CORAL_SCUTTLER,
    name: 'Coral-Scuttler',
    colors: { main: '#ff8da1', glow: '#ff6b8b', trail: 'rgba(255, 141, 161, 0.3)' },
    baseSpeed: 0.04,
    altitude: 4,
    scale: 0.7,
  },
};

export function createInitialEntities(gridSize = 16) {
  return [
    {
      id: 'npc-1',
      type: ENTITY_TYPES.STAR_SPRITE,
      x: 7,
      y: 7,
      targetX: 8,
      targetY: 7,
      t: 0,
      altitude: 18,
      bouncePhase: 0,
      speed: 0.03,
    },
    {
      id: 'npc-2',
      type: ENTITY_TYPES.BUBBLE_WHALE,
      x: 2,
      y: 3,
      targetX: 3,
      targetY: 4,
      t: 0,
      altitude: 26,
      bouncePhase: 1.2,
      speed: 0.018,
    },
    {
      id: 'npc-3',
      type: ENTITY_TYPES.SUN_GLIDER,
      x: 9,
      y: 9,
      targetX: 10,
      targetY: 8,
      t: 0,
      altitude: 22,
      bouncePhase: 2.4,
      speed: 0.025,
    },
    {
      id: 'npc-4',
      type: ENTITY_TYPES.CORAL_SCUTTLER,
      x: 5,
      y: 6,
      targetX: 6,
      targetY: 6,
      t: 0,
      altitude: 4,
      bouncePhase: 3.1,
      speed: 0.035,
    },
  ];
}
