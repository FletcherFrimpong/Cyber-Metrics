"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Shield, Loader2, CheckCircle, XCircle, ExternalLink, Users, Plus, Pencil, Trash2, X } from "lucide-react";
import { useAuth } from "@/components/auth-provider";

interface SentinelFormState {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  workspaceId: string;
}

interface UserRecord {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: "admin" | "analyst" | "viewer";
  createdAt: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrator",
  analyst: "Security Analyst",
  viewer: "Viewer",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "bg-red-500/10 border-red-500/30 text-red-400",
  analyst: "bg-blue-500/10 border-blue-500/30 text-blue-400",
  viewer: "bg-neutral-500/10 border-neutral-500/30 text-neutral-400",
};

export default function SettingsPage() {
  const { hasPermission } = useAuth();
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [sentinel, setSentinel] = useState<SentinelFormState>({
    tenantId: "",
    clientId: "",
    clientSecret: "",
    workspaceId: "",
  });
  const [sentinelConnected, setSentinelConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);

  // User management state
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [userForm, setUserForm] = useState({
    username: "",
    displayName: "",
    email: "",
    password: "",
    role: "analyst" as "admin" | "analyst" | "viewer",
  });
  const [userError, setUserError] = useState("");

  const fetchConnectionStatus = async () => {
    try {
      const res = await fetch("/api/sentinel/status");
      if (res.ok) {
        const status = await res.json();
        setConnectionStatus(status);
        setSentinelConnected(status.connected || false);
      }
    } catch (err) {
      console.error("Failed to fetch connection status:", err);
    }
  };

  // Load current settings
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings");
        const settings = await res.json();

        setInvestmentAmount(settings.investmentAmount ? String(settings.investmentAmount) : "");
        if (settings.sentinel) {
          setSentinel({
            tenantId: settings.sentinel.tenantId || "",
            clientId: settings.sentinel.clientId || "",
            clientSecret: settings.sentinel.clientSecret || "",
            workspaceId: settings.sentinel.workspaceId || "",
          });
          setSentinelConnected(settings.sentinel.connected || false);
          // Fetch live connection status if credentials are configured
          if (settings.sentinel.tenantId && settings.sentinel.clientId) {
            fetchConnectionStatus();
          }
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Save settings
  const handleSave = async () => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          investmentAmount: parseFloat(investmentAmount) || 0,
          sentinel: sentinel.tenantId
            ? {
                tenantId: sentinel.tenantId,
                clientId: sentinel.clientId,
                clientSecret: sentinel.clientSecret,
                workspaceId: sentinel.workspaceId,
              }
            : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveMessage("Settings saved");
        setTimeout(() => setSaveMessage(null), 3000);
        // Refresh connection status after saving
        if (sentinel.tenantId && sentinel.clientId) {
          fetchConnectionStatus();
        }
      }
    } catch (err: any) {
      setSaveMessage("Failed to save: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Test Sentinel connection
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/sentinel/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenantId: sentinel.tenantId,
          clientId: sentinel.clientId,
          clientSecret: sentinel.clientSecret,
        }),
      });
      const data = await res.json();
      setTestResult({ success: data.success, message: data.message });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  // Fetch users (admin only)
  const fetchUsers = async () => {
    if (!hasPermission("users:manage")) return;
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
    if (hasPermission("users:manage")) fetchUsers();
  }, []);

  const resetUserForm = () => {
    setUserForm({ username: "", displayName: "", email: "", password: "", role: "analyst" });
    setEditingUser(null);
    setShowUserForm(false);
    setUserError("");
  };

  const handleSaveUser = async () => {
    setUserError("");
    try {
      if (editingUser) {
        // Update
        const payload: any = {
          id: editingUser.id,
          displayName: userForm.displayName,
          email: userForm.email,
          role: userForm.role,
        };
        if (userForm.password) payload.password = userForm.password;
        const res = await fetch("/api/auth/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) { setUserError(data.error); return; }
      } else {
        // Create
        const res = await fetch("/api/auth/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(userForm),
        });
        const data = await res.json();
        if (!res.ok) { setUserError(data.error); return; }
      }
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
    setUserForm({
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      password: "",
      role: user.role,
    });
    setShowUserForm(true);
    setUserError("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <div>
        <h2 className="text-2xl font-semibold text-white">Settings</h2>
        <p className="text-base text-neutral-500">Configure your security investment and SIEM connection</p>
      </div>

      {/* Investment Amount */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="pb-4 pt-5 px-6">
          <CardTitle className="text-base font-semibold text-neutral-200 uppercase tracking-wide flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Security Investment
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <p className="text-sm text-neutral-400 mb-4">
            Enter your total annual security investment (EDR licensing, SOC operations, tooling).
            This is used to calculate ROI and net benefit.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-base">$</span>
              <Input
                type="number"
                placeholder="e.g. 700000"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                className="pl-7 bg-neutral-800 border-neutral-700 text-white text-base h-11"
              />
            </div>
            <span className="text-sm text-neutral-500">per year</span>
          </div>
          {investmentAmount && parseFloat(investmentAmount) > 0 && (
            <p className="text-sm text-neutral-500 mt-3">
              = ${(parseFloat(investmentAmount) / 1000).toFixed(0)}K/year, ${(parseFloat(investmentAmount) / 4 / 1000).toFixed(0)}K/quarter
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sentinel Connection */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="pb-4 pt-5 px-6">
          <CardTitle className="text-base font-semibold text-neutral-200 uppercase tracking-wide flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Microsoft Sentinel Connection
            {sentinelConnected && (
              <Badge variant="outline" className="ml-2 bg-green-500/10 border-green-500/30 text-green-400 text-xs">
                Connected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6 space-y-5">
          <p className="text-sm text-neutral-400">
            Connect your Microsoft Sentinel workspace to ingest resolved incidents.
            SignalFoundry will pull alerts from all your connected security tools (Defender, SentinelOne, CrowdStrike, etc.)
            and quantify the cyber risk based on true positive detections.
          </p>

          {/* Setup instructions */}
          <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-md p-4">
            <p className="text-sm text-neutral-300 font-medium mb-2">Setup steps:</p>
            <ol className="text-sm text-neutral-400 space-y-1.5 list-decimal list-inside">
              <li>Go to Azure Portal → App Registrations → New Registration</li>
              <li>Add API permission: Microsoft Graph → SecurityIncident.Read.All</li>
              <li>Add API permission: Microsoft Graph → SecurityAlert.Read.All</li>
              <li>Grant admin consent for the permissions</li>
              <li>Create a client secret under Certificates & Secrets</li>
              <li>Copy the Tenant ID, Client ID, and Client Secret below</li>
            </ol>
          </div>

          {/* Credentials form */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-neutral-400 mb-1.5 block">Tenant ID</label>
              <Input
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={sentinel.tenantId}
                onChange={(e) => setSentinel((s) => ({ ...s, tenantId: e.target.value }))}
                className="bg-neutral-800 border-neutral-700 text-white text-base font-mono h-11"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 mb-1.5 block">Client ID (Application ID)</label>
              <Input
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={sentinel.clientId}
                onChange={(e) => setSentinel((s) => ({ ...s, clientId: e.target.value }))}
                className="bg-neutral-800 border-neutral-700 text-white text-base font-mono h-11"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 mb-1.5 block">Client Secret</label>
              <Input
                type="password"
                placeholder="Enter client secret"
                value={sentinel.clientSecret}
                onChange={(e) => setSentinel((s) => ({ ...s, clientSecret: e.target.value }))}
                className="bg-neutral-800 border-neutral-700 text-white text-base font-mono h-11"
              />
            </div>
            <div>
              <label className="text-sm text-neutral-400 mb-1.5 block">Workspace ID <span className="text-neutral-600">(optional)</span></label>
              <Input
                placeholder="Log Analytics workspace ID"
                value={sentinel.workspaceId}
                onChange={(e) => setSentinel((s) => ({ ...s, workspaceId: e.target.value }))}
                className="bg-neutral-800 border-neutral-700 text-white text-base font-mono h-11"
              />
            </div>
          </div>

          {/* Test connection */}
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !sentinel.tenantId || !sentinel.clientId || !sentinel.clientSecret}
              className="text-sm"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
            {testResult && (
              <div className={`flex items-center gap-2 text-sm ${testResult.success ? "text-green-400" : "text-red-400"}`}>
                {testResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {testResult.message}
              </div>
            )}
          </div>

          {/* Connection status */}
          {connectionStatus && connectionStatus.connected && (
            <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-md p-4">
              <p className="text-sm text-neutral-300 font-medium mb-3">Ingestion Status</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Status</span>
                  <span className="text-green-400">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Last Poll</span>
                  <span className="text-neutral-300">{connectionStatus.lastPollTime || "Pending..."}</span>
                </div>
                {connectionStatus.categoryBreakdown && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">EDR Alerts</span>
                      <span className="text-neutral-300">{connectionStatus.categoryBreakdown.edr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Email Alerts</span>
                      <span className="text-neutral-300">{connectionStatus.categoryBreakdown.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Network Alerts</span>
                      <span className="text-neutral-300">{connectionStatus.categoryBreakdown.network}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Web Alerts</span>
                      <span className="text-neutral-300">{connectionStatus.categoryBreakdown.web}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Cloud Alerts</span>
                      <span className="text-neutral-300">{connectionStatus.categoryBreakdown.cloud}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save button */}
      <div className="flex items-center gap-4">
        <Button size="lg" onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white text-sm">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
        {saveMessage && (
          <span className="text-sm text-green-400">{saveMessage}</span>
        )}
      </div>

      {/* User Management — Admin only */}
      {hasPermission("users:manage") && (
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-4 pt-5 px-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-neutral-200 uppercase tracking-wide flex items-center gap-2">
                <Users className="w-5 h-5" />
                User Management
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => { resetUserForm(); setShowUserForm(true); }}
                className="text-sm"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add User
              </Button>
            </div>
          </CardHeader>
          <CardContent className="px-6 pb-6 space-y-5">
            {/* User form */}
            {showUserForm && (
              <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-md p-5 space-y-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-neutral-300 font-medium">
                    {editingUser ? `Edit: ${editingUser.username}` : "New User"}
                  </p>
                  <button onClick={resetUserForm} className="text-neutral-500 hover:text-neutral-300">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {userError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                    {userError}
                  </div>
                )}

                {!editingUser && (
                  <div>
                    <label className="text-sm text-neutral-400 mb-1.5 block">Username</label>
                    <Input
                      value={userForm.username}
                      onChange={(e) => setUserForm((f) => ({ ...f, username: e.target.value }))}
                      placeholder="username"
                      className="bg-neutral-800 border-neutral-700 text-white text-base h-11"
                    />
                  </div>
                )}
                <div>
                  <label className="text-sm text-neutral-400 mb-1.5 block">Display Name</label>
                  <Input
                    value={userForm.displayName}
                    onChange={(e) => setUserForm((f) => ({ ...f, displayName: e.target.value }))}
                    placeholder="Full name"
                    className="bg-neutral-800 border-neutral-700 text-white text-base h-11"
                  />
                </div>
                <div>
                  <label className="text-sm text-neutral-400 mb-1.5 block">Email</label>
                  <Input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="user@company.com"
                    className="bg-neutral-800 border-neutral-700 text-white text-base h-11"
                  />
                </div>
                <div>
                  <label className="text-sm text-neutral-400 mb-1.5 block">
                    Password {editingUser && <span className="text-neutral-600">(leave blank to keep current)</span>}
                  </label>
                  <Input
                    type="password"
                    value={userForm.password}
                    onChange={(e) => setUserForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder={editingUser ? "Leave blank to keep" : "Min. 8 characters"}
                    className="bg-neutral-800 border-neutral-700 text-white text-base h-11"
                  />
                </div>
                <div>
                  <label className="text-sm text-neutral-400 mb-1.5 block">Role</label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value as any }))}
                    className="w-full bg-neutral-800 border border-neutral-700 rounded-md px-3 py-2.5 text-base text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="admin">Administrator</option>
                    <option value="analyst">Security Analyst</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-2">
                  <Button onClick={handleSaveUser} className="bg-orange-600 hover:bg-orange-700 text-white text-sm">
                    {editingUser ? "Update User" : "Create User"}
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
                        <div className="flex items-center gap-2">
                          <span className="text-base text-white truncate">{u.displayName || u.username}</span>
                          <Badge variant="outline" className={`text-xs ${ROLE_COLORS[u.role] || ""}`}>
                            {ROLE_LABELS[u.role] || u.role}
                          </Badge>
                        </div>
                        <p className="text-sm text-neutral-500 truncate">{u.username} {u.email ? `- ${u.email}` : ""}</p>
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
                <div><span className="text-red-400 font-medium">Administrator</span> — Full access: dashboard, reports, alerts, settings, users, Sentinel config</div>
                <div><span className="text-blue-400 font-medium">Security Analyst</span> — View dashboard, reports, alerts, settings. Can export reports and trigger syncs</div>
                <div><span className="text-neutral-300 font-medium">Viewer</span> — Read-only: dashboard, reports, alerts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
