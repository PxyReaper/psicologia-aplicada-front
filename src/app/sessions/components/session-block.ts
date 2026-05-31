import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { WeeklySession } from '../../models/session';

const HOUR_HEIGHT = 60;
const START_HOUR = 0;

@Component({
  selector: 'app-session-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'class': 'absolute left-0.5 right-0.5 bg-primary/10 border-l-2 border-primary rounded cursor-pointer overflow-hidden z-10 text-xs flex flex-col justify-start px-1.5 py-1 hover:bg-primary/20 transition-colors select-none',
    '[class.opacity-30]': 'isDragging()',
    '[style]': 'sessionStyle()',
    '(mousedown)': 'onDragStart($event)',
    '(click)': 'onClick($event)',
  },
  template: `
    <span class="font-semibold text-primary truncate leading-tight">{{ weeklySession().session.patientName }} {{ weeklySession().session.patientSurname }}</span>
    <span class="text-slate-500 leading-tight">{{ formatTime(weeklySession().startHour, weeklySession().startMinute) }} - {{ formatTime(weeklySession().endHour, weeklySession().endMinute) }}</span>
  `,
})
export class SessionBlock {
  weeklySession = input.required<WeeklySession>();
  isDragging = input(false);

  sessionClick = output<void>();
  dragStart = output<MouseEvent>();

  sessionStyle = computed(() => {
    const ws = this.weeklySession();
    const topPx = (ws.startHour - START_HOUR) * HOUR_HEIGHT + (ws.startMinute / 60) * HOUR_HEIGHT;
    const heightPx = Math.max(ws.durationMinutes / 60 * HOUR_HEIGHT, 25);
    return {
      top: `${topPx}px`,
      height: `${heightPx}px`,
    };
  });

  formatTime(h: number, m: number): string {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  onDragStart(event: MouseEvent): void {
    this.dragStart.emit(event);
  }

  onClick(event: MouseEvent): void {
    this.sessionClick.emit();
    event.stopPropagation();
  }
}
