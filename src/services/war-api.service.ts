// noinspection JSUnusedGlobalSymbols

import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {catchError, forkJoin, map, Observable, of, switchMap, tap} from 'rxjs';

export type TeamId = "NONE" | "WARDENS" | "COLONIALS";
export type Shard = "able" | "baker" | "charlie";

export type HexName =
  | "DeadLandsHex"
  | "CallahansPassageHex"
  | "MarbanHollow"
  | "DrownedValeHex"
  | "UmbralWildwoodHex"
  | "LochMorHex"
  | "LinnMercyHex"
  | "WeatheredExpanseHex"
  | "StlicanShelfHex"
  | "WestgateHex"
  | "KingsCageHex"
  | "SableportHex"
  | "OriginHex"
  | "KalokaiHex"
  | "AcrithiaHex"
  | "TerminusHex"
  | "ReaversPassHex"
  | "TheFingersHex"
  | "ClahstraHex"
  | "MorgensCrossingHex"
  | "HowlCountyHex"
  | "BasinSionnachHex"
  | "MooringCountyHex"
  | "GodcroftsHex"
  | "CallumsCapeHex"
  | "NevishLineHex"
  | "StemaLandingHex"
  | "AshFieldsHex"
  | "HeartlandsHex"
  | "ShackledChasmHex"
  | "GreatMarchHex"
  | "RedRiverHex"
  | "EndlessShoreHex"
  | "AllodsBightHex"
  | "ReachingTrailHex"
  | "ViperPitHex"
  | "ClansheadValleyHex"
  | "OarbreakerHex"
  | "SpeakingWoodsHex"
  | "StonecradleHex"
  | "FarranacCoastHex"
  | "FishermansRowHex"
  | "TempestIslandHex";

export interface WarData {
  warId: string;
  warNumber: number;
  winner: TeamId;
  conquestStartTime: number;
  conquestEndTime: number;
  resistanceStartTime: number;
  requiredVictoryTowns: number;
}

export interface WarMapReport {
  mapName: string; // Added by me

  totalEnlistments: number;
  colonialCasualties: number;
  wardenCasualties: number;
  dayOfWar: number;
}

export interface WarMapData {
  mapName: string; // Added by me

  regionId: number;
  scorchedVictoryTowns: number;
  mapItems: {
    teamId: TeamId;
    iconType: MapStructure;
    x: number;
    y: number;
    flags: number;
  }[]
  mapTextItems: {
    text: string;
    x: number;
    y: number;
    mapMarkerType: "Major" | "Minor";
  }[]
  lastUpdated: number;
  version: number;
}

export enum MapStructure {
  // Static Bases - Removed in Update 46
  StaticBase1 = 5,
  StaticBase2 = 6,
  StaticBase3 = 7,

  // Forward Bases
  ForwardBase1 = 8,
  ForwardBase2 = 9,  // Removed in Update 50
  ForwardBase3 = 10, // Removed in Update 50

  // Basic Structures
  Hospital = 11,
  VehicleFactory = 12,
  Armory = 13,           // Removed
  SupplyStation = 14,    // Removed
  Workshop = 15,         // Removed
  ManufacturingPlant = 16, // Removed
  Refinery = 17,
  Shipyard = 18,
  TechCenter = 19,      // Engineering Center in Update 37

  // Resources and Facilities
  SalvageField = 20,
  ComponentField = 21,
  FuelField = 22,
  SulfurField = 23,
  WorldMapTent = 24,
  TravelTent = 25,
  TrainingArea = 26,
  SpecialBaseKeep = 27, // Update 14
  ObservationTower = 28, // Update 14
  Fort = 29,            // Update 14
  TroopShip = 30,      // Update 14
  SulfurMine = 32,     // Update 16
  StorageFacility = 33, // Update 17
  Factory = 34,        // Update 17
  GarrisonStation = 35, // Update 20
  AmmoFactory = 36,    // Removed
  RocketSite = 37,     // Update 20
  SalvageMine = 38,    // Update 22
  ConstructionYard = 39, // Update 26
  ComponentMine = 40,   // Update 26
  OilWell = 41,        // Removed in Update 50

  // Relic Bases
  RelicBase1 = 45,     // Update 32
  RelicBase2 = 46,     // Removed in Update 52
  RelicBase3 = 47,     // Removed in Update 52

  // Production and Military
  MassProductionFactory = 51, // Update 35
  Seaport = 52,              // Update 37
  CoastalGun = 53,           // Update 37
  SoulFactory = 54,          // Update 39

  // Town Bases
  TownBase1 = 56,     // Update 46
  TownBase2 = 57,     // Removed in Update 52
  TownBase3 = 58,     // Removed in Update 52

  // Military Installations
  StormCannon = 59,   // Update 47
  IntelCenter = 60,   // Update 47

  // Resource Fields
  CoalField = 61,     // Update 50
  OilField = 62,      // Update 50

  // Rocket Facilities
  RocketTarget = 70,        // Update 54
  RocketGroundZero = 71,    // Update 54
  RocketSiteWithRocket = 72, // Update 54

  // Oil Facilities
  FacilityMineOilRig = 75,  // Update 54

  // Latest Additions
  WeatherStation = 83,      // Update 57
  MortarHouse = 84         // Update 58
}

// @ts-ignore
export const MapIcons: Record<MapStructure, string> = {
  [MapStructure.CoalField]: './assets/MapIconCoalFieldColor.webp',
  [MapStructure.CoastalGun]: './assets/MapIconCoastalGun.webp',
  [MapStructure.ComponentMine]: './assets/MapIconComponentMineColor.webp',
  [MapStructure.ComponentField]: './assets/MapIconComponentsColor.webp',
  [MapStructure.ConstructionYard]: './assets/MapIconConstructionYard.webp',
  [MapStructure.Factory]: './assets/MapIconFactory.webp',
  [MapStructure.OilField]: './assets/MapIconOilFieldColor.webp',
  [MapStructure.IntelCenter]: './assets/MapIconIntelcenter.webp',
  [MapStructure.Refinery]: './assets/MapIconManufacturing.webp',
  [MapStructure.ObservationTower]: './assets/MapIconObservationTower.webp',
  [MapStructure.RelicBase1]: './assets/MapIconRelicBase.webp',
  [MapStructure.RelicBase2]: './assets/MapIconRelicBase.webp',
  [MapStructure.RelicBase3]: './assets/MapIconRelicBase.webp',
  [MapStructure.ForwardBase1]: './assets/MapIconSafeHouse.webp',
  [MapStructure.SalvageField]: './assets/MapIconSalvageColor.webp',
  [MapStructure.Seaport]: './assets/MapIconSeaport.webp',
  [MapStructure.StormCannon]: './assets/MapIconStormcannon.webp',
  [MapStructure.SulfurField]: './assets/MapIconSulfurColor.webp',
  [MapStructure.TownBase1]: './assets/MapIconTownBaseTier1.webp',
  [MapStructure.TownBase2]: './assets/MapIconTownBaseTier2.webp',
  [MapStructure.TownBase3]: './assets/MapIconTownBaseTier3.webp',
  [MapStructure.WeatherStation]: './assets/MapIconWeatherStation.webp',
  [MapStructure.SalvageMine]: './assets/MapIconSalvageMineColor.webp',
  [MapStructure.SulfurMine]: './assets/MapIconSulfurMineColor.webp',
  [MapStructure.Shipyard]: './assets/Shipyard.webp',
  [MapStructure.ManufacturingPlant]: './assets/MapIconManufacturingPlant.webp',
  [MapStructure.TechCenter]: './assets/MapIconTechCenter.webp',
  [MapStructure.MortarHouse]: './assets/MapIconMortarHouse.webp',
  [MapStructure.StorageFacility]: './assets/MapIconStorageFacility.webp',
  [MapStructure.MassProductionFactory]: './assets/MapIconMassProductionFactory.webp',
  [MapStructure.VehicleFactory]: './assets/MapIconVehicle.webp',
  [MapStructure.Hospital]: './assets/MapIconHospital.webp',
  [MapStructure.RocketSite]: './assets/MapIconRocketSite.webp',
  [MapStructure.RocketGroundZero]: './assets/MapIconRocketGroundZero.webp',
  [MapStructure.RocketTarget]: './assets/MapIconRocketTarget.webp',
  [MapStructure.RocketSiteWithRocket]: './assets/MapIconRocketSiteWithRocket.webp',
  [MapStructure.FacilityMineOilRig]: './assets/MapIconFacilityMineOilRig.webp',
  [MapStructure.SpecialBaseKeep]: './assets/MapIconsKeep.webp',
  [MapStructure.GarrisonStation]: './assets/MapIconBorderBase.webp',
}

export const VictoryPointStructure = "./assets/MapIconTownHallNeutral.webp"

export const getMapIcon = (iconType: MapStructure): string => {
  const mapIcon = MapIcons[iconType];
  if (!mapIcon) {
    console.warn(`Map icon for ${MapStructure[iconType]} (${iconType}) not found`);
    return "./assets/unknown.webp";
  }

  return mapIcon;
}

export const getMapStructureFriendlyName = (structure: MapStructure): string => {
  const enumKey = MapStructure[structure];
  if (!enumKey) {
    return "Unknown Structure";
  }

  const withSpaces = enumKey.replace(/([A-Z0-9])/g, ' $1').trim();
  const fixedNumbers = withSpaces.replace(/(\d) (?=\d)/g, '$1');

  return fixedNumbers.replace(/\w\S*/g, (word) => {
    return word.charAt(0).toUpperCase() + word.substring(1).toLowerCase();
  });
}

export const hexFriendlyNames: Record<HexName, string> = {
  "DeadLandsHex": "Deadlands",
  "CallahansPassageHex": "Callahans Passage",
  "MarbanHollow": "Marban Hollow",
  "DrownedValeHex": "Drowned Vale",
  "UmbralWildwoodHex": "Umbral Wildwood",
  "LochMorHex": "Loch Mor",
  "LinnMercyHex": "Linn of Mercy",
  "WeatheredExpanseHex": "Weathered Expanse",
  "StlicanShelfHex": "Stlican Shelf",
  "WestgateHex": "Westgate",
  "KingsCageHex": "Kings Cage",
  "SableportHex": "Sableport",
  "OriginHex": "Origin",
  "KalokaiHex": "Kalokai",
  "AcrithiaHex": "Acrithia",
  "TerminusHex": "Terminus",
  "ReaversPassHex": "Reavers Pass",
  "TheFingersHex": "The Fingers",
  "ClahstraHex": "Clahstra",
  "MorgensCrossingHex": "Morgens Crossing",
  "HowlCountyHex": "Howl County",
  "BasinSionnachHex": "Basin Sionnach",
  "MooringCountyHex": "Mooring County",
  "GodcroftsHex": "Godcrofts",
  "CallumsCapeHex": "Callums Cape",
  "NevishLineHex": "Nevish Line",
  "StemaLandingHex": "Stema Landing",
  "AshFieldsHex": "Ash Fields",
  "HeartlandsHex": "Heartlands",
  "ShackledChasmHex": "Shackled Chasm",
  "GreatMarchHex": "Great March",
  "RedRiverHex": "Red River",
  "EndlessShoreHex": "Endless Shore",
  "AllodsBightHex": "Allods Bight",
  "ReachingTrailHex": "Reaching Trail",
  "ViperPitHex": "Viper Pit",
  "ClansheadValleyHex": "Clanshead Valley",
  "OarbreakerHex": "Oarbreaker",
  "SpeakingWoodsHex": "Speaking Woods",
  "StonecradleHex": "Stonecradle",
  "FarranacCoastHex": "Farranac Coast",
  "FishermansRowHex": "Fishermans Row",
  "TempestIslandHex": "Tempest Island"
};

export type WarVictoryPointSummary = {
  warden: number;
  colonial: number;
  scorched: number;
  required: number;
}

@Injectable({
  providedIn: 'root'
})
export class WarApiService {

  public static readonly ABLE_SHARD = "able";
  public static readonly BAKER_SHARD = "baker";
  public static readonly CHARLIE_SHARD = "charlie";
  public static readonly SHARDS = [WarApiService.ABLE_SHARD, WarApiService.BAKER_SHARD, WarApiService.CHARLIE_SHARD];

  private shards: Record<string, string> = {
    [WarApiService.ABLE_SHARD]: "https://war-service-live.foxholeservices.com/api",
    [WarApiService.BAKER_SHARD]: "https://war-service-live-2.foxholeservices.com/api",
    [WarApiService.CHARLIE_SHARD]: "https://war-service-live-3.foxholeservices.com/api",
  }

  constructor(private http: HttpClient) { }

  private getShardUrl(shard: Shard | undefined) {
    if (!shard) {
      return this.shards["able"];
    }

    return this.shards[shard];
  }

  getCurrentWarData(shard: Shard | undefined = undefined): Observable<WarData | undefined> {
    const shardUrl = this.getShardUrl(shard);
    const url = `${shardUrl}/worldconquest/war`;
    return this.http.get<WarData>(url).pipe(
      catchError(_ => of(undefined))
    );
  }

  getMapNames(shard: Shard | undefined = undefined): Observable<string[]> {
    const shardUrl = this.getShardUrl(shard);
    const url = `${shardUrl}/worldconquest/maps`;
    return this.http.get<string[]>(url);
  }

  getMapReport(shard: Shard | undefined = undefined, mapName: string): Observable<WarMapReport> {
    const shardUrl = this.getShardUrl(shard);
    const url = `${shardUrl}/worldconquest/warreport/${mapName}`;
    return this.http.get<WarMapReport>(url).pipe(
      map(report => ({...report, mapName}))
    );
  }

  getMapStaticData(shard: Shard | undefined = undefined, mapName: string): Observable<WarMapData> {
    const shardUrl = this.getShardUrl(shard);
    const url = `${shardUrl}/worldconquest/maps/${mapName}/static`;
    return this.http.get<WarMapData>(url).pipe(
      map(data => ({...data, mapName}))
    );
  }

  getAllMapStaticData(shard: Shard | undefined = undefined): Observable<Record<string, WarMapData>> {
    return this.getMapNames(shard).pipe(
      switchMap(mapNames => forkJoin(mapNames.map(mapName => this.getMapStaticData(shard, mapName)))),
      map(mapData => Object.fromEntries(mapData.map(data => [data.mapName, data])))
    );
  }

  getMapDynamicData(shard: Shard | undefined = undefined, mapName: string): Observable<WarMapData> {
    const shardUrl = this.getShardUrl(shard);
    const url = `${shardUrl}/worldconquest/maps/${mapName}/dynamic/public`;
    return this.http.get<WarMapData>(url);
  }

  getAllMapDynamicData(shard: Shard | undefined = undefined): Observable<Record<string, WarMapData>> {
    return this.getMapNames(shard).pipe(
      switchMap(mapNames => forkJoin(
        mapNames.map(mapName => this.getMapDynamicData(shard, mapName).pipe(
          map(data => ({...data, mapName}))
        ))
      )),
      map(mapData => Object.fromEntries(mapData.map(data => [data.mapName, data])))
    );
  }

  getVictoryPointCounts(shard: Shard | undefined = undefined): Observable<WarVictoryPointSummary | undefined> {
    return forkJoin([
      this.getCurrentWarData(shard),
      this.getAllMapDynamicData(shard)
    ]).pipe(
      map(([warData, mapData]): WarVictoryPointSummary | undefined => {
        if (!warData) return undefined;

        const isScorched = (mapItem: { flags: number }) => (mapItem.flags & 0x10) == 0x10;
        const isVictoryPoint = (mapItem: { flags:number }) => (mapItem.flags & 0x01) == 0x01;

        const summary = Object.values(mapData)
          .reduce((warSummary, map): WarVictoryPointSummary =>
            map.mapItems
              .reduce((summary, item): WarVictoryPointSummary => {
                const victoryPoint = isVictoryPoint(item);
                const scorched = isScorched(item);

                if (!victoryPoint) {
                  return summary;
                }

                if (scorched) {
                  summary.scorched++;
                } else if (item.teamId === "WARDENS") {
                  summary.warden++;
                } else if (item.teamId === "COLONIALS") {
                  summary.colonial++;
                }

                return summary;
              }, warSummary),
            {
              warden: 0,
              colonial: 0,
              scorched: 0,
              required: 0,
            });

        summary.required = warData.requiredVictoryTowns - summary.scorched;

        return summary;
      }),
    );
  }
}
