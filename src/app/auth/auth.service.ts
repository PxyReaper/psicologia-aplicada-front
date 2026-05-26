import { HttpClient } from '@angular/common/http';
import { Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { map, Observable, tap } from 'rxjs';
import { AuthRequest, AuthResponse, JwtPayload } from '../models/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly API_URL = 'http://localhost:8080/api';

  readonly token = signal<string | null>(this.loadToken());
  readonly isAuthenticated = signal(!!this.token());
  readonly userEmail = signal<string | null>(null);
  readonly userRole = signal<string | null>(null);

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    if (this.token()) {
      this.decodeToken();
    }
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/auth/login`, { email, password } as AuthRequest).pipe(
      tap(res => {
        this.saveToken(res.token);
        this.decodeToken();
        this.isAuthenticated.set(true);
      }),
    );
  }

  register(data: { email: string; username: string; password: string; name: string; surname: string; role: 'ADMIN' | 'PSYCHOLOGIST' }): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/auth/register`, data);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    this.token.set(null);
    this.isAuthenticated.set(false);
    this.userEmail.set(null);
    this.userRole.set(null);
    this.router.navigate(['/login']);
  }

  private saveToken(t: string): void {
    localStorage.setItem(this.TOKEN_KEY, t);
    this.token.set(t);
  }

  private loadToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private decodeToken(): void {
    const t = this.token();
    if (!t) return;
    try {
      const payload = JSON.parse(atob(t.split('.')[1])) as JwtPayload;
      this.userEmail.set(payload.sub);
      this.userRole.set(payload.role);
    } catch {
      this.logout();
    }
  }
}
