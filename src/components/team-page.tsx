"use client";

import { useCallback, useEffect, useState } from "react";
import { Panel, Tag, Field, th, td } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Users, UserPlus, Pencil, Trash2, Loader2, CheckCircle, Copy, ShieldCheck, KeyRound, ScrollText, Check, Minus } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { ROLES, ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/lib/auth/rbac";
import type { Role } from "@/lib/auth/types";

interface Member {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: Role;
  status: "active" | "pending";
  createdAt: string;
  invitedByName: string | null;
  canEdit: boolean;
  canRemove: boolean;
}

interface Policy {
  signup: "open" | "domain" | "invite_only";
  allowedDomains: string[];
  membersCanInvite: boolean;
}

interface AuditEntry {
  id: number;
  at: string;
  actor: string;
  actorRole: string;
  action: string;
  target: string;
  detail: string;
}

const inputClass = "h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none";
const selectClass = "h-8 rounded-md border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900";
const ROLE_TONE: Record<Role, "red" | "orange" | "blue" | "green" | "neutral"> = {
  owner: "red",
  admin: "orange",
  manager: "blue",
  analyst: "green",
  viewer: "neutral",
};

// What each role can do, for the reference table.
const CAPABILITIES: { label: string; min: Role }[] = [
  { label: "View reports, alerts and settings", min: "viewer" },
  { label: "Export reports", min: "viewer" },
  { label: "Trigger a sync of a data source", min: "analyst" },
  { label: "See the whole team", min: "manager" },
  { label: "Invite analysts and viewers", min: "manager" },
  { label: "Change settings and integrations", min: "admin" },
  { label: "Invite and manage managers", min: "admin" },
  { label: "Set the access policy, read the audit log", min: "admin" },
  { label: "Manage administrators and owners", min: "owner" },
];
const RANK: Record<Role, number> = { owner: 5, admin: 4, manager: 3, analyst: 2, viewer: 1 };

const ACTION_LABELS: Record<string, string> = {
  "auth.login": "Signed in",
  "auth.login_failed": "Failed sign-in",
  "user.signup": "Signed up",
  "user.invite": "Invited",
  "user.invite_accepted": "Accepted invitation",
  "user.invite_withdrawn": "Withdrew invitation",
  "user.role_change": "Changed role",
  "user.password_reset": "Reset password",
  "user.update": "Updated profile",
  "user.remove": "Removed",
  "team.policy_update": "Changed access policy",
  "settings.update": "Changed settings",
  "integration.connect": "Connected integration",
  "integration.disconnect": "Disconnected integration",
};

async function api(url: string, method = "GET", body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export default function TeamPage() {
  const { user, hasPermission } = useAuth();
  const canManage = hasPermission("users:manage");
  const canAudit = hasPermission("audit:view");

  const [members, setMembers] = useState<Member[] | null>(null);
  const [seesEveryone, setSeesEveryone] = useState(false);
  const [assignable, setAssignable] = useState<Role[]>([]);
  const [policy, setPolicy] = useState<Policy | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [u, p] = await Promise.all([api("/api/auth/users"), api("/api/team/policy")]);
      setMembers(u.users);
      setSeesEveryone(u.seesEveryone);
      setAssignable(u.assignableRoles || []);
      setPolicy(p.policy);
      if (canAudit) setAudit((await api("/api/audit?limit=50")).entries);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, [canAudit]);

  useEffect(() => { load(); }, [load]);

  // ── Invite ──────────────────────────────────────────────────────────────
  const [inviteOpen, setInviteOpen] = useState(false);
  const [invite, setInvite] = useState({ email: "", displayName: "", role: "viewer" as Role });
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteResult, setInviteResult] = useState<{ email: string; emailSent: boolean; inviteUrl?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const openInvite = () => {
    setInvite({ email: "", displayName: "", role: assignable.includes("viewer") ? "viewer" : assignable[assignable.length - 1] });
    setInviteError(null);
    setInviteResult(null);
    setCopied(false);
    setInviteOpen(true);
  };

  const sendInvite = async () => {
    setInviteBusy(true);
    setInviteError(null);
    try {
      const data = await api("/api/auth/invite", "POST", invite);
      setInviteResult({ email: invite.email, emailSent: data.emailSent, inviteUrl: data.inviteUrl });
      load();
    } catch (err: any) {
      setInviteError(err.message);
    } finally {
      setInviteBusy(false);
    }
  };

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  // ── Edit / remove ───────────────────────────────────────────────────────
  const [editing, setEditing] = useState<Member | null>(null);
  const [edit, setEdit] = useState({ displayName: "", email: "", role: "viewer" as Role, password: "" });
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [removing, setRemoving] = useState<Member | null>(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const startEdit = (m: Member) => {
    setEditing(m);
    setEdit({ displayName: m.displayName, email: m.email, role: m.role, password: "" });
    setEditError(null);
  };

  const saveEdit = async () => {
    if (!editing) return;
    setEditBusy(true);
    setEditError(null);
    try {
      await api("/api/auth/users", "PUT", {
        id: editing.id,
        displayName: edit.displayName,
        email: edit.email,
        role: edit.role !== editing.role ? edit.role : undefined,
        password: edit.password || undefined,
      });
      setEditing(null);
      load();
    } catch (err: any) {
      setEditError(err.message);
    } finally {
      setEditBusy(false);
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    setRemoveBusy(true);
    setRemoveError(null);
    try {
      await api(`/api/auth/users?id=${encodeURIComponent(removing.id)}`, "DELETE");
      setRemoving(null);
      load();
    } catch (err: any) {
      setRemoveError(err.message);
    } finally {
      setRemoveBusy(false);
    }
  };

  // ── Access policy ───────────────────────────────────────────────────────
  const [draft, setDraft] = useState<Policy | null>(null);
  const [domains, setDomains] = useState("");
  const [policyBusy, setPolicyBusy] = useState(false);
  const [policyMsg, setPolicyMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Follow the saved policy only when its content changes, so reloading the
  // team list (after an invite, say) never discards unsaved policy edits.
  const savedPolicy = policy ? JSON.stringify(policy) : "";
  useEffect(() => {
    if (!savedPolicy) return;
    const saved: Policy = JSON.parse(savedPolicy);
    setDraft(saved);
    setDomains(saved.allowedDomains.join(", "));
  }, [savedPolicy]);

  const policyDirty =
    !!draft && !!policy &&
    (draft.signup !== policy.signup || draft.membersCanInvite !== policy.membersCanInvite || domains !== policy.allowedDomains.join(", "));

  const savePolicy = async () => {
    if (!draft) return;
    setPolicyBusy(true);
    setPolicyMsg(null);
    try {
      const data = await api("/api/team/policy", "POST", {
        signup: draft.signup,
        membersCanInvite: draft.membersCanInvite,
        allowedDomains: domains.split(/[\s,]+/).filter(Boolean),
      });
      setPolicy(data.policy);
      setPolicyMsg({ ok: true, text: "Access policy saved" });
      load();
    } catch (err: any) {
      setPolicyMsg({ ok: false, text: err.message });
    } finally {
      setPolicyBusy(false);
    }
  };

  if (error) return <p className="text-[13px] text-red-600">{error}</p>;
  if (!members || !policy || !draft) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
      </div>
    );
  }

  const active = members.filter((m) => m.status === "active").length;
  const pending = members.length - active;
  const editableRoles = editing ? [...new Set([editing.role, ...assignable])].sort((a, b) => RANK[b] - RANK[a]) : [];
  const myRole = (user?.role || "viewer") as Role;

  return (
    <div className="space-y-3 w-full max-w-6xl pb-6">
      <p className="text-[13px] text-neutral-500">
        You are signed in as <span className="text-neutral-900 font-medium">{user?.displayName}</span>, {ROLE_LABELS[myRole]}.{" "}
        {assignable.length > 0
          ? `You can invite: ${assignable.map((r) => ROLE_LABELS[r]).join(", ")}.`
          : "Your role cannot invite teammates."}
      </p>

      {/* Members */}
      <Panel
        icon={Users}
        title={seesEveryone ? "Team" : "People you invited"}
        subtitle={`${active} active${pending ? `, ${pending} pending` : ""}`}
        action={
          assignable.length > 0 ? (
            <Button size="sm" onClick={openInvite} className="h-7 bg-neutral-900 hover:bg-neutral-800 text-white text-xs">
              <UserPlus className="w-3.5 h-3.5" />
              Invite teammate
            </Button>
          ) : undefined
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr>
                <th className={th}>Person</th>
                <th className={th}>Email</th>
                <th className={th}>Role</th>
                <th className={th}>Status</th>
                <th className={th}>Invited by</th>
                <th className={`${th} w-20`} />
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id}>
                  <td className={td}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-neutral-100 flex items-center justify-center text-[11px] text-neutral-700 font-medium shrink-0">
                        {(m.displayName || m.username).charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium truncate">{m.displayName || m.username}</span>
                      {m.status === "active" && <span className="text-neutral-400 truncate">{m.username}</span>}
                      {m.id === user?.id && <Tag>You</Tag>}
                    </div>
                  </td>
                  <td className={`${td} text-neutral-600`}>{m.email || "—"}</td>
                  <td className={td}><Tag tone={ROLE_TONE[m.role]}>{ROLE_LABELS[m.role]}</Tag></td>
                  <td className={td}><Tag tone={m.status === "pending" ? "yellow" : "green"}>{m.status === "pending" ? "Invited" : "Active"}</Tag></td>
                  <td className={`${td} text-neutral-500`}>{m.invitedByName || "—"}</td>
                  <td className={`${td} text-right`}>
                    <div className="flex items-center justify-end gap-0.5">
                      {m.canEdit && (
                        <Button variant="ghost" size="icon" aria-label={`Edit ${m.displayName || m.username}`} onClick={() => startEdit(m)} className="h-7 w-7 text-neutral-500 hover:text-neutral-900">
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {m.canRemove && (
                        <Button variant="ghost" size="icon" aria-label={`Remove ${m.displayName || m.username}`} onClick={() => { setRemoveError(null); setRemoving(m); }} className="h-7 w-7 text-neutral-500 hover:text-red-600">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 items-start">
        {/* Roles */}
        <Panel icon={ShieldCheck} title="Roles" subtitle="What each role can do">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr>
                  <th className={th}>Capability</th>
                  {ROLES.map((r) => (
                    <th key={r} className={`${th} text-center ${r === myRole ? "text-neutral-900 font-medium" : ""}`}>{ROLE_LABELS[r]}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CAPABILITIES.map((c) => (
                  <tr key={c.label}>
                    <td className={`${td} text-neutral-600`}>{c.label}</td>
                    {ROLES.map((r) => (
                      <td key={r} className={`${td} text-center`}>
                        {RANK[r] >= RANK[c.min] ? (
                          <Check className="inline w-3.5 h-3.5 text-green-600" aria-label="Yes" />
                        ) : (
                          <Minus className="inline w-3.5 h-3.5 text-neutral-300" aria-label="No" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className={`${td} text-neutral-600`}>Invite viewers</td>
                  {ROLES.map((r) => (
                    <td key={r} className={`${td} text-center text-[12px] ${RANK[r] >= RANK.manager || policy.membersCanInvite ? "text-green-600!" : "text-neutral-400!"}`}>
                      {RANK[r] >= RANK.manager ? <Check className="inline w-3.5 h-3.5" aria-label="Yes" /> : policy.membersCanInvite ? "If allowed" : <Minus className="inline w-3.5 h-3.5 text-neutral-300" aria-label="No" />}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </Panel>

        {/* Access policy */}
        <Panel icon={KeyRound} title="Access policy" subtitle="Who can join and who can invite">
          <div className="p-3 space-y-3">
            <Field label="Who can sign up">
              <select
                value={draft.signup}
                onChange={(e) => setDraft((v) => (v ? { ...v, signup: e.target.value as Policy["signup"] } : v))}
                disabled={!canManage}
                aria-label="Who can sign up"
                className={`${selectClass} w-full max-w-xs`}
              >
                <option value="invite_only">Invitation only</option>
                <option value="domain">Anyone with an approved email domain</option>
                <option value="open">Anyone who can reach this site</option>
              </select>
              <p className="mt-1.5 text-[12px] text-neutral-500">
                {draft.signup === "invite_only" && "Nobody can create their own account. The sign-up form is hidden."}
                {draft.signup === "domain" && "People with a matching work email can sign up, as viewers."}
                {draft.signup === "open" && "Anyone who can open the login page can create a viewer account and read every report. Use this only on a private network."}
              </p>
            </Field>
            {draft.signup === "domain" && (
              <Field label="Approved email domains">
                <Input
                  value={domains}
                  onChange={(e) => setDomains(e.target.value)}
                  placeholder="yourcompany.com, subsidiary.com"
                  disabled={!canManage}
                  aria-label="Approved email domains"
                  className={inputClass}
                />
              </Field>
            )}
            <Field label="Members can invite">
              <label className="flex items-start gap-2 text-[13px] text-neutral-800">
                <input
                  type="checkbox"
                  checked={draft.membersCanInvite}
                  onChange={(e) => setDraft((v) => (v ? { ...v, membersCanInvite: e.target.checked } : v))}
                  disabled={!canManage}
                  className="mt-0.5 accent-neutral-900"
                />
                <span>
                  Analysts and viewers may invite teammates
                  <span className="block text-[12px] text-neutral-500">Anyone they invite joins as a viewer. Managers and above can always invite.</span>
                </span>
              </label>
            </Field>
            {canManage ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm" onClick={savePolicy} disabled={policyBusy || !policyDirty} className="bg-neutral-900 hover:bg-neutral-800 text-white text-sm">
                  {policyBusy && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save policy
                </Button>
                {policyMsg && <span className={`text-[13px] ${policyMsg.ok ? "text-green-600" : "text-red-600"}`}>{policyMsg.text}</span>}
              </div>
            ) : (
              <p className="text-[12px] text-neutral-400">Only administrators and owners can change the access policy.</p>
            )}
          </div>
        </Panel>
      </div>

      {/* Audit log */}
      {canAudit && (
        <Panel icon={ScrollText} title="Audit log" subtitle="The last 50 sign-ins and changes">
          {audit.length === 0 ? (
            <p className="p-3 text-[13px] text-neutral-500">Nothing recorded yet.</p>
          ) : (
            <div className="overflow-x-auto max-h-80 overflow-y-auto">
              <table className="w-full min-w-[640px]">
                <thead className="sticky top-0">
                  <tr>
                    <th className={th}>When</th>
                    <th className={th}>Who</th>
                    <th className={th}>Action</th>
                    <th className={th}>Target</th>
                    <th className={th}>Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {audit.map((e) => (
                    <tr key={e.id}>
                      <td className={`${td} whitespace-nowrap text-neutral-500 tabular-nums`} title={e.at}>
                        {new Date(e.at).toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{e.actor}</td>
                      <td className={`${td} whitespace-nowrap ${e.action === "auth.login_failed" ? "text-red-600" : ""}`}>{ACTION_LABELS[e.action] || e.action}</td>
                      <td className={`${td} text-neutral-600`}>{e.target}</td>
                      <td className={`${td} text-neutral-500`}>{e.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Panel>
      )}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen} title="Invite a teammate" description="They get a link to choose their own username and password. It expires in 72 hours.">
        {inviteResult ? (
          <div className="space-y-3">
            <p className="flex items-start gap-2 text-[13px] text-green-700">
              <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {inviteResult.emailSent ? `Invitation emailed to ${inviteResult.email}.` : `Invitation created for ${inviteResult.email}.`}
            </p>
            {inviteResult.inviteUrl && (
              <>
                <p className="text-[13px] text-neutral-500">Email is not set up, so send them this link yourself:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 min-w-0 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5 text-[12px] text-neutral-800 break-all">{inviteResult.inviteUrl}</code>
                  <Button variant="outline" size="sm" onClick={() => copyLink(inviteResult.inviteUrl!)} className="h-8 text-xs shadow-none shrink-0">
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy link"}
                  </Button>
                </div>
              </>
            )}
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={openInvite} variant="outline" className="h-7 text-xs shadow-none">Invite another</Button>
              <Button size="sm" onClick={() => setInviteOpen(false)} className="h-7 bg-neutral-900 hover:bg-neutral-800 text-white text-xs">Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <Field label="Work email">
              <Input type="email" value={invite.email} onChange={(e) => setInvite((v) => ({ ...v, email: e.target.value }))} placeholder="colleague@company.com" aria-label="Work email" autoComplete="off" className={inputClass} />
            </Field>
            <Field label={<>Name <span className="text-neutral-400">(optional)</span></>}>
              <Input value={invite.displayName} onChange={(e) => setInvite((v) => ({ ...v, displayName: e.target.value }))} placeholder="Full name" aria-label="Name" autoComplete="off" className={inputClass} />
            </Field>
            <Field label="Role">
              <select value={invite.role} onChange={(e) => setInvite((v) => ({ ...v, role: e.target.value as Role }))} aria-label="Role" className={`${selectClass} w-full`}>
                {assignable.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <p className="mt-1.5 text-[12px] text-neutral-500">{ROLE_DESCRIPTIONS[invite.role]}</p>
            </Field>
            {inviteError && <p className="text-[13px] text-red-600">{inviteError}</p>}
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={sendInvite} disabled={inviteBusy || !invite.email} className="h-7 bg-neutral-900 hover:bg-neutral-800 text-white text-xs">
                {inviteBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Send invitation
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setInviteOpen(false)} className="h-7 text-xs">Cancel</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)} title={`Edit ${editing?.displayName || editing?.username || ""}`} description={editing?.email || undefined}>
        {editing && (
          <div className="space-y-3">
            <Field label="Name">
              <Input value={edit.displayName} onChange={(e) => setEdit((v) => ({ ...v, displayName: e.target.value }))} aria-label="Name" className={inputClass} />
            </Field>
            <Field label="Email">
              <Input type="email" value={edit.email} onChange={(e) => setEdit((v) => ({ ...v, email: e.target.value }))} aria-label="Email" className={inputClass} />
            </Field>
            <Field label="Role">
              <select value={edit.role} onChange={(e) => setEdit((v) => ({ ...v, role: e.target.value as Role }))} aria-label="Role" className={`${selectClass} w-full`}>
                {editableRoles.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </select>
              <p className="mt-1.5 text-[12px] text-neutral-500">{ROLE_DESCRIPTIONS[edit.role]}</p>
            </Field>
            {editing.status === "active" && (
              <Field label={<>New password <span className="text-neutral-400">(optional)</span></>}>
                <Input type="password" value={edit.password} onChange={(e) => setEdit((v) => ({ ...v, password: e.target.value }))} placeholder="Leave blank to keep the current one" aria-label="New password" autoComplete="new-password" className={inputClass} />
              </Field>
            )}
            {editError && <p className="text-[13px] text-red-600">{editError}</p>}
            <div className="flex gap-2 pt-1">
              <Button size="sm" onClick={saveEdit} disabled={editBusy} className="h-7 bg-neutral-900 hover:bg-neutral-800 text-white text-xs">
                {editBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save changes
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setEditing(null)} className="h-7 text-xs">Cancel</Button>
            </div>
          </div>
        )}
      </Dialog>

      {/* Remove confirmation */}
      <Dialog
        open={!!removing}
        onOpenChange={(o) => !o && setRemoving(null)}
        title={removing?.status === "pending" ? "Withdraw this invitation?" : "Remove this person?"}
        description={removing ? `${removing.displayName || removing.username}${removing.email ? ` (${removing.email})` : ""}` : undefined}
      >
        {removing && (
          <div className="space-y-3">
            <p className="text-[13px] text-neutral-600">
              {removing.status === "pending"
                ? "Their invitation link will stop working."
                : "They are signed out at once and can no longer sign in. This cannot be undone."}
            </p>
            {removeError && <p className="text-[13px] text-red-600">{removeError}</p>}
            <div className="flex gap-2">
              <Button size="sm" onClick={confirmRemove} disabled={removeBusy} className="h-7 bg-red-600 hover:bg-red-700 text-white text-xs">
                {removeBusy && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {removing.status === "pending" ? "Withdraw invitation" : "Remove"}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setRemoving(null)} className="h-7 text-xs">Cancel</Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
