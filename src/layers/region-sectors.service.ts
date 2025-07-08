import {inject, Injectable} from '@angular/core';
import {HexOverlayService, LayerService} from './index';
import ol from 'ol/dist/ol';
import LayerGroup from 'ol/layer/Group';
import VectorSource from 'ol/source/Vector';
import {HexCoordinateService} from '../services/hex-coordinate.service';
import {HexName, MapStructure, Shard, TeamId, WarApiService} from '../services/war-api.service';
import Feature from 'ol/Feature';
import {Point, Polygon} from 'ol/geom';
import {Fill, Stroke, Style} from 'ol/style';
import VectorLayer from 'ol/layer/Vector';
import {firstValueFrom, map, Observable, take} from 'rxjs';
import {GeoJSON} from 'ol/format';
import {featureCollection, intersect, point, polygon, voronoi} from '@turf/turf';
import {feature as turfFeature} from '@turf/helpers';

@Injectable({
  providedIn: 'root'
})
export class RegionSectorsService implements LayerService {
  readonly warApiService = inject(WarApiService);
  readonly hexCoordinateService = inject(HexCoordinateService);
  readonly name = 'Region Sectors';

  public async getLayer(shard: Shard): Promise<LayerGroup> {
    const features = await firstValueFrom(this.getSectorPolygons(shard));

    const layer = new VectorLayer({
      renderBuffer: 4098
    });
    layer.set("title", "Hex Sectors");
    layer.setZIndex(92);
    layer.setSource( new VectorSource({
      overlaps: true,
      features,
    }));

    return new LayerGroup({
      layers: [
        layer
      ]
    });
  }

  private isSectorBase(type: MapStructure): boolean {
    return type === MapStructure.TownBase1 || type === MapStructure.TownBase2 || type === MapStructure.TownBase3 || type === MapStructure.RelicBase1 || type === MapStructure.RelicBase2 || type === MapStructure.RelicBase3;
  }

  private getTeamColour(teamId: TeamId): string {
    switch (teamId) {
      case "COLONIALS":
        return "rgba(81,108,75, 0.3)";
      case "WARDENS":
        return "rgba(36,86,130, 0.3)";
      default:
        return "rgba(221,221,221, 0.2)";
    }
  }

  private getSectorPolygons(shard: Shard): Observable<Feature[]> {
    return this.warApiService.getAllMapDynamicData(shard).pipe(
      take(1),
      map(mapData => {
        const features: Feature[] = [];
        for (const [name, data] of Object.entries(mapData)) {
          const points = data.mapItems.filter(item => this.isSectorBase(item.iconType)).map(mapItem => {
            const [x, y] = this.hexCoordinateService.normaliseCoordinates(name as HexName, [mapItem.x, mapItem.y]);
            return { point: new Point([x, y]), colour: this.getTeamColour(mapItem.teamId) };
          });

          let [sX, sY] = this.hexCoordinateService.getCoordinates(name as HexName);
          const vertices = HexOverlayService.drawHex(sX, sY, this.hexCoordinateService.hexSize);
          features.push(...this.generateRegionPolygons(points, new Polygon([[...vertices, vertices[0]]])));
        }

        return features;
      })
    )
  }

  private generateRegionPolygons(points: { point: Point, colour: string }[], hexPolygon: Polygon): Feature[] {
    const json = new GeoJSON();
    const turfHex = polygon(hexPolygon.getCoordinates());

    const extent = hexPolygon.getExtent();
    const boundingBox: [number, number, number, number] = [
      extent[0], // minX
      extent[1], // minY
      extent[2], // maxX
      extent[3]  // maxY
    ];

    const featurePoints = points.map(p => {
      const newPoint = point(p.point.getCoordinates());
      return {
        ...newPoint,
        properties: {
          colour: p.colour
        }
      }
    });
    const voronoiPolygons = voronoi(featureCollection(featurePoints), {bbox: boundingBox});

    return voronoiPolygons.features
      .filter(feature => feature.geometry.type === 'Polygon')
      .map(voronoiFeature => {
        const voronoiPoly = voronoiFeature.geometry.type === 'Polygon' || voronoiFeature.geometry.type === 'MultiPolygon'
          ? voronoiFeature
          : null;

        if (voronoiPoly === null) {
          return null;
        }

        const featureVoronoiPoly = turfFeature(voronoiPoly.geometry);
        const featureTurfHex = turfFeature(turfHex.geometry);
        const intersection = intersect(featureCollection([featureVoronoiPoly, featureTurfHex]));
        if (intersection) {
          const clippedFeature = new Feature({
            geometry: json.readGeometry(intersection.geometry),
            properties: voronoiFeature.properties
          });

          clippedFeature.setStyle(new Style({
            stroke: new Stroke({
              color: "rgba(32, 32, 32, 0.5)",
              width: 1
            }),
            fill: new Fill({
              // @ts-ignore
              color: voronoiFeature.properties["colour"]
            })
          }));

          return clippedFeature;
        } else {
          return null;
        }
      })
      .filter((f): f is Feature => f !== null);
  }
}
