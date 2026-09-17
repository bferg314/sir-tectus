import { BiomeConfig, BiomeTier } from './BiomeTypes';

export const BIOMES: Record<string, BiomeConfig> = {
  // ==========================================
  // TIER 1: EASY BIOMES (Maps 1 & 2)
  // ==========================================
  'verdant-canopy': {
    id: 'verdant-canopy',
    name: 'Verdant Canopy',
    tier: 'easy',
    theme: 'Lush Forest',
    description: 'Enchanted woods with bouncy mushrooms and gentle rolling branches.',
    bgColor: '#091811',
    bgGradient: ['#0d281e', '#05140d'],
    platformColor: '#1b4332',
    platformBorder: '#2d6a4f',
    material: 'wood',
    ambientParticle: 'leaves',
    lightColor: '#74c69d',
    uniqueEnemy: 'spore_shroom'
  },
  'royal-courtyard': {
    id: 'royal-courtyard',
    name: 'Royal Courtyard',
    tier: 'easy',
    theme: 'Castle Battlements',
    description: 'Grand stone battlements adorned with royal heraldry and glowing torches.',
    bgColor: '#0f1422',
    bgGradient: ['#162035', '#080c18'],
    platformColor: '#2b3a55',
    platformBorder: '#4a628a',
    material: 'stone',
    ambientParticle: 'sparks',
    lightColor: '#ffd166',
    uniqueEnemy: 'royal_guard'
  },
  'sunlit-aqueducts': {
    id: 'sunlit-aqueducts',
    name: 'Sunlit Aqueducts',
    tier: 'easy',
    theme: 'Waterway Ruins',
    description: 'Pristine ancient channels with shallow pools and refreshing waterfalls.',
    bgColor: '#081721',
    bgGradient: ['#0e2a3f', '#050f16'],
    platformColor: '#1d3e53',
    platformBorder: '#2e6f95',
    material: 'ancient',
    ambientParticle: 'bubbles',
    lightColor: '#4cc9f0',
    uniqueEnemy: 'tide_lurker'
  },
  'whispering-grottos': {
    id: 'whispering-grottos',
    name: 'Whispering Grottos',
    tier: 'easy',
    theme: 'Crystal Caves',
    description: 'Softly luminescent subterranean caves with singing crystal formations.',
    bgColor: '#120d20',
    bgGradient: ['#1e1436', '#090612'],
    platformColor: '#30224d',
    platformBorder: '#533c85',
    material: 'crystal',
    ambientParticle: 'crystals',
    lightColor: '#b5179e',
    uniqueEnemy: 'crystal_crawler'
  },

  // ==========================================
  // TIER 2: MEDIUM BIOMES (Maps 2 & 3)
  // ==========================================
  'clockwork-foundry': {
    id: 'clockwork-foundry',
    name: 'Clockwork Foundry',
    tier: 'medium',
    theme: 'Steampunk Machinery',
    description: 'Industrial maze of turning gears, swift conveyor belts, and roaring steam vents.',
    bgColor: '#1a1208',
    bgGradient: ['#2e1f0e', '#100a04'],
    platformColor: '#4d3419',
    platformBorder: '#7d562b',
    material: 'tech',
    ambientParticle: 'steam',
    lightColor: '#ffb703',
    uniqueEnemy: 'steam_automaton'
  },
  'molten-caverns': {
    id: 'molten-caverns',
    name: 'Molten Caverns',
    tier: 'medium',
    theme: 'Volcanic Caldera',
    description: 'Hazardous basalt crags suspended over churning pools of fiery magma.',
    bgColor: '#1a0907',
    bgGradient: ['#2e0f0c', '#100504'],
    platformColor: '#3a120f',
    platformBorder: '#6d211b',
    material: 'basalt',
    ambientParticle: 'embers',
    lightColor: '#fb5607',
    uniqueEnemy: 'magma_brute'
  },
  'frostpeak-summit': {
    id: 'frostpeak-summit',
    name: 'Frostpeak Summit',
    tier: 'medium',
    theme: 'Frozen Glaciers',
    description: 'Slick icy ridges, sharp stalactites, and biting mountain snowstorms.',
    bgColor: '#091522',
    bgGradient: ['#0e243a', '#050d16'],
    platformColor: '#1d3e5e',
    platformBorder: '#3a72a8',
    material: 'ice',
    ambientParticle: 'snow',
    lightColor: '#a2d2ff',
    uniqueEnemy: 'frost_yeti'
  },
  'sunken-catacombs': {
    id: 'sunken-catacombs',
    name: 'Sunken Catacombs',
    tier: 'medium',
    theme: 'Submerged Crypt',
    description: 'Flooded tomb passages haunted by ancient skeletons and crumbling arches.',
    bgColor: '#0a1617',
    bgGradient: ['#112a2b', '#060e0f'],
    platformColor: '#1b3b3c',
    platformBorder: '#2e6366',
    material: 'ancient',
    ambientParticle: 'bubbles',
    lightColor: '#2ec4b6',
    uniqueEnemy: 'drowned_revenant'
  },

  // ==========================================
  // TIER 3: HARD BIOMES (Maps 3 & 4)
  // ==========================================
  'celestial-spires': {
    id: 'celestial-spires',
    name: 'Celestial Spires',
    tier: 'hard',
    theme: 'Floating Sky Isles',
    description: 'Low-gravity sanctuaries floating above the clouds with roaring wind updrafts.',
    bgColor: '#0f182b',
    bgGradient: ['#182848', '#09101d'],
    platformColor: '#283c66',
    platformBorder: '#4868ad',
    material: 'stone',
    ambientParticle: 'sparks',
    lightColor: '#ffd166',
    gravityMultiplier: 0.88,
    uniqueEnemy: 'aether_valkyrie'
  },
  'astral-void': {
    id: 'astral-void',
    name: 'Astral Void',
    tier: 'hard',
    theme: 'Cosmic Rift',
    description: 'Zero-friction cosmic pathways and unstable spatial rifts beyond reality.',
    bgColor: '#0d071c',
    bgGradient: ['#190e36', '#07040e'],
    platformColor: '#281754',
    platformBorder: '#4a2b99',
    material: 'crystal',
    ambientParticle: 'void',
    lightColor: '#b5179e',
    gravityMultiplier: 0.82,
    uniqueEnemy: 'void_weaver'
  },
  'infernal-core': {
    id: 'infernal-core',
    name: 'Infernal Core',
    tier: 'hard',
    theme: 'Heart of the Volcano',
    description: 'Intense searing heat waves, explosive volcanic bombs, and rising lava tides.',
    bgColor: '#1c0502',
    bgGradient: ['#330a05', '#100301'],
    platformColor: '#3d0d07',
    platformBorder: '#7a1a0e',
    material: 'basalt',
    ambientParticle: 'embers',
    lightColor: '#ff0054',
    uniqueEnemy: 'infernal_demon'
  },
  'cursed-necropolis': {
    id: 'cursed-necropolis',
    name: 'Cursed Necropolis',
    tier: 'hard',
    theme: 'Haunted Sepulcher',
    description: 'Ghostly apparition mists and crumbling bridges of brittle ancient bone.',
    bgColor: '#08120e',
    bgGradient: ['#0e221a', '#040907'],
    platformColor: '#17362a',
    platformBorder: '#265945',
    material: 'ancient',
    ambientParticle: 'void',
    lightColor: '#06d6a0',
    uniqueEnemy: 'death_knight'
  },

  // ==========================================
  // FINAL MAP 5: THE GOLDEN SANCTUARY
  // ==========================================
  'golden-sandwich-sanctuary': {
    id: 'golden-sandwich-sanctuary',
    name: 'The Golden Vault',
    tier: 'vault',
    theme: 'Sanctuary of the Golden Sandwich',
    description: 'The sacred divine kitchen of antiquity where the legendary Golden Sandwich awaits.',
    bgColor: '#1f1505',
    bgGradient: ['#38260a', '#140d03'],
    platformColor: '#52370f',
    platformBorder: '#94631b',
    material: 'gold',
    ambientParticle: 'gold',
    lightColor: '#ffbe0b'
  }
};

export function getBiomesByTier(tier: BiomeTier): BiomeConfig[] {
  return Object.values(BIOMES).filter(b => b.tier === tier);
}
