import { ChangeDetectionStrategy, Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { fromEvent } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SessionWithPatientDTO, WeeklySession } from '../../models/session';
import { SessionBlock } from './session-block';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const HOUR_HEIGHT = 60;
const START_HOUR = 0;
const END_HOUR = 23;

@Component({
  selector: 'app-session-week-grid',
  imports: [SessionBlock],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block h-full' },
  template: `
    <div class="flex flex-col h-full">
      <!-- Week Header -->
      <div class="grid grid-cols-[60px_repeat(7,1fr)] border-b-2 border-slate-200 bg-white shrink-0">
        <div></div>
        @for (day of weekDays(); track day.getTime(); let i = $index) {
          <div class="px-2 py-3 text-center border-l border-slate-200">
            <span class="block text-xs text-slate-400">{{ DAYS[i] }}</span>
            <span class="block text-base font-semibold" [class.text-primary]="isToday(day)">{{ day.getDate() }}</span>
          </div>
        }
      </div>

      <!-- Scrollable Grid -->
      <div class="flex-1 overflow-y-auto overflow-x-hidden relative select-none">
        <div class="grid grid-cols-[60px_repeat(7,1fr)] relative">
          <!-- Time labels -->
          <div class="border-r border-slate-200">
            @for (h of hours; track h) {
              <div class="flex items-start justify-center pt-0.5 text-xs text-slate-400 border-b border-slate-200" [style.height.px]="hourHeight">
                {{ formatTime(h, 0) }}
              </div>
            }
          </div>

          <!-- Day columns -->
          @for (day of weekDays(); track day.getTime(); let dayIdx = $index) {
            <div class="relative border-l border-slate-200">
              <!-- Hour slots -->
              @for (h of hours; track h) {
                <div class="border-b border-slate-100 hover:bg-primary/5 cursor-pointer transition-colors" [style.height.px]="hourHeight"
                     (mousedown)="startDrag(dayIdx, h)"
                     (mouseenter)="updateDrag(dayIdx, h)"></div>
              }
              <!-- New-session drag overlay -->
              @if (dragState()?.dayIdx === dayIdx) {
                <div class="absolute left-0 right-0 z-20 bg-accent/20 border-l-2 border-accent rounded pointer-events-none"
                     [style]="dragOverlayStyle()"></div>
              }
              <!-- Session drag overlay -->
              @if (sessionDragState()?.targetDayIdx === dayIdx) {
                <div class="absolute left-0 right-0 z-20 bg-primary/20 border-l-2 border-primary rounded pointer-events-none"
                     [style]="sessionDragOverlayStyle()"></div>
              }
              <!-- Session blocks -->
              @for (ws of sessionsByDay().get(dayIdx) ?? []; track ws.session.id) {
                <app-session-block
                  [weeklySession]="ws"
                  [isDragging]="draggedSessionId() === ws.session.id"
                  (sessionClick)="onSessionClick(ws)"
                  (dragStart)="startSessionDrag(ws, $event)"
                />
              }
            </div>
          }
        </div>

        <!-- Loading overlay -->
        @if (loading()) {
          <div class="absolute inset-0 z-20 flex items-start justify-center pt-20 bg-white/60">
            <div class="flex flex-col items-center gap-2">
              <svg class="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span class="text-sm text-slate-500 font-medium">Cargando sesiones&hellip;</span>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class SessionWeekGrid {
  private destroyRef = inject(DestroyRef);

  weekDays = input.required<Date[]>();
  sessionsByDay = input.required<Map<number, WeeklySession[]>>();
  loading = input(false);

  createSession = output<{ dayIdx: number; startHour: number; endHour: number }>();
  editSession = output<WeeklySession>();
  moveSession = output<{ session: SessionWithPatientDTO; dayIdx: number; hour: number; minute: number }>();

  readonly DAYS = DAYS;
  readonly hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  readonly hourHeight = HOUR_HEIGHT;

  dragState = signal<{ dayIdx: number; startHour: number; endHour: number } | null>(null);

  sessionDragState = signal<{
    session: SessionWithPatientDTO;
    originalDayIdx: number;
    targetDayIdx: number;
    targetHour: number;
    targetMinute: number;
  } | null>(null);

  sessionDragMoved = false;

  draggedSessionId = signal(0);

  constructor() {
    fromEvent<MouseEvent>(document, 'mouseup')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.endDrag());
  }

  isToday(d: Date): boolean {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }

  formatTime(h: number, m: number): string {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  dragOverlayStyle(): Record<string, string> {
    const ds = this.dragState();
    if (!ds) return { display: 'none' };
    const startHour = Math.min(ds.startHour, ds.endHour);
    const endHour = Math.max(ds.startHour, ds.endHour);
    const topPx = (startHour - START_HOUR) * HOUR_HEIGHT;
    const heightPx = (endHour - startHour) * HOUR_HEIGHT;
    return {
      top: `${topPx}px`,
      height: `${heightPx}px`,
    };
  }

  sessionDragOverlayStyle(): Record<string, string> {
    const sds = this.sessionDragState();
    if (!sds) return { display: 'none' };
    const start = new Date(sds.session.dateSession);
    const end = new Date(sds.session.dateSessionEnd);
    const durationMs = end.getTime() - start.getTime();
    const durationMin = Math.round(durationMs / 60000);
    const heightPx = Math.max((durationMin / 60) * HOUR_HEIGHT, 25);
    const topPx = (sds.targetHour + sds.targetMinute / 60 - START_HOUR) * HOUR_HEIGHT;
    return { top: `${topPx}px`, height: `${heightPx}px` };
  }

  startDrag(dayIdx: number, hour: number): void {
    this.dragState.set({ dayIdx, startHour: hour, endHour: hour });
  }

  startSessionDrag(ws: WeeklySession, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.sessionDragMoved = false;
    this.draggedSessionId.set(ws.session.id);
    const start = new Date(ws.session.dateSession);
    this.sessionDragState.set({
      session: ws.session,
      originalDayIdx: ws.dayIndex,
      targetDayIdx: ws.dayIndex,
      targetHour: start.getHours(),
      targetMinute: start.getMinutes(),
    });
  }

  updateDrag(dayIdx: number, hour: number): void {
    const sds = this.sessionDragState();
    if (sds) {
      this.sessionDragMoved = true;
      this.sessionDragState.set({ ...sds, targetDayIdx: dayIdx, targetHour: hour, targetMinute: 0 });
      return;
    }
    const ds = this.dragState();
    if (!ds || ds.dayIdx !== dayIdx) return;
    if (hour === ds.endHour) return;
    this.dragState.set({ ...ds, endHour: hour });
  }

  endDrag(): void {
    const sds = this.sessionDragState();
    if (sds) {
      this.sessionDragState.set(null);
      this.draggedSessionId.set(0);
      if (this.sessionDragMoved) {
        this.moveSession.emit({
          session: sds.session,
          dayIdx: sds.targetDayIdx,
          hour: sds.targetHour,
          minute: sds.targetMinute,
        });
      }
      return;
    }
    const ds = this.dragState();
    if (!ds) return;
    this.dragState.set(null);
    let startHour = Math.min(ds.startHour, ds.endHour);
    let endHour = Math.max(ds.startHour, ds.endHour);
    if (startHour === endHour) endHour = Math.min(startHour + 1, 23);
    this.createSession.emit({ dayIdx: ds.dayIdx, startHour, endHour });
  }

  onSessionClick(ws: WeeklySession): void {
    if (this.sessionDragMoved) {
      this.sessionDragMoved = false;
      return;
    }
    this.editSession.emit(ws);
  }
}
