import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { Component } from '@angular/core';
import { PatientFormComponent } from './patient-form';
import { PatientsService } from '../patients.service';

@Component({ template: '', standalone: true })
class MockComponent {};

describe('PatientFormComponent', () => {
  let component: PatientFormComponent;
  let httpMock: HttpTestingController;
  let patientsService: PatientsService;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [PatientFormComponent],
      providers: [
        provideRouter([{ path: 'patients', component: MockComponent }, { path: 'login', component: MockComponent }]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideZonelessChangeDetection(),
      ],
    });
    await TestBed.compileComponents();
    const fixture = TestBed.createComponent(PatientFormComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    patientsService = TestBed.inject(PatientsService);
    localStorage.setItem('auth_token', 'test-token');
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with empty fields for new patient', () => {
    expect(component.name()).toBe('');
    expect(component.surname()).toBe('');
    expect(component.birthDay()).toBe('');
    expect(component.genre()).toBe('');
    expect(component.isEdit()).toBeFalse();
  });

  it('should have genre options', () => {
    expect(component.genres.length).toBe(2);
    expect(component.genres[0].value).toBe('masculino');
    expect(component.genres[1].value).toBe('femenino');
  });

  it('should show error when required fields are missing', () => {
    component.save();
    expect(component.loading()).toBeFalse();
  });

  it('should create patient on save with valid data', () => {
    component.name.set('Carlos');
    component.surname.set('Ruiz');
    component.birthDay.set('1990-01-15');
    component.genre.set('masculino');

    component.save();
    expect(component.loading()).toBeTrue();

    const req = httpMock.expectOne('http://localhost:8080/api/patients');
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      name: 'Carlos', surname: 'Ruiz', birthDay: '1990-01-15',
      cellPhone: '', genre: 'masculino', observation: undefined,
    });
    req.flush(null);
  });
});
