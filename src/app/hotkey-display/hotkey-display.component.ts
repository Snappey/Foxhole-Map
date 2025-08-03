import { Component, computed, inject, input } from '@angular/core';
import { HotkeyService, RegisteredHotkey } from '../../services/hotkey.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-hotkey-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="hotkey-display bg-slate-800/95 backdrop-blur-xl border border-slate-600/50 rounded-lg p-4 max-w-md">
      <h3 class="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
        <i class="pi pi-keyboard"></i>
        Keyboard Shortcuts
      </h3>

      @if (groupedHotkeys().length === 0) {
        <div class="text-xs text-slate-400 italic">No hotkeys registered</div>
      } @else {
        @for (group of groupedHotkeys(); track group.context) {
          <div class="mb-3 last:mb-0">
            @if (group.context !== 'global') {
              <div class="text-xs font-medium text-slate-300 mb-1 capitalize">{{ group.context }}</div>
            }

            <div class="space-y-1">
              @for (hotkey of group.hotkeys; track hotkey.id) {
                <div class="flex items-center justify-between py-1 gap-2">
                  <span class="text-xs text-slate-300">{{ hotkey.description }}</span>
                  <div class="flex items-center gap-1">
                    @for (key of parseKeyCombo(hotkey.keyCombo); track key; let last = $last) {
                      <kbd class="px-1.5 py-0.5 text-xs font-mono bg-slate-700/50 border border-slate-600/50 rounded text-slate-200">
                        {{ key }}
                      </kbd>
                      @if (!last) {
                        <span class="text-xs text-slate-400">+</span>
                      }
                    }
                  </div>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    .hotkey-display {
      font-family: inherit;
      max-height: 400px;
      overflow-y: auto;
    }

    kbd {
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
      min-width: 20px;
      text-align: center;
    }

    :host {
      display: block;
    }
  `]
})
export class HotkeyDisplayComponent {
  private hotkeyService = inject(HotkeyService);

  context = input<string>();
  showDisabled = input<boolean>(false);

  groupedHotkeys = computed(() => {
    const hotkeys = this.context()
      ? this.hotkeyService.getRegisteredHotkeys(this.context()!)
      : this.hotkeyService.getRegisteredHotkeys();

    const filtered = this.showDisabled()
      ? hotkeys
      : hotkeys.filter(h => h.enabled);

    const groups = this.groupByContext(filtered);
    return this.sortGroups(groups);
  });

  parseKeyCombo(keyCombo: string): string[] {
    return keyCombo.split('+');
  }

  private groupByContext(hotkeys: RegisteredHotkey[]): Array<{context: string, hotkeys: RegisteredHotkey[]}> {
    const groups = new Map<string, RegisteredHotkey[]>();

    hotkeys.forEach(hotkey => {
      const context = hotkey.context;
      if (!context) {
        return;
      }

      if (!groups.has(context)) {
        groups.set(context, []);
      }
      groups.get(context)!.push(hotkey);
    });

    return Array.from(groups.entries()).map(([context, hotkeys]) => ({
      context,
      hotkeys: hotkeys.sort((a, b) => a.description.localeCompare(b.description))
    }));
  }

  private sortGroups(groups: Array<{context: string, hotkeys: RegisteredHotkey[]}>): Array<{context: string, hotkeys: RegisteredHotkey[]}> {
    return groups.sort((a, b) => {
      if (a.context === 'global') return -1;
      if (b.context === 'global') return 1;
      return a.context.localeCompare(b.context);
    });
  }
}
