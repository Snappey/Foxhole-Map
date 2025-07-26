import {AfterViewInit, Component, effect, ElementRef, inject, Signal, ViewChild, WritableSignal} from '@angular/core';
import {MapInfoComponent} from '../map-info/map-info.component';
import Map from 'ol/Map';
import {SettingsService} from '../../services/settings.service';
import {
  HexOverlayService,
  LayerService,
  RegionLabelsService,
  RegionSectorsService,
  StructureIconsService
} from '../../layers';
import {Shard} from '../../services/war-api.service';
import proj4 from 'proj4';
import {register} from 'ol/proj/proj4';
import {Projection} from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import TileDebug from 'ol/source/TileDebug';
import {TileGrid} from 'ol/tilegrid';
import {MousePosition} from 'ol/control';
import {createStringXY} from 'ol/coordinate';
import LayerSwitcher from 'ol-layerswitcher';
import {DragPan, Draw, Link, MouseWheelZoom} from 'ol/interaction';
import {Kinetic} from 'ol';
import VectorSource from 'ol/source/Vector';
import {Stroke, Style} from 'ol/style';
import {shiftKeyOnly} from 'ol/events/condition';
import View from 'ol/View';
import XYZ from 'ol/source/XYZ';
import LayerGroup from 'ol/layer/Group';
import VectorLayer from 'ol/layer/Vector';

@Component({
  selector: 'app-map',
  imports: [
    MapInfoComponent
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css'
})
export class MapComponent implements AfterViewInit {
  @ViewChild('map', { static: true }) mapElement!: ElementRef;
  map!: Map;
  @ViewChild('tooltip', { static: true }) tooltip!: HTMLElement;

  private readonly settingsService: SettingsService = inject(SettingsService);
  private readonly staticLayers: LayerService[] = [
    inject(HexOverlayService),
    inject(RegionLabelsService),
    inject(StructureIconsService),
    inject(RegionSectorsService)
  ];

  shard: WritableSignal<Shard> = this.settingsService.selectedShard;

  ngAfterViewInit() {
    proj4.defs(this.PROJECTION_CODE, '+proj=identity +no_defs');
    register(proj4);

    this.tooltip = document.getElementById('tooltip')!;
    this.map = this.initialiseMap();

    this.map.on('pointermove', (evt) => {
      if (evt.dragging) {
        this.tooltip.style.display = 'none';
        return;
      }

      const pixel = this.map.getEventPixel(evt.originalEvent);
      const features = this.map.getFeaturesAtPixel(pixel);

      if (features.length > 0) {
        const tooltipContent: string = features
          .map(feature => feature.get('name'))
          .find(name => !!name);

        if (tooltipContent) {
          this.tooltip.style.display = 'block';
          this.tooltip.style.left = (pixel[0] + 10) + 'px';
          this.tooltip.style.top = (pixel[1] + 10) + 'px';
          this.tooltip.innerText = tooltipContent;
        } else {
          this.tooltip.style.display = 'none';
        }
      } else {
        this.tooltip.style.display = 'none';
      }
    });

    this.map.getViewport().addEventListener('mouseout', () => {
      this.tooltip.style.display = 'none';
    });
  }

  readonly PROJECTION_CODE = "GAME_SIMPLE";
  readonly TILE_SIZE = 256;
  readonly MAX_ZOOM = 8;

  readonly maxTileScale = Math.pow(2, this.MAX_ZOOM);
  readonly tileExtent = [0, 0, this.TILE_SIZE * this.maxTileScale, this.TILE_SIZE * this.maxTileScale];

  readonly gameProjection = new Projection({
    code: this.PROJECTION_CODE,
    extent: this.tileExtent,
    units: 'pixels',
    metersPerUnit: 1,
    global: false
  });

  readonly resolutions = Array.from(
    { length: this.MAX_ZOOM + 1 },
    (_, i) => Math.pow(2, this.MAX_ZOOM - i)
  );

  readonly mousePositionControl = new MousePosition({
    coordinateFormat: createStringXY(0),
    projection: this.gameProjection
  });

  readonly mapLink = new Link({
    params: ["x", "y", "z", "l"]
  });
  readonly mapLinkUpdater = effect(() => {
    this.mapLink.update("shard", this.shard())
  })

  private initialiseMap(): Map {
    const baseLayer = this.createTileLayer(this.gameProjection, this.resolutions);
    baseLayer.setZIndex(1);

    this.mapLink.track("shard", (newValue) => {
      this.shard.set(newValue as Shard);
    })

    const map = new Map({
      target: 'map',
      layers: [
        baseLayer
      ],
      controls: [this.mousePositionControl, new LayerSwitcher()],
      interactions: [
        new DragPan({
          kinetic: new Kinetic(-0.005, 0.05, 100)
        }),
        new MouseWheelZoom(),
        new Draw({
          source: new VectorSource(),
          type: "LineString",
          style: new Style({
            stroke: new Stroke({
              color: 'white',
              width: 2
            })
          }),
          freehandCondition: shiftKeyOnly,
        }),
        this.mapLink,
      ],
      view: new View({
        projection: this.gameProjection,
        center: [this.tileExtent[2]/2, this.tileExtent[3]/2],
        zoom: 2,
        minZoom: 0,
        maxZoom: this.MAX_ZOOM,
        extent: this.tileExtent,
        resolutions: this.resolutions,
        constrainResolution: false
      })
    });

    map.on('click', (evt) => {
      const pixel = map.getEventPixel(evt.originalEvent)
      const features = map.getFeaturesAtPixel(pixel);
      if (features.length) {
        console.log('Feature found at click:', features[0].getGeometry());
      }
    });

    map.once("loadend", () => {
      this.initialiseLayers(this.shard());
    });
    return map;
  }

  private createTileLayer(projection: Projection, resolutions: number[]): TileLayer {
    return new TileLayer({
      extent: this.tileExtent,
      source: new XYZ({
        url: "https://raw.githubusercontent.com/Kastow/Foxhole-Map-Tiles/master/Tiles/{z}/{z}_{x}_{y}.png",
        interpolate: true,
        wrapX: false,
        minZoom: 0,
        maxZoom: this.MAX_ZOOM,
        projection: projection,
        tileGrid: new TileGrid({
          extent: this.tileExtent,
          origin: [0, this.tileExtent[3]],
          resolutions,
          tileSize: this.TILE_SIZE
        })
      })
    });
  }

  private createDebugLayer(projection: Projection, resolutions: number[]): TileLayer {
    return new TileLayer({
      source: new TileDebug({
        projection: projection,
        tileGrid: new TileGrid({
          extent: this.tileExtent,
          origin: [0, this.tileExtent[3]],
          resolutions: resolutions,
          tileSize: this.TILE_SIZE
        })
      }),
      zIndex: 2,
      opacity: 1
    });
  }

  _ = effect(() => this.initialiseLayers(this.shard()));
  private initialiseLayers(shard: Shard) {
    if (!this.map) {
      console.warn('Map not initialised, skipping layer initialisation');
      return;
    }

    this.staticLayers.forEach(layerService => {
      layerService.getLayer(shard).then(group => {
        if (!!this.map)
          console.warn("Map not initialised, skipping layer initialisation (post layer get)");

        const layers = group.getLayers();
        for (const layer of layers.getArray()) {
          const existingLayer = this.map
            .getAllLayers()
            .find((mapLayer) => layer.get("title") === mapLayer.get("title"));

          if (existingLayer) {
            if (layer instanceof VectorLayer) {
              existingLayer.setSource(layer.getSource());
            } else {
              console.warn('Layer is not a VectorLayer, skipping source update', layer);
            }
          } else {
            this.map.addLayer(layer);
          }
        }
      });
    });
  }
}
