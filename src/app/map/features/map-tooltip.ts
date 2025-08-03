import Map from 'ol/Map';
import { Feature } from 'ol';
import { FeatureLike } from 'ol/Feature';
import { Geometry } from 'ol/geom';

export interface TooltipOptions {
  tooltipElement: HTMLElement | string;
  hitTolerance?: number;
  maxWidth?: number;
  maxHeight?: number;
  viewportWidthRatio?: number;
  viewportHeightRatio?: number;
  cursorOffset?: number;
}

export interface TooltipFeatureData {
  name?: string;
  imageUrl?: string;
}

export class MapTooltip {
  private map: Map | null = null;
  private tooltipElement: HTMLElement;
  private options: Required<TooltipOptions>;
  private isInitialized = false;

  constructor(options: TooltipOptions) {
    if (typeof options.tooltipElement === 'string') {
      const element = document.getElementById(options.tooltipElement);
      if (!element) {
        throw new Error(`Tooltip element with ID '${options.tooltipElement}' not found`);
      }
      this.tooltipElement = element;
    } else {
      this.tooltipElement = options.tooltipElement;
    }

    this.options = {
      tooltipElement: this.tooltipElement,
      hitTolerance: options.hitTolerance ?? 5,
      maxWidth: options.maxWidth ?? 800,
      maxHeight: options.maxHeight ?? 600,
      viewportWidthRatio: options.viewportWidthRatio ?? 0.8,
      viewportHeightRatio: options.viewportHeightRatio ?? 0.8,
      cursorOffset: options.cursorOffset ?? 10
    };
  }

  public initialize(map: Map): void {
    if (this.isInitialized) {
      this.destroy();
    }

    this.map = map;
    this.setupEventListeners();
    this.isInitialized = true;
  }

  public destroy(): void {
    if (this.map && this.isInitialized) {
      this.map.un('pointermove', this.handlePointerMove);
      this.map.getViewport().removeEventListener('mouseout', this.handleMouseOut);
    }

    this.hideTooltip();
    this.map = null;
    this.isInitialized = false;
  }

  private setupEventListeners(): void {
    if (!this.map) return;

    this.map.on('pointermove', this.handlePointerMove.bind(this));
    this.map.getViewport().addEventListener('mouseout', this.handleMouseOut.bind(this));
  }

  private handlePointerMove(evt: any): void {
    if (!this.map) return;

    if (evt.dragging) {
      this.hideTooltip();
      return;
    }

    const pixel = this.map.getEventPixel(evt.originalEvent);
    const features = this.map.getFeaturesAtPixel(pixel, {
      hitTolerance: this.options.hitTolerance
    });

    if (features.length > 0) {
      const validFeature = this.findValidFeature(features);
      if (validFeature) {
        this.showTooltip(validFeature, pixel);
      } else {
        this.hideTooltip();
      }
    } else {
      this.hideTooltip();
    }
  }

  private handleMouseOut(): void {
    this.hideTooltip();
  }

  private findValidFeature(features: FeatureLike[]): Feature<Geometry> | null {
    const validFeature = features.find(f => f.get('name') || f.get('imageUrl'));
    return (validFeature as Feature<Geometry>) || null;
  }

  private showTooltip(feature: Feature<Geometry>, pixel: number[]): void {
    const tooltipData: TooltipFeatureData = {
      name: feature.get('name'),
      imageUrl: feature.get('imageUrl')
    };

    if (!tooltipData.name && !tooltipData.imageUrl) {
      this.hideTooltip();
      return;
    }

    const position = this.calculateTooltipPosition(pixel);
    this.tooltipElement.style.left = position.left + 'px';
    this.tooltipElement.style.top = position.top + 'px';

    this.buildTooltipContent(tooltipData);

    this.tooltipElement.classList.remove('hidden');
    this.tooltipElement.style.display = 'block';
  }

  private hideTooltip(): void {
    this.tooltipElement.classList.add('hidden');
    this.tooltipElement.style.display = 'none';
  }

  private calculateTooltipPosition(pixel: number[]): { left: number; top: number } {
    const offset = this.options.cursorOffset;
    let left = pixel[0] + offset;
    let top = pixel[1] + offset;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const estimatedWidth = 100;
    const estimatedHeight = 30;

    if (left + estimatedWidth > viewportWidth) {
      left = pixel[0] - estimatedWidth - offset;
    }

    if (top + estimatedHeight > viewportHeight) {
      top = pixel[1] - estimatedHeight - offset;
    }

    left = Math.max(10, left);
    top = Math.max(10, top);

    return { left, top };
  }

  private buildTooltipContent(data: TooltipFeatureData): void {
    this.tooltipElement.innerHTML = '';

    if (data.name) {
      const textElement = document.createElement('div');
      textElement.textContent = data.name;
      textElement.className = 'text-sm font-medium';
      if (data.imageUrl) {
        textElement.className += ' mb-1';
      }
      this.tooltipElement.appendChild(textElement);
    }

    if (data.imageUrl) {
      this.addImageToTooltip(data.imageUrl, data.name);
    }
  }

  private addImageToTooltip(imageUrl: string, altText?: string): void {
    const imageElement = document.createElement('img');
    imageElement.src = imageUrl;
    imageElement.alt = altText || 'Tooltip image';
    imageElement.className = 'rounded border border-slate-600';
    imageElement.style.display = 'block';

    const maxWidth = Math.min(
      this.options.maxWidth,
      window.innerWidth * this.options.viewportWidthRatio
    );
    const maxHeight = Math.min(
      this.options.maxHeight,
      window.innerHeight * this.options.viewportHeightRatio
    );

    imageElement.style.maxWidth = maxWidth + 'px';
    imageElement.style.maxHeight = maxHeight + 'px';
    imageElement.style.objectFit = 'contain';

    imageElement.onload = () => {
      const naturalWidth = imageElement.naturalWidth;
      const naturalHeight = imageElement.naturalHeight;

      let displayWidth = naturalWidth;
      let displayHeight = naturalHeight;

      if (naturalWidth > maxWidth || naturalHeight > maxHeight) {
        const widthRatio = maxWidth / naturalWidth;
        const heightRatio = maxHeight / naturalHeight;
        const scale = Math.min(widthRatio, heightRatio);

        displayWidth = naturalWidth * scale;
        displayHeight = naturalHeight * scale;
      }

      imageElement.style.width = displayWidth + 'px';
      imageElement.style.height = displayHeight + 'px';
    };

    imageElement.onerror = () => {
      imageElement.style.display = 'none';
      if (!altText) {
        this.hideTooltip();
      }
    };

    this.tooltipElement.appendChild(imageElement);
  }

  public isActive(): boolean {
    return this.isInitialized;
  }

  public updateOptions(newOptions: Partial<TooltipOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}


export function initializeMapTooltip(map: Map, options: TooltipOptions): MapTooltip {
  const tooltip = new MapTooltip(options);
  tooltip.initialize(map);
  return tooltip;
}
