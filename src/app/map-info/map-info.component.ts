import {Component, computed, inject, input, Input, model, Signal} from '@angular/core';
import {Select, SelectChangeEvent} from 'primeng/select';
import {Shard, WarApiService} from '../../services/war-api.service';
import {SettingsService} from '../../services/settings.service';
import {FormsModule} from '@angular/forms';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {switchMap} from 'rxjs';

@Component({
  selector: 'app-map-info',
  imports: [
    Select,
    FormsModule
  ],
  templateUrl: './map-info.component.html',
  styleUrl: './map-info.component.css'
})
export class MapInfoComponent {
  private readonly settingsService = inject(SettingsService);
  private readonly warApiService = inject(WarApiService);

  public selectableShards: string[] = [WarApiService.ABLE_SHARD, WarApiService.BAKER_SHARD, WarApiService.CHARLIE_SHARD];

  shard: Signal<Shard> = this.settingsService.selectedShard;
  warData = toSignal(
    toObservable(this.shard).pipe(
      switchMap(shard => this.warApiService.getCurrentWarData(shard))
    )
  );
  isActiveWar = computed(() => this.warData() !== undefined);

  getTimeSince(timestamp: number): string {
    const now = new Date();
    const diff = now.getTime() - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) {
      return `${days} days`;
    }
    if (hours > 0) {
      return `${hours} hours`;
    }
    if (minutes > 0) {
      return `${minutes} minutes`;
    }
    return `${seconds} seconds`;
  }

  saveSelectedShard($event: SelectChangeEvent) {
    this.settingsService.saveSelectedShard($event.value as Shard);
  }
}
