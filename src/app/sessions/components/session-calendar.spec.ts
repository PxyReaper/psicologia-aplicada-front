import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SessionCalendar } from './session-calendar';

describe('SessionCalendar', () => {
  let fixture: ComponentFixture<SessionCalendar>;
  let component: SessionCalendar;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [SessionCalendar],
      providers: [provideZonelessChangeDetection()],
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(SessionCalendar);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('selectedDate', new Date());
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('calendar navigation', () => {
    it('should go to today and emit selectDate', () => {
      spyOn(component.selectDate, 'emit');
      component.goToToday();
      const today = new Date();
      expect(component.calendarMonth()).toBe(today.getMonth());
      expect(component.calendarYear()).toBe(today.getFullYear());
      expect(component.selectDate.emit).toHaveBeenCalled();
    });

    it('should navigate months forward and backward', () => {
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
      fixture.componentRef.setInput('selectedDate', d);
      expect(component.isSelected(d)).toBeTrue();
      expect(component.isSelected(new Date(2026, 4, 16))).toBeFalse();
    });
  });

  describe('pickDate', () => {
    it('should update month/year and emit selectDate', () => {
      spyOn(component.selectDate, 'emit');
      component.calendarMonth.set(4);
      component.calendarYear.set(2026);
      component.pickDate(15);
      expect(component.selectDate.emit).toHaveBeenCalled();
      expect(component.calendarMonth()).toBe(4);
      expect(component.calendarYear()).toBe(2026);
    });
  });
});
