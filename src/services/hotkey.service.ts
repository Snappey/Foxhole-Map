import { Injectable, OnDestroy } from '@angular/core';

export interface HotkeyConfig {
  key: string;
  description: string;
  action: () => void;
  modifiers?: {
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
  };
  preventDefault?: boolean;
  stopPropagation?: boolean;
  context?: string;
  enabled?: boolean;
}

export interface RegisteredHotkey extends HotkeyConfig {
  id: string;
  keyCombo: string;
}

@Injectable({
  providedIn: 'root'
})
export class HotkeyService implements OnDestroy {
  private hotkeys = new Map<string, RegisteredHotkey>();
  private contexts = new Set<string>();
  private activeContexts = new Set<string>(['global']);
  private globalListener?: (event: KeyboardEvent) => void;

  constructor() {
    this.initializeGlobalListener();
  }

  private initializeGlobalListener(): void {
    this.globalListener = (event: KeyboardEvent) => {
      this.handleKeyEvent(event);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.globalListener);
    }
  }

  register(config: HotkeyConfig): string {
    const id = this.generateId();
    const keyCombo = this.buildKeyCombo(config.key, config.modifiers);

    const registeredHotkey: RegisteredHotkey = {
      ...config,
      id,
      keyCombo,
      context: config.context || 'global',
      enabled: config.enabled !== false,
      preventDefault: config.preventDefault !== false,
      stopPropagation: config.stopPropagation !== false
    };

    this.hotkeys.set(id, registeredHotkey);
    if (registeredHotkey.context) {
      this.contexts.add(registeredHotkey.context);
    }

    return id;
  }

  unregister(id: string): boolean {
    return this.hotkeys.delete(id);
  }

  unregisterByContext(context: string): number {
    let count = 0;
    for (const [id, hotkey] of this.hotkeys.entries()) {
      if (hotkey.context === context) {
        this.hotkeys.delete(id);
        count++;
      }
    }
    return count;
  }

  enable(id: string): boolean {
    const hotkey = this.hotkeys.get(id);
    if (hotkey) {
      hotkey.enabled = true;
      return true;
    }
    return false;
  }

  disable(id: string): boolean {
    const hotkey = this.hotkeys.get(id);
    if (hotkey) {
      hotkey.enabled = false;
      return true;
    }
    return false;
  }

  enableContext(context: string): void {
    this.activeContexts.add(context);
  }

  disableContext(context: string): void {
    this.activeContexts.delete(context);
  }

  setActiveContexts(contexts: string[]): void {
    this.activeContexts.clear();
    contexts.forEach(context => this.activeContexts.add(context));
    if (!this.activeContexts.has('global')) {
      this.activeContexts.add('global');
    }
  }

  storedContexts: Set<string> = new Set();
  storeContexts(): void {
    this.storedContexts = new Set(this.activeContexts);
    this.setActiveContexts([]);
  }

  restoreContexts(): void {
    this.setActiveContexts(Array.from(this.storedContexts));
    this.storedContexts.clear();
  }

  getRegisteredHotkeys(context?: string): RegisteredHotkey[] {
    const hotkeys = Array.from(this.hotkeys.values());
    return context
      ? hotkeys.filter(h => h.context === context)
      : hotkeys;
  }

  getHotkeysByContext(): Record<string, RegisteredHotkey[]> {
    const result: Record<string, RegisteredHotkey[]> = {};

    for (const context of this.contexts) {
      result[context] = this.getRegisteredHotkeys(context);
    }

    return result;
  }

  getActiveContexts(): string[] {
    return Array.from(this.activeContexts);
  }

  private handleKeyEvent(event: KeyboardEvent): void {
    const keyCombo = this.buildKeyCombo(event.key, {
      ctrl: event.ctrlKey,
      alt: event.altKey,
      shift: event.shiftKey,
      meta: event.metaKey
    });

    for (const hotkey of this.hotkeys.values()) {
      if (this.shouldTriggerHotkey(hotkey, keyCombo)) {
        if (hotkey.preventDefault) {
          event.preventDefault();
        }
        if (hotkey.stopPropagation) {
          event.stopPropagation();
        }

        try {
          hotkey.action();
        } catch (error) {
          console.error('Error executing hotkey action:', error);
        }
        break;
      }
    }
  }

  private shouldTriggerHotkey(hotkey: RegisteredHotkey, pressedCombo: string): boolean {
    if (hotkey.context && !this.activeContexts.has(hotkey.context)) {
      return false;
    }

    if (!hotkey.enabled) {
      return false;
    }

    return hotkey.keyCombo === pressedCombo
  }

  private buildKeyCombo(key: string, modifiers?: HotkeyConfig['modifiers']): string {
    const parts: string[] = [];

    if (modifiers?.ctrl) parts.push('Ctrl');
    if (modifiers?.alt) parts.push('Alt');
    if (modifiers?.shift) parts.push('Shift');
    if (modifiers?.meta) parts.push('Meta');

    parts.push(this.normalizeKey(key));

    return parts.join('+');
  }

  private normalizeKey(key: string): string {
    const keyMap: Record<string, string> = {
      ' ': 'Space',
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right',
      'Escape': 'Esc'
    };

    return keyMap[key] || key.toLowerCase();
  }

  private generateId(): string {
    return `hotkey_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  ngOnDestroy(): void {
    if (this.globalListener && typeof window !== 'undefined') {
      window.removeEventListener('keydown', this.globalListener);
    }
    this.hotkeys.clear();
  }

  // Utility methods for common key combinations
  registerEscape(action: () => void, context = 'global'): string {
    return this.register({
      key: 'Escape',
      description: 'Close/Cancel',
      action,
      context
    });
  }

  registerToggle(key: string, description: string, action: () => void, context = 'global'): string {
    return this.register({
      key,
      description,
      action,
      context
    });
  }

  registerWithCtrl(key: string, description: string, action: () => void, context = 'global'): string {
    return this.register({
      key,
      description,
      action,
      modifiers: { ctrl: true },
      context
    });
  }

  registerWithShift(key: string, description: string, action: () => void, context = 'global'): string {
    return this.register({
      key,
      description,
      action,
      modifiers: { shift: true },
      context
    });
  }
}
