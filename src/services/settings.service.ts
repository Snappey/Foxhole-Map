import {effect, EffectRef, inject, Injectable, model, ModelSignal, signal, Signal, WritableSignal} from '@angular/core';
import {Shard, WarApiService} from './war-api.service';
import {filter, map, Observable} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {LayerGroupState} from './layer-groups.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private route: ActivatedRoute = inject(ActivatedRoute);

  public selectedShard: WritableSignal<Shard> = signal<Shard>((() => {
    const params = this.route.snapshot.queryParams;
    const hasShardQueryParam = "shard" in params && !!params["shard"];
    if (hasShardQueryParam) {
      return params["shard"] as Shard;
    }
    return localStorage.getItem('selectedShard') as Shard;
  })());

  public saveSelectedShard(shard: Shard) {
    localStorage.setItem('selectedShard', shard);
    this.selectedShard.set(shard);
  }

  public saveLayerGroupStates(states: Map<string, LayerGroupState>): void {
    const statesArray = Array.from(states.entries()).map(([groupId, state]) => ({
      groupId,
      visible: state.visible,
      opacity: state.opacity
    }));
    localStorage.setItem('layerGroupStates', JSON.stringify(statesArray));
  }

  public loadLayerGroupStates(): Map<string, LayerGroupState> | null {
    try {
      const stored = localStorage.getItem('layerGroupStates');
      if (!stored) return null;
      
      const statesArray = JSON.parse(stored);
      const statesMap = new Map<string, LayerGroupState>();
      
      statesArray.forEach((item: any) => {
        if (item.groupId && typeof item.visible === 'boolean') {
          statesMap.set(item.groupId, {
            groupId: item.groupId,
            visible: item.visible,
            opacity: typeof item.opacity === 'number' ? item.opacity : 1.0
          });
        }
      });
      
      return statesMap;
    } catch (error) {
      console.error('Failed to load layer group states:', error);
      return null;
    }
  }

  public clearLayerGroupSettings(): void {
    localStorage.removeItem('layerGroupStates');
  }
}
