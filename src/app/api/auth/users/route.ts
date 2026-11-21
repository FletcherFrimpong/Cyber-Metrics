import { NextRequest, NextResponse } from "next/server";
import { requireAuth, isAuthError } from "@/lib/auth/api-guard";
import { getAllUsers, getUserById, updateUser, deleteUser, countOwners } from "@/lib/auth/user-store";
import { hasPermission, assignableRoles, canManage, isRole, ROLE_LABELS } from "@/lib/auth/rbac";
import { getTeamPolicy } from "@/lib/settings-store";
import { audit } from "@/lib/audit-log";

// GET: the team. Managers and above see everyone. Anyone else sees themselves
// and the people they invited, so they can follow up on their own invitations.
export async function GET() {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const all = getAllUsers();
  const names = new Map(all.map((u) => [u.id, u.displayName || u.username]));
  const visible = hasPermission(auth.role, "users:view")
    ? all
    : all.filter((u) => u.id === auth.userId || u.invitedBy === auth.userId);

  return NextResponse.json({
    users: visible.map((u) => ({
      ...u,
      invitedByName: u.invitedBy ? names.get(u.invitedBy) || "Removed user" : null,
      // what the caller may do with this person
      canEdit: u.id !== auth.userId && canManage(auth.role, u.role),
      canRemove:
        u.id !== auth.userId &&
        (canManage(auth.role, u.role) || (u.status === "pending" && u.invitedBy === auth.userId)),
    })),
    seesEveryone: hasPermission(auth.role, "users:view"),
    assignableRoles: assignableRoles(auth.role, getTeamPolicy().membersCanInvite),
  });
}

// PUT { id, displayName?, email?, role?, password? }: change someone else's details or role.
export async function PUT(request: NextRequest) {
  const auth = await requireAuth("users:manage");
  if (isAuthError(auth)) return auth;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { id, displayName, email, role, password } = body || {};
  if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 });

  const target = getUserById(id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (id === auth.userId && role && role !== target.role) {
    return NextResponse.json({ error: "You cannot change your own role" }, { status: 400 });
  }
  if (id !== auth.userId && !canManage(auth.role, target.role)) {
    return NextResponse.json({ error: `Your role cannot manage ${ROLE_LABELS[target.role]} accounts` }, { status: 403 });
  }
  if (role !== undefined && role !== target.role) {
    if (!isRole(role)) return NextResponse.json({ error: "Invalid role" }, { status: 400 });
    if (!assignableRoles(auth.role, getTeamPolicy().membersCanInvite).includes(role)) {
      return NextResponse.json({ error: `Your role cannot grant the ${ROLE_LABELS[role]} role` }, { status: 403 });
    }
    if (target.role === "owner" && countOwners() <= 1) {
      return NextResponse.json({ error: "A workspace must keep at least one owner. Make someone else an owner first." }, { status: 400 });
    }
  }
  if (password && String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // updateUser changes the stored record in place, so note the old role first
  const previousRole = target.role;
  const user = await updateUser(id, { displayName, email, role, password });
  if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const roleChanged = role !== undefined && role !== previousRole;
  if (roleChanged) {
    audit({ actor: auth.username, actorRole: auth.role, action: "user.role_change", target: user.username, detail: `${ROLE_LABELS[previousRole]} → ${ROLE_LABELS[user.role]}` });
  }
  if (password) audit({ actor: auth.username, actorRole: auth.role, action: "user.password_reset", target: target.username });
  if (!roleChanged && !password) audit({ actor: auth.username, actorRole: auth.role, action: "user.update", target: target.username });

  return NextResponse.json({ success: true, user });
}

// DELETE ?id=: remove someone, or withdraw an invitation you sent.
export async function DELETE(request: NextRequest) {
  const auth = await requireAuth();
  if (isAuthError(auth)) return auth;

  const id = new URL(request.url).searchParams.get("id");
  if (!id) return NextResponse.json({ error: "User ID is required" }, { status: 400 });
  if (id === auth.userId) return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });

  const target = getUserById(id);
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const ownPendingInvite = target.status === "pending" && target.invitedBy === auth.userId;
  if (!ownPendingInvite && !canManage(auth.role, target.role)) {
    return NextResponse.json({ error: "Your role cannot remove this person" }, { status: 403 });
  }
  if (target.role === "owner" && target.status === "active" && countOwners() <= 1) {
    return NextResponse.json({ error: "A workspace must keep at least one owner" }, { status: 400 });
  }

  deleteUser(id);
  audit({
    actor: auth.username,
    actorRole: auth.role,
    action: target.status === "pending" ? "user.invite_withdrawn" : "user.remove",
    target: target.status === "pending" ? target.email : target.username,
    detail: ROLE_LABELS[target.role],
  });
  return NextResponse.json({ success: true });
}
