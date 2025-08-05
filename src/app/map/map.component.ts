import {
  AfterViewInit,
  Component,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { MapInfoComponent } from '../map-info/map-info.component';
import Map from 'ol/Map';
import { SettingsService } from '../../services/settings.service';
import {
  HexOverlayService,
  LayerService,
  RegionLabelsService,
  RegionSectorsService,
  StructureIconsService,
} from '../../layers';
import { Shard } from '../../services/war-api.service';
import proj4 from 'proj4';
import { register } from 'ol/proj/proj4';
import { Projection } from 'ol/proj';
import TileLayer from 'ol/layer/Tile';
import TileDebug from 'ol/source/TileDebug';
import { TileGrid } from 'ol/tilegrid';
import LayerSwitcher from 'ol-layerswitcher';
import { DragPan, Link, MouseWheelZoom } from 'ol/interaction';
import { Kinetic } from 'ol';
import View from 'ol/View';
import XYZ from 'ol/source/XYZ';
import LayerGroup from 'ol/layer/Group';
import VectorLayer from 'ol/layer/Vector';
import { DrawingToolbarComponent } from '../drawing-toolbar/drawing-toolbar.component';
import { DrawingService, DrawingType } from '../../services/drawing.service';
import { DrawingContextMenuComponent } from '../drawing-context-menu/drawing-context-menu.component';
import { LayerGroupsToolbarComponent } from '../layer-groups-toolbar/layer-groups-toolbar.component';
import { LayerGroupsService } from '../../services/layer-groups.service';
import Feature from 'ol/Feature';
import { Geometry } from 'ol/geom';
import { initializeMapTooltip, MapTooltip } from './features';
import { HotkeyService } from '../../services/hotkey.service';
import { HotkeyDisplayComponent } from '../hotkey-display/hotkey-display.component';

@Component({
  selector: 'app-map',
  imports: [
    MapInfoComponent,
    DrawingToolbarComponent,
    DrawingContextMenuComponent,
    LayerGroupsToolbarComponent,
    HotkeyDisplayComponent,
  ],
  templateUrl: './map.component.html',
  styleUrl: './map.component.css',
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('map', { static: true }) mapElement!: ElementRef;
  map!: Map;
  private mapTooltip!: MapTooltip;
  private layerSwitcher!: LayerSwitcher;
  private hexSectorsLayer: LayerGroup | null = null;
  @ViewChild('contextMenu') contextMenu!: DrawingContextMenuComponent;

  private readonly settingsService: SettingsService = inject(SettingsService);
  private readonly drawingService: DrawingService = inject(DrawingService);
  private readonly layerGroupsService: LayerGroupsService =
    inject(LayerGroupsService);
  private readonly structureIconsService: StructureIconsService = inject(
    StructureIconsService
  );
  private readonly regionSectorsService: RegionSectorsService =
    inject(RegionSectorsService);
  private readonly hotkeyService: HotkeyService = inject(HotkeyService);
  private readonly staticLayers: LayerService[] = [
    inject(HexOverlayService),
    inject(RegionLabelsService),
    inject(StructureIconsService),
  ];

  shard: WritableSignal<Shard> = this.settingsService.selectedShard;
  showHotkeyDisplay = false;

  ngAfterViewInit() {
    proj4.defs(this.PROJECTION_CODE, '+proj=identity +no_defs');
    register(proj4);

    this.map = this.initialiseMap();
    this.setupHotkeys();
    this.hotkeyService.enableContext('map');

    this.layerSwitcher = new LayerSwitcher({
      startActive: false, // Start closed
      tipLabel: 'Layer list', // Tooltip for button
      collapseTipLabel: 'Close layer list', // Tooltip when open
    });

    this.drawingService.initialize(this.map);

    this.mapTooltip = initializeMapTooltip(this.map, {
      tooltipElement: 'tooltip',
      hitTolerance: 5,
    });

    this.drawingService.featureRightClicked$.subscribe((featureClick) => {
      if (featureClick) {
        this.contextMenu.show(featureClick.event, featureClick.feature);
      }
    });
  }

  ngOnDestroy() {
    if (this.mapTooltip) {
      this.mapTooltip.destroy();
    }
    this.hotkeyService.unregisterByContext('map');
  }

  private setupHotkeys(): void {
    this.hotkeyService.register({
      key: '?',
      modifiers: {
        shift: true,
      },
      description: 'Show keyboard shortcuts',
      action: () => this.toggleHotkeyDisplay(),
      context: 'map',
    });

    this.hotkeyService.register({
      key: 'r',
      description: 'Reset map layers',
      action: () => this.layerGroupsService.resetToDefaults(),
      context: 'map',
    });

    this.hotkeyService.register({
      key: '1',
      description: 'Toggle Overview Layer',
      action: () => this.layerGroupsService.toggleLayerGroup('overview'),
      context: 'map',
    });

    this.hotkeyService.register({
      key: '2',
      description: 'Toggle Logistics Layer',
      action: () => this.layerGroupsService.toggleLayerGroup('logistics'),
      context: 'map',
    });

    this.hotkeyService.register({
      key: '3',
      description: 'Toggle Resource Layer',
      action: () => this.layerGroupsService.toggleLayerGroup('production'),
      context: 'map',
    });

    this.hotkeyService.register({
      key: '4',
      description: 'Toggle Defence Layer',
      action: () => this.layerGroupsService.toggleLayerGroup('defence'),
      context: 'map',
    });

    this.hotkeyService.register({
      key: '5',
      description: 'Toggle Intelligence Layer',
      action: () => this.layerGroupsService.toggleLayerGroup('intelligence'),
      context: 'map',
    });

    this.hotkeyService.register({
      key: '6',
      description: 'Toggle Heavy Weapons Layer',
      action: () => this.layerGroupsService.toggleLayerGroup('weapons'),
      context: 'map',
    });

    this.hotkeyService.register({
      key: '7',
      description: 'Toggle Hex Sectors Layer',
      action: () => this.layerGroupsService.toggleLayerGroup('hex-sectors'),
      context: 'map',
    });
  }

  private resetMapView(): void {
    const view = this.map.getView();
    view.setCenter([0, 0]);
    view.setZoom(2);
  }

  private toggleHotkeyDisplay(): void {
    this.showHotkeyDisplay = !this.showHotkeyDisplay;
  }

  onDeleteFeature(feature: Feature<Geometry>): void {
    this.drawingService.deleteFeature(feature);
  }

  onDrawingTypeChange(drawingType: DrawingType): void {
    this.drawingService.setDrawingType(drawingType);
  }

  onLayerSwitcherToggle(): void {
    if (this.layerSwitcher && this.map) {
      const controls = this.map.getControls();
      const existingLayerSwitcher = controls
        .getArray()
        .find((control) => control instanceof LayerSwitcher);

      if (existingLayerSwitcher) {
        this.map.removeControl(existingLayerSwitcher);
      } else {
        this.map.addControl(this.layerSwitcher);
        this.layerSwitcher.showPanel();
      }
    }
  }

  readonly PROJECTION_CODE = 'GAME_SIMPLE';
  readonly TILE_SIZE = 256;
  readonly MAX_ZOOM = 8;

  readonly maxTileScale = Math.pow(2, this.MAX_ZOOM);
  readonly tileExtent = [
    0,
    0,
    this.TILE_SIZE * this.maxTileScale,
    this.TILE_SIZE * this.maxTileScale,
  ];

  readonly gameProjection = new Projection({
    code: this.PROJECTION_CODE,
    extent: this.tileExtent,
    units: 'pixels',
    metersPerUnit: 1,
    global: false,
  });

  readonly resolutions = Array.from({ length: this.MAX_ZOOM + 1 }, (_, i) =>
    Math.pow(2, this.MAX_ZOOM - i)
  );

  readonly mapLink = new Link({
    params: ['x', 'y', 'z'],
  });
  readonly mapLinkUpdater = effect(() => {
    this.mapLink.update('shard', this.shard());
  });

  private initialiseMap(): Map {
    const baseLayer = this.createTileLayer(
      this.gameProjection,
      this.resolutions
    );
    baseLayer.setZIndex(1);

    this.mapLink.track('shard', (newValue) => {
      this.shard.set(newValue as Shard);
    });

    const map = new Map({
      target: 'map',
      layers: [baseLayer],
      controls: [],
      interactions: [
        new DragPan({
          kinetic: new Kinetic(-0.005, 0.05, 100),
          condition: (event) => {
            return (
              event.originalEvent.button === 0 ||
              event.originalEvent.button === 1
            );
          },
        }),
        new MouseWheelZoom(),
        this.mapLink,
      ],
      view: new View({
        projection: this.gameProjection,
        center: [this.tileExtent[2] / 2, this.tileExtent[3] / 2],
        zoom: 2,
        minZoom: 0,
        maxZoom: this.MAX_ZOOM,
        extent: this.tileExtent,
        resolutions: this.resolutions,
        constrainResolution: false,
      }),
    });

    map.on('click', (evt) => {
      const pixel = map.getEventPixel(evt.originalEvent);
      const features = map.getFeaturesAtPixel(pixel);
    });

    map.once('loadend', () => {
      this.initialiseLayers(this.shard());
    });
    return map;
  }

  private createTileLayer(
    projection: Projection,
    resolutions: number[]
  ): TileLayer {
    return new TileLayer({
      extent: this.tileExtent,
      source: new XYZ({
        url: 'https://raw.githubusercontent.com/Kastow/Foxhole-Map-Tiles/master/Tiles/{z}/{z}_{x}_{y}.png',
        interpolate: true,
        wrapX: false,
        minZoom: 0,
        maxZoom: this.MAX_ZOOM,
        projection: projection,
        tileGrid: new TileGrid({
          extent: this.tileExtent,
          origin: [0, this.tileExtent[3]],
          resolutions,
          tileSize: this.TILE_SIZE,
        }),
      }),
    });
  }

  private createDebugLayer(
    projection: Projection,
    resolutions: number[]
  ): TileLayer {
    return new TileLayer({
      source: new TileDebug({
        projection: projection,
        tileGrid: new TileGrid({
          extent: this.tileExtent,
          origin: [0, this.tileExtent[3]],
          resolutions: resolutions,
          tileSize: this.TILE_SIZE,
        }),
      }),
      zIndex: 2,
      opacity: 1,
    });
  }

  _ = effect(() => this.initialiseLayers(this.shard()));

  hexSectorsEffect = effect(() => {
    const isHexSectorsVisible =
      this.layerGroupsService.isLayerGroupVisible('hex-sectors');
    const currentShard = this.shard();
    this.handleHexSectorsVisibility(isHexSectorsVisible, currentShard);
  });

  private async handleHexSectorsVisibility(
    visible: boolean,
    shard: Shard
  ): Promise<void> {
    if (!this.map) return;
    if (
      this.hexSectorsLayer &&
      this.map.getLayers().getArray().includes(this.hexSectorsLayer)
    ) {
      this.map.removeLayer(this.hexSectorsLayer);
    }
    if (visible) {
      this.hexSectorsLayer = await this.regionSectorsService.getLayer(shard);
      this.map.addLayer(this.hexSectorsLayer);
    }
  }

  private initialiseLayers(shard: Shard) {
    if (!this.map) {
      console.warn('Map not initialised, skipping layer initialisation');
      return;
    }

    this.staticLayers.forEach((layerService) => {
      layerService.getLayer(shard).then((group) => {
        if (!!this.map)
          console.warn(
            'Map not initialised, skipping layer initialisation (post layer get)'
          );

        const layers = group.getLayers();
        for (const layer of layers.getArray()) {
          const existingLayer = this.map
            .getAllLayers()
            .find((mapLayer) => layer.get('title') === mapLayer.get('title'));

          if (existingLayer) {
            if (layer instanceof VectorLayer) {
              existingLayer.setSource(layer.getSource());
            } else {
              console.warn(
                'Layer is not a VectorLayer, skipping source update',
                layer
              );
            }
          } else {
            this.map.addLayer(layer);
          }
        }
      });
    });
  }
}
