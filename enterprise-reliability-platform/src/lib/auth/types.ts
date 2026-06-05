export type UserRole = "admin" | "manager" | "customer";

export interface SessionUser {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string | null;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface UserProfile {
  role: UserRole;
  full_name: string | null;
  email: string;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  iat: number;
  exp: number;
}
