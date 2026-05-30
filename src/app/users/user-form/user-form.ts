import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, signal } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UsersService } from '../users.service';
import { ToastService } from '../../shared/toast.service';
import { ToastContainer } from '../../shared/toast-container';

@Component({
  selector: 'app-user-form',
  imports: [FormsModule, ToastContainer],
  templateUrl: './user-form.html',
  styleUrl: './user-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserFormComponent {
  private usersService = inject(UsersService);
  private router = inject(Router);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);

  id = input<number>();

  email = signal('');
  username = signal('');
  name = signal('');
  surname = signal('');
  role = signal<string>('');
  enabled = signal(true);
  loading = signal(false);
  isEdit = signal(false);

  readonly roles = [
    { label: 'Psicólogo', value: 'PSYCHOLOGIST' },
    { label: 'Administrador', value: 'ADMIN' },
  ];

  constructor() {
    effect(() => {
      const uid = this.id();
      if (uid !== undefined) {
        this.isEdit.set(true);
        this.loading.set(true);
        this.usersService.getById(uid).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
          next: (u) => {
            this.email.set(u.email);
            this.username.set(u.username);
            this.name.set(u.name ?? '');
            this.surname.set(u.surname ?? '');
            this.role.set(u.role);
            this.enabled.set(u.enabled);
            this.loading.set(false);
          },
          error: () => {
            this.toast.error('Error al cargar el usuario');
            this.loading.set(false);
          },
        });
      }
    });
  }

  save(): void {
    if (!this.email().trim() || !this.username().trim() || !this.role()) {
      this.toast.error('Completa los campos obligatorios');
      return;
    }

    this.loading.set(true);

    if (this.isEdit()) {
      this.usersService.update(this.id()!, {
        email: this.email().trim() || undefined,
        username: this.username().trim() || undefined,
        name: this.name().trim() || undefined,
        surname: this.surname().trim() || undefined,
        role: this.role() as 'ADMIN' | 'PSYCHOLOGIST',
        enabled: this.enabled(),
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.toast.success('Usuario actualizado correctamente');
          setTimeout(() => this.router.navigate(['/users']), 1000);
        },
        error: () => {
          this.toast.error('No se pudo actualizar el usuario');
          this.loading.set(false);
        },
      });
    } else {
      this.usersService.create({
        email: this.email().trim(),
        username: this.username().trim(),
        name: this.name().trim() || this.username().trim(),
        surname: this.surname().trim() || '',
        role: this.role() as 'ADMIN' | 'PSYCHOLOGIST',
      }).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: () => {
          this.toast.success('Usuario creado correctamente. Se ha enviado un email con la contraseña.');
          setTimeout(() => this.router.navigate(['/users']), 1000);
        },
        error: () => {
          this.toast.error('No se pudo crear el usuario');
          this.loading.set(false);
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/users']);
  }
}
