import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  if (req.url.includes('/auth/login')) {
    return next(req);
  }
  const token = localStorage.getItem('auth_token');
  let headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  req = req.clone({ setHeaders: headers });
  return next(req).pipe(
    catchError((err) => {
      if (err instanceof HttpErrorResponse && err.status === 401) {
        localStorage.removeItem('auth_token');
        router.navigate(['/login']);
      }
      return throwError(() => err);
    }),
  );
};
