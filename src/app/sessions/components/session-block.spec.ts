import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SessionBlock } from './session-block';
import { WeeklySession } from '../../models/session';

describe('SessionBlock', () => {
  let fixture: ComponentFixture<SessionBlock>;
  let component: SessionBlock;

  const mockWs: WeeklySession = {
    session: { id: 1, dateSession: '2026-05-26T10:00:00', dateSessionEnd: '2026-05-26T11:00:00', observation: '', observationSummary: '', pay: false, patientId: 1, patientName: 'Ana', patientSurname: 'López' },
    startHour: 10, startMinute: 0, endHour: 11, endMinute: 0, dayIndex: 0, durationMinutes: 60,
  };

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [SessionBlock],
      providers: [provideZonelessChangeDetection()],
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(SessionBlock);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('weeklySession', mockWs);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('sessionStyle', () => {
    it('should calculate top and height', () => {
      const style = component.sessionStyle();
      expect(style['top']).toBe('600px');
      expect(style['height']).toBe('60px');
    });

    it('should enforce minimum height', () => {
      const shortWs: WeeklySession = {
        session: { id: 2, dateSession: '2026-05-26T10:00:00', dateSessionEnd: '2026-05-26T10:15:00', observation: '', observationSummary: '', pay: false, patientId: 1, patientName: '', patientSurname: '' },
        startHour: 10, startMinute: 0, endHour: 10, endMinute: 15, dayIndex: 0, durationMinutes: 15,
      };
      fixture.componentRef.setInput('weeklySession', shortWs);
      const style = component.sessionStyle();
      expect(Number(style['height'].replace('px', ''))).toBeGreaterThanOrEqual(25);
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
});
