import {inject, Injectable, effect} from '@angular/core';
import {firstValueFrom, map, Observable} from 'rxjs';
import Feature from 'ol/Feature';
import {
  getMapIcon,
  getMapStructureFriendlyName,
  HexName,
  MapStructure,
  Shard,
  TeamId, VictoryPointStructure,
  WarApiService
} from '../services/war-api.service';
import {Point} from 'ol/geom';
import {Icon, Style} from 'ol/style';
import {HexCoordinateService} from '../services/hex-coordinate.service';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import LayerGroup from 'ol/layer/Group';
import {LayerService} from './index';
import {LayerGroupsService} from '../services/layer-groups.service';

@Injectable({
  providedIn: 'root'
})
export class StructureIconsService implements LayerService {

  public name = 'Structure Icons';
  private readonly warApiService = inject(WarApiService);
  private readonly hexCoordinateService = inject(HexCoordinateService);
  private readonly layerGroupsService = inject(LayerGroupsService);
  private currentLayerGroup: LayerGroup | null = null;
  private allFeatures: Map<string, Feature[]> = new Map();

  constructor() {
    effect(() => {
      const states = this.layerGroupsService.getLayerGroupStates();
      if (this.currentLayerGroup) {
        this.updateLayerVisibility();
      }
    });
  }

  public async getLayer(shard: Shard): Promise<LayerGroup> {
    const mapData = await firstValueFrom(this.dynamicMapData(shard));
    const layers: VectorLayer[] = Object.entries(mapData)
      .map(([name, data]): VectorLayer => {
        const layer = new VectorLayer({
          renderBuffer: 2048
        });
        layer.set("title", name);
        layer.setZIndex(40);
        layer.setSource(new VectorSource({ features: data }));

        return layer;
      });

    this.currentLayerGroup = new LayerGroup({
      layers: layers
    });

    this.updateLayerVisibility();

    return this.currentLayerGroup;
  }

  public updateLayerVisibility(): void {
    if (!this.currentLayerGroup || this.allFeatures.size === 0) return;

    const visibleStructures = this.layerGroupsService.getVisibleStructures();
    const layers = this.currentLayerGroup.getLayers().getArray() as VectorLayer[];

    layers.forEach(layer => {
      const layerTitle = layer.get('title') as string;
      const allLayerFeatures = this.allFeatures.get(layerTitle) || [];
      const source = layer.getSource() as VectorSource;

      const visibleFeatures = allLayerFeatures.filter(feature => {
        const structureType = feature.get('structureType') as MapStructure;
        return structureType ? visibleStructures.has(structureType) : true;
      });

      source.clear();
      source.addFeatures(visibleFeatures);
    });
  }

  public refreshLayer(shard: Shard): void {
    if (this.currentLayerGroup) {
      this.getLayer(shard).then(newLayerGroup => {
        this.currentLayerGroup = newLayerGroup;
        this.updateLayerVisibility();
      });
    }
  }

  private getTeamColour(teamId: TeamId): string {
    switch (teamId) {
      case "COLONIALS":
        return "#4d7e30";
      case "WARDENS":
        return "#2878bf";
      default:
        return "#ddd";
    }
  }

  private typeLayers:  { [key in MapStructure]?: string } = {
    [MapStructure.CoalField]: "Fields",
    [MapStructure.OilField]: "Fields",
    [MapStructure.FuelField]: "Fields",
    [MapStructure.SalvageField]: "Fields",
    [MapStructure.ComponentField]: "Fields",
    [MapStructure.SulfurField]: "Fields",

    [MapStructure.SalvageMine]: "Mines",
    [MapStructure.SulfurMine]: "Mines",
    [MapStructure.ComponentMine]: "Mines",
    [MapStructure.OilWell]: "Mines",

    [MapStructure.StorageFacility]: "Storage",
    [MapStructure.Seaport]: "Storage",

    [MapStructure.Refinery]: "Refinery",

    [MapStructure.Factory]: "Factory",
    [MapStructure.MassProductionFactory]: "Factory",

    [MapStructure.VehicleFactory]: "Garage",
    [MapStructure.Shipyard]: "Garage",

    [MapStructure.Hospital]: "Hospital",
    [MapStructure.TechCenter]: "Tech Center",
    [MapStructure.StormCannon]: "Storm Cannon",
    [MapStructure.IntelCenter]: "Intelligence Center",
    [MapStructure.WeatherStation]: "Weather Station",

    [MapStructure.RocketGroundZero]: "Rocket",
    [MapStructure.RocketSite]: "Rocket",
    [MapStructure.RocketSiteWithRocket]: "Rocket",
    [MapStructure.RocketTarget]: "Rocket",

    [MapStructure.RelicBase1]: "Relic Base",
    [MapStructure.RelicBase2]: "Relic Base",
    [MapStructure.RelicBase3]: "Relic Base",

    [MapStructure.SpecialBaseKeep]: "Keep",

    [MapStructure.TownBase1]: "Town Base",
    [MapStructure.TownBase2]: "Town Base",
    [MapStructure.TownBase3]: "Town Base",
  }

  private dynamicMapData(shard: Shard): Observable<Record<string, Feature[]>> {
    return this.warApiService.getAllMapDynamicData(shard).pipe(
      map(mapData => {
        const layers: Record<string, Feature[]> = {};
        this.allFeatures.clear(); // Clear previous features

        for (const [name, data] of Object.entries(mapData)) {
          data.mapItems.forEach(mapItem => {
            const [x, y] = this.hexCoordinateService.normaliseCoordinates(name as HexName, [mapItem.x, mapItem.y]);

            const isScorched = (mapItem.flags & 0x10) == 0x10
            const isVictoryPoint = (mapItem.flags & 0x01) == 0x01
            let labelName = getMapStructureFriendlyName(mapItem.iconType);

            if (isVictoryPoint) {
              labelName = `Victory Point`;
            }

            if (isScorched) {
              labelName = `Scorched ${labelName}`;
            }

            const label = new Feature({
              geometry: new Point([x, y]),
              name: labelName,
              structureType: mapItem.iconType,
              teamId: mapItem.teamId,
              isVictoryPoint: isVictoryPoint,
              isScorched: isScorched,
              flags: mapItem.flags
            });
            label.setStyle(new Style({
              image: new Icon({
                src: isVictoryPoint ? VictoryPointStructure : getMapIcon(mapItem.iconType),
                scale: 0.5,
                color: isScorched ? "#e74c3c" : this.getTeamColour(mapItem.teamId)
              }),
              zIndex: 9999
            }));

            const typeGroup = mapItem.iconType in this.typeLayers ? this.typeLayers[mapItem.iconType] ?? "Other" : "Other";
            const hasLayer = typeGroup in layers;
            if (!hasLayer) {
              layers[typeGroup] = [];
              this.allFeatures.set(typeGroup, []);
            }

            layers[typeGroup].push(label);
            this.allFeatures.get(typeGroup)!.push(label);
          });
        }

        return layers;
      })
    )
  }
}
