import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
    service = TestBed.inject(ToastService);
  });

  it('should start with empty toasts', () => {
    expect(service.toasts()).toEqual([]);
  });

  it('should add a success toast', () => {
    service.success('Operación exitosa');
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].message).toBe('Operación exitosa');
    expect(service.toasts()[0].type).toBe('success');
  });

  it('should add an error toast', () => {
    service.error('Algo salió mal');
    expect(service.toasts()[0].type).toBe('error');
  });

  it('should add an info toast', () => {
    service.info('Información');
    expect(service.toasts()[0].type).toBe('info');
  });

});
