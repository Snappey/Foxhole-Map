import { Component, inject, signal, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { DrawingService } from '../../services/drawing.service';
import {TextareaModule} from 'primeng/textarea';

@Component({
  selector: 'app-import-dialog',
  imports: [CommonModule, FormsModule, DialogModule, ButtonModule, TextareaModule],
  template: `
    <p-dialog
      header="Import Drawings"
      [modal]="true"
      [visible]="visible()"
      (onHide)="onClose()"
      [style]="{width: '50vw', maxWidth: '600px', height: 'auto', maxHeight: '60vh', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)'}"
      [draggable]="false"
      [resizable]="false"
      [closable]="false"
      [closeOnEscape]="true"
      position="center"
      appendTo="body">

      <div class="space-y-4">
        <div>
          <label for="jsonInput" class="block text-sm font-medium text-slate-200 mb-2">
            Paste JSON:
          </label>
          <textarea
            id="jsonInput"
            pTextarea
            [(ngModel)]="geoJsonText"
            placeholder="Paste your JSON here..."
            rows="12"
            class="w-full resize-none bg-slate-800 border border-slate-600 rounded-md text-slate-200 p-3"
            [style]="{fontFamily: 'monospace', fontSize: '12px', height: '40vh', minHeight: '250px', maxHeight: '400px'}">
          </textarea>
        </div>

        <div *ngIf="errorMessage()" class="text-red-400 text-sm">
          {{ errorMessage() }}
        </div>
      </div>

      <ng-template pTemplate="footer">
        <div class="flex gap-2 justify-end">
          <button
            pButton
            class="p-button-text p-button-danger"
            (click)="onClose()">
            Cancel
          </button>
          <button
            pButton
            class="p-button-success"
            [disabled]="!geoJsonText.trim()"
            (click)="importDrawings()">
            Import
          </button>
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class ImportDialogComponent {
  @Output() readonly closeDialog = new EventEmitter<void>();

  private readonly drawingService = inject(DrawingService);

  readonly visible = signal<boolean>(false);
  readonly errorMessage = signal<string>('');
  geoJsonText = '';

  show(): void {
    this.visible.set(true);
    this.geoJsonText = '';
    this.errorMessage.set('');
  }

  onClose(): void {
    this.visible.set(false);
    this.geoJsonText = '';
    this.errorMessage.set('');
    this.closeDialog.emit();
  }

  importDrawings(): void {
    if (!this.geoJsonText.trim()) {
      this.errorMessage.set('Please paste GeoJSON data');
      return;
    }

    const success = this.drawingService.loadFromGeoJSON(this.geoJsonText);

    if (success) {
      this.onClose();
    } else {
      this.errorMessage.set('Invalid GeoJSON format. Please check your data and try again.');
    }
  }
}
