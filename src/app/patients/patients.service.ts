import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Patient, PatientObservationsDTO, PatientsRequestDTO } from '../models/patient';

@Injectable({ providedIn: 'root' })
export class PatientsService {
  private readonly API = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getActivePatients(rangeStart: string, rangeEnd: string, page = 0, size = 50): Observable<any> {
    const params = new HttpParams()
      .set('rangeStart', rangeStart)
      .set('rangeEnd', rangeEnd)
      .set('page', page)
      .set('size', size);
    return this.http.get<any>(`${this.API}/observations/patients`, { params });
  }

  getById(id: number): Observable<Patient> {
    return this.http.get<Patient>(`${this.API}/patients/${id}`);
  }

  create(data: PatientsRequestDTO): Observable<void> {
    return this.http.post<void>(`${this.API}/patients`, data);
  }

  update(id: number, data: PatientsRequestDTO): Observable<void> {
    return this.http.put<void>(`${this.API}/patients/${id}`, data);
  }

  discharge(id: number): Observable<void> {
    return this.http.post<void>(`${this.API}/patients/${id}/discharge`, {});
  }
}
