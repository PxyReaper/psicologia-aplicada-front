export interface AuthRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  name: string;
  surname: string;
  role: 'ADMIN' | 'PSYCHOLOGIST';
}

export interface JwtPayload {
  sub: string;
  role: string;
  iat: number;
  exp: number;
}
