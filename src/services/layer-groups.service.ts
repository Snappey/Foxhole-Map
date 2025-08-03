import { Injectable, inject, signal, effect } from '@angular/core';
import { MapStructure } from './war-api.service';
import { SettingsService } from './settings.service';
import { LAYER_GROUP_CONFIGS } from '../config/layer-groups.config';

export interface LayerGroup {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly color: string;
  readonly structures: MapStructure[];
  readonly defaultVisible: boolean;
}

export interface LayerGroupState {
  readonly groupId: string;
  readonly visible: boolean;
  readonly opacity: number;
}

@Injectable({
  providedIn: 'root'
})
export class LayerGroupsService {
  private readonly settingsService = inject(SettingsService);
  private readonly layerGroupStates = signal<Map<string, LayerGroupState>>(new Map());

  constructor() {
    this.initializeStates();

    effect(() => {
      const states = this.layerGroupStates();
      this.settingsService.saveLayerGroupStates(states);
    });
  }

  private initializeStates(): void {
    const savedStates = this.settingsService.loadLayerGroupStates();

    if (savedStates && savedStates.size > 0) {
      const finalStates = new Map<string, LayerGroupState>();

      LAYER_GROUP_CONFIGS.forEach(config => {
        const savedState = savedStates.get(config.id);
        finalStates.set(config.id, savedState || {
          groupId: config.id,
          visible: config.defaultVisible,
          opacity: 1.0
        });
      });

      this.layerGroupStates.set(finalStates);
    } else {
      this.initializeDefaultStates();
    }
  }

  private initializeDefaultStates(): void {
    const initialStates = new Map<string, LayerGroupState>();

    LAYER_GROUP_CONFIGS.forEach(config => {
      initialStates.set(config.id, {
        groupId: config.id,
        visible: config.defaultVisible,
        opacity: 1.0
      });
    });

    this.layerGroupStates.set(initialStates);
  }

  getLayerGroups(): LayerGroup[] {
    return [...LAYER_GROUP_CONFIGS]
  }

  getLayerGroupStates(): Map<string, LayerGroupState> {
    return this.layerGroupStates();
  }

  isLayerGroupVisible(groupId: string): boolean {
    return this.layerGroupStates().get(groupId)?.visible ?? false;
  }

  toggleLayerGroup(groupId: string): void {
    const currentStates = new Map(this.layerGroupStates());
    const currentState = currentStates.get(groupId);

    console.log('Toggle layer group:', groupId, currentStates);
    if (currentState) {
      const newVisible = !currentState.visible;

      currentStates.set(groupId, {
        ...currentState,
        visible: newVisible
      });
      this.layerGroupStates.set(currentStates);
    }
  }

  setLayerGroupVisibility(groupId: string, visible: boolean): void {
    const currentStates = new Map(this.layerGroupStates());
    const currentState = currentStates.get(groupId);

    if (currentState) {
      currentStates.set(groupId, {
        ...currentState,
        visible
      });
      this.layerGroupStates.set(currentStates);
    }
  }

  setLayerGroupOpacity(groupId: string, opacity: number): void {
    const currentStates = new Map(this.layerGroupStates());
    const currentState = currentStates.get(groupId);

    if (currentState) {
      currentStates.set(groupId, {
        ...currentState,
        opacity: Math.max(0, Math.min(1, opacity))
      });
      this.layerGroupStates.set(currentStates);
    }
  }

  getVisibleStructures(): Set<MapStructure> {
    const visibleStructures = new Set<MapStructure>();
    const states = this.layerGroupStates();

    LAYER_GROUP_CONFIGS.forEach(config => {
      const state = states.get(config.id);
      if (state?.visible) {
        config.structures.forEach(structure => {
          visibleStructures.add(structure);
        });
      }
    });

    return visibleStructures;
  }

  getStructureLayerGroup(structure: MapStructure): LayerGroup | undefined {
    return LAYER_GROUP_CONFIGS.find(config =>
      config.structures.includes(structure)
    );
  }

  showAll(): void {
    const currentStates = new Map(this.layerGroupStates());

    LAYER_GROUP_CONFIGS.forEach(config => {
      const currentState = currentStates.get(config.id);
      if (currentState) {
        currentStates.set(config.id, {
          ...currentState,
          visible: true
        });
      }
    });

    this.layerGroupStates.set(currentStates);
  }

  hideAll(): void {
    const currentStates = new Map(this.layerGroupStates());

    LAYER_GROUP_CONFIGS.forEach(config => {
      const currentState = currentStates.get(config.id);
      if (currentState) {
        currentStates.set(config.id, {
          ...currentState,
          visible: false
        });
      }
    });

    this.layerGroupStates.set(currentStates);
  }

  resetToDefaults(): void {
    this.settingsService.clearLayerGroupSettings();
    this.initializeDefaultStates();
  }

  exportConfiguration(): string {
    const config = Array.from(this.layerGroupStates().entries()).map(([groupId, state]) => ({
      groupId,
      visible: state.visible,
      opacity: state.opacity
    }));

    return JSON.stringify(config, null, 2);
  }

  importConfiguration(configJson: string): boolean {
    try {
      const config = JSON.parse(configJson);
      const newStates = new Map<string, LayerGroupState>();

      LAYER_GROUP_CONFIGS.forEach(groupConfig => {
        newStates.set(groupConfig.id, {
          groupId: groupConfig.id,
          visible: groupConfig.defaultVisible,
          opacity: 1.0
        });
      });

      config.forEach((item: any) => {
        if (item.groupId && typeof item.visible === 'boolean') {
          newStates.set(item.groupId, {
            groupId: item.groupId,
            visible: item.visible,
            opacity: typeof item.opacity === 'number' ? item.opacity : 1.0
          });
        }
      });

      this.layerGroupStates.set(newStates);
      return true;
    } catch (error) {
      console.error('Failed to import layer configuration:', error);
      return false;
    }
  }
}
