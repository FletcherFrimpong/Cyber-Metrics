export type Role = "admin" | "analyst" | "viewer";

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export type SafeUser = Omit<User, "passwordHash">;

export interface SessionPayload {
  userId: string;
  username: string;
  displayName: string;
  role: Role;
  iat: number;
  exp: number;
}

export type Permission =
  | "dashboard:view"
  | "reports:view"
  | "reports:export"
  | "alerts:view"
  | "settings:view"
  | "settings:edit"
  | "users:manage"
  | "sentinel:configure"
  | "sentinel:sync";
