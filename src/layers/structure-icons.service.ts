import {inject, Injectable} from '@angular/core';
import {firstValueFrom, map, Observable} from 'rxjs';
import Feature from 'ol/Feature';
import {
  getMapIcon,
  getMapStructureFriendlyName,
  HexName,
  MapStructure,
  Shard,
  TeamId,
  WarApiService
} from '../services/war-api.service';
import {Point} from 'ol/geom';
import {Icon, Style} from 'ol/style';
import {HexCoordinateService} from '../services/hex-coordinate.service';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import LayerGroup from 'ol/layer/Group';
import {LayerService} from './index';

@Injectable({
  providedIn: 'root'
})
export class StructureIconsService implements LayerService {

  public name = 'Structure Icons';
  private readonly warApiService = inject(WarApiService);
  private readonly hexCoordinateService = inject(HexCoordinateService);

  constructor() { }

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

    return new LayerGroup({
      layers: layers
    });
  }

  private getTeamColour(teamId: TeamId): string {
    switch (teamId) {
      case "COLONIALS":
        return "#516C4BFF";
      case "WARDENS":
        return "#245682FF";
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
        for (const [name, data] of Object.entries(mapData)) {
          data.mapItems.forEach(mapItem => {
            const [x, y] = this.hexCoordinateService.normaliseCoordinates(name as HexName, [mapItem.x, mapItem.y]);

            const label = new Feature({
              geometry: new Point([x, y]),
              name: getMapStructureFriendlyName(mapItem.iconType)
            });
            label.setStyle(new Style({
              image: new Icon({
                src: getMapIcon(mapItem.iconType),
                scale: 0.5,
                color: this.getTeamColour(mapItem.teamId)
              }),
              zIndex: 9999
            }));

            const typeGroup = mapItem.iconType in this.typeLayers ? this.typeLayers[mapItem.iconType] ?? "Other" : "Other";
            const hasLayer = typeGroup in layers;
            if (!hasLayer) {
              layers[typeGroup] = [];
            }

            layers[typeGroup].push(label);
          });
        }

        return layers;
      })
    )
  }
}
