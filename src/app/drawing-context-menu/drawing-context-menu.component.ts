import {Component, ViewChild, EventEmitter, Output, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {ContextMenu, ContextMenuModule} from 'primeng/contextmenu';
import {MenuItem} from 'primeng/api';
import Feature from 'ol/Feature';
import {Geometry} from 'ol/geom';

@Component({
  selector: 'app-drawing-context-menu',
  imports: [CommonModule, ContextMenuModule],
  templateUrl: './drawing-context-menu.component.html',
  styleUrl: './drawing-context-menu.component.css'
})
export class DrawingContextMenuComponent implements OnInit {
  @ViewChild('contextMenu') contextMenu!: ContextMenu;
  @Output() readonly deleteFeature = new EventEmitter<Feature<Geometry>>();

  readonly menuItems = signal<MenuItem[]>([]);
  private readonly selectedFeature = signal<Feature<Geometry> | null>(null);

  ngOnInit(): void {
    this.menuItems.set([
      {
        label: 'Delete',
        icon: 'pi pi-trash',
        command: () => this.handleDelete()
      }
    ]);
  }

  show(event: MouseEvent, feature: Feature<Geometry>): void {
    this.selectedFeature.set(feature);
    this.contextMenu.show(event);
  }

  hide(): void {
    this.contextMenu.hide();
    this.selectedFeature.set(null);
  }

  private handleDelete(): void {
    const feature = this.selectedFeature();
    if (feature) {
      this.deleteFeature.emit(feature);
      this.selectedFeature.set(null);
    }
  }
}
