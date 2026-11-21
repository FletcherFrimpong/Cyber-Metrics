import { test } from "node:test";
import assert from "node:assert/strict";
import { assignableRoles, canManage, hasPermission, getPermissions, ROLES } from "./rbac.ts";

test("each role has every permission of the roles below it", () => {
  for (let i = 0; i < ROLES.length - 1; i++) {
    const higher = getPermissions(ROLES[i]);
    for (const p of getPermissions(ROLES[i + 1])) assert.ok(higher.includes(p), `${ROLES[i]} lacks ${p}`);
  }
});

test("only admins and owners change settings, manage users or read the audit log", () => {
  for (const r of ROLES) {
    const expected = r === "owner" || r === "admin";
    assert.equal(hasPermission(r, "settings:edit"), expected);
    assert.equal(hasPermission(r, "users:manage"), expected);
    assert.equal(hasPermission(r, "audit:view"), expected);
  }
});

test("nobody can grant a role at or above their own, except an owner", () => {
  assert.deepEqual(assignableRoles("owner", false), ROLES);
  assert.deepEqual(assignableRoles("admin", false), ["manager", "analyst", "viewer"]);
  assert.deepEqual(assignableRoles("manager", false), ["analyst", "viewer"]);
});

test("analysts and viewers invite viewers only, and only when the workspace allows it", () => {
  assert.deepEqual(assignableRoles("analyst", true), ["viewer"]);
  assert.deepEqual(assignableRoles("viewer", true), ["viewer"]);
  assert.deepEqual(assignableRoles("analyst", false), []);
  assert.deepEqual(assignableRoles("viewer", false), []);
});

test("an admin cannot manage another admin or an owner; an owner can manage anyone", () => {
  assert.equal(canManage("admin", "admin"), false);
  assert.equal(canManage("admin", "owner"), false);
  assert.equal(canManage("admin", "manager"), true);
  assert.equal(canManage("owner", "owner"), true);
  assert.equal(canManage("manager", "viewer"), false);
});
