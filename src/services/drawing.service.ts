import {Injectable, signal, WritableSignal} from '@angular/core';
import Map from 'ol/Map';
import VectorSource from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import {Draw, Modify, Snap} from 'ol/interaction';
import {Circle as CircleGeom, Geometry, Point, LineString, Polygon} from 'ol/geom';
import {Circle as CircleStyle, Fill, Icon, Stroke, Style} from 'ol/style';
import {createBox} from 'ol/interaction/Draw';
import {shiftKeyOnly, primaryAction} from 'ol/events/condition';
import Feature, {FeatureLike} from 'ol/Feature';
import {BehaviorSubject, Observable} from 'rxjs';

export type DrawingType = 'Point' | 'LineString' | 'Polygon' | 'Circle' | 'Rectangle' | 'Freehand' | null;

export interface DrawingState {
  readonly activeType: DrawingType;
  readonly color: string;
  readonly text: string;
  readonly pointIcon: string;
  readonly imageUrl: string;
}

export interface FeatureClickEvent {
  readonly event: MouseEvent;
  readonly feature: Feature<Geometry>;
}

@Injectable({
  providedIn: 'root'
})
export class DrawingService {
  private readonly map = signal<Map | null>(null);
  private readonly source = signal<VectorSource | null>(null);
  private readonly layer = signal<VectorLayer | null>(null);
  private readonly draw = signal<Draw | null>(null);

  private readonly drawingStateSubject = new BehaviorSubject<DrawingState>({
    activeType: null,
    color: '#FFFFFF',
    text: '',
    pointIcon: '',
    imageUrl: ''
  });

  private readonly featureClickSubject = new BehaviorSubject<FeatureClickEvent | null>(null);

  readonly drawingState$ = this.drawingStateSubject.asObservable();
  readonly featureRightClicked$ = this.featureClickSubject.asObservable();

  constructor() {}

  initialize(map: Map): void {
    this.map.set(map);

    const source = new VectorSource();
    this.source.set(source);

    const layer = new VectorLayer({
      source,
      style: (feature: FeatureLike) => this.createStyleForFeature(feature as Feature)
    });

    layer.set('title', 'Drawing Layer');
    layer.setZIndex(100);
    this.layer.set(layer);

    map.addLayer(layer);
    this.setupFeatureInteraction();
  }

  setDrawingType(type: DrawingType): void {
    const currentState = this.drawingStateSubject.value;
    const newState = { ...currentState, activeType: type };
    this.drawingStateSubject.next(newState);

    this.removeCurrentDrawInteraction();

    if (!type) {
      return;
    }

    this.createDrawInteraction(type);
  }

  setDrawingColor(color: string): void {
    const currentState = this.drawingStateSubject.value;
    const newState = { ...currentState, color };
    this.drawingStateSubject.next(newState);
  }

  setShapeText(text: string): void {
    const currentState = this.drawingStateSubject.value;
    const newState = { ...currentState, text };
    this.drawingStateSubject.next(newState);
  }

  setPointIcon(pointIcon: string): void {
    const currentState = this.drawingStateSubject.value;
    const newState = { ...currentState, pointIcon };
    this.drawingStateSubject.next(newState);
  }

  setImageUrl(imageUrl: string): void {
    const currentState = this.drawingStateSubject.value;
    const newState = { ...currentState, imageUrl };
    this.drawingStateSubject.next(newState);
  }

  deleteFeature(feature: Feature<Geometry>): void {
    const source = this.source();
    if (source && feature) {
      source.removeFeature(feature);
    }
  }

  clearDrawings(): void {
    const source = this.source();
    source?.clear();
  }

  getDrawingsAsGeoJSON(): any {
    const source = this.source();
    if (!source) return null;

    const features = source.getFeatures();
    const geoJSONFeatures = features.map(feature => this.convertFeatureToGeoJSON(feature))
      .filter(feature => feature !== null);

    return {
      type: 'FeatureCollection',
      features: geoJSONFeatures
    };
  }

  loadFromGeoJSON(geoJSONString: string): boolean {
    try {
      const geoJSON = JSON.parse(geoJSONString);
      const source = this.source();
      
      if (!source || !geoJSON || geoJSON.type !== 'FeatureCollection') {
        return false;
      }

      const features: Feature[] = [];
      for (const featureData of geoJSON.features) {
        const feature = this.convertGeoJSONToFeature(featureData);
        if (feature) {
          features.push(feature);
        }
      }

      source.addFeatures(features);
      return true;
    } catch (error) {
      console.error('Failed to parse GeoJSON:', error);
      return false;
    }
  }

  private convertGeoJSONToFeature(featureData: any): Feature | null {
    try {
      const geometry = this.convertGeoJSONToGeometry(featureData.geometry);
      if (!geometry) return null;

      const feature = new Feature(geometry);
      
      if (featureData.properties) {
        Object.keys(featureData.properties).forEach(key => {
          feature.set(key, featureData.properties[key]);
        });
      }

      const properties = featureData.properties || {};
      const style = this.createStyleFromProperties(properties);
      if (style) {
        feature.setStyle(style);
      }

      return feature;
    } catch (error) {
      console.error('Failed to convert GeoJSON feature:', error);
      return null;
    }
  }

  private convertGeoJSONToGeometry(geometryData: any): Geometry | null {
    if (!geometryData || !geometryData.type || !geometryData.coordinates) {
      return null;
    }

    try {
      switch (geometryData.type) {
        case 'Point':
          return new Point(geometryData.coordinates);
        case 'LineString':
          return new LineString(geometryData.coordinates);
        case 'Polygon':
          return new Polygon(geometryData.coordinates);
        default:
          console.warn('Unsupported geometry type:', geometryData.type);
          return null;
      }
    } catch (error) {
      console.error('Failed to create geometry:', error);
      return null;
    }
  }

  private createStyleFromProperties(properties: any): Style | null {
    try {
      const style = new Style();
      let hasStyle = false;

      if (properties.stroke || properties.strokeColor) {
        style.setStroke(new Stroke({
          color: properties.strokeColor || properties.stroke || '#000000',
          width: properties.strokeWidth || 2
        }));
        hasStyle = true;
      }

      if (properties.fill || properties.fillColor) {
        style.setFill(new Fill({
          color: properties.fillColor || properties.fill || 'rgba(255,255,255,0.2)'
        }));
        hasStyle = true;
      }

      if (properties.pointIcon && properties.pointIcon !== 'none') {
        style.setImage(new Icon({
          src: properties.pointIcon,
          scale: properties.iconScale || 1,
          anchor: [0.5, 1],
          anchorXUnits: 'fraction',
          anchorYUnits: 'fraction'
        }));
        hasStyle = true;
      }

      return hasStyle ? style : null;
    } catch (error) {
      console.error('Failed to create style:', error);
      return null;
    }
  }

  private removeCurrentDrawInteraction(): void {
    const currentDraw = this.draw();
    const map = this.map();

    if (currentDraw && map) {
      map.removeInteraction(currentDraw);
      this.draw.set(null);
    }
  }

  private createDrawInteraction(type: DrawingType): void {
    const map = this.map();
    const source = this.source();

    if (!map || !source || !type) {
      return;
    }

    const { geometryType, geometryFunction, freehand, freehandCondition } = this.getDrawConfig(type);

    const draw = new Draw({
      source,
      type: geometryType,
      geometryFunction,
      freehand,
      freehandCondition,
      condition: primaryAction
    });

    draw.on('drawend', (event) => this.onDrawEnd(event, type));

    this.draw.set(draw);
    map.addInteraction(draw);
  }

  private getDrawConfig(type: DrawingType) {
    let geometryType: any = type;
    let geometryFunction = undefined;
    let freehand = false;
    let freehandCondition = undefined;

    switch (type) {
      case 'Rectangle':
        geometryType = 'Circle';
        geometryFunction = createBox();
        break;
      case 'Circle':
        geometryType = 'Circle';
        break;
      case 'Freehand':
        geometryType = 'LineString';
        freehand = true;
        break;
      default:
        freehandCondition = shiftKeyOnly;
    }

    return { geometryType, geometryFunction, freehand, freehandCondition };
  }

  private onDrawEnd(event: any, type: DrawingType): void {
    const feature = event.feature;
    const currentState = this.drawingStateSubject.value;

    if (currentState.text) {
      feature.set('name', currentState.text);
    }

    feature.set('color', currentState.color);

    if (currentState.imageUrl) {
      feature.set('imageUrl', currentState.imageUrl);
    }

    if (type === 'Point' && currentState.pointIcon) {
      feature.set('icon', currentState.pointIcon);
    }
  }

  private setupFeatureInteraction(): void {
    const map = this.map();
    if (!map) return;

    map.getViewport().addEventListener('contextmenu', (evt) => {
      const source = this.source();
      const layer = this.layer();
      if (!source || !layer) return;

      const pixel = map.getEventPixel(evt);
      const features = map.getFeaturesAtPixel(pixel, {
        layerFilter: (l) => l === layer
      });

      if (features.length > 0) {
        const feature = features[0] as Feature<Geometry>;
        this.featureClickSubject.next({
          event: evt as MouseEvent,
          feature
        });

        evt.stopPropagation();
        evt.preventDefault();
      } else {
        const currentState = this.drawingStateSubject.value;
        if (currentState.activeType) {
          this.setDrawingType(null);
          evt.stopPropagation();
          evt.preventDefault();
        }
      }
    });
  }

  private convertFeatureToGeoJSON(feature: Feature): any {
    const geometry = feature.getGeometry();
    const name = feature.get('name') || '';

    if (!geometry) return null;

    const geoJSONGeometry = this.convertGeometryToGeoJSON(geometry);
    if (!geoJSONGeometry) return null;

    const currentState = this.drawingStateSubject.value;
    const featureColor = feature.get('color') || currentState.color;
    const featureIcon = feature.get('icon') || '';
    const featureImageUrl = feature.get('imageUrl') || '';

    return {
      type: 'Feature',
      geometry: geoJSONGeometry,
      properties: {
        name,
        color: featureColor,
        icon: featureIcon,
        imageUrl: featureImageUrl
      }
    };
  }

  private convertGeometryToGeoJSON(geometry: Geometry): any {
    const type = geometry.getType();

    switch (type) {
      case 'Circle':
        return this.circleToPolygon(geometry as CircleGeom);
      case 'Point':
      case 'LineString':
      case 'Polygon':
        return {
          type,
          coordinates: (geometry as any).getCoordinates()
        };
      default:
        return null;
    }
  }

  private circleToPolygon(circle: CircleGeom, sides: number = 32): any {
    const center = circle.getCenter();
    const radius = circle.getRadius();
    const coordinates = [[...center]];

    for (let i = 0; i <= sides; i++) {
      const angle = (i * 2 * Math.PI) / sides;
      const x = center[0] + radius * Math.cos(angle);
      const y = center[1] + radius * Math.sin(angle);
      coordinates.push([x, y]);
    }

    coordinates.push([...coordinates[1]]);

    return {
      type: 'Polygon',
      coordinates: [coordinates]
    };
  }

  private createStyleForFeature(feature: Feature): Style {
    const currentState = this.drawingStateSubject.value;
    const featureColor = feature.get('color') || currentState.color;

    const fillColor = this.hexToRgba(featureColor, 0.2);
    const strokeColor = this.hexToRgba(featureColor, 0.8);

    const iconPath = feature.get('icon');
    const imageStyle = iconPath
      ? new Icon({
          src: iconPath,
          scale: 0.5,
          color: featureColor
        })
      : new CircleStyle({
          radius: 5,
          fill: new Fill({ color: strokeColor }),
          stroke: new Stroke({ color: featureColor, width: 1 })
        });

    return new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: strokeColor, width: 2 }),
      image: imageStyle
    });
  }

  private hexToRgba(hex: string, alpha: number): string {
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
