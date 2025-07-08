import {inject, Injectable} from '@angular/core';
import {firstValueFrom, map, Observable, take} from 'rxjs';
import Feature from 'ol/Feature';
import {HexName, Shard, WarApiService} from '../services/war-api.service';
import {Point, Polygon} from 'ol/geom';
import {Fill, Stroke, Style, Text} from 'ol/style';
import {HexCoordinateService} from '../services/hex-coordinate.service';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import LayerGroup from 'ol/layer/Group';
import {LayerService} from './index';

@Injectable({
  providedIn: 'root'
})
export class RegionLabelsService implements LayerService {

  public name = 'Region Labels';
  private readonly warApiService = inject(WarApiService);
  private readonly hexCoordinateService = inject(HexCoordinateService);

  public async getLayer(shard: Shard): Promise<LayerGroup> {
    const mapData = await firstValueFrom(this.staticMapData(shard));

    const layers: VectorLayer[] = Object.entries(mapData)
      .map(([type, features]) => {
        const layer = new VectorLayer({
          renderBuffer: 2048
        });
        layer.setMinZoom(type === "Major" ? 5 : 6);
        layer.setMaxZoom(7);
        layer.setSource(new VectorSource({
          features
        }));
        layer.setZIndex(90);

        layer.set("title", type + " Regions");

        return layer;
      });

    return new LayerGroup({
      layers: layers
    });
  }


  private staticMapData(shard: Shard): Observable<Record<string, Feature[]>> {
    return this.warApiService.getAllMapStaticData(shard).pipe(
      take(1),
      map(mapData => {
        const features: Record<string, Feature[]> = {};
        for (const [name, data] of Object.entries(mapData)) {
          data.mapTextItems.forEach(mapItem => {
            const [x, y] = this.hexCoordinateService.normaliseCoordinates(name as HexName, [mapItem.x, mapItem.y]);
            const label = new Feature({
              geometry: new Point([x, y]),
              name: mapItem.text
            });

            label.setStyle(new Style({
              text: new Text({
                text: mapItem.text,  // Use the actual text from mapItem
                scale: mapItem.mapMarkerType === 'Major' ? 1.5 : 1,
                fill: new Fill({
                  color: 'white'
                }),
                stroke: new Stroke({
                  color: 'black',
                  width: 3
                }),
                offsetY: 0
              })
            }));

            if (!features[mapItem.mapMarkerType]) {
              features[mapItem.mapMarkerType] = [];
            }

            features[mapItem.mapMarkerType].push(label);
          });
        }

        return features;
      })
    )
  }
}
