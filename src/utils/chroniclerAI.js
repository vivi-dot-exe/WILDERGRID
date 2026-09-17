// Phase 2: AI Lore & Ecosystem Generator ("World Chronicler")
import { ALL_ITEMS, DOMAINS } from '../types/world';

const POETIC_PREFIXES = [
  'Whispering', 'Sun-Kissed', 'Radiant', 'Celestial', 'Opalescent',
  'Shimmering', 'Breezy', 'Velvet', 'Prismatic', 'Lagoon of',
  'Sanctuary of', 'Arch of', 'Haven of', 'Terrace of', 'Coral'
];

const POETIC_SUFFIXES = [
  'Solaria', 'Aura-Cove', 'Palma-Dore', 'Breeze-Haven', 'Zephyr-Reach',
  'Laguna-Rose', 'Tidewhisper', 'Golden-Drift', 'Sunbeam-Bluff', 'Lullaby'
];

const MICRO_SPECIES = [
  { name: 'Sun-Glider', type: 'Sky Manta', trait: 'Basks on yellow balcony rails at dawn', rarity: 'Common' },
  { name: 'Star-Sprite', type: 'Astral Wisp', trait: 'Spins tiny luminous circles over still pools', rarity: 'Rare' },
  { name: 'Bubble-Whale', type: 'Aero-Cetacean', trait: 'Blows miniature rainbow vapor rings in sea air', rarity: 'Uncommon' },
  { name: 'Coral-Scuttler', type: 'Pastel Crustacean', trait: 'Polishes sea-glass and arranges white boulders', rarity: 'Common' },
  { name: 'Luminary Moth', type: 'Silken Lepidoptera', trait: 'Dances around streetlamps and neon signs', rarity: 'Uncommon' },
  { name: 'Dew-Drop Gecko', type: 'Amphibian Friend', trait: 'Sips droplets from split-leaf monstera plants', rarity: 'Common' },
];

const SYNERGIES = [
  'Harmonic Solar Reflection: The curved glass pavilion amplifies morning sunlight directly into the turquoise pool, creating a gentle thermal micro-climate.',
  'Flora Resonance: Royal palm fronds filter coastal breeze, scattering soothing chlorophyll aromas across the coral patio.',
  'Acoustic Wave Diffusion: The yellow cantilevered balcony catches distant surf hums, tuning the entire sector to a relaxing 432Hz ambient chord.',
  'Terrazzo Thermal Storage: Natural stone flooring absorbs noon sunlight, releasing cozy warmth during breezy twilight hours.',
  'Bioluminescent Vitality: Potted monsteras and bougainvillea blossoms exchange photosynthetic vitality with passing star-sprites.'
];

const CONFLICTS = [
  'Playful Wind Vortex: Playful gusts occasionally roll sun-hats down the yellow staircase into the lower deck.',
  'Curious Glider Infiltration: Mischievous sun-gliders mistake yellow outdoor cushions for sunny resting petals.',
  'Sparkle Distraction: High crystal sheen on the pool water briefly hypnotizes passing bubble-whales.',
  'Neon Hum Harmony: Retro neon signs emit a gentle hum that attracts nighttime phosphorescent beetles.'
];

const NARRATIVES = [
  'Legend tells that ancient cartographers dipped their quills into liquid coral to draft the curves of this haven. Here, the boundary between architectural poise and natural tide fades into an endless tropical afternoon.',
  'Every evening when the sun sinks toward the horizon, the palms whisper bedtime lullabies to the wandering sun-gliders. The white sands hold the memory of countless peaceful dreams under starry pastel skies.',
  'Built as an open invitation to sea breezes and wandering spirits, this sanctuary echoes with soft acoustic chimes whenever the tide turns. Visitors often lose track of time while watching light play across the tinted glass.',
  'Under the shade of the curved pavilion, time unfurls like a fresh monstera leaf in warm morning mist. Even the shyest micro-creatures gather here to share sweet coconut water and quiet reveries.'
];

export async function generateLoreForSector(tile, domain = DOMAINS.EXTERIOR, customEndpoint = null) {
  // If custom LLM endpoint is provided, call it
  if (customEndpoint && customEndpoint.url) {
    try {
      const response = await fetch(customEndpoint.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(customEndpoint.apiKey ? { 'Authorization': `Bearer ${customEndpoint.apiKey}` } : {})
        },
        body: JSON.stringify({
          prompt: `Generate a whimsical architectural and ecological chronicle for a sector at [${tile.x}, ${tile.y}] with base "${tile.base}" and prop "${tile.prop}". Return JSON with islandName, species, synergy, conflict, and narrative.`,
        })
      });
      if (response.ok) {
        return await response.json();
      }
    } catch (e) {
      console.warn('Custom LLM endpoint failed, falling back to local chronicler engine:', e);
    }
  }

  // Local Combinatorial AI Chronicler Engine
  const baseItem = ALL_ITEMS[tile.base] || {};
  const propItem = tile.prop ? ALL_ITEMS[tile.prop] : null;
  const seedNum = (tile.x * 37 + tile.y * 73 + (tile.elevation || 0) * 19) % 1000;

  const prefix = POETIC_PREFIXES[seedNum % POETIC_PREFIXES.length];
  const suffix = POETIC_SUFFIXES[(seedNum + 3) % POETIC_SUFFIXES.length];
  const islandName = propItem
    ? `${prefix} ${propItem.name.split(' ')[0]} of ${suffix}`
    : `${prefix} ${baseItem.name ? baseItem.name.split(' ')[0] : 'Sands'} of ${suffix}`;

  const species = [
    MICRO_SPECIES[seedNum % MICRO_SPECIES.length],
    MICRO_SPECIES[(seedNum + 2) % MICRO_SPECIES.length],
  ];

  const synergy = SYNERGIES[seedNum % SYNERGIES.length];
  const conflict = CONFLICTS[(seedNum + 1) % CONFLICTS.length];
  const narrative = NARRATIVES[seedNum % NARRATIVES.length];

  return {
    islandName,
    coordinates: `[${tile.x}, ${tile.y}]`,
    elevation: tile.elevation || 0,
    structure: propItem ? propItem.name : 'Open Terrain',
    species,
    synergy,
    conflict,
    narrative,
    chronicledAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}
