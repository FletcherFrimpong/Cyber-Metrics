import type { Role, Permission } from "./types";

// Roles from most to least privileged. A higher role has every permission of
// the roles below it.
export const ROLES: Role[] = ["owner", "admin", "manager", "analyst", "viewer"];

const RANK: Record<Role, number> = { owner: 5, admin: 4, manager: 3, analyst: 2, viewer: 1 };
export const rankOf = (role: Role): number => RANK[role] ?? 0;

const VIEWER: Permission[] = ["dashboard:view", "reports:view", "reports:export", "alerts:view", "settings:view"];
const ANALYST: Permission[] = [...VIEWER, "sentinel:sync"];
const MANAGER: Permission[] = [...ANALYST, "users:view", "team:access"];
const ADMIN: Permission[] = [...MANAGER, "users:manage", "settings:edit", "sentinel:configure", "audit:view"];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  owner: ADMIN,
  admin: ADMIN,
  manager: MANAGER,
  analyst: ANALYST,
  viewer: VIEWER,
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export const ROLE_LABELS: Record<Role, string> = {
  owner: "Owner",
  admin: "Administrator",
  manager: "Manager",
  analyst: "Analyst",
  viewer: "Viewer",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  owner: "Everything an administrator can do, plus managing administrators and other owners. There is always at least one.",
  admin: "Change settings and integrations, manage the team up to manager level, set the access policy and read the audit log.",
  manager: "See the whole team and invite analysts and viewers. Cannot change settings.",
  analyst: "View every report and alert, export reports and trigger a sync. Cannot change settings.",
  viewer: "Read-only access to reports, alerts and settings.",
};

/**
 * The roles `actor` may give to someone else.
 *   owner    any role, including owner
 *   admin    manager, analyst, viewer
 *   manager  analyst, viewer
 *   analyst, viewer   viewer only, and only when the workspace allows members to invite
 */
export function assignableRoles(actor: Role, membersCanInvite: boolean): Role[] {
  if (actor === "owner") return [...ROLES];
  if (actor === "admin") return ["manager", "analyst", "viewer"];
  if (actor === "manager") return ["analyst", "viewer"];
  return membersCanInvite ? ["viewer"] : [];
}

/** May `actor` change or remove a user whose current role is `target`? */
export function canManage(actor: Role, target: Role): boolean {
  if (!hasPermission(actor, "users:manage")) return false;
  return actor === "owner" || rankOf(actor) > rankOf(target);
}

export function isRole(value: unknown): value is Role {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}
