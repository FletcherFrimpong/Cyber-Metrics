"use client";

import { useState, useEffect } from "react";
import { Panel, Tag, Field, th, td } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Plus, Pencil, Trash2, X, Loader2, CheckCircle, Shield } from "lucide-react";

interface UserRecord {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: "admin" | "viewer";
  status: "active" | "pending";
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-50 border-red-200 text-red-600",
  viewer: "bg-neutral-500/10 border-neutral-500/30 text-neutral-500",
};

export default function UserManagement() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [userForm, setUserForm] = useState({
    displayName: "",
    email: "",
    role: "viewer" as "admin" | "viewer",
  });
  // Edit form needs extra fields
  const [editForm, setEditForm] = useState({
    displayName: "",
    email: "",
    password: "",
    role: "viewer" as "admin" | "viewer",
  });
  const [userError, setUserError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState<{
    email: string;
    emailSent: boolean;
    inviteUrl?: string;
  } | null>(null);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const res = await fetch("/api/auth/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      // silent
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const resetUserForm = () => {
    setUserForm({ displayName: "", email: "", role: "viewer" });
    setEditForm({ displayName: "", email: "", password: "", role: "viewer" });
    setEditingUser(null);
    setShowUserForm(false);
    setUserError("");
  };

  const handleSendInvite = async () => {
    setUserError("");
    setInviteSuccess(null);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userForm),
      });
      const data = await res.json();
      if (!res.ok) { setUserError(data.error); return; }
      const savedEmail = userForm.email;
      resetUserForm();
      setInviteSuccess({
        email: savedEmail,
        emailSent: data.emailSent ?? false,
        inviteUrl: data.inviteUrl,
      });
      fetchUsers();
    } catch (err: any) {
      setUserError(err.message);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    setUserError("");
    try {
      const payload: any = {
        id: editingUser.id,
        displayName: editForm.displayName,
        email: editForm.email,
        role: editForm.role,
      };
      if (editForm.password) payload.password = editForm.password;
      const res = await fetch("/api/auth/users", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setUserError(data.error); return; }
      resetUserForm();
      fetchUsers();
    } catch (err: any) {
      setUserError(err.message);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return;
    try {
      const res = await fetch(`/api/auth/users?id=${id}`, { method: "DELETE" });
      if (res.ok) fetchUsers();
    } catch {
      // silent
    }
  };

  const startEditUser = (user: UserRecord) => {
    setEditingUser(user);
    setEditForm({
      displayName: user.displayName,
      email: user.email,
      password: "",
      role: user.role,
    });
    setShowUserForm(true);
    setUserError("");
    setInviteSuccess(null);
  };

  return (
    <div className="space-y-3 w-full max-w-4xl pb-6">
      <p className="text-[13px] text-neutral-500">Invite and manage users, assign roles</p>

      <Panel
        icon={Users}
        title="Users"
        subtitle={`${users.length} with access`}
        action={
          !showUserForm ? (
            <Button
              size="sm"
              onClick={() => { resetUserForm(); setInviteSuccess(null); setShowUserForm(true); }}
              className="h-7 bg-neutral-900 hover:bg-neutral-800 text-white text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              Invite User
            </Button>
          ) : undefined
        }
      >
        <div className={inviteSuccess || showUserForm ? "p-3 space-y-3 border-b border-neutral-200" : ""}>
          {/* Invite success banner */}
          {inviteSuccess && (
            <div className={`p-3 rounded-md space-y-2 ${
              inviteSuccess.emailSent
                ? "bg-green-50 border border-green-200"
                : "bg-neutral-100 border border-neutral-200"
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-5 h-5 ${inviteSuccess.emailSent ? "text-green-600" : "text-neutral-900"}`} />
                <p className={`text-sm font-medium ${inviteSuccess.emailSent ? "text-green-600" : "text-neutral-900"}`}>
                  {inviteSuccess.emailSent
                    ? `Invite sent to ${inviteSuccess.email}`
                    : "Invite created"}
                </p>
              </div>

              {inviteSuccess.emailSent ? (
                <p className="text-[13px] text-neutral-500">
                  An email has been sent with a link to set up their account. The link expires in 72 hours.
                </p>
              ) : (
                <>
                  <p className="text-[13px] text-neutral-500">
                    {inviteSuccess.inviteUrl
                      ? "Email is not configured. Share this invite link manually:"
                      : "The invite was created but the email could not be sent."}
                  </p>
                  {inviteSuccess.inviteUrl && (
                    <div className="bg-white border border-neutral-200 rounded p-3">
                      <p className="text-sm text-neutral-900 tabular-nums break-all">{inviteSuccess.inviteUrl}</p>
                    </div>
                  )}
                </>
              )}
              <p className="text-xs text-neutral-500">The user will choose their own username and password when they accept.</p>
              <Button variant="ghost" size="sm" onClick={() => setInviteSuccess(null)} className="text-xs text-neutral-500">
                Dismiss
              </Button>
            </div>
          )}

          {/* Invite form (new user) */}
          {showUserForm && !editingUser && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-md p-3 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[13px] text-neutral-800 font-medium">Invite New User</p>
                <button onClick={resetUserForm} className="text-neutral-500 hover:text-neutral-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[13px] text-neutral-500">
                Enter their email and role. They'll receive a link to set up their own username and password.
              </p>

              {userError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {userError}
                </div>
              )}

              <div className="space-y-3">
                <Field label={<>Email</>}>
                  <Input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="user@company.com"
                    required
                    className="h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none"
                  />
              </Field>
                <Field label={<>Display Name <span className="text-neutral-400">(optional)</span></>}>
                  <Input
                    value={userForm.displayName}
                    onChange={(e) => setUserForm((f) => ({ ...f, displayName: e.target.value }))}
                    placeholder="Full name"
                    className="h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none"
                  />
              </Field>
              </div>
              <div>
                <label className="text-sm text-neutral-500 mb-1.5 block">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserForm((f) => ({ ...f, role: "admin" }))}
                    className={`p-3 rounded-md border text-left transition-colors ${
                      userForm.role === "admin"
                        ? "border-neutral-900 bg-neutral-100 text-neutral-900"
                        : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300"
                    }`}
                  >
                    <div className="text-sm font-medium">Administrator</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Full access, can edit settings and manage users</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserForm((f) => ({ ...f, role: "viewer" }))}
                    className={`p-3 rounded-md border text-left transition-colors ${
                      userForm.role === "viewer"
                        ? "border-neutral-900 bg-neutral-100 text-neutral-900"
                        : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300"
                    }`}
                  >
                    <div className="text-sm font-medium">Viewer</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Read-only access to dashboard, reports, and settings</div>
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button size="sm" onClick={handleSendInvite} disabled={!userForm.email} className="bg-neutral-900 hover:bg-neutral-800 text-white text-sm">
                  Send Invite
                </Button>
                <Button variant="ghost" size="sm" onClick={resetUserForm} className="text-sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Edit form (existing user) */}
          {showUserForm && editingUser && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-md p-3 space-y-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[13px] text-neutral-800 font-medium">Edit: {editingUser.username}</p>
                <button onClick={resetUserForm} className="text-neutral-500 hover:text-neutral-700">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {userError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {userError}
                </div>
              )}

              <div className="space-y-3">
                <Field label={<>Display Name</>}>
                  <Input
                    value={editForm.displayName}
                    onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                    placeholder="Full name"
                    className="h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none"
                  />
              </Field>
                <Field label={<>Email</>}>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="user@company.com"
                    className="h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none"
                  />
              </Field>
                <Field label={<>Reset Password <span className="text-neutral-400">(leave blank to keep)</span></>}>
                  <Input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Leave blank to keep current"
                    className="h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none"
                  />
              </Field>
              </div>
              <div>
                <label className="text-sm text-neutral-500 mb-1.5 block">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditForm((f) => ({ ...f, role: "admin" }))}
                    className={`p-3 rounded-md border text-left transition-colors ${
                      editForm.role === "admin"
                        ? "border-neutral-900 bg-neutral-100 text-neutral-900"
                        : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300"
                    }`}
                  >
                    <div className="text-sm font-medium">Administrator</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Full access, can edit settings and manage users</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditForm((f) => ({ ...f, role: "viewer" }))}
                    className={`p-3 rounded-md border text-left transition-colors ${
                      editForm.role === "viewer"
                        ? "border-neutral-900 bg-neutral-100 text-neutral-900"
                        : "border-neutral-200 bg-neutral-50 text-neutral-500 hover:border-neutral-300"
                    }`}
                  >
                    <div className="text-sm font-medium">Viewer</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Read-only access to dashboard, reports, and settings</div>
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button size="sm" onClick={handleUpdateUser} className="bg-neutral-900 hover:bg-neutral-800 text-white text-sm">
                  Update User
                </Button>
                <Button variant="ghost" size="sm" onClick={resetUserForm} className="text-sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Users list */}
        {usersLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
          </div>
        ) : users.length === 0 ? (
          <p className="text-[13px] text-neutral-500 text-center py-6">No users found</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>User</th>
                <th className={th}>Email</th>
                <th className={th}>Role</th>
                <th className={th}>Status</th>
                <th className={`${th} w-20`} />
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className={td}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-[11px] text-neutral-700 font-medium shrink-0">
                        {u.displayName?.charAt(0)?.toUpperCase() || u.username.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium truncate">{u.displayName || u.username}</span>
                      {u.status !== "pending" && <span className="text-neutral-400 truncate">{u.username}</span>}
                    </div>
                  </td>
                  <td className={`${td} text-neutral-600`}>{u.email || "—"}</td>
                  <td className={td}>
                    <Tag tone={u.role === "admin" ? "red" : "neutral"}>{ROLE_LABELS[u.role] || u.role}</Tag>
                  </td>
                  <td className={td}>
                    <Tag tone={u.status === "pending" ? "yellow" : "green"}>{u.status === "pending" ? "Pending" : "Active"}</Tag>
                  </td>
                  <td className={`${td} text-right`}>
                    <div className="flex items-center justify-end gap-0.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Edit ${u.username}`}
                        onClick={() => startEditUser(u)}
                        className="h-7 w-7 text-neutral-500 hover:text-neutral-900"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${u.username}`}
                        onClick={() => handleDeleteUser(u.id)}
                        className="h-7 w-7 text-neutral-500 hover:text-red-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      {/* RBAC legend */}
      <Panel icon={Shield} title="Role Permissions">
        <table className="w-full">
          <tbody>
            <tr>
              <td className={`${td} w-40`}><Tag tone="red">Administrator</Tag></td>
              <td className={`${td} text-neutral-600`}>Full access: dashboard, reports, alerts, settings (edit), user management, Sentinel config</td>
            </tr>
            <tr>
              <td className={td}><Tag>Viewer</Tag></td>
              <td className={`${td} text-neutral-600`}>Read-only: dashboard, reports, alerts, settings (view only)</td>
            </tr>
          </tbody>
        </table>
      </Panel>
    </div>
  );
}
