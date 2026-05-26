import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { provideZonelessChangeDetection } from '@angular/core';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: Router, useValue: routerSpy },
      ],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should start unauthenticated when no token', () => {
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.token()).toBeNull();
  });

  it('should login and store token', () => {
    const token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbkB0ZXN0LmNvbSIsInJvbGUiOiJBRE1JTiJ9.fake';
    let receivedToken = '';

    service.login('admin@test.com', 'pass').subscribe(res => {
      receivedToken = res.token;
    });

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ email: 'admin@test.com', password: 'pass' });
    req.flush({ token });

    expect(receivedToken).toBe(token);
    expect(service.token()).toBe(token);
    expect(service.isAuthenticated()).toBeTrue();
    expect(localStorage.getItem('auth_token')).toBe(token);
  });

  it('should set user data from JWT on login', () => {
    const payload = { sub: 'admin@test.com', role: 'ADMIN', iat: 0, exp: 9999999999 };
    const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';

    service.login('admin@test.com', 'pass').subscribe();

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    req.flush({ token });

    expect(service.userEmail()).toBe('admin@test.com');
    expect(service.userRole()).toBe('ADMIN');
  });

  it('should logout and clear state', () => {
    service.logout();

    expect(service.token()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(service.userEmail()).toBeNull();
    expect(service.userRole()).toBeNull();
    expect(localStorage.getItem('auth_token')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
