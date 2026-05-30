import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { adminGuard } from './auth/admin.guard';

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
        path: ':id',
        loadComponent: () => import('./patients/patient-detail/patient-detail').then(m => m.PatientDetailComponent),
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./patients/patient-form/patient-form').then(m => m.PatientFormComponent),
      },
    ],
  },
  {
    path: 'users',
    canActivate: [authGuard, adminGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./users/users-list/users-list').then(m => m.UsersListComponent),
      },
      {
        path: 'new',
        loadComponent: () => import('./users/user-form/user-form').then(m => m.UserFormComponent),
      },
      {
        path: ':id/edit',
        loadComponent: () => import('./users/user-form/user-form').then(m => m.UserFormComponent),
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
