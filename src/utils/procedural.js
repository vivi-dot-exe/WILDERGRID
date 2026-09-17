// Procedural 2D Multi-octave Perlin/Simplex FBM generator supporting string seeds
import { ALL_ITEMS } from '../types/world';

export function hashStringSeed(seedStr) {
  if (typeof seedStr === 'number') return seedStr;
  let hash = 0;
  const str = String(seedStr || 'wildergrid-cozy-island');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash) / 2147483648;
}

class FastNoise2D {
  constructor(seed = 0.42) {
    this.seed = typeof seed === 'string' ? hashStringSeed(seed) : seed;
  }

  hash(x, y) {
    let h = Math.sin(x * 12.9898 + y * 78.233 + this.seed * 43758.5453) * 43758.5453;
    return h - Math.floor(h);
  }

  smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  noise(x, y) {
    const i = Math.floor(x);
    const j = Math.floor(y);
    const fx = x - i;
    const fy = y - j;

    const sx = this.smoothstep(fx);
    const sy = this.smoothstep(fy);

    const n00 = this.hash(i, j);
    const n10 = this.hash(i + 1, j);
    const n01 = this.hash(i, j + 1);
    const n11 = this.hash(i + 1, j + 1);

    const nx0 = n00 * (1 - sx) + n10 * sx;
    const nx1 = n01 * (1 - sx) + n11 * sx;

    return nx0 * (1 - sy) + nx1 * sy;
  }

  fbm(x, y, octaves = 3) {
    let value = 0;
    let amplitude = 0.5;
    let frequency = 1;
    let maxValue = 0;

    for (let o = 0; o < octaves; o++) {
      value += this.noise(x * frequency, y * frequency) * amplitude;
      maxValue += amplitude;
      amplitude *= 0.5;
      frequency *= 2;
    }

    return value / maxValue;
  }
}

// Generate seeded tropical city island
export function generateSeededExteriorGrid(size = 16, seedStr = 'sunny-resort-villa') {
  const numSeed = hashStringSeed(seedStr);
  const elevNoise = new FastNoise2D(numSeed);
  const moistNoise = new FastNoise2D(numSeed + 123.45);
  const featureNoise = new FastNoise2D(numSeed + 678.91);

  const grid = [];
  const centerX = size / 2;
  const centerY = size / 2;
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      const dx = x - centerX + 0.5;
      const dy = y - centerY + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const islandFalloff = Math.max(0, 1 - (dist / (maxRadius * 0.88)));

      const elevVal = elevNoise.fbm(x * 0.2, y * 0.2, 3) * 0.6 + islandFalloff * 0.5;
      const moistVal = moistNoise.fbm(x * 0.25, y * 0.25, 2);
      const featVal = featureNoise.fbm(x * 0.3, y * 0.3, 2);

      let base = 'ground_sand';
      let prop = null;
      let elevation = 0;

      // Base terrain determination
      if (elevVal > 0.35) {
        if (moistVal > 0.68 && dist < maxRadius * 0.6) {
          base = 'ground_pool';
        } else if (dist < maxRadius * 0.45) {
          base = 'ground_patio';
          elevation = elevVal > 0.7 ? 2 : (elevVal > 0.52 ? 1 : 0);
        } else if (moistVal < 0.35) {
          base = 'ground_boardwalk';
        } else {
          base = 'ground_lawn';
        }
      } else {
        base = 'ground_sand';
      }

      // Feature placement based on noise seeds
      if (base === 'ground_patio') {
        if (featVal > 0.72 && elevation >= 2) {
          prop = 'arch_pink_pavilion';
        } else if (featVal > 0.62 && elevation >= 1) {
          prop = 'arch_blue_tower';
        } else if (featVal < 0.28) {
          prop = 'arch_yellow_terrace';
        } else if (featVal >= 0.45 && featVal <= 0.55 && elevation >= 1) {
          prop = 'arch_glass_atrium';
        }
      } else if (base === 'ground_sand' || base === 'ground_lawn') {
        if (featVal > 0.78) {
          prop = (x + y) % 2 === 0 ? 'flora_royal_palm' : 'flora_coconut_palm';
        } else if (featVal > 0.68) {
          prop = 'flora_bougainvillea';
        } else if (featVal < 0.18) {
          prop = 'flora_white_boulders';
        }
      } else if (base === 'ground_boardwalk' && featVal > 0.65) {
        prop = 'amenity_sun_cabana';
      }

      row.push({
        x,
        y,
        base,
        prop,
        elevation,
        metadata: {
          seed: seedStr,
          temperature: Math.round(24 + (1 - elevVal) * 8),
          moisture: Math.round(moistVal * 100),
          energyResonance: Math.round(featVal * 100),
        },
      });
    }
    grid.push(row);
  }

  // Ensure central staircase and signature pavilions if missing
  const mid = Math.floor(size / 2);
  if (!grid[mid][mid].prop) grid[mid][mid].prop = 'arch_pink_pavilion';
  if (grid[mid + 1] && !grid[mid + 1][mid].prop) grid[mid + 1][mid].prop = 'arch_yellow_stairs';
  if (grid[mid - 1] && !grid[mid - 1][mid + 1].prop) grid[mid - 1][mid + 1].prop = 'arch_blue_tower';

  return grid;
}

// Generate seeded luxury interior room
export function generateSeededInteriorGrid(size = 12, seedStr = 'cozy-penthouse') {
  const numSeed = hashStringSeed(seedStr);
  const decorNoise = new FastNoise2D(numSeed + 999);

  const grid = [];
  for (let y = 0; y < size; y++) {
    const row = [];
    for (let x = 0; x < size; x++) {
      const dVal = decorNoise.fbm(x * 0.3, y * 0.3, 2);
      let base = 'int_floor_terrazzo';
      let prop = null;

      // Flooring variation
      if (x > size - 4 && y < 5) base = 'int_floor_mint';
      else if (x < 5 && y > size - 5) base = 'int_floor_parquet';

      // Walls
      if (y === 0) {
        prop = (x >= 4 && x <= 7) ? 'int_wall_glass' : 'int_wall_pink';
      } else if (x === 0 && y < size - 2) {
        prop = 'int_wall_glass';
      }

      row.push({
        x,
        y,
        base,
        prop,
        elevation: 0,
        metadata: {
          seed: seedStr,
          aestheticHarmonics: Math.round(dVal * 100),
        },
      });
    }
    grid.push(row);
  }

  // Curated layout placement
  grid[3][size - 3].prop = 'int_kitchen_island';
  grid[4][size - 3].prop = 'int_bar_stool';
  grid[2][size - 2].prop = 'int_fridge_retro';

  grid[5][4].prop = 'int_sofa_curved';
  grid[6][4].prop = 'int_table_coffee';
  grid[6][3].prop = 'int_chair_bubble';
  grid[4][2].prop = 'int_tv_console';
  grid[3][1].prop = 'int_lamp_sunset';

  grid[1][1].prop = 'int_plant_monstera';
  grid[1][size - 4].prop = 'int_plant_fig';
  grid[1][size - 2].prop = 'int_neon_sign';
  grid[7][2].prop = 'int_record_player';

  return grid;
}
