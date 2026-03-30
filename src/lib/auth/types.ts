export type Role = "admin" | "viewer";
export type UserStatus = "active" | "pending";

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  passwordHash: string;
  role: Role;
  status: UserStatus;
  inviteToken?: string;
  inviteTokenExpiry?: string;
  createdAt: string;
  updatedAt: string;
}

export type SafeUser = Omit<User, "passwordHash" | "inviteToken" | "inviteTokenExpiry">;

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
