export type BiomeTier = 'easy' | 'medium' | 'hard' | 'vault';

export type PlatformMaterial =
  | 'stone'
  | 'wood'
  | 'basalt'
  | 'ice'
  | 'crystal'
  | 'tech'
  | 'ancient'
  | 'gold'
  | 'water';

export interface InteractiveProp {
  id: string;
  type: 'torch' | 'lantern' | 'crystal' | 'vending_machine' | 'golden_altar' | 'gate';
  x: number;
  y: number;
  w?: number;
  h?: number;
  lightColor?: string;
  lightRadius?: number;
  active?: boolean;
}

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  oneWay?: boolean;
  bouncy?: number;
  slippery?: boolean;
  hazard?: boolean;
  water?: boolean;
  conveyor?: number; // horizontal speed boost
  crumble?: boolean;
  crumbleTimer?: number;
  crumbleState?: 'idle' | 'shaking' | 'broken';
  isCrumbled?: boolean;
  crumbleCooldown?: number;
  shakeOffset?: number;
  color?: string;
  borderColor?: string;
  material?: PlatformMaterial;
}

export type HazardType = 'lava' | 'spikes' | 'acid' | 'laser' | 'fire_vent' | 'blade_trap';

export interface HazardZone {
  x: number;
  y: number;
  w: number;
  h: number;
  damage: number;
  type: HazardType;
  state?: 'dormant' | 'warning' | 'active';
  timer?: number;
  cycleTime?: number;
  anchorX?: number;
  anchorY?: number;
  length?: number;
  angle?: number;
  swingSpeed?: number;
  flameHeight?: number;
}

export interface BiomeConfig {
  id: string;
  name: string;
  tier: BiomeTier;
  theme: string;
  description: string;
  bgColor: string;
  bgGradient: [string, string];
  platformColor: string;
  platformBorder: string;
  material: PlatformMaterial;
  ambientParticle: 'leaves' | 'sparks' | 'bubbles' | 'crystals' | 'steam' | 'embers' | 'snow' | 'void' | 'gold';
  lightColor: string;
  gravityMultiplier?: number;
}
