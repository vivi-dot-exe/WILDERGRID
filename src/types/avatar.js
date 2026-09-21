export const PRIMARY_GAME_MODES = {
  creative: {
    id: 'creative',
    name: 'Creative',
    subtitle: 'Weightless Builder',
    tag: 'Unlimited Resources & Flying',
    description: 'Unlimited resources, flying, instant break. Float weightlessly across the realm with an infinite palette of Lego blocks and decorations.',
    perks: [
      'Unlimited building resources',
      'Weightless flight (Double-tap Space)',
      'Instant block break with left-click',
      'Infinite color & item selector',
    ],
    icon: 'Feather',
    color: '#00bbf9',
    accentBg: 'bg-cyan-500/15',
    borderClass: 'border-cyan-400',
    ringClass: 'ring-cyan-400',
    badgeClass: 'bg-cyan-100 text-cyan-800 border-cyan-300',
  },
  survival: {
    id: 'survival',
    name: 'Survival',
    subtitle: 'Classic Stakes',
    tag: 'Health Bar & Finite Hotbar',
    description: 'Health bar, finite hotbar resources, gravity, delayed mining. Manage stamina, survive falls, and collect materials brick-by-brick.',
    perks: [
      '10-Heart player health bar',
      'Finite hotbar inventory system',
      'Realistic gravity & fall damage',
      'Delayed block mining with cracking overlay',
    ],
    icon: 'Flame',
    color: '#f97316',
    accentBg: 'bg-orange-500/15',
    borderClass: 'border-orange-400',
    ringClass: 'ring-orange-400',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  hardcore: {
    id: 'hardcore',
    name: 'Hardcore',
    subtitle: 'Iron-Thread Permadeath',
    tag: 'Permadeath & Fragile Thread',
    description: 'Ultimate survival challenge. Bound to a single shimmering iron thread—fall damage is magnified and death permanently seals your world save.',
    perks: [
      'Single fragile life thread (Permadeath)',
      '1.5× Aggressive fall damage hazards',
      'Zero passive health regeneration',
      'Delayed block mining with cracking overlay',
    ],
    icon: 'ShieldAlert',
    color: '#e11d48',
    accentBg: 'bg-rose-500/15',
    borderClass: 'border-rose-500',
    ringClass: 'ring-rose-500',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300',
  },
  adventure: {
    id: 'adventure',
    name: 'Adventure',
    subtitle: 'Wayfarer Story & Quests',
    tag: 'Story Quests & Puzzles',
    description: 'Narrative exploration and handcrafted riddles. Interact with magical relics, NPC dialogues, and solve environmental mysteries across the archipelago.',
    perks: [
      'Narrative story quest objectives',
      'Protected historic town structures',
      'Interactive dialogue & relic triggers',
      'Stamina-based exploration & hazards',
    ],
    icon: 'Compass',
    color: '#8b5cf6',
    accentBg: 'bg-purple-500/15',
    borderClass: 'border-purple-400',
    ringClass: 'ring-purple-400',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-300',
  },
  peaceful: {
    id: 'peaceful',
    name: 'Peaceful',
    subtitle: 'Zen Sanctuary',
    tag: 'Serene Sanctuary & No Danger',
    description: 'Pure creative tranquility without danger. No fall damage, infinite stamina, soothing ambient aura, and weightless freedom to construct in peace.',
    perks: [
      'Zero fall damage & hazard immunity',
      'Infinite stamina reserves',
      'Unlimited building blocks & fast break',
      'Tranquil ambient aura & weightless flight',
    ],
    icon: 'HeartHandshake',
    color: '#10b981',
    accentBg: 'bg-emerald-500/15',
    borderClass: 'border-emerald-400',
    ringClass: 'ring-emerald-400',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  },
  spectator: {
    id: 'spectator',
    name: 'Spectator',
    subtitle: 'Chronicler Ghost',
    tag: 'No-Clip Ghost & Lore Camera',
    description: 'Omniscient free-flight camera. Phase effortlessly through solid walls and terrain without collision to inspect architecture and record world lore.',
    perks: [
      'Continuous no-clip phase flight',
      'Bypasses all block and wall collision',
      'Translucent ghost avatar presence',
      'Omniscient inspection & observation HUD',
    ],
    icon: 'Eye',
    color: '#6366f1',
    accentBg: 'bg-indigo-500/15',
    borderClass: 'border-indigo-400',
    ringClass: 'ring-indigo-400',
    badgeClass: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  architect: {
    id: 'architect',
    name: 'Architect',
    subtitle: 'Precision Blueprint',
    tag: 'Blueprint Grid & Precision Builder',
    description: 'Master builder precision mode. High-visibility structural alignment grids, accelerated flight speed, batch layout guides, and instant demolition.',
    perks: [
      'High-contrast precision blueprint grid',
      'Accelerated 1.6× flight movement speed',
      'Instant structural demolition & placement',
      'Precision coordinate & measurement HUD',
    ],
    icon: 'Ruler',
    color: '#f59e0b',
    accentBg: 'bg-amber-500/15',
    borderClass: 'border-amber-400',
    ringClass: 'ring-amber-400',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
  },
};

export const GAME_MODES = {
  ...PRIMARY_GAME_MODES,
  dreamweaver: PRIMARY_GAME_MODES.creative,
  hearthkeeper: PRIMARY_GAME_MODES.survival,
  iron_thread: PRIMARY_GAME_MODES.hardcore,
  wayfarer: PRIMARY_GAME_MODES.adventure,
  zen: PRIMARY_GAME_MODES.peaceful,
  chronicler: PRIMARY_GAME_MODES.spectator,
  blueprint: PRIMARY_GAME_MODES.architect,
};

export function isCreativeMode(mode) {
  return [
    'creative',
    'dreamweaver',
    'peaceful',
    'zen',
    'spectator',
    'chronicler',
    'architect',
    'blueprint',
  ].includes(mode);
}

export function getGameModeConfig(mode) {
  return GAME_MODES[mode] || PRIMARY_GAME_MODES.creative;
}

export const THEMES = [
  {
    id: 'pastel_dream',
    name: 'Pastel Dream',
    subtitle: 'Soft Candy & Fairy Light',
    description: 'Soft candy skybox, pastel fog, glowing fairy-light studs, and whimsical marshmallow vibes.',
    preview: ['#ff8da1', '#ffd166', '#80e5ff'],
    bgGradient: 'from-[#5ec7f8] via-[#bde9ff] to-[#fff5ea]',
    atmosphere3D: {
      skyColor: 0xbde9ff,
      fogColor: 0xffedf2,
      fogDensity: 0.013,
      sunColor: 0xfff0f5,
      sunIntensity: 1.45,
      sunPos: [24, 38, 20],
      ambientColor: 0xffffff,
      ambientIntensity: 0.92,
      studEmissive: 0xff6b8b,
      studEmissiveIntensity: 0.35,
    },
    modalTheme: {
      overlay: 'bg-black/35 backdrop-blur-md',
      container: 'bg-white/85 text-slate-800 border-white/80 shadow-[0_20px_60px_rgba(255,107,139,0.22)]',
      card: 'bg-white/75 border-white/90 text-slate-800 shadow-sm',
      cardSelected: 'border-tropical-coral bg-pink-50/50 shadow-coral-glow/30',
      tabActive: 'bg-gradient-to-r from-tropical-coral to-tropical-yellow text-white shadow-coral-glow',
      tabInactive: 'text-slate-600 hover:bg-black/5',
      primaryBtn: 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-500/25',
      accentColor: '#ff6b8b',
      pedestalColor: '#ff8da1',
      ambientColor: 0xfff5ea,
      textColor: 'text-slate-800',
      mutedText: 'text-slate-500',
    },
  },
  {
    id: 'cozy_sunset',
    name: 'Cozy Sunset',
    subtitle: 'Golden Hour & Dusk Shadows',
    description: 'Golden hour lighting, warm orange/purple horizon, ambient dusk shadows, and nostalgic glow.',
    preview: ['#ff9e3b', '#e76f51', '#7b2cbf'],
    bgGradient: 'from-[#2b1055] via-[#75225b] to-[#d4a373]',
    atmosphere3D: {
      skyColor: 0x3d1245,
      fogColor: 0x6e2652,
      fogDensity: 0.016,
      sunColor: 0xff9e3b,
      sunIntensity: 1.6,
      sunPos: [32, 14, 18],
      ambientColor: 0x4a1c54,
      ambientIntensity: 0.78,
      studEmissive: 0xffaa00,
      studEmissiveIntensity: 0.45,
    },
    modalTheme: {
      overlay: 'bg-black/45 backdrop-blur-md',
      container: 'bg-[#fefae0]/92 text-amber-950 border-[#faedcd]/90 shadow-[0_20px_60px_rgba(231,111,81,0.25)]',
      card: 'bg-amber-50/80 border-[#faedcd] text-amber-950 shadow-sm',
      cardSelected: 'border-amber-600 bg-amber-100/60 shadow-[0_0_20px_rgba(231,111,81,0.25)]',
      tabActive: 'bg-gradient-to-r from-[#e76f51] to-[#f4a261] text-white shadow-[0_0_20px_rgba(231,111,81,0.3)]',
      tabInactive: 'text-amber-800/80 hover:bg-black/5',
      primaryBtn: 'bg-gradient-to-r from-[#e76f51] via-[#f4a261] to-[#7b2cbf] text-white shadow-[0_0_25px_rgba(231,111,81,0.35)]',
      accentColor: '#e76f51',
      pedestalColor: '#f4a261',
      ambientColor: 0xfefae0,
      textColor: 'text-amber-950',
      mutedText: 'text-amber-800/70',
    },
  },
  {
    id: 'cyber_dark',
    name: 'Cyber Dark',
    subtitle: 'Neon Blocks & Midnight Sky',
    description: 'Neon block accents, midnight navy sky, glowing cyan studs, and sleek futuristic cyber aesthetics.',
    preview: ['#050814', '#00f5d4', '#7000ff'],
    bgGradient: 'from-[#050814] via-[#0f172a] to-[#1e1b4b]',
    atmosphere3D: {
      skyColor: 0x050814,
      fogColor: 0x070b1a,
      fogDensity: 0.022,
      sunColor: 0x00f5d4,
      sunIntensity: 1.15,
      sunPos: [-18, 28, -12],
      ambientColor: 0x1e1b4b,
      ambientIntensity: 0.65,
      studEmissive: 0x00f5d4,
      studEmissiveIntensity: 0.85,
    },
    modalTheme: {
      overlay: 'bg-black/65 backdrop-blur-lg',
      container: 'bg-[#0b1120]/95 text-slate-100 border-cyan-500/30 shadow-[0_20px_60px_rgba(0,245,212,0.25)]',
      card: 'bg-slate-900/85 border-white/10 text-slate-100 shadow-sm',
      cardSelected: 'border-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(0,245,212,0.35)]',
      tabActive: 'bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-500 text-white shadow-[0_0_20px_rgba(0,245,212,0.35)]',
      tabInactive: 'text-slate-400 hover:bg-white/5',
      primaryBtn: 'bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 text-white shadow-[0_0_25px_rgba(0,245,212,0.4)]',
      accentColor: '#00f5d4',
      pedestalColor: '#7000ff',
      ambientColor: 0x050814,
      textColor: 'text-slate-100',
      mutedText: 'text-slate-400',
    },
  },
];

export function getThemeById(themeId) {
  if (!themeId) return THEMES[0];
  const norm =
    themeId === 'midnight_dark'
      ? 'cyber_dark'
      : themeId === 'soft_retro'
      ? 'cozy_sunset'
      : themeId;
  return THEMES.find((t) => t.id === norm) || THEMES[0];
}

export const PRONOUNS = [
  { id: 'she_her', label: 'She / Her' },
  { id: 'he_him', label: 'He / Him' },
  { id: 'they_them', label: 'They / Them' },
  { id: 'custom', label: 'Custom' },
];

export const BODY_FORMS = [
  {
    id: 'feminine',
    name: 'Feminine',
    desc: 'Soft curves & tapered waist',
    tag: 'Curved Waist',
    torsoWidth: 0.88,
    torsoHeight: 0.98,
    shoulderWidth: 0.86,
    waistScale: 0.85,
    legHeight: 0.98,
    armWidth: 0.88,
  },
  {
    id: 'masculine',
    name: 'Masculine',
    desc: 'Broader shoulders & straight torso',
    tag: 'Broad Shoulders',
    torsoWidth: 1.08,
    torsoHeight: 1.02,
    shoulderWidth: 1.18,
    waistScale: 1.0,
    legHeight: 1.02,
    armWidth: 1.05,
  },
  {
    id: 'androgynous',
    name: 'Androgynous',
    desc: 'Balanced neutral proportions',
    tag: 'Balanced',
    torsoWidth: 0.98,
    torsoHeight: 1.0,
    shoulderWidth: 1.0,
    waistScale: 0.96,
    legHeight: 1.0,
    armWidth: 0.96,
  },
  {
    id: 'tall',
    name: 'Tall & Slender',
    desc: 'Elongated limbs & regal stature',
    tag: 'Elongated Limbs',
    torsoWidth: 0.92,
    torsoHeight: 1.14,
    shoulderWidth: 0.96,
    waistScale: 0.92,
    legHeight: 1.2,
    armWidth: 0.92,
  },
  {
    id: 'petite',
    name: 'Petite & Compact',
    desc: 'Playful mini proportions',
    tag: 'Playful Mini',
    torsoWidth: 0.94,
    torsoHeight: 0.86,
    shoulderWidth: 0.9,
    waistScale: 0.94,
    legHeight: 0.84,
    armWidth: 0.9,
  },
];

export const SKIN_TONES = [
  // Natural inclusive tones
  { id: 'espresso', name: 'Deep Espresso', hex: '#3d2314', type: 'natural' },
  { id: 'cocoa', name: 'Warm Cocoa', hex: '#603813', type: 'natural' },
  { id: 'caramel', name: 'Rich Caramel', hex: '#8d5524', type: 'natural' },
  { id: 'golden', name: 'Golden Honey', hex: '#c68642', type: 'natural' },
  { id: 'peach', name: 'Warm Peach', hex: '#e0ac69', type: 'natural' },
  { id: 'sand', name: 'Soft Sand', hex: '#f1c27d', type: 'natural' },
  { id: 'porcelain', name: 'Fair Porcelain', hex: '#ffdbac', type: 'natural' },
  // Fantasy tones
  { id: 'lavender', name: 'Pastel Lavender', hex: '#d8bbff', type: 'fantasy' },
  { id: 'mint', name: 'Fairy Mint', hex: '#b7efc5', type: 'fantasy' },
  { id: 'coral', name: 'Rosy Coral', hex: '#ffccd5', type: 'fantasy' },
  { id: 'star_blue', name: 'Celestial Cyan', hex: '#a0f0ed', type: 'fantasy' },
];

export const HAIR_STYLES = [
  { id: 'curls', name: 'Bouncy Curls', desc: 'Textured volumetric coils' },
  { id: 'locs', name: 'Crown Locs', desc: 'Sculpted neat loc strands' },
  { id: 'braids', name: 'Box Braids', desc: 'Cascading braided texture' },
  { id: 'fade', name: 'Clean Fade', desc: 'Sharp modern tapered fade' },
  { id: 'bob', name: 'Chic Bob', desc: 'Sleek rounded chin-length cut' },
  { id: 'long_flowy', name: 'Long Flowy', desc: 'Cascading wavy locks' },
  { id: 'afro', name: 'Cloud Afro', desc: 'Magnificent halo crown' },
  { id: 'pixie', name: 'Messy Pixie', desc: 'Playful textured crop' },
];

export const HAIR_COLORS = [
  { id: 'jet_black', name: 'Jet Black', hex: '#18181b' },
  { id: 'espresso_brown', name: 'Dark Espresso', hex: '#3e2723' },
  { id: 'honey_blonde', name: 'Honey Blonde', hex: '#ffd166' },
  { id: 'auburn_copper', name: 'Auburn Copper', hex: '#b23a22' },
  { id: 'cotton_pink', name: 'Cotton Candy', hex: '#ff6b8b' },
  { id: 'sky_aqua', name: 'Sky Aqua', hex: '#00bbf9' },
  { id: 'lilac_purple', name: 'Dreamy Lilac', hex: '#9d4edd' },
  { id: 'fairy_mint', name: 'Pastel Mint', hex: '#2ec4b6' },
  { id: 'silver_white', name: 'Platinum Silver', hex: '#f1f5f9' },
];

export const TOPS = [
  { id: 'hoodie', name: 'Cozy Oversized Hoodie', icon: 'Shirt' },
  { id: 'resort_shirt', name: 'Resort Camp Collar Shirt', icon: 'Shirt' },
  { id: 'fitted_tee', name: 'Minimalist Crew Tee', icon: 'Shirt' },
  { id: 'sweater', name: 'Chunky Knit Sweater', icon: 'Shirt' },
];

export const BOTTOMS = [
  { id: 'cargo_pants', name: 'Pastel Cargo Pants' },
  { id: 'linen_shorts', name: 'Linen Beach Shorts' },
  { id: 'pleated_skirt', name: 'Pleated Tennis Skirt' },
  { id: 'denim_overalls', name: 'Retro Overalls' },
];

export const SHOES = [
  { id: 'sneakers', name: 'Chunky Retro Sneakers' },
  { id: 'slides', name: 'Puff Cloud Slides' },
  { id: 'loafers', name: 'Classic Penny Loafers' },
  { id: 'high_tops', name: 'Vintage High-Tops' },
];

export const ACCESSORIES = [
  { id: 'none', name: 'None' },
  { id: 'sun_cap', name: 'Streetwear Dad Cap' },
  { id: 'beanie', name: 'Cozy Folded Beanie' },
  { id: 'sunglasses', name: 'Chic Tinted Sunglasses' },
  { id: 'glasses', name: 'Round Gold Spectacles' },
];

export const WARDROBE_PALETTES = {
  pastels: [
    '#ff6b8b', '#ff8da1', '#ffd166', '#fee440', '#80e5ff',
    '#00bbf9', '#2ec4b6', '#b7efc5', '#d8bbff', '#ffccd5',
  ],
  darkAndBold: [
    '#0f172a', '#1e293b', '#334155', '#3e2723', '#4a154b',
    '#7000ff', '#1e1b4b', '#e11d48', '#264653', '#2b2d42',
  ],
  neutrals: [
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#94a3b8', '#18181b',
  ],
};

// Flat list for simple randomizer
export const ALL_WARDROBE_COLORS = [
  ...WARDROBE_PALETTES.pastels,
  ...WARDROBE_PALETTES.darkAndBold,
  ...WARDROBE_PALETTES.neutrals,
];

export const DEFAULT_AVATAR_CONFIG = {
  username: 'BuilderVivi',
  pronouns: 'they_them',
  customPronoun: '',
  gameMode: 'creative',
  theme: 'pastel_dream',
  bodyForm: 'androgynous',
  skinTone: '#e0ac69',
  hairStyle: 'curls',
  hairColor: '#3e2723',
  topStyle: 'resort_shirt',
  topColor: '#ff8da1',
  bottomStyle: 'cargo_pants',
  bottomColor: '#ffffff',
  shoeStyle: 'sneakers',
  shoeColor: '#ffd166',
  accessory: 'sunglasses',
};
