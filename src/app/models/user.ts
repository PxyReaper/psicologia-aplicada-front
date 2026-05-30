export interface UserResponse {
  id: number;
  email: string;
  username: string;
  name: string;
  surname: string;
  role: 'ADMIN' | 'PSYCHOLOGIST';
  enabled: boolean;
  createdAt: string;
}

export interface UpdateUserRequest {
  email?: string;
  username?: string;
  name?: string;
  surname?: string;
  role?: 'ADMIN' | 'PSYCHOLOGIST';
  enabled?: boolean;
}
