import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Component } from '@angular/core';
import { PatientsListComponent } from './patients-list';

@Component({ template: '', standalone: true })
class MockComponent {};

describe('PatientsListComponent', () => {
  let component: PatientsListComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [PatientsListComponent],
      providers: [
        provideRouter([{ path: 'patients', component: MockComponent }, { path: 'login', component: MockComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ],
    });
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(PatientsListComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.setItem('auth_token', 'test-token');

    // Flush constructor's search() request
    const req = httpMock.expectOne(r => r.url.includes('/observations/patients'));
    req.flush({ content: [], totalElements: 0 });
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have default date range', () => {
    expect(component.rangeStart()).toBeTruthy();
    expect(component.rangeEnd()).toBeTruthy();
  });

  it('should confirm discharge and execute it', () => {
    const mockPatient = {
      patient: { id: 1, name: 'Ana', surname: 'López', startDate: '2026-01-01', endDate: null, birthDay: '1990-01-01', cellPhone: '600123456', genre: 'femenino' },
      observations: [],
    };

    component.confirmDischarge(mockPatient);
    expect(component.confirmingId).toBe(1);

    component.doDischarge(1);
    expect(component.confirmingId).toBeNull();

    const dischargeReq = httpMock.expectOne('http://localhost:8080/api/patients/1/discharge');
    expect(dischargeReq.request.method).toBe('POST');

    dischargeReq.flush(null);

    // Flush the search() called in doDischarge
    const searchReq = httpMock.expectOne(r => r.url.includes('/observations/patients'));
    searchReq.flush({ content: [], totalElements: 0 });
  });

  it('should cancel discharge', () => {
    component.confirmingId = 1;
    component.cancelDischarge();
    expect(component.confirmingId).toBeNull();
  });

  it('should load patients on search', () => {
    component.search();
    const req = httpMock.expectOne(r => r.url.includes('/observations/patients'));
    expect(req.request.method).toBe('GET');
    req.flush({ content: [], totalElements: 0 });
  });
});
