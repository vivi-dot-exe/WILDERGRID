// Procedural 2D Simplex/Perlin-like noise generator for organic world creation
import { BIOMES } from '../types/world';

class FastNoise2D {
  constructor(seed = Math.random()) {
    this.seed = seed;
  }

  // Pseudo-random gradient hash
  hash(x, y) {
    let h = Math.sin(x * 12.9898 + y * 78.233 + this.seed * 43758.5453) * 43758.5453;
    return h - Math.floor(h);
  }

  // Smooth interpolation
  smoothstep(t) {
    return t * t * (3 - 2 * t);
  }

  // 2D Value Noise
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

  // Octave Fractal Brownian Motion
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

export function generateProceduralWorld(width = 16, height = 16, seed = Math.random()) {
  const elevNoise = new FastNoise2D(seed);
  const moistNoise = new FastNoise2D(seed + 101.37);
  const crystalNoise = new FastNoise2D(seed + 444.89);

  const grid = [];

  const centerX = width / 2;
  const centerY = height / 2;
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      // Radial falloff so it forms a floating island
      const dx = x - centerX + 0.5;
      const dy = y - centerY + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const islandFactor = Math.max(0, 1 - (dist / (maxRadius * 0.82)));

      const elevRaw = elevNoise.fbm(x * 0.22, y * 0.22, 3);
      const moistRaw = moistNoise.fbm(x * 0.18, y * 0.18, 2);
      const crystalRaw = crystalNoise.fbm(x * 0.35, y * 0.35, 2);

      const heightVal = elevRaw * 0.7 + islandFactor * 0.45;

      let biome = BIOMES.EMPTY;
      let elevation = 0;

      if (heightVal > 0.32) {
        if (heightVal > 0.75) {
          biome = BIOMES.PEAK;
          elevation = 3;
        } else if (crystalRaw > 0.62 && heightVal > 0.45) {
          biome = BIOMES.CRYSTAL;
          elevation = 2;
        } else if (moistRaw > 0.65) {
          biome = BIOMES.MARSH;
          elevation = 0;
        } else if (moistRaw < 0.28) {
          biome = BIOMES.SANDS;
          elevation = 1;
        } else if (moistRaw > 0.48 && heightVal > 0.55) {
          biome = BIOMES.CANOPY;
          elevation = 2;
        } else {
          biome = BIOMES.MEADOW;
          elevation = 1;
        }
      } else {
        biome = BIOMES.EMPTY;
        elevation = 0;
      }

      row.push({
        x,
        y,
        biome,
        elevation,
        moisture: Math.round(moistRaw * 100),
        temperature: Math.round(15 + (1 - heightVal) * 20 - (elevation * 5)),
        vegetation: Math.round(heightVal * 80),
        mana: Math.round(crystalRaw * 100),
        metadata: {
          generationSeed: seed,
          settlementPossible: biome === BIOMES.MEADOW || biome === BIOMES.CANOPY,
          simulationTicks: 0,
        }
      });
    }
    grid.push(row);
  }

  return grid;
}
