import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { UserResponse, UpdateUserRequest } from '../models/user';
import { AuthService } from '../auth/auth.service';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly API = 'http://localhost:8080/api';
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  getAll(): Observable<UserResponse[]> {
    return this.http.get<UserResponse[]>(`${this.API}/users`);
  }

  getById(id: number): Observable<UserResponse> {
    return this.http.get<UserResponse>(`${this.API}/users/${id}`);
  }

  update(id: number, data: UpdateUserRequest): Observable<UserResponse> {
    return this.http.put<UserResponse>(`${this.API}/users/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.API}/users/${id}`);
  }

  resetPassword(id: number): Observable<void> {
    return this.http.post<void>(`${this.API}/users/${id}/reset-password`, {});
  }

  create(data: { email: string; username: string; name: string; surname: string; role: 'ADMIN' | 'PSYCHOLOGIST' }): Observable<void> {
    return this.authService.register({ ...data, password: '' });
  }
}
