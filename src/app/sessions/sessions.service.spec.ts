import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { SessionsService } from './sessions.service';
import { SessionRequestDTO, SessionWithPatientDTO } from '../models/session';

describe('SessionsService', () => {
  let service: SessionsService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SessionsService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch sessions by date', () => {
    const mockSessions: SessionWithPatientDTO[] = [
      {
        id: 1, dateSession: '2026-05-26T10:00:00', dateSessionEnd: '2026-05-26T11:00:00',
        observation: '', observationSummary: '', pay: false,
        patientId: 1, patientName: 'Juan', patientSurname: 'Pérez',
      },
    ];

    service.getByDate('2026-05-26').subscribe(sessions => {
      expect(sessions.length).toBe(1);
      expect(sessions[0].patientName).toBe('Juan');
    });

    const req = httpMock.expectOne('http://localhost:8080/api/session?date=2026-05-26');
    expect(req.request.method).toBe('GET');
    req.flush(mockSessions);
  });

  it('should create a session', () => {
    const dto: SessionRequestDTO = {
      dateSession: '2026-05-26T10:00:00',
      dateSessionEnd: '2026-05-26T11:00:00',
      observatory: '',
      observatorySummary: '',
      idPatient: 1,
      pay: false,
    };

    service.create(dto).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/session');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(dto);
    req.flush(null);
  });

  it('should update a session', () => {
    const dto: SessionRequestDTO = {
      dateSession: '2026-05-26T10:00:00',
      dateSessionEnd: '2026-05-26T11:00:00',
      observatory: '',
      observatorySummary: '',
      idPatient: 1,
      pay: false,
    };

    service.update(1, dto).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/session/1');
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(dto);
    req.flush(null);
  });

  it('should delete a session', () => {
    service.delete(1).subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/session/1');
    expect(req.request.method).toBe('DELETE');
    req.flush(null);
  });
});
