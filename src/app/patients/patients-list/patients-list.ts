import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PatientsService } from '../patients.service';
import { PatientObservationsDTO } from '../../models/patient';
import { ToastService } from '../../shared/toast.service';
import { ToastContainer } from '../../shared/toast-container';

@Component({
  selector: 'app-patients-list',
  imports: [FormsModule, DatePipe, ToastContainer],
  templateUrl: './patients-list.html',
  styleUrl: './patients-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientsListComponent {
  private patientsService = inject(PatientsService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  router = inject(Router);

  rangeStart = signal<string>(this.toDateInputValue(new Date(new Date().getFullYear(), new Date().getMonth(), 1)));
  rangeEnd = signal<string>(this.toDateInputValue(new Date()));
  patients = signal<PatientObservationsDTO[]>([]);
  loading = signal(false);
  confirmingId: number | null = null;
  first = 0;
  totalRecords = 0;

  constructor() {
    this.search();
  }

  search(): void {
    this.loading.set(true);
    this.patientsService.getActivePatients(this.rangeStart(), this.rangeEnd()).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (res) => {
        this.patients.set(res.content ?? res);
        this.totalRecords = res.totalElements ?? (res.content ?? res).length;
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  detail(id: number): void {
    this.router.navigate(['/patients', id]);
  }

  edit(id: number): void {
    this.router.navigate(['/patients', id, 'edit']);
  }

  confirmDischarge(p: PatientObservationsDTO): void {
    this.confirmingId = p.patient.id;
  }

  cancelDischarge(): void {
    this.confirmingId = null;
  }

  doDischarge(id: number): void {
    this.confirmingId = null;
    this.patientsService.discharge(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success('Paciente dado de baja');
        this.search();
      },
      error: () => this.toast.error('Error al dar de baja'),
    });
  }

  observationPreview(obs: string[], max = 60): string {
    if (!obs || obs.length === 0) return '-';
    const last = obs[obs.length - 1];
    if (last.length <= max) return last;
    return last.slice(0, max) + '...';
  }

  private toDateInputValue(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
