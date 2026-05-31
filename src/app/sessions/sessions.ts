import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SessionsService } from './sessions.service';
import { SessionRequestDTO, SessionWithPatientDTO, WeeklySession } from '../models/session';
import { PatientsService } from '../patients/patients.service';
import { PatientObservationsDTO } from '../models/patient';
import { ToastService } from '../shared/toast.service';
import { ToastContainer } from '../shared/toast-container';
import { SessionCalendar } from './components/session-calendar';
import { SessionWeekGrid } from './components/session-week-grid';
import { SessionDialog } from './components/session-dialog';

@Component({
  selector: 'app-sessions',
  imports: [ToastContainer, SessionCalendar, SessionWeekGrid, SessionDialog],
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
  saving = signal(false);

  sessionDialogPreset = signal<{
    date: Date;
    startHour: number;
    startMinute: number;
    endHour: number;
    endMinute: number;
  } | null>(null);

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

  constructor() {
    this.loadWeek();
  }

  onDateSelect(d: Date): void {
    this.selectedDate.set(d);
    this.loadWeek();
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

  private loadAllPatientCache(): void {
    const y = new Date().getFullYear();
    this.patientsService.getActivePatients(`${y}-01-01`, `${y}-12-31`, 0, 200).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: res => this.allPatients.set(res.content ?? res),
    });
  }

  handleCreateSession(event: { dayIdx: number; startHour: number; endHour: number }): void {
    this.sessionDialogPreset.set({
      date: this.weekDays()[event.dayIdx],
      startHour: event.startHour,
      startMinute: 0,
      endHour: event.endHour,
      endMinute: 0,
    });
    this.editingSession.set(null);
    this.showDialog.set(true);
  }

  handleEditSession(ws: WeeklySession): void {
    this.sessionDialogPreset.set(null);
    this.editingSession.set(ws.session);
    this.showDialog.set(true);
  }

  handleSaveSession(dto: SessionRequestDTO): void {
    this.saving.set(true);
    const request = this.editingSession()
      ? this.sessionsService.update(this.editingSession()!.id, dto)
      : this.sessionsService.create(dto);
    request.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success('Sesión guardada');
        this.showDialog.set(false);
        this.sessionDialogPreset.set(null);
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

  handleDelete(): void {
    const s = this.editingSession();
    if (!s) return;
    this.sessionsService.delete(s.id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success('Sesión eliminada');
        this.showDialog.set(false);
        this.sessionDialogPreset.set(null);
        this.weeklySessions.set([]);
        this.loadWeek();
      },
      error: () => this.toast.error('Error al eliminar la sesión'),
    });
  }

  handleMoveSession(event: { session: SessionWithPatientDTO; dayIdx: number; hour: number; minute: number }): void {
    const weekStart = this.getWeekStart(this.selectedDate());
    const targetDate = new Date(weekStart);
    targetDate.setDate(targetDate.getDate() + event.dayIdx);
    targetDate.setHours(event.hour, event.minute, 0, 0);

    const originalStart = new Date(event.session.dateSession);
    const originalEnd = new Date(event.session.dateSessionEnd);
    const durationMs = originalEnd.getTime() - originalStart.getTime();
    const targetEnd = new Date(targetDate.getTime() + durationMs);

    const dto: SessionRequestDTO = {
      dateSession: this.toSpanishLocalISO(targetDate),
      dateSessionEnd: this.toSpanishLocalISO(targetEnd),
      observatory: event.session.observation,
      observatorySummary: event.session.observationSummary,
      idPatient: event.session.patientId,
      pay: event.session.pay,
    };

    this.saving.set(true);
    this.sessionsService.update(event.session.id, dto).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Sesión reubicada');
        this.weeklySessions.set([]);
        this.loadWeek();
      },
      error: () => {
        this.saving.set(false);
        this.toast.error('Error al reubicar la sesión');
      },
    });
  }

  handleDialogClose(): void {
    this.showDialog.set(false);
    this.sessionDialogPreset.set(null);
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
}
