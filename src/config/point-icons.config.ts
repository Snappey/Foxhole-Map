export interface PointIcon {
  readonly name: string;
  readonly value: string;
  readonly category: string;
  readonly description: string;
}

export const POINT_ICON_CONFIGS: PointIcon[] = [
  // Default
  {
    name: 'Default Circle',
    value: '',
    category: 'Basic',
    description: 'Simple colored circle marker'
  },

  // Intelligence Icons - Colonial
  {
    name: "Artillery (Colonial)",
    value: "./assets/ArtilleryIntelActiveCol.webp",
    category: "Intelligence",
    description: "Colonial artillery intel marker"
  },
  {
    name: "Defense (Colonial)",
    value: "./assets/DefenseIntelActiveCol.webp",
    category: "Intelligence", 
    description: "Colonial defensive position intel marker"
  },
  {
    name: "Infantry (Colonial)",
    value: "./assets/InfantryIntelActiveCol.webp",
    category: "Intelligence",
    description: "Colonial infantry intel marker"
  },
  {
    name: "Medical (Colonial)",
    value: "./assets/MedicalIntelActiveCol.webp",
    category: "Intelligence",
    description: "Colonial medical facility intel marker"
  },
  {
    name: "Outpost (Colonial)",
    value: "./assets/OutpostIntelActiveCol.webp",
    category: "Intelligence",
    description: "Colonial outpost intel marker"
  },
  {
    name: "Structure (Colonial)",
    value: "./assets/StructureIntelActiveCol.webp",
    category: "Intelligence",
    description: "Colonial structure intel marker"
  },
  {
    name: "Vehicle (Colonial)",
    value: "./assets/VehicleIntelActiveCol.webp",
    category: "Intelligence",
    description: "Colonial vehicle intel marker"
  },

  // Intelligence Icons - Warden
  {
    name: "Artillery (Warden)",
    value: "./assets/ArtilleryIntelActiveWar.webp",
    category: "Intelligence",
    description: "Warden artillery intel marker"
  },
  {
    name: "Defense (Warden)",
    value: "./assets/DefenseIntelActiveWar.webp",
    category: "Intelligence",
    description: "Warden defensive position intel marker"
  },
  {
    name: "Infantry (Warden)",
    value: "./assets/InfantryIntelActiveWar.webp",
    category: "Intelligence",
    description: "Warden infantry intel marker"
  },
  {
    name: "Medical (Warden)",
    value: "./assets/MedicalIntelActiveWar.webp",
    category: "Intelligence",
    description: "Warden medical facility intel marker"
  },
  {
    name: "Outpost (Warden)",
    value: "./assets/OutpostIntelActiveWar.webp",
    category: "Intelligence",
    description: "Warden outpost intel marker"
  },
  {
    name: "Structure (Warden)",
    value: "./assets/StructureIntelActiveWar.webp",
    category: "Intelligence",
    description: "Warden structure intel marker"
  },
  {
    name: "Vehicle (Warden)",
    value: "./assets/VehicleIntelActiveWar.webp",
    category: "Intelligence",
    description: "Warden vehicle intel marker"
  },

  // Infrastructure
  {
    name: 'Factory',
    value: './assets/MapIconFactory.webp',
    category: 'Industrial',
    description: 'Manufacturing facility'
  },
  {
    name: 'Storage Facility',
    value: './assets/MapIconStorageFacility.webp',
    category: 'Logistics',
    description: 'Supply storage and depot'
  },

  // Military
  {
    name: 'Observation Tower',
    value: './assets/MapIconObservationTower.webp',
    category: 'Intelligence',
    description: 'Watchtower or observation post'
  },
  {
    name: 'Storm Cannon',
    value: './assets/MapIconStormcannon.webp',
    category: 'Artillery',
    description: 'Heavy artillery placement'
  },

  // Environmental
  {
    name: 'Weather Station',
    value: './assets/MapIconWeatherStation.webp',
    category: 'Infrastructure',
    description: 'Meteorological monitoring station'
  }
];

export function getIconsByCategory(category?: string): PointIcon[] {
  if (!category) return POINT_ICON_CONFIGS;
  return POINT_ICON_CONFIGS.filter(icon => icon.category === category);
}

export function getIconCategories(): string[] {
  const categories = POINT_ICON_CONFIGS
    .map(icon => icon.category)
    .filter((category, index, self) => category && self.indexOf(category) === index);
  return categories.sort();
}
