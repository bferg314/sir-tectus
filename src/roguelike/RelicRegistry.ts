export interface Relic {
  id: string;
  name: string;
  cost: number;
  icon: string;
  description: string;
}

export const RELIC_POOL: Relic[] = [
  {
    id: 'coin-magnet',
    name: 'Ancient Lodestone',
    cost: 4,
    icon: '🧲',
    description: 'Greatly increases the magnetic attraction radius for gathering golden coins.'
  },
  {
    id: 'extra-quiver',
    name: 'Elven Quiver',
    cost: 5,
    icon: '🏹',
    description: 'Increases max quiver capacity by +2 arrows and speeds up ammo regeneration.'
  },
  {
    id: 'heart-container',
    name: 'Sacred Heart',
    cost: 6,
    icon: '❤️',
    description: 'Increases max health by +1 heart and restores all players to full health.'
  },
  {
    id: 'swift-boots',
    name: 'Hermes Greaves',
    cost: 4,
    icon: '👢',
    description: 'Grants +20% movement speed and reduces dash cooldowns.'
  },
  {
    id: 'fiery-blade',
    name: 'Sunfire Whetstone',
    cost: 5,
    icon: '🔥',
    description: 'Infuses all melee strikes with fiery sparks dealing bonus damage.'
  },
  {
    id: 'revive-grace',
    name: 'Guardian Angel Phylactery',
    cost: 5,
    icon: '🛡️',
    description: 'Reduces the coin cost of soul bubble revives by 1.'
  }
];
