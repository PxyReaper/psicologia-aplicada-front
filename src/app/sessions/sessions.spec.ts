import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Component } from '@angular/core';
import { SessionsComponent } from './sessions';
import { WeeklySession } from '../models/session';

@Component({ template: '', standalone: true })
class MockComponent {};

describe('SessionsComponent', () => {
  let component: SessionsComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [SessionsComponent],
      providers: [
        provideRouter([{ path: 'patients', component: MockComponent }, { path: 'login', component: MockComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ],
    });
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(SessionsComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.setItem('auth_token', 'test-token');

    // Flush all requests from loadWeek() (constructor)
    httpMock.expectOne(r => r.url.includes('/observations/patients')).flush({ content: [], totalElements: 0 });
    httpMock.match(r => r.url.includes('/api/session')).forEach(req => req.flush([]));
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('calendar navigation', () => {
    it('should go to today', () => {
      const today = new Date();
      component.goToToday();
      expect(component.selectedDate().getDate()).toBe(today.getDate());
      expect(component.calendarMonth()).toBe(today.getMonth());
      // flush the requests from loadWeek triggered by goToToday
      httpMock.expectOne(r => r.url.includes('/observations/patients')).flush({ content: [], totalElements: 0 });
      httpMock.match(r => r.url.includes('/api/session')).forEach(req => req.flush([]));
    });

    it('should navigate months', () => {
      component.calendarMonth.set(5);
      component.prevMonth();
      expect(component.calendarMonth()).toBe(4);

      component.nextMonth();
      expect(component.calendarMonth()).toBe(5);
    });

    it('should wrap year on month navigation', () => {
      component.calendarMonth.set(0);
      component.prevMonth();
      expect(component.calendarMonth()).toBe(11);
      expect(component.calendarYear()).toBe(new Date().getFullYear() - 1);

      component.nextMonth();
      expect(component.calendarMonth()).toBe(0);
    });
  });

  describe('date helpers', () => {
    it('isToday should return true for today', () => {
      expect(component.isToday(new Date())).toBeTrue();
    });

    it('isToday should return false for other date', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      expect(component.isToday(yesterday)).toBeFalse();
    });

    it('isSelected should match selectedDate', () => {
      const d = new Date(2026, 4, 15);
      component.selectedDate.set(d);
      expect(component.isSelected(d)).toBeTrue();
      expect(component.isSelected(new Date(2026, 4, 16))).toBeFalse();
    });
  });

  describe('formatTime', () => {
    it('should pad single digits', () => {
      expect(component.formatTime(9, 5)).toBe('09:05');
    });

    it('should format double digits', () => {
      expect(component.formatTime(23, 59)).toBe('23:59');
    });
  });

  describe('pad', () => {
    it('should pad single digit', () => {
      expect(component.pad(3)).toBe('03');
    });

    it('should not pad double digit', () => {
      expect(component.pad(15)).toBe('15');
    });
  });

  describe('sessionStyle', () => {
    it('should calculate top and height', () => {
      const ws: WeeklySession = {
        session: { id: 1, dateSession: '2026-05-26T10:00:00', dateSessionEnd: '2026-05-26T11:00:00', observation: '', observationSummary: '', pay: false, patientId: 1, patientName: '', patientSurname: '' },
        startHour: 10, startMinute: 0, endHour: 11, endMinute: 0, dayIndex: 0, durationMinutes: 60,
      };
      const style = component.sessionStyle(ws);
      expect(style['top']).toBe('600px');
      expect(style['height']).toBe('60px');
    });

    it('should enforce minimum height', () => {
      const ws: WeeklySession = {
        session: { id: 1, dateSession: '2026-05-26T10:00:00', dateSessionEnd: '2026-05-26T10:15:00', observation: '', observationSummary: '', pay: false, patientId: 1, patientName: '', patientSurname: '' },
        startHour: 10, startMinute: 0, endHour: 10, endMinute: 15, dayIndex: 0, durationMinutes: 15,
      };
      const style = component.sessionStyle(ws);
      expect(Number(style['height'].replace('px', ''))).toBeGreaterThanOrEqual(25);
    });
  });

  describe('drag behavior', () => {
    it('should start drag and show overlay', () => {
      expect(component.dragState()).toBeNull();
      component.startDrag(0, 10);
      expect(component.dragState()).toEqual({ dayIdx: 0, startHour: 10, endHour: 10 });
    });

    it('should update drag end hour', () => {
      component.startDrag(0, 10);
      component.updateDrag(0, 14);
      expect(component.dragState()?.endHour).toBe(14);
    });

    it('should ignore updateDrag for different day', () => {
      component.startDrag(0, 10);
      component.updateDrag(1, 14);
      expect(component.dragState()?.endHour).toBe(10);
    });

    it('should ignore updateDrag when same hour', () => {
      component.startDrag(0, 10);
      component.updateDrag(0, 10);
      expect(component.dragState()?.endHour).toBe(10);
    });

    it('should ignore updateDrag when not dragging', () => {
      component.updateDrag(0, 10);
      expect(component.dragState()).toBeNull();
    });

    it('should end drag and open dialog with range', () => {
      component.weekDays.set([new Date(2026, 4, 25)]);
      component.startDrag(0, 10);
      component.updateDrag(0, 14);
      component.endDrag();

      expect(component.dragState()).toBeNull();
      expect(component.showDialog()).toBeTrue();
      expect(component.startHour()).toBe(10);
      expect(component.endHour()).toBe(14);
    });

    it('should end drag as click (same hour) and open 1h dialog', () => {
      component.weekDays.set([new Date(2026, 4, 25)]);
      component.startDrag(0, 10);
      component.endDrag();

      expect(component.showDialog()).toBeTrue();
      expect(component.startHour()).toBe(10);
      expect(component.endHour()).toBe(11);
    });

    it('should end drag with no state and do nothing', () => {
      component.endDrag();
      expect(component.showDialog()).toBeFalse();
    });

    it('should handle reverse drag (down then up)', () => {
      component.weekDays.set([new Date(2026, 4, 25)]);
      component.startDrag(0, 14);
      component.updateDrag(0, 10);
      component.endDrag();

      expect(component.startHour()).toBe(10);
      expect(component.endHour()).toBe(14);
    });
  });

  describe('dragOverlayStyle', () => {
    it('should return display none when no drag', () => {
      expect(component.dragOverlayStyle()).toEqual({ display: 'none' });
    });

    it('should compute overlay position', () => {
      component.startDrag(0, 10);
      component.updateDrag(0, 14);
      const style = component.dragOverlayStyle();
      expect(style['top']).toBe('600px');
      expect(style['height']).toBe('240px');
    });
  });

  describe('onSessionClick', () => {
    it('should populate dialog for editing', () => {
      const ws: WeeklySession = {
        session: {
          id: 1, dateSession: '2026-05-26T10:00:00', dateSessionEnd: '2026-05-26T11:00:00',
          observation: 'test obs', observationSummary: 'test summary', pay: false,
          patientId: 5, patientName: 'Ana', patientSurname: 'López',
        },
        startHour: 10, startMinute: 0, endHour: 11, endMinute: 0, dayIndex: 0, durationMinutes: 60,
      };
      component.onSessionClick(ws);

      expect(component.showDialog()).toBeTrue();
      expect(component.editingSession()).toBe(ws.session);
      expect(component.startHour()).toBe(10);
      expect(component.endHour()).toBe(11);
      expect(component.selectedPatientId()).toBe(5);
      expect(component.observatory()).toBe('test obs');
      expect(component.observatorySummary()).toBe('test summary');
    });
  });

  describe('sessionsByDay', () => {
    it('should group sessions by dayIndex', () => {
      const s1 = {
        session: { id: 1, dateSession: '2026-05-26T10:00:00', dateSessionEnd: '2026-05-26T11:00:00', observation: '', observationSummary: '', pay: false, patientId: 1, patientName: '', patientSurname: '' },
        startHour: 10, startMinute: 0, endHour: 11, endMinute: 0, dayIndex: 0, durationMinutes: 60,
      };
      const s2 = {
        session: { id: 2, dateSession: '2026-05-26T12:00:00', dateSessionEnd: '2026-05-26T13:00:00', observation: '', observationSummary: '', pay: false, patientId: 2, patientName: '', patientSurname: '' },
        startHour: 12, startMinute: 0, endHour: 13, endMinute: 0, dayIndex: 0, durationMinutes: 60,
      };
      const s3 = {
        session: { id: 3, dateSession: '2026-05-27T10:00:00', dateSessionEnd: '2026-05-27T11:00:00', observation: '', observationSummary: '', pay: false, patientId: 3, patientName: '', patientSurname: '' },
        startHour: 10, startMinute: 0, endHour: 11, endMinute: 0, dayIndex: 1, durationMinutes: 60,
      };

      component.weeklySessions.set([s1, s2, s3]);
      const map = component.sessionsByDay();

      expect(map.get(0)?.length).toBe(2);
      expect(map.get(1)?.length).toBe(1);
      expect(map.get(2)).toBeUndefined();
    });
  });

  describe('getWeekStart', () => {
    it('should return Monday for a Wednesday', () => {
      const wed = new Date(2026, 4, 27);
      const monday = component.getWeekStart(wed);
      expect(monday.getDay()).toBe(1);
      expect(monday.getDate()).toBe(25);
    });

    it('should return Monday for a Sunday', () => {
      const sun = new Date(2026, 4, 31);
      const monday = component.getWeekStart(sun);
      expect(monday.getDay()).toBe(1);
      expect(monday.getDate()).toBe(25);
    });

    it('should return same day for Monday', () => {
      const mon = new Date(2026, 4, 25);
      const result = component.getWeekStart(mon);
      expect(result.getDate()).toBe(25);
    });
  });

  describe('delete', () => {
    it('should toggle delete confirm', () => {
      expect(component.showDeleteConfirm()).toBeFalse();
      component.promptDelete();
      expect(component.showDeleteConfirm()).toBeTrue();
      component.cancelDelete();
      expect(component.showDeleteConfirm()).toBeFalse();
    });
  });
});
