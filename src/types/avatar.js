export const GAME_MODES = {
  hearthkeeper: {
    id: 'hearthkeeper',
    name: 'Hearthkeeper',
    subtitle: 'Survival Alternative',
    shortKeywords: 'Cozy Survival • Warmth • Foraging',
    keywords: ['Cozy Survival', 'Warmth & Comfort', 'Foraging'],
    description: 'The classic wilderness loop reimagined with cozy stakes. Manage warmth and comfort, forage berries, and tend campfires against gentle mischief-makers.',
    fullDescription: 'The classic wilderness loop, reimagined with cozy stakes. Instead of running on high-stress panic meters, you manage comfort, hunger, and warmth. You forage for berries, craft patchwork tents, and befriend critters to harvest wool and seeds. Nightfall brings gentle mischief-makers rather than lethal monsters—shadow sprites might steal your fruit if your lantern goes out, requiring you to tend your campfire and build cozy shelters.',
    icon: 'Flame',
    color: '#f97316',
    borderClass: 'border-orange-400',
    bgClass: 'bg-orange-500/15 border-orange-400/40 text-orange-700',
  },
  dreamweaver: {
    id: 'dreamweaver',
    name: 'Dreamweaver',
    subtitle: 'Creative Alternative',
    shortKeywords: 'Infinite Blocks • Weightless • Toybox',
    keywords: ['Infinite Creative', 'Weightless Flight', 'Infinite Toybox'],
    description: 'A zero-consequence open-ended paradise. Float weightlessly and snap pastel tiles, glowing lanterns, and candy foliage instantly.',
    fullDescription: 'A zero-consequence, open-ended paradise for pure construction and artistry. Players float weightlessly, snapping pastel tiles, glowing lanterns, and candy-colored foliage into place instantly. Inventory limits disappear into an infinite toybox of materials, palettes, and furniture sets, allowing you to sculpt landscapes, tea pavilions, and castles in the clouds without breaking a sweat.',
    icon: 'Feather',
    color: '#00bbf9',
    borderClass: 'border-cyan-400',
    bgClass: 'bg-cyan-500/15 border-cyan-400/40 text-cyan-700',
  },
  iron_thread: {
    id: 'iron_thread',
    name: 'Iron-Thread',
    subtitle: 'Hardcore Alternative',
    shortKeywords: 'Fragile Thread • Peril • Permadeath',
    keywords: ['Fragile Thread', 'Permadeath', 'High Peril'],
    description: 'High stakes in delicate aesthetics. Journey tied to a single shimmering thread—if it snaps, your story permanently closes as a stone monument.',
    fullDescription: 'High stakes wrapped in delicate aesthetics. You journey through the world tied to a single, fragile spool of shimmering thread. Environmental hazards, treacherous winds, and wild storms pose genuine peril; if your thread snaps, your story permanently closes, transforming your character into an ancient stone statue or a field of blooming forget-me-nots that future players (or your next run) can visit.',
    icon: 'ShieldAlert',
    color: '#e11d48',
    borderClass: 'border-rose-500',
    bgClass: 'bg-rose-500/15 border-rose-400/40 text-rose-700',
  },
  wayfarer: {
    id: 'wayfarer',
    name: 'Wayfarer',
    subtitle: 'Adventure Alternative',
    shortKeywords: 'Story Villages • Puzzles • Relics',
    keywords: ['Story Quests', 'Puzzles & Riddles', 'Lost Relics'],
    description: 'Narrative exploration and handcrafted riddles. Interact through magical trinkets, keys, and dialogue to restore ancient clocktowers.',
    fullDescription: 'Built for narrative exploration and handcrafted puzzles. You cannot smash through walls or remodel the environment at will; instead, you interact with the world through magical trinkets, keys, cranks, and dialogue. You stroll through curated story villages, restore abandoned clocktowers, solve environmental riddles, and deliver lost letters across whimsical lands.',
    icon: 'Compass',
    color: '#8b5cf6',
    borderClass: 'border-purple-400',
    bgClass: 'bg-purple-500/15 border-purple-400/40 text-purple-700',
  },
  gossamer_spirit: {
    id: 'gossamer_spirit',
    name: 'Gossamer Spirit',
    subtitle: 'Spectator Alternative',
    shortKeywords: 'Invisible Breeze • Spectator • Leylines',
    keywords: ['Invisible Breeze', 'Spectator Cam', 'Hidden Leylines'],
    description: 'Drift as an invisible breeze or glowing firefly. Peek under mushroom caps and observe animal migrations and secret geode caves without disturbing a leaf.',
    fullDescription: 'You cast off your physical boots and drift as an invisible breeze or glowing firefly. Glide silently through mountains, peek under mushroom caps, and hitch rides on passing cloud-whales. You cannot touch or break blocks, but you can see the world’s hidden ley lines, animal migrations, and secret underground geode caves without disturbing a single leaf.',
    icon: 'Ghost',
    color: '#14b8a6',
    borderClass: 'border-teal-400',
    bgClass: 'bg-teal-500/15 border-teal-400/40 text-teal-700',
  },
  slumber_party: {
    id: 'slumber_party',
    name: 'Slumber Party',
    subtitle: 'Cozy Co-Op Sandbox',
    shortKeywords: 'Co-Op Rituals • Blanket Forts • Baking',
    keywords: ['Co-op Rituals', 'Blanket Forts', 'Communal Tea'],
    description: 'Cooperative celebration where tasks scale with shared presence. Engage in group baking, synchronized garden planting, and plushie collecting.',
    fullDescription: 'A dedicated multiplayer celebration mode where tasks scale with shared presence. The entire world runs on cooperative rituals: communal baking, group tea ceremonies, synchronized garden planting, and shared blanket forts. Synchronized actions unlock pastel firework displays, special musical instruments, and exclusive plushie decor items.',
    icon: 'Users',
    color: '#ec4899',
    borderClass: 'border-pink-400',
    bgClass: 'bg-pink-500/15 border-pink-400/40 text-pink-700',
  },
  bloom_decay: {
    id: 'bloom_decay',
    name: 'Bloom & Decay',
    subtitle: 'Ecology Challenge',
    shortKeywords: 'Rapid Seasons • Ecology • Harvest',
    keywords: ['Rapid Seasons', 'Ecosystem Balance', 'Candy Harvest'],
    description: 'Rapid ecological seasons that transform biomes every few days—from wild vine blooms to peppermint ice, testing your resource adaptation.',
    fullDescription: 'A whimsical simulation mode driven by rapid ecological cycles. Seasons turn every couple of in-game days, completely transforming the biome. In the Bloom cycle, vines grow wild and candy-fruit bursts open, requiring you to harvest before they overripen; in the Frost cycle, waterways turn to peppermint glass and critters burrow away, testing your ability to store supplies, adapt your settlement, and manage the ecosystem\'s delicate balance.',
    icon: 'Sprout',
    color: '#22c55e',
    borderClass: 'border-emerald-400',
    bgClass: 'bg-emerald-500/15 border-emerald-400/40 text-emerald-700',
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
  { id: 'espresso', name: 'Deep Espresso', hex: '#3d2314' },
  { id: 'cocoa', name: 'Warm Cocoa', hex: '#603813' },
  { id: 'caramel', name: 'Rich Caramel', hex: '#8d5524' },
  { id: 'golden', name: 'Golden Honey', hex: '#c68642' },
  { id: 'peach', name: 'Warm Peach', hex: '#e0ac69' },
  { id: 'sand', name: 'Soft Sand', hex: '#f1c27d' },
  { id: 'porcelain', name: 'Fair Porcelain', hex: '#ffdbac' },
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
  gameMode: 'dreamweaver',
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
