import {effect, EffectRef, inject, Injectable, model, ModelSignal, signal, Signal, WritableSignal} from '@angular/core';
import {Shard, WarApiService} from './war-api.service';
import {filter, map, Observable} from 'rxjs';
import {ActivatedRoute} from '@angular/router';

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
}
