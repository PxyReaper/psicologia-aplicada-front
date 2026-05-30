import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PatientsService } from '../patients.service';
import { Patient, SessionData } from '../../models/patient';
import { ToastService } from '../../shared/toast.service';
import { ToastContainer } from '../../shared/toast-container';

@Component({
  selector: 'app-patient-detail',
  imports: [DatePipe, ToastContainer],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientDetailComponent {
  private patientsService = inject(PatientsService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  id = input.required<number>();

  patient = signal<Patient | null>(null);
  sessions = signal<SessionData[]>([]);
  loading = signal(false);

  constructor() {
    effect(() => {
      const pid = this.id();
      this.loading.set(true);
      this.patientsService.getById(pid).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (p) => {
          this.patient.set(p);
          this.sessions.set(p.sessions ?? []);
          this.loading.set(false);
        },
        error: () => {
          this.toast.error('Error al cargar el detalle del paciente');
          this.loading.set(false);
        },
      });
    });
  }

  goBack(): void {
    this.router.navigate(['/patients']);
  }
}
