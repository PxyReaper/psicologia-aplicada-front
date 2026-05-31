import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Component } from '@angular/core';
import { SessionsComponent } from './sessions';
import { WeeklySession } from '../models/session';

@Component({ template: '', standalone: true })
class MockComponent {}

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

  describe('dialog handling', () => {
    it('handleEditSession should set editingSession and show dialog', () => {
      const ws: WeeklySession = {
        session: {
          id: 1, dateSession: '2026-05-26T10:00:00', dateSessionEnd: '2026-05-26T11:00:00',
          observation: 'test obs', observationSummary: 'test summary', pay: false,
          patientId: 5, patientName: 'Ana', patientSurname: 'López',
        },
        startHour: 10, startMinute: 0, endHour: 11, endMinute: 0, dayIndex: 0, durationMinutes: 60,
      };

      component.handleEditSession(ws);

      expect(component.showDialog()).toBeTrue();
      expect(component.editingSession()).toEqual(ws.session);
    });

    it('handleCreateSession should set preset and show dialog', () => {
      component.weekDays.set([new Date(2026, 4, 25)]);
      component.handleCreateSession({ dayIdx: 0, startHour: 10, endHour: 14 });

      expect(component.showDialog()).toBeTrue();
      expect(component.editingSession()).toBeNull();
      expect(component.sessionDialogPreset()).toEqual({
        date: new Date(2026, 4, 25),
        startHour: 10,
        startMinute: 0,
        endHour: 14,
        endMinute: 0,
      });
    });

    it('handleDialogClose should hide dialog and clear preset', () => {
      component.showDialog.set(true);
      component.sessionDialogPreset.set({ date: new Date(), startHour: 9, startMinute: 0, endHour: 10, endMinute: 0 });
      component.handleDialogClose();

      expect(component.showDialog()).toBeFalse();
      expect(component.sessionDialogPreset()).toBeNull();
    });
  });
});
