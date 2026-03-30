import type { Role, Permission } from "./types";

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    "dashboard:view",
    "reports:view",
    "reports:export",
    "alerts:view",
    "settings:view",
    "settings:edit",
    "users:manage",
    "sentinel:configure",
    "sentinel:sync",
  ],
  viewer: [
    "dashboard:view",
    "reports:view",
    "reports:export",
    "alerts:view",
    "settings:view",
  ],
};

export function hasPermission(role: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

export function getPermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export const ROLE_LABELS: Record<Role, string> = {
  admin: "Administrator",
  viewer: "Viewer",
};
