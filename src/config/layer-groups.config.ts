import { MapStructure } from '../services/war-api.service';
import { LayerGroup } from '../services/layer-groups.service';

export const LAYER_GROUP_CONFIGS: LayerGroup[] = [
  {
    id: 'overview',
    name: 'Strategic Overview',
    description: 'Victory points, town halls, and key strategic locations',
    icon: 'pi pi-flag',
    color: '#f59e0b',
    defaultVisible: true,
    structures: [
      MapStructure.TownBase1,
      MapStructure.TownBase2,
      MapStructure.TownBase3,
      MapStructure.RelicBase1,
      MapStructure.RelicBase2,
      MapStructure.RelicBase3,
      MapStructure.SpecialBaseKeep
    ]
  },
  {
    id: 'logistics',
    name: 'Logistics',
    description: 'Supply chain infrastructure: factories, storage, and transportation',
    icon: 'pi pi-truck',
    color: '#10b981',
    defaultVisible: true,
    structures: [
      MapStructure.Factory,
      MapStructure.MassProductionFactory,
      MapStructure.StorageFacility,
      MapStructure.Seaport,
      MapStructure.Refinery,
      MapStructure.TechCenter,
      MapStructure.Hospital
    ]
  },
  {
    id: 'production',
    name: 'Resource Production',
    description: 'Raw material extraction and processing facilities',
    icon: 'pi pi-cog',
    color: '#8b5cf6',
    defaultVisible: false,
    structures: [
      MapStructure.CoalField,
      MapStructure.OilField,
      MapStructure.SalvageField,
      MapStructure.ComponentField,
      MapStructure.SulfurField,
      MapStructure.SalvageMine,
      MapStructure.SulfurMine,
      MapStructure.ComponentMine,
      MapStructure.FacilityMineOilRig
    ]
  },
  {
    id: 'defence',
    name: 'Defence',
    description: 'Structures used for defence',
    icon: 'pi pi-shield',
    color: '#ef4444',
    defaultVisible: true,
    structures: [
      MapStructure.GarrisonStation,
      MapStructure.ObservationTower,
      MapStructure.CoastalGun,
      MapStructure.MortarHouse
    ]
  },
  {
    id: 'intelligence',
    name: 'Intelligence',
    description: 'Information gathering, research, and reconnaissance',
    icon: 'pi pi-eye',
    color: '#06b6d4',
    defaultVisible: false,
    structures: [
      MapStructure.IntelCenter,
      MapStructure.WeatherStation
    ]
  },
  {
    id: 'weapons',
    name: 'Heavy Weapons',
    description: 'Storm cannons and Rockets',
    icon: 'pi pi-bolt',
    color: '#facc15',
    defaultVisible: true,
    structures: [
      MapStructure.StormCannon,
      MapStructure.RocketSite,
      MapStructure.RocketSiteWithRocket,
      MapStructure.RocketGroundZero,
      MapStructure.RocketTarget
    ]
  },
  {
    id: 'hex-sectors',
    name: 'Hex Sectors',
    description: 'Shows hex grid boundaries with team control zones',
    icon: 'pi pi-stop',
    color: '#64748b',
    defaultVisible: false,
    structures: []
  }
];
