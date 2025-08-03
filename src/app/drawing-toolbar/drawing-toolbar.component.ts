import {Component, inject, OnInit, Output, EventEmitter, signal, ViewChild} from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {ButtonModule} from 'primeng/button';
import {ColorPickerModule} from 'primeng/colorpicker';
import {TooltipModule} from 'primeng/tooltip';
import {FormsModule} from '@angular/forms';
import {DrawingService, DrawingType} from '../../services/drawing.service';
import {InputTextModule} from 'primeng/inputtext';
import {DropdownModule} from 'primeng/dropdown';
import {POINT_ICON_CONFIGS, PointIcon} from '../../config/point-icons.config';
import {ImportDialogComponent} from './import-dialog.component';
import {HotkeyService} from '../../services/hotkey.service';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';

export interface DrawingTool {
  readonly type: DrawingType;
  readonly icon: string;
  readonly tooltip: string;
  readonly category?: string;
  readonly hotkey?: string;
}

@Component({
  selector: 'app-drawing-toolbar',
  imports: [CommonModule, ButtonModule, ColorPickerModule, TooltipModule, FormsModule, InputTextModule, DropdownModule, NgOptimizedImage, ImportDialogComponent],
  templateUrl: './drawing-toolbar.component.html',
  styleUrl: './drawing-toolbar.component.css'
})
export class DrawingToolbarComponent {
  @Output() readonly drawingTypeChange = new EventEmitter<DrawingType>();
  @ViewChild(ImportDialogComponent) importDialog!: ImportDialogComponent;

  private readonly drawingService = inject(DrawingService);
  private readonly hotkeyService = inject(HotkeyService);

  readonly activeDrawingType = signal<DrawingType>(null);
  selectedColor = '#FFFFFF';
  shapeText = '';
  selectedIcon = '';
  imageUrl = '';

  readonly pointIcons: PointIcon[] = POINT_ICON_CONFIGS;

  readonly drawingTools: DrawingTool[] = [
    { type: 'Point', icon: 'pi pi-map-marker', tooltip: 'Point Markers', category: 'markers', hotkey: 'P' },
    { type: 'LineString', icon: 'pi pi-minus', tooltip: 'Lines and Paths', category: 'lines', hotkey: 'L' },
    { type: 'Polygon', icon: 'pi pi-star', tooltip: 'Polygons', category: 'shapes', hotkey: 'G' },
    { type: 'Circle', icon: 'pi pi-circle', tooltip: 'Circles', category: 'shapes', hotkey: 'C' },
    { type: 'Rectangle', icon: 'pi pi-stop', tooltip: 'Rectangles', category: 'shapes', hotkey: 'R' },
    { type: 'Freehand', icon: 'pi pi-pencil', tooltip: 'Freehand', category: 'drawing', hotkey: 'F' }
  ];

  readonly drawingStateSub = this.drawingService.drawingState$
    .pipe(takeUntilDestroyed())
    .subscribe(state => {
      this.activeDrawingType.set(state.activeType);
      this.selectedColor = state.color;
      this.shapeText = state.text;
      this.selectedIcon = state.pointIcon;
      this.imageUrl = state.imageUrl;
    });

  readonly hotkeyContextSub = this.drawingTypeChange
    .pipe(takeUntilDestroyed())
    .subscribe(type => {
      if (type === null) {
        this.hotkeyService.restoreContexts();
      } else {
        this.hotkeyService.storeContexts();
      }
    });

  setDrawingType(type: DrawingType): void {
    const currentType = this.activeDrawingType();
    const newType = currentType === type ? null : type;

    this.drawingService.setDrawingType(newType);
    this.drawingTypeChange.emit(newType);
  }

  isActive(type: DrawingType): boolean {
    return this.activeDrawingType() === type;
  }

  clearAllDrawings(): void {
    this.drawingService.clearDrawings();
  }

  onColorChange(color: string): void {
    this.selectedColor = color;
    this.drawingService.setDrawingColor(color);
  }

  onTextChange(text: string): void {
    this.drawingService.setShapeText(text);
  }

  onIconChange(icon: string): void {
    this.drawingService.setPointIcon(icon);
  }

  onImageUrlChange(imageUrl: string): void {
    this.imageUrl = imageUrl;
    this.drawingService.setImageUrl(imageUrl);
  }

  exportDrawings(): void {
    const geoJSON = this.drawingService.getDrawingsAsGeoJSON();

    if (!geoJSON || geoJSON.features.length === 0) {
      return;
    }

    const jsonString = JSON.stringify(geoJSON, null, 2);

    navigator.clipboard.writeText(jsonString)
      .catch(err => console.error('Failed to copy drawings to clipboard:', err));
  }

  importDrawings(): void {
    this.importDialog.show();
  }
}
