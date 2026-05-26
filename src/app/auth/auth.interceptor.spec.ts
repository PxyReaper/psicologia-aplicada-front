import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideZonelessChangeDetection } from '@angular/core';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let httpMock: HttpTestingController;
  let http: HttpClient;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    httpMock = TestBed.inject(HttpTestingController);
    http = TestBed.inject(HttpClient);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should not add Authorization header for login request', () => {
    http.post('http://localhost:8080/api/auth/login', {}).subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({});
  });

  it('should add Authorization header when token exists', () => {
    localStorage.setItem('auth_token', 'test-token-123');
    http.get('http://localhost:8080/api/session').subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/session');
    expect(req.request.headers.get('Authorization')).toBe('Bearer test-token-123');
    req.flush([]);
  });

  it('should set Content-Type header', () => {
    http.get('http://localhost:8080/api/session').subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/session');
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    req.flush([]);
  });

  it('should not add Authorization when no token', () => {
    http.get('http://localhost:8080/api/session').subscribe();
    const req = httpMock.expectOne('http://localhost:8080/api/session');
    expect(req.request.headers.has('Authorization')).toBeFalse();
    expect(req.request.headers.get('Content-Type')).toBe('application/json');
    req.flush([]);
  });
});
