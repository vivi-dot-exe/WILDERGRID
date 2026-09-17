export const GAME_MODES = {
  CREATIVE: {
    id: 'creative',
    name: 'Creative Mode',
    badge: 'Unlimited',
    icon: 'Feather',
    description: 'Unlimited resources, free flying camera, and instant terrain placement.',
    features: ['Unlimited Resources', 'Instant Placement', 'God-eye Camera'],
    color: '#00bbf9',
    bgClass: 'bg-cyan-500/15 border-cyan-400/40 text-cyan-700',
  },
  SURVIVAL: {
    id: 'survival',
    name: 'Survival Mode',
    badge: 'Challenge',
    icon: 'Shield',
    description: 'Health & stamina meters, finite hotbar resources, gravity, and simulated harvesting.',
    features: ['Health & Energy', 'Resource Gathering', 'Day/Night Dangers'],
    color: '#ff6b8b',
    bgClass: 'bg-rose-500/15 border-rose-400/40 text-rose-700',
  },
};

export const THEMES = [
  {
    id: 'pastel_dream',
    name: 'Pastel Dream',
    subtitle: 'Vibrant & Whimsical',
    preview: ['#ff8da1', '#ffd166', '#80e5ff'],
    bgGradient: 'from-[#5ec7f8] via-[#bde9ff] to-[#fff5ea]',
  },
  {
    id: 'midnight_dark',
    name: 'Midnight Dark',
    subtitle: 'Cosmic & Sleek',
    preview: ['#1e1b4b', '#7000ff', '#38bdf8'],
    bgGradient: 'from-[#0f172a] via-[#1e1b4b] to-[#090d16]',
  },
  {
    id: 'soft_retro',
    name: 'Soft Retro',
    subtitle: 'Warm Butter & Terracotta',
    preview: ['#f4a261', '#e76f51', '#2a9d8f'],
    bgGradient: 'from-[#fefae0] via-[#faedcd] to-[#d4a373]',
  },
];

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
    torsoWidth: 0.9,
    torsoHeight: 1.0,
    shoulderWidth: 0.88,
    legHeight: 1.0,
  },
  {
    id: 'masculine',
    name: 'Masculine',
    desc: 'Broader shoulders & straight torso',
    torsoWidth: 1.05,
    torsoHeight: 1.02,
    shoulderWidth: 1.15,
    legHeight: 1.02,
  },
  {
    id: 'androgynous',
    name: 'Androgynous',
    desc: 'Balanced neutral proportions',
    torsoWidth: 0.98,
    torsoHeight: 1.0,
    shoulderWidth: 1.0,
    legHeight: 1.0,
  },
  {
    id: 'tall',
    name: 'Tall & Slender',
    desc: 'Elongated limbs & regal stature',
    torsoWidth: 0.92,
    torsoHeight: 1.12,
    shoulderWidth: 0.98,
    legHeight: 1.18,
  },
  {
    id: 'petite',
    name: 'Petite & Compact',
    desc: 'Playful mini proportions',
    torsoWidth: 0.95,
    torsoHeight: 0.88,
    shoulderWidth: 0.92,
    legHeight: 0.85,
  },
];

export const SKIN_TONES = [
  // Natural inclusive tones
  { id: 'espresso', name: 'Deep Espresso', hex: '#3d2314' },
  { id: 'cocoa', name: 'Warm Cocoa', hex: '#603813' },
  { id: 'caramel', name: 'Rich Caramel', hex: '#8d5524' },
  { id: 'golden', name: 'Golden Honey', hex: '#c68642' },
  { id: 'peach', name: 'Warm Peach', hex: '#e0ac69' },
  { id: 'sand', name: 'Soft Sand', hex: '#f1c27d' },
  { id: 'porcelain', name: 'Fair Porcelain', hex: '#ffdbac' },
  // Whimsical / Fantasy tones
  { id: 'lavender', name: 'Pastel Lavender', hex: '#d8bbff' },
  { id: 'mint', name: 'Fairy Mint', hex: '#b7efc5' },
  { id: 'coral', name: 'Rosy Coral', hex: '#ffccd5' },
  { id: 'star_blue', name: 'Celestial Cyan', hex: '#a0f0ed' },
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
  { id: 'hoodie', name: 'Cozy Oversized Hoodie' },
  { id: 'resort_shirt', name: 'Resort Camp Collar Shirt' },
  { id: 'fitted_tee', name: 'Minimalist Crew Tee' },
  { id: 'sweater', name: 'Chunky Knit Sweater' },
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

export const WARDROBE_PALETTES = [
  '#ff6b8b', '#ff8da1', '#ffd166', '#fee440', '#00bbf9',
  '#2ec4b6', '#57cc99', '#9d4edd', '#ffffff', '#1e293b'
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
