import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SessionRequestDTO, SessionWithPatientDTO } from '../models/session';
import { PatientObservationsDTO } from '../models/patient';

@Injectable({ providedIn: 'root' })
export class SessionsService {
  private readonly API = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getByDate(date: string): Observable<SessionWithPatientDTO[]> {
    return this.http.get<SessionWithPatientDTO[]>(`${this.API}/session`, { params: { date } });
  }

  create(data: SessionRequestDTO): Observable<void> {
    return this.http.post<void>(`${this.API}/session`, data);
  }

  update(id: number, data: SessionRequestDTO): Observable<void> {
    return this.http.put<void>(`${this.API}/session/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/session/${id}`);
  }
}
