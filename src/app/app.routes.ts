import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then(m => m.LoginComponent),
  },
  {
    path: 'patients',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./patients/patients-list/patients-list').then(m => m.PatientsListComponent),
      },
      {
        path: 'new',
        loadComponent: () => import('./patients/patient-form/patient-form').then(m => m.PatientFormComponent),
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./patients/patient-form/patient-form').then(m => m.PatientFormComponent),
      },
    ],
  },
  {
    path: 'sessions',
    canActivate: [authGuard],
    loadComponent: () => import('./sessions/sessions').then(m => m.SessionsComponent),
  },
  { path: '', redirectTo: '/patients', pathMatch: 'full' },
  { path: '**', redirectTo: '/patients' },
];
