import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { UsersService } from '../users.service';
import { UserResponse } from '../../models/user';
import { ToastService } from '../../shared/toast.service';
import { ToastContainer } from '../../shared/toast-container';

@Component({
  selector: 'app-users-list',
  imports: [DatePipe, ToastContainer],
  templateUrl: './users-list.html',
  styleUrl: './users-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersListComponent {
  private usersService = inject(UsersService);
  private toast = inject(ToastService);
  private destroyRef = inject(DestroyRef);
  router = inject(Router);

  users = signal<UserResponse[]>([]);
  loading = signal(false);
  confirmingId: number | null = null;
  resettingId = signal<number | null>(null);

  constructor() {
    this.loadUsers();
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.usersService.getAll().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (data) => {
        this.users.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Error al cargar usuarios');
        this.loading.set(false);
      },
    });
  }

  edit(id: number): void {
    this.router.navigate(['/users', id, 'edit']);
  }

  confirmDelete(id: number): void {
    this.confirmingId = id;
  }

  cancelDelete(): void {
    this.confirmingId = null;
  }

  doDelete(id: number): void {
    this.confirmingId = null;
    this.usersService.delete(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.toast.success('Usuario eliminado');
        this.loadUsers();
      },
      error: () => this.toast.error('Error al eliminar usuario'),
    });
  }

  resetPassword(id: number): void {
    this.resettingId.set(id);
    this.usersService.resetPassword(id).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: () => {
        this.resettingId.set(null);
        this.toast.success('Nueva contraseña enviada por email');
      },
      error: () => {
        this.resettingId.set(null);
        this.toast.error('Error al restablecer la contraseña');
      },
    });
  }

  newUser(): void {
    this.router.navigate(['/users/new']);
  }
}
