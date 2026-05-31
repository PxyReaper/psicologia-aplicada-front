import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SessionWeekGrid } from './session-week-grid';
import { WeeklySession } from '../../models/session';

describe('SessionWeekGrid', () => {
  let fixture: ComponentFixture<SessionWeekGrid>;
  let component: SessionWeekGrid;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [SessionWeekGrid],
      providers: [provideZonelessChangeDetection()],
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(SessionWeekGrid);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('weekDays', [new Date(2026, 4, 25)]);
    fixture.componentRef.setInput('sessionsByDay', new Map());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('formatTime', () => {
    it('should pad single digits', () => {
      expect(component.formatTime(9, 5)).toBe('09:05');
    });

    it('should format double digits', () => {
      expect(component.formatTime(23, 59)).toBe('23:59');
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

    it('should end drag and emit createSession with range', () => {
      spyOn(component.createSession, 'emit');
      component.startDrag(0, 10);
      component.updateDrag(0, 14);
      component.endDrag();

      expect(component.dragState()).toBeNull();
      expect(component.createSession.emit).toHaveBeenCalledWith({ dayIdx: 0, startHour: 10, endHour: 14 });
    });

    it('should end drag as click (same hour) and create 1h session', () => {
      spyOn(component.createSession, 'emit');
      component.startDrag(0, 10);
      component.endDrag();

      expect(component.createSession.emit).toHaveBeenCalledWith({ dayIdx: 0, startHour: 10, endHour: 11 });
    });

    it('should handle reverse drag (down then up)', () => {
      spyOn(component.createSession, 'emit');
      component.startDrag(0, 14);
      component.updateDrag(0, 10);
      component.endDrag();

      expect(component.createSession.emit).toHaveBeenCalledWith({ dayIdx: 0, startHour: 10, endHour: 14 });
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
});
