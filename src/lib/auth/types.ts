export type Role = "owner" | "admin" | "manager" | "analyst" | "viewer";
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
  /** User id of whoever invited this person; absent for sign-ups and the first owner. */
  invitedBy?: string;
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
  | "users:view"      // see the whole team
  | "users:manage"    // change roles, remove people, set the access policy
  | "team:access"     // may open the Team screen (granted to anyone who can view or invite)
  | "audit:view"
  | "sentinel:configure"
  | "sentinel:sync";
