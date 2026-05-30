import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { fromEvent } from 'rxjs';
import { SessionsService } from './sessions.service';
import { SessionRequestDTO, SessionWithPatientDTO, WeeklySession } from '../models/session';
import { PatientsService } from '../patients/patients.service';
import { PatientObservationsDTO } from '../models/patient';
import { ToastService } from '../shared/toast.service';
import { ToastContainer } from '../shared/toast-container';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const HOUR_HEIGHT = 60;
const START_HOUR = 0;
const END_HOUR = 23;

@Component({
  selector: 'app-sessions',
  imports: [FormsModule, DatePipe, ToastContainer],
  templateUrl: './sessions.html',
  styleUrl: './sessions.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionsComponent {
  private sessionsService = inject(SessionsService);
  private patientsService = inject(PatientsService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  selectedDate = signal<Date>(new Date());
  weekDays = signal<Date[]>([]);
  weeklySessions = signal<WeeklySession[]>([]);
  allPatients = signal<PatientObservationsDTO[]>([]);
  loading = signal(false);

  showDialog = signal(false);
  editingSession = signal<SessionWithPatientDTO | null>(null);
  dialogDate = signal<Date>(new Date());
  startHour = signal(9);
  startMinute = signal(0);
  endHour = signal(10);
  endMinute = signal(0);
  selectedPatientId = signal<number | null>(null);
  observatory = signal('');
  observatorySummary = signal('');
  pay = signal(false);
  saving = signal(false);
  showDeleteConfirm = signal(false);

  dragState = signal<{ dayIdx: number; startHour: number; endHour: number } | null>(null);

  sessionDragState = signal<{
    session: SessionWithPatientDTO;
    originalDayIdx: number;
    targetDayIdx: number;
    targetHour: number;
    targetMinute: number;
  } | null>(null);

  sessionDragMoved = false;

  draggedSessionId = computed(() => this.sessionDragState()?.session.id ?? 0);

  // Calendar state
  calendarMonth = signal(new Date().getMonth());
  calendarYear = signal(new Date().getFullYear());

  readonly days = DAYS;
  readonly months = MONTHS;
  readonly hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);
  readonly hourOptions = Array.from({ length: 24 }, (_, i) => i);
  readonly minuteOptions = [0, 15, 30, 45];
  readonly hourHeight = HOUR_HEIGHT;

  private loadGen = 0;

  sessionsByDay = computed(() => {
    const map = new Map<number, WeeklySession[]>();
    for (const ws of this.weeklySessions()) {
      const list = map.get(ws.dayIndex);
      if (list) {
        list.push(ws);
      } else {
        map.set(ws.dayIndex, [ws]);
      }
    }
    return map;
  });

  patientOptions = computed(() => {
    return this.allPatients().map(p => ({
      label: `${p.patient.name} ${p.patient.surname}`,
      value: p.patient.id,
    }));
  });

  calendarDays = computed(() => {
    const year = this.calendarYear();
    const month = this.calendarMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: (number | null)[] = [];
    const sunIndex = firstDay === 0 ? 6 : firstDay - 1;
    for (let i = 0; i < sunIndex; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    return result;
  });

  constructor() {
    this.loadWeek();
    fromEvent<MouseEvent>(document, 'mouseup').pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.endDrag());
  }

  goToToday(): void {
    this.onDateSelect(new Date());
  }

  isToday(d: Date): boolean {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }

  isSelected(d: Date): boolean {
    const s = this.selectedDate();
    return d.getDate() === s.getDate() && d.getMonth() === s.getMonth() && d.getFullYear() === s.getFullYear();
  }

  onDateSelect(d: Date): void {
    this.selectedDate.set(d);
    this.calendarMonth.set(d.getMonth());
    this.calendarYear.set(d.getFullYear());
    this.loadWeek();
  }

  prevMonth(): void {
    if (this.calendarMonth() === 0) {
      this.calendarMonth.set(11);
      this.calendarYear.update(y => y - 1);
    } else {
      this.calendarMonth.update(m => m - 1);
    }
  }

  nextMonth(): void {
    if (this.calendarMonth() === 11) {
      this.calendarMonth.set(0);
      this.calendarYear.update(y => y + 1);
    } else {
      this.calendarMonth.update(m => m + 1);
    }
  }

  pickDate(day: number): void {
    const d = new Date(this.calendarYear(), this.calendarMonth(), day);
    this.onDateSelect(d);
  }

  getCalendarDate(day: number): Date {
    return new Date(this.calendarYear(), this.calendarMonth(), day);
  }

  pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  loadWeek(): void {
    const gen = ++this.loadGen;
    const start = this.getWeekStart(this.selectedDate());
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    this.weekDays.set(days);
    this.loading.set(true);
    const loaded: WeeklySession[] = [];
    this.loadAllPatientCache();

    const dateStr = (dt: Date) => {
      const y = dt.getFullYear();
      const m = String(dt.getMonth() + 1).padStart(2, '0');
      const day = String(dt.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    let completed = 0;
    for (let dayIdx = 0; dayIdx < days.length; dayIdx++) {
      const day = days[dayIdx];
      this.sessionsService.getByDate(dateStr(day)).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: sessions => {
          if (gen !== this.loadGen) return;
          for (const s of sessions) {
            const start = new Date(s.dateSession);
            const end = new Date(s.dateSessionEnd);
            const diffMs = end.getTime() - start.getTime();
            const diffMin = Math.round(diffMs / 60000);
            loaded.push({
              session: s,
              startHour: start.getHours(),
              startMinute: start.getMinutes(),
              endHour: end.getHours(),
              endMinute: end.getMinutes(),
              dayIndex: dayIdx,
              durationMinutes: Math.max(diffMin, 30),
            });
          }
          completed++;
          if (completed === days.length) {
            this.weeklySessions.set(loaded);
            this.loading.set(false);
          }
        },
        error: () => {
          if (gen !== this.loadGen) return;
          completed++;
          if (completed === days.length) {
            this.weeklySessions.set(loaded);
            this.loading.set(false);
          }
        },
      });
    }
  }

  getWeekStart(d: Date): Date {
    const date = new Date(d);
    const day = date.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    date.setDate(date.getDate() + diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  loadAllPatientCache(): void {
    const y = new Date().getFullYear();
    this.patientsService.getActivePatients(`${y}-01-01`, `${y}-12-31`, 0, 200).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => this.allPatients.set(res.content ?? res),
    });
  }

  getWeekDates(): string[] {
    return this.weekDays().map(d => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${day}/${m}/${y}`;
    });
  }

  onSessionClick(s: WeeklySession): void {
    if (this.sessionDragMoved) {
      this.sessionDragMoved = false;
      return;
    }
    this.editingSession.set(s.session);
    this.showDeleteConfirm.set(false);
    const start = new Date(s.session.dateSession);
    const end = new Date(s.session.dateSessionEnd);
    this.dialogDate.set(start);
    this.startHour.set(start.getHours());
    this.startMinute.set(start.getMinutes());
    this.endHour.set(end.getHours());
    this.endMinute.set(end.getMinutes());
    this.selectedPatientId.set(s.session.patientId);
    this.observatory.set(s.session.observation);
    this.observatorySummary.set(s.session.observationSummary);
    this.pay.set(s.session.pay);
    this.showDialog.set(true);
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
    if (!this.selectedPatientId()) {
      this.toast.error('Selecciona un paciente');
      return;
    }
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
    this.saving.set(true);
    const request = this.editingSession()
      ? this.sessionsService.update(this.editingSession()!.id, dto)
      : this.sessionsService.create(dto);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success('Sesión guardada');
        this.showDialog.set(false);
        this.weeklySessions.set([]);
        this.loadWeek();
        this.saving.set(false);
      },
      error: () => {
        this.toast.error('No se pudo guardar la sesión');
        this.saving.set(false);
      },
    });
  }

  promptDelete(): void {
    this.showDeleteConfirm.set(true);
  }

  cancelDelete(): void {
    this.showDeleteConfirm.set(false);
  }

  doDelete(): void {
    const s = this.editingSession();
    if (!s) return;
    this.showDeleteConfirm.set(false);
    this.sessionsService.delete(s.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success('Sesión eliminada');
        this.showDialog.set(false);
        this.weeklySessions.set([]);
        this.loadWeek();
      },
      error: () => this.toast.error('Error al eliminar la sesión'),
    });
  }

  formatTime(h: number, m: number): string {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  sessionStyle(ws: WeeklySession): Record<string, string> {
    const topPx = (ws.startHour - START_HOUR) * HOUR_HEIGHT + (ws.startMinute / 60) * HOUR_HEIGHT;
    const heightPx = Math.max(ws.durationMinutes / 60 * HOUR_HEIGHT, 25);
    return {
      top: `${topPx}px`,
      height: `${heightPx}px`,
    };
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

  sessionDragOverlayStyle = computed(() => {
    const sds = this.sessionDragState();
    if (!sds) return { display: 'none' };
    const start = new Date(sds.session.dateSession);
    const end = new Date(sds.session.dateSessionEnd);
    const durationMs = end.getTime() - start.getTime();
    const durationMin = Math.round(durationMs / 60000);
    const heightPx = Math.max(durationMin / 60 * HOUR_HEIGHT, 25);
    const topPx = (sds.targetHour + sds.targetMinute / 60 - START_HOUR) * HOUR_HEIGHT;
    return { top: `${topPx}px`, height: `${heightPx}px` };
  });

  startDrag(dayIdx: number, hour: number): void {
    this.dragState.set({ dayIdx, startHour: hour, endHour: hour });
  }

  startSessionDrag(ws: WeeklySession, event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.sessionDragMoved = false;
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
      if (this.sessionDragMoved) this.moveSession(sds);
      return;
    }
    const ds = this.dragState();
    if (!ds) return;
    this.dragState.set(null);
    let startHour = Math.min(ds.startHour, ds.endHour);
    let endHour = Math.max(ds.startHour, ds.endHour);
    if (startHour === endHour) endHour = Math.min(startHour + 1, 23);
    this.openNewSessionDialog(ds.dayIdx, startHour, endHour);
  }

  private moveSession(sds: Exclude<ReturnType<typeof this.sessionDragState>, null>): void {
    const weekStart = this.getWeekStart(this.selectedDate());
    const targetDate = new Date(weekStart);
    targetDate.setDate(targetDate.getDate() + sds.targetDayIdx);
    targetDate.setHours(sds.targetHour, sds.targetMinute, 0, 0);

    const originalStart = new Date(sds.session.dateSession);
    const originalEnd = new Date(sds.session.dateSessionEnd);
    const durationMs = originalEnd.getTime() - originalStart.getTime();
    const targetEnd = new Date(targetDate.getTime() + durationMs);

    const dto: SessionRequestDTO = {
      dateSession: this.toSpanishLocalISO(targetDate),
      dateSessionEnd: this.toSpanishLocalISO(targetEnd),
      observatory: sds.session.observation,
      observatorySummary: sds.session.observationSummary,
      idPatient: sds.session.patientId,
      pay: sds.session.pay,
    };

    this.saving.set(true);
    this.sessionsService.update(sds.session.id, dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Sesión reubicada');
        this.sessionDragMoved = false;
        this.weeklySessions.set([]);
        this.loadWeek();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Error al reubicar la sesión');
      },
    });
  }

  private openNewSessionDialog(dayIdx: number, startHour: number, endHourVal: number): void {
    this.editingSession.set(null);
    this.showDeleteConfirm.set(false);
    this.dialogDate.set(this.weekDays()[dayIdx]);
    this.startHour.set(startHour);
    this.startMinute.set(0);
    this.endHour.set(endHourVal);
    this.endMinute.set(0);
    this.selectedPatientId.set(null);
    this.observatory.set('');
    this.observatorySummary.set('');
    this.pay.set(false);
    this.showDialog.set(true);
  }
}
