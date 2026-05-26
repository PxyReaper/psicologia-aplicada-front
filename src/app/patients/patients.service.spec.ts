import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { PatientsService } from './patients.service';
import { PatientsRequestDTO } from '../models/patient';

describe('PatientsService', () => {
  let service: PatientsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PatientsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch active patients with params', () => {
    const mockResponse = {
      content: [{ patient: { id: 1, name: 'Ana', surname: 'López' }, observations: [] }],
      totalElements: 1,
    };

    service.getActivePatients('2026-01-01', '2026-12-31', 0, 50).subscribe(res => {
      expect(res.totalElements).toBe(1);
      expect(res.content[0].patient.name).toBe('Ana');
    });

    const req = httpMock.expectOne(r =>
      r.url === 'http://localhost:8080/api/observations/patients' &&
      r.params.get('rangeStart') === '2026-01-01' &&
      r.params.get('rangeEnd') === '2026-12-31' &&
      r.params.get('page') === '0' &&
      r.params.get('size') === '50'
    );
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should create a patient', () => {
    const dto: PatientsRequestDTO = {
      name: 'Carlos', surname: 'Ruiz', birthDay: '1990-01-15',
      cellPhone: '600123456', genre: 'masculino',
    };

    service.create(dto).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/patients');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(null);
  });

  it('should update a patient', () => {
    const dto: PatientsRequestDTO = {
      name: 'Carlos', surname: 'Ruiz', birthDay: '1990-01-15',
      cellPhone: '600123456', genre: 'masculino',
    };

    service.update(1, dto).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/patients/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(null);
  });

  it('should discharge a patient', () => {
    service.discharge(1).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/patients/1/discharge');
    expect(req.request.method).toBe('POST');
    req.flush(null);
  });
});
