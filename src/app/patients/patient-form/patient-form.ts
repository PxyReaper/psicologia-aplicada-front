import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PatientsService } from '../patients.service';
import { PatientsRequestDTO } from '../../models/patient';
import { ToastService } from '../../shared/toast.service';
import { ToastContainer } from '../../shared/toast-container';

@Component({
  selector: 'app-patient-form',
  imports: [FormsModule, ToastContainer],
  templateUrl: './patient-form.html',
  styleUrl: './patient-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PatientFormComponent {
  private patientsService = inject(PatientsService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  id = input<number>();

  name = signal('');
  surname = signal('');
  birthDay = signal('');
  cellPhone = signal('');
  genre = signal<string>('');
  observation = signal('');
  existingObservations = signal<string[]>([]);
  loading = signal(false);
  isEdit = signal(false);

  readonly genres = [
    { label: 'Masculino', value: 'masculino' },
    { label: 'Femenino', value: 'femenino' },
  ];

  constructor() {
    effect(() => {
      const pid = this.id();
      if (pid !== undefined) {
        this.isEdit.set(true);
        this.loading.set(true);
        this.patientsService.getById(pid).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (p) => {
            this.name.set(p.name);
            this.surname.set(p.surname);
            this.birthDay.set(p.birthDay);
            this.cellPhone.set(p.cellPhone);
            this.genre.set(p.genre);
            this.existingObservations.set(p.observations ?? []);
            this.loading.set(false);
          },
          error: () => {
            this.toast.error('Error al cargar el paciente');
            this.loading.set(false);
          },
        });
      }
    });
  }

  save(): void {
    if (!this.name().trim() || !this.surname().trim() || !this.birthDay() || !this.genre()) {
      this.toast.error('Completa los campos obligatorios');
      return;
    }
    const dto: PatientsRequestDTO = {
      name: this.name(),
      surname: this.surname(),
      birthDay: this.birthDay(),
      cellPhone: this.cellPhone(),
      genre: this.genre() as 'masculino' | 'femenino',
      observation: this.observation().trim() || undefined,
    };
    this.loading.set(true);
    const request = this.isEdit()
      ? this.patientsService.update(this.id()!, dto)
      : this.patientsService.create(dto);
    request.subscribe({
      next: () => {
        this.toast.success('Paciente guardado correctamente');
        setTimeout(() => this.router.navigate(['/patients']), 1000);
      },
      error: () => {
        this.toast.error('No se pudo guardar el paciente');
        this.loading.set(false);
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/patients']);
  }
}
