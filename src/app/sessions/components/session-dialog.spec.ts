import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { SessionDialog } from './session-dialog';

describe('SessionDialog', () => {
  let fixture: ComponentFixture<SessionDialog>;
  let component: SessionDialog;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [SessionDialog],
      providers: [provideZonelessChangeDetection()],
    });
    await TestBed.compileComponents();
    fixture = TestBed.createComponent(SessionDialog);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('show', false);
    fixture.componentRef.setInput('patientOptions', []);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('pad', () => {
    it('should pad single digit', () => {
      expect(component.pad(3)).toBe('03');
    });

    it('should not pad double digit', () => {
      expect(component.pad(15)).toBe('15');
    });
  });

  describe('delete confirm', () => {
    it('should toggle delete confirm', () => {
      expect(component.showDeleteConfirm()).toBeFalse();
      component.promptDelete();
      expect(component.showDeleteConfirm()).toBeTrue();
      component.cancelDelete();
      expect(component.showDeleteConfirm()).toBeFalse();
    });
  });

  describe('saveSession', () => {
    it('should emit save with DTO when patient is selected', () => {
      spyOn(component.save, 'emit');
      component.showDeleteConfirm.set(false);
      component.selectedPatientId.set(1);
      component.saveSession();
      expect(component.save.emit).toHaveBeenCalled();
    });

    it('should not emit save when no patient selected', () => {
      spyOn(component.save, 'emit');
      component.selectedPatientId.set(null);
      component.saveSession();
      expect(component.save.emit).not.toHaveBeenCalled();
    });
  });

  describe('doDelete', () => {
    it('should emit delete', () => {
      spyOn(component.delete, 'emit');
      component.doDelete();
      expect(component.delete.emit).toHaveBeenCalled();
    });
  });
});
