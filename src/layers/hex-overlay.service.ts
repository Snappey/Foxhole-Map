import {inject, Injectable} from '@angular/core';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import {Point, Polygon} from 'ol/geom';
import {Fill, Icon, Stroke, Style, Text} from 'ol/style';
import {
  getMapIcon,
  hexFriendlyNames,
  HexName, Shard,
  WarApiService
} from '../services/war-api.service';
import {HexCoordinateService, hexCoords} from '../services/hex-coordinate.service';
import LayerGroup from 'ol/layer/Group';
import {LayerService} from './index';

@Injectable({
  providedIn: 'root'
})
export class HexOverlayService implements LayerService {

  public name = 'Hex Overlay';
  private readonly hexCoordinateService: HexCoordinateService = inject(HexCoordinateService);

  public async getLayer(_: Shard): Promise<LayerGroup> {
    const hexOverlay = new VectorSource();
    const hexTitle = new VectorSource();

    for (const [hexName, _] of Object.entries(hexCoords)) {
      let [sX, sY] = this.hexCoordinateService.getCoordinates(hexName as HexName);

      const vertices = HexOverlayService.drawHex(sX, sY, this.hexCoordinateService.hexSize);
      const hexagon = new Feature({
        geometry: new Polygon([[...vertices, vertices[0]]])
      });

      hexagon.setStyle(new Style({
        stroke: new Stroke({
          color: '#444',
          width: 2
        }),
        fill: new Fill({
          color: 'rgba(230,230,230,0)'
        }),
        zIndex: 999
      }));
      hexOverlay.addFeature(hexagon);

      const title = new Feature({
        geometry: new Point([sX, sY])
      });

      title.setStyle(new Style({
        text: new Text({
          text: hexFriendlyNames[hexName as HexName],
          scale: 2,
          fill: new Fill({
            color: 'white'
          }),
          stroke: new Stroke({
            color: 'black',
            width: 2
          }),
          offsetY: 0
        }),
        zIndex: 999
      }));

      hexTitle.addFeature(title);
    }

    return new LayerGroup({
      layers: [
        new VectorLayer({
          // @ts-ignore
          title: "Hexagon",
          source: hexOverlay,
          zIndex: 90,
          renderBuffer: 256
        }),
        new VectorLayer({
          // @ts-ignore
          title: "Hex Names",
          source: hexTitle,
          zIndex: 91,
          renderBuffer: 256,
          maxZoom: 6
        })
      ]
    });
  }


  public static drawHex(x: number, y: number, size: number): number[][] {
    const angles = [0, 60, 120, 180, 240, 300];
    return angles.map(angle => {
      const radian = angle * Math.PI / 180;
      // For flat-top hexagons, we swap sine and cosine and adjust size ratio
      return [
        x + size * Math.cos(radian),
        y + size * Math.sin(radian)
      ];
    });
  }
}
