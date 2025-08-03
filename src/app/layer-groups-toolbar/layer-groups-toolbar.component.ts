import { Component, inject, OnInit, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { LayerGroup, LayerGroupsService, LayerGroupState } from '../../services/layer-groups.service';

@Component({
  selector: 'app-layer-groups-toolbar',
  imports: [
    CommonModule,
    ButtonModule,
    TooltipModule
  ],
  templateUrl: './layer-groups-toolbar.component.html',
  styleUrl: './layer-groups-toolbar.component.css'
})
export class LayerGroupsToolbarComponent implements OnInit {
  @Output() readonly layerSwitcherToggle = new EventEmitter<void>();

  private readonly layerGroupsService = inject(LayerGroupsService);

  readonly layerGroups = signal<LayerGroup[]>([]);
  readonly layerGroupStates = signal<Map<string, LayerGroupState>>(new Map());

  ngOnInit(): void {
    this.layerGroups.set(this.layerGroupsService.getLayerGroups());
    this.layerGroupStates.set(this.layerGroupsService.getLayerGroupStates());

    this.layerGroupsService.getLayerGroupStates();
  }

  toggleLayerGroup(groupId: string): void {
    this.layerGroupsService.toggleLayerGroup(groupId);
    this.updateStates();
  }

  isLayerGroupVisible(groupId: string): boolean {
    return this.layerGroupsService.isLayerGroupVisible(groupId);
  }

  private updateStates(): void {
    this.layerGroupStates.set(this.layerGroupsService.getLayerGroupStates());
  }

  showAll(): void {
    this.layerGroupsService.showAll();
    this.updateStates();
  }

  hideAll(): void {
    this.layerGroupsService.hideAll();
    this.updateStates();
  }

  resetToDefaults(): void {
    this.layerGroupsService.resetToDefaults();
    this.updateStates();
  }

  getVisibleLayerGroupsCount(): number {
    return Array.from(this.layerGroupStates().values())
      .filter(state => state.visible).length;
  }

  getTotalLayerGroupsCount(): number {
    return this.layerGroups().length;
  }
}
