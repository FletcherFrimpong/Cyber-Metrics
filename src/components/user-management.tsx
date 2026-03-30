"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Plus, Pencil, Trash2, X, Loader2, CheckCircle } from "lucide-react";

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
  admin: "bg-red-500/10 border-red-500/30 text-red-400",
  viewer: "bg-neutral-500/10 border-neutral-500/30 text-neutral-400",
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
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-2xl font-semibold text-white">User Management</h2>
        <p className="text-base text-neutral-500">Invite and manage users, assign roles</p>
      </div>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="pb-4 pt-5 px-6">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-neutral-200 uppercase tracking-wide flex items-center gap-2">
              <Users className="w-5 h-5" />
              Users
              <Badge variant="outline" className="ml-2 text-xs text-neutral-400 border-neutral-700">
                {users.length}
              </Badge>
            </CardTitle>
            {!showUserForm && (
              <Button
                onClick={() => { resetUserForm(); setInviteSuccess(null); setShowUserForm(true); }}
                className="bg-orange-600 hover:bg-orange-700 text-white text-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Invite User
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-5">
          {/* Invite success banner */}
          {inviteSuccess && (
            <div className={`p-4 rounded-md space-y-3 ${
              inviteSuccess.emailSent
                ? "bg-green-500/10 border border-green-500/20"
                : "bg-orange-500/10 border border-orange-500/20"
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-5 h-5 ${inviteSuccess.emailSent ? "text-green-400" : "text-orange-400"}`} />
                <p className={`text-sm font-medium ${inviteSuccess.emailSent ? "text-green-400" : "text-orange-400"}`}>
                  {inviteSuccess.emailSent
                    ? `Invite sent to ${inviteSuccess.email}`
                    : "Invite created"}
                </p>
              </div>

              {inviteSuccess.emailSent ? (
                <p className="text-sm text-neutral-400">
                  An email has been sent with a link to set up their account. The link expires in 72 hours.
                </p>
              ) : (
                <>
                  <p className="text-sm text-neutral-400">
                    {inviteSuccess.inviteUrl
                      ? "Email is not configured. Share this invite link manually:"
                      : "The invite was created but the email could not be sent."}
                  </p>
                  {inviteSuccess.inviteUrl && (
                    <div className="bg-neutral-900 border border-neutral-700 rounded p-3">
                      <p className="text-sm text-orange-400 font-mono break-all">{inviteSuccess.inviteUrl}</p>
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
            <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-md p-5 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-neutral-300 font-medium">Invite New User</p>
                <button onClick={resetUserForm} className="text-neutral-500 hover:text-neutral-300">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-neutral-500">
                Enter their email and role. They'll receive a link to set up their own username and password.
              </p>

              {userError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                  {userError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-neutral-400 mb-1.5 block">Email</label>
                  <Input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="user@company.com"
                    required
                    className="bg-neutral-800 border-neutral-700 text-white text-base h-11"
                  />
                </div>
                <div>
                  <label className="text-sm text-neutral-400 mb-1.5 block">Display Name <span className="text-neutral-600">(optional)</span></label>
                  <Input
                    value={userForm.displayName}
                    onChange={(e) => setUserForm((f) => ({ ...f, displayName: e.target.value }))}
                    placeholder="Full name"
                    className="bg-neutral-800 border-neutral-700 text-white text-base h-11"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-neutral-400 mb-1.5 block">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserForm((f) => ({ ...f, role: "admin" }))}
                    className={`p-3 rounded-md border text-left transition-colors ${
                      userForm.role === "admin"
                        ? "border-orange-500 bg-orange-500/10 text-white"
                        : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600"
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
                        ? "border-orange-500 bg-orange-500/10 text-white"
                        : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600"
                    }`}
                  >
                    <div className="text-sm font-medium">Viewer</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Read-only access to dashboard, reports, and settings</div>
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleSendInvite} disabled={!userForm.email} className="bg-orange-600 hover:bg-orange-700 text-white text-sm">
                  Send Invite
                </Button>
                <Button variant="ghost" onClick={resetUserForm} className="text-sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Edit form (existing user) */}
          {showUserForm && editingUser && (
            <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-md p-5 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm text-neutral-300 font-medium">Edit: {editingUser.username}</p>
                <button onClick={resetUserForm} className="text-neutral-500 hover:text-neutral-300">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {userError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                  {userError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-neutral-400 mb-1.5 block">Display Name</label>
                  <Input
                    value={editForm.displayName}
                    onChange={(e) => setEditForm((f) => ({ ...f, displayName: e.target.value }))}
                    placeholder="Full name"
                    className="bg-neutral-800 border-neutral-700 text-white text-base h-11"
                  />
                </div>
                <div>
                  <label className="text-sm text-neutral-400 mb-1.5 block">Email</label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="user@company.com"
                    className="bg-neutral-800 border-neutral-700 text-white text-base h-11"
                  />
                </div>
                <div>
                  <label className="text-sm text-neutral-400 mb-1.5 block">
                    Reset Password <span className="text-neutral-600">(leave blank to keep)</span>
                  </label>
                  <Input
                    type="password"
                    value={editForm.password}
                    onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder="Leave blank to keep current"
                    className="bg-neutral-800 border-neutral-700 text-white text-base h-11"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm text-neutral-400 mb-1.5 block">Role</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditForm((f) => ({ ...f, role: "admin" }))}
                    className={`p-3 rounded-md border text-left transition-colors ${
                      editForm.role === "admin"
                        ? "border-orange-500 bg-orange-500/10 text-white"
                        : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600"
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
                        ? "border-orange-500 bg-orange-500/10 text-white"
                        : "border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600"
                    }`}
                  >
                    <div className="text-sm font-medium">Viewer</div>
                    <div className="text-xs text-neutral-500 mt-0.5">Read-only access to dashboard, reports, and settings</div>
                  </button>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button onClick={handleUpdateUser} className="bg-orange-600 hover:bg-orange-700 text-white text-sm">
                  Update User
                </Button>
                <Button variant="ghost" onClick={resetUserForm} className="text-sm">
                  Cancel
                </Button>
              </div>
            </div>
          )}

          {/* Users list */}
          {usersLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
            </div>
          ) : users.length === 0 ? (
            <p className="text-sm text-neutral-500 text-center py-6">No users found</p>
          ) : (
            <div className="space-y-3">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between p-4 bg-neutral-800/50 border border-neutral-700/50 rounded-md"
                >
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-neutral-700 flex items-center justify-center text-sm text-neutral-300 font-medium shrink-0">
                      {u.displayName?.charAt(0)?.toUpperCase() || u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-base text-white truncate">{u.displayName || u.username}</span>
                        <Badge variant="outline" className={`text-xs ${ROLE_COLORS[u.role] || ""}`}>
                          {ROLE_LABELS[u.role] || u.role}
                        </Badge>
                        {u.status === "pending" && (
                          <Badge variant="outline" className="text-xs bg-yellow-500/10 border-yellow-500/30 text-yellow-400">
                            Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-neutral-500 truncate">
                        {u.status === "pending" ? u.email : `${u.username}${u.email ? ` - ${u.email}` : ""}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-3">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => startEditUser(u)}
                      className="h-9 w-9 text-neutral-500 hover:text-orange-400"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteUser(u.id)}
                      className="h-9 w-9 text-neutral-500 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* RBAC legend */}
          <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-md p-4">
            <p className="text-sm text-neutral-300 font-medium mb-3">Role Permissions</p>
            <div className="space-y-2 text-sm text-neutral-400">
              <div><span className="text-red-400 font-medium">Administrator</span> — Full access: dashboard, reports, alerts, settings (edit), user management, Sentinel config</div>
              <div><span className="text-neutral-300 font-medium">Viewer</span> — Read-only: dashboard, reports, alerts, settings (view only)</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
