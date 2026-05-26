import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Component } from '@angular/core';
import { LoginComponent } from './login';

@Component({ template: '', standalone: true })
class MockComponent {};

describe('LoginComponent', () => {
  let component: LoginComponent;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideRouter([{ path: 'patients', component: MockComponent }, { path: 'login', component: MockComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ],
    });
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with empty fields', () => {
    expect(component.email()).toBe('');
    expect(component.password()).toBe('');
    expect(component.error()).toBe('');
    expect(component.loading()).toBeFalse();
  });

  it('should show error when fields are empty', () => {
    component.login();
    expect(component.error()).toBe('Email y contraseña son requeridos');
    expect(component.loading()).toBeFalse();
  });

  it('should set loading during login request', () => {
    component.email.set('admin@test.com');
    component.password.set('pass');
    component.login();
    expect(component.loading()).toBeTrue();
    expect(component.error()).toBe('');

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    req.flush({ token: 'fake-token' });
  });

  it('should show error on login failure', () => {
    component.email.set('wrong@test.com');
    component.password.set('wrong');
    component.login();

    const req = httpMock.expectOne('http://localhost:8080/api/auth/login');
    req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(component.error()).toBe('Credenciales inválidas');
    expect(component.loading()).toBeFalse();
  });
});
