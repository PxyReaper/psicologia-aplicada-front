import { ChangeDetectionStrategy, Component, effect, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { SessionRequestDTO, SessionWithPatientDTO } from '../../models/session';

@Component({
  selector: 'app-session-dialog',
  imports: [FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" (click)="close.emit()">
      <div class="w-full max-w-md bg-white rounded-xl shadow-xl p-6" (click)="$event.stopPropagation()">
        <h2 class="text-lg font-bold text-slate-800 mb-4">{{ editingSession() ? 'Editar Sesión' : 'Nueva Sesión' }}</h2>

        <div class="flex flex-col gap-4">
          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-slate-700">Fecha</label>
            <span class="text-sm font-semibold text-slate-800">{{ dialogDate() | date:'fullDate' }}</span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-slate-700">Hora inicio</label>
              <div class="flex items-center gap-1">
                <select [(ngModel)]="startHour"
                        class="flex-1 px-2 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                  @for (h of hourOptions; track h) {
                    <option [value]="h">{{ formatTime(h, 0) }}</option>
                  }
                </select>
                <span class="text-slate-400">:</span>
                <select [(ngModel)]="startMinute"
                        class="flex-1 px-2 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                  @for (m of minuteOptions; track m) {
                    <option [value]="m">{{ pad(m) }}</option>
                  }
                </select>
              </div>
            </div>
            <div class="flex flex-col gap-1.5">
              <label class="text-sm font-medium text-slate-700">Hora fin</label>
              <div class="flex items-center gap-1">
                <select [(ngModel)]="endHour"
                        class="flex-1 px-2 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                  @for (h of hourOptions; track h) {
                    <option [value]="h">{{ formatTime(h, 0) }}</option>
                  }
                </select>
                <span class="text-slate-400">:</span>
                <select [(ngModel)]="endMinute"
                        class="flex-1 px-2 py-2 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
                  @for (m of minuteOptions; track m) {
                    <option [value]="m">{{ pad(m) }}</option>
                  }
                </select>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-slate-700">Paciente</label>
            <select [(ngModel)]="selectedPatientId"
                    class="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary">
              <option [ngValue]="null" disabled>Seleccionar paciente</option>
              @for (p of patientOptions(); track p.value) {
                <option [ngValue]="p.value">{{ p.label }}</option>
              }
            </select>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-slate-700">Observación</label>
            <textarea [(ngModel)]="observatory" rows="2"
                      class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"></textarea>
          </div>

          <div class="flex flex-col gap-1.5">
            <label class="text-sm font-medium text-slate-700">Resumen</label>
            <textarea [(ngModel)]="observatorySummary" rows="2"
                      class="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"></textarea>
          </div>

          <div class="flex items-center gap-2">
            <input type="checkbox" [ngModel]="pay()" (ngModelChange)="pay.set($event)" id="session-pay"
                   class="h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/30 cursor-pointer" />
            <label for="session-pay" class="text-sm font-medium text-slate-700 cursor-pointer select-none">Pagada</label>
          </div>
        </div>

        @if (showDeleteConfirm()) {
          <div class="mt-4 flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200">
            <span class="text-sm text-red-700 flex-1">¿Eliminar esta sesión?</span>
            <button (click)="doDelete()" class="px-3 py-1 rounded text-xs font-medium text-white bg-red-600 hover:bg-red-700 cursor-pointer">Sí</button>
            <button (click)="cancelDelete()" class="px-3 py-1 rounded text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 cursor-pointer">No</button>
          </div>
        }

        <div class="mt-6 flex items-center justify-between">
          <div>
            @if (editingSession() && !showDeleteConfirm()) {
              <button (click)="promptDelete()"
                      class="px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Eliminar
              </button>
            }
          </div>
          <div class="flex items-center gap-2">
            <button (click)="close.emit()"
                    class="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer">
              Cancelar
            </button>
            <button (click)="saveSession()" [disabled]="saving()"
                    class="px-4 py-2 rounded-lg text-sm font-medium text-white bg-primary hover:bg-primary-light disabled:opacity-60 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-2">
              @if (saving()) {
                <svg class="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              }
              Guardar
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SessionDialog {
  show = input(false);
  editingSession = input<SessionWithPatientDTO | null>(null);
  patientOptions = input<{ label: string; value: number }[]>([]);
  saving = input(false);
  newSessionPreset = input<{
    date: Date;
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  } | null>(null);

  save = output<SessionRequestDTO>();
  delete = output<void>();
  close = output<void>();

  readonly hourOptions = Array.from({ length: 24 }, (_, i) => i);
  readonly minuteOptions = [0, 15, 30, 45];

  dialogDate = signal(new Date());
  startHour = signal(9);
  startMinute = signal(0);
  endHour = signal(10);
  endMinute = signal(0);
  selectedPatientId = signal<number | null>(null);
  observatory = signal('');
  observatorySummary = signal('');
  pay = signal(false);
  showDeleteConfirm = signal(false);

  constructor() {
    effect(() => {
      if (this.show()) {
        const edit = this.editingSession();
        if (edit) {
          const start = new Date(edit.dateSession);
          const end = new Date(edit.dateSessionEnd);
          this.dialogDate.set(start);
          this.startHour.set(start.getHours());
          this.startMinute.set(start.getMinutes());
          this.endHour.set(end.getHours());
          this.endMinute.set(end.getMinutes());
          this.selectedPatientId.set(edit.patientId);
          this.observatory.set(edit.observation);
          this.observatorySummary.set(edit.observationSummary);
          this.pay.set(edit.pay);
        } else {
          const preset = this.newSessionPreset();
          if (preset) {
            this.dialogDate.set(preset.date);
            this.startHour.set(preset.startHour);
            this.startMinute.set(preset.startMinute);
            this.endHour.set(preset.endHour);
            this.endMinute.set(preset.endMinute);
          }
        }
        this.showDeleteConfirm.set(false);
      }
    });
  }

  formatTime(h: number, m: number): string {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  private toSpanishLocalISO(d: Date): string {
    const fmt = new Intl.DateTimeFormat('es-ES', {
      timeZone: 'Europe/Madrid',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
    const parts = fmt.formatToParts(d);
    const m = new Map(parts.filter(p => p.type !== 'literal').map(p => [p.type, p.value]));
    return `${m.get('year')}-${m.get('month')}-${m.get('day')}T${m.get('hour')}:${m.get('minute')}:${m.get('second')}`;
  }

  saveSession(): void {
    if (!this.selectedPatientId()) return;
    const d = this.dialogDate();
    const dateSession = new Date(d.getFullYear(), d.getMonth(), d.getDate(), this.startHour(), this.startMinute());
    const dateSessionEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate(), this.endHour(), this.endMinute());
    const dto: SessionRequestDTO = {
      dateSession: this.toSpanishLocalISO(dateSession),
      dateSessionEnd: this.toSpanishLocalISO(dateSessionEnd),
      observatory: this.observatory(),
      observatorySummary: this.observatorySummary(),
      idPatient: this.selectedPatientId()!,
      pay: this.pay(),
    };
    this.save.emit(dto);
  }

  promptDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  doDelete(): void {
    this.delete.emit();
  }
}
