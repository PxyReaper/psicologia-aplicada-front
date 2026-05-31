import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

@Component({
  selector: 'app-session-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="select-none">
      <div class="flex items-center justify-between mb-3">
        <button (click)="prevMonth()" class="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
        </button>
        <span class="text-sm font-semibold text-slate-700">{{ months[calendarMonth()] }} {{ calendarYear() }}</span>
        <button (click)="nextMonth()" class="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
        </button>
      </div>
      <div class="grid grid-cols-7 gap-0 text-center mb-1">
        @for (d of days; track d) {
          <span class="text-xs text-slate-400 py-1">{{ d }}</span>
        }
      </div>
      <div class="grid grid-cols-7 gap-0 text-center">
        @for (day of calendarDays(); track $index) {
          @if (day !== null) {
            @let dt = getCalendarDate(day);
            @let today = isToday(dt);
            @let sel = isSelected(dt);
            <button (click)="pickDate(day)"
                    [class]="'text-sm py-1.5 rounded-lg transition-colors cursor-pointer ' + (sel ? 'bg-primary text-white font-medium' : today ? 'bg-primary/10 text-primary font-medium' : 'text-slate-600 hover:bg-slate-100')">
              {{ day }}
            </button>
          } @else {
            <span></span>
          }
        }
      </div>
    </div>

    <div class="mt-4">
      <button (click)="goToToday()"
              class="w-full px-3 py-2 rounded-lg text-sm font-medium text-primary border border-primary/30 hover:bg-primary/5 transition-colors cursor-pointer flex items-center justify-center gap-1.5">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Hoy
      </button>
    </div>
  `,
})
export class SessionCalendar {
  selectedDate = input.required<Date>();

  selectDate = output<Date>();

  readonly days = DAYS;
  readonly months = MONTHS;

  calendarMonth = signal(new Date().getMonth());
  calendarYear = signal(new Date().getFullYear());

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

  isToday(d: Date): boolean {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  }

  isSelected(d: Date): boolean {
    const s = this.selectedDate();
    return d.getDate() === s.getDate() && d.getMonth() === s.getMonth() && d.getFullYear() === s.getFullYear();
  }

  getCalendarDate(day: number): Date {
    return new Date(this.calendarYear(), this.calendarMonth(), day);
  }

  pickDate(day: number): void {
    const d = this.getCalendarDate(day);
    this.calendarMonth.set(d.getMonth());
    this.calendarYear.set(d.getFullYear());
    this.selectDate.emit(d);
  }

  goToToday(): void {
    const today = new Date();
    this.calendarMonth.set(today.getMonth());
    this.calendarYear.set(today.getFullYear());
    this.selectDate.emit(today);
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
}
