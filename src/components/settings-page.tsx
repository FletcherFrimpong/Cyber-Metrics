"use client";

import { useState, useEffect } from "react";
import { Panel, Tag, Field } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail, Plug, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import Integrations from "@/components/integrations";
import GeneralSettings from "@/components/settings-general";

type TabId = "general" | "integrations" | "email";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { id: "general", label: "General", icon: SlidersHorizontal, description: "Your organisation and security spend. Every dollar figure on the dashboard is calculated from these; the panel beside them shows the effect of each change." },
  { id: "integrations", label: "Integrations", icon: Plug, description: "Where alerts come from. Click a card to set it up or manage it." },
  { id: "email", label: "Email", icon: Mail, description: "Outgoing mail for user invitations." },
];

const inputClass = "h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none";

export default function SettingsPage({ initialTab = "general", onTabChange }: { initialTab?: TabId; onTabChange?: (tab: TabId) => void }) {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("settings:edit");
  const [tab, setTabState] = useState<TabId>(initialTab);
  // The shell remembers the tab, so links such as "Connect a data source" can open one directly
  const setTab = (next: TabId) => { setTabState(next); onTabChange?.(next); };
  useEffect(() => { setTabState(initialTab); }, [initialTab]);

  const [smtp, setSmtp] = useState({ host: "", port: "587", user: "", pass: "", from: "" });
  const [smtpConfigured, setSmtpConfigured] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Load current settings
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/settings");
        const settings = await res.json();

        if (settings.smtp) {
          setSmtp({
            host: settings.smtp.host || "",
            port: String(settings.smtp.port || 587),
            user: settings.smtp.user || "",
            pass: settings.smtp.pass || "",
            from: settings.smtp.from || "",
          });
          setSmtpConfigured(settings.smtp.configured || false);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Each tab saves only its own section, so saving one never touches another.
  const save = async (body: Record<string, unknown>) => {
    setSaving(true);
    setSaveMessage(null);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Could not save");
      setSaveMessage({ ok: true, text: "Settings saved" });
      if (body.smtp !== undefined) setSmtpConfigured(!!(smtp.host && smtp.user));
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      setSaveMessage({ ok: false, text: "Failed to save: " + err.message });
    } finally {
      setSaving(false);
    }
  };

  const saveEmail = () =>
    save({
      smtp: smtp.host
        ? { host: smtp.host, port: parseInt(smtp.port) || 587, user: smtp.user, pass: smtp.pass, from: smtp.from }
        : null,
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  const active = TABS.find((t) => t.id === tab)!;
  const SaveBar = ({ onSave }: { onSave: () => void }) =>
    canEdit ? (
      <div className="flex items-center gap-3">
        <Button size="sm" onClick={onSave} disabled={saving} className="bg-neutral-900 hover:bg-neutral-800 text-white text-sm">
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {saving ? "Saving..." : "Save Settings"}
        </Button>
        {saveMessage && <span className={`text-[13px] ${saveMessage.ok ? "text-green-600" : "text-red-600"}`}>{saveMessage.text}</span>}
      </div>
    ) : (
      <p className="text-[12px] text-neutral-400">Only administrators can change settings.</p>
    );

  return (
    <div className={`w-full pb-6 ${tab === "email" ? "max-w-3xl" : "max-w-6xl"}`}>
      {/* Section tabs */}
      <div role="tablist" aria-label="Settings sections" className="inline-flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => { setTab(t.id); setSaveMessage(null); }}
            className={`flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[13px] ${
              tab === t.id ? "bg-white text-neutral-900 font-medium shadow-sm" : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>
      <p className="mt-2 mb-4 text-[13px] text-neutral-500">{active.description}</p>

      {tab === "general" && <GeneralSettings canEdit={canEdit} />}

      {tab === "integrations" && <Integrations canEdit={canEdit} />}

      {tab === "email" && (
        <div className="space-y-3">
          {/* SMTP / Email Configuration */}
          <Panel
            icon={Mail}
            title="Email / SMTP Configuration"
            action={smtpConfigured ? <Tag tone="green">Configured</Tag> : <Tag>Not configured</Tag>}
          >
            <div className="p-3 space-y-3">
              <p className="text-[13px] text-neutral-500">
                Configure SMTP to send invite emails when adding new users.
                Works with any SMTP provider: Gmail, Outlook, Amazon SES, SendGrid, etc.
              </p>

              <div className="bg-neutral-50 border border-neutral-200 rounded-md p-3">
                <p className="text-[13px] text-neutral-800 font-medium mb-2">Common providers:</p>
                <div className="text-[13px] text-neutral-500 space-y-1">
                  <div><span className="text-neutral-700">Gmail:</span> smtp.gmail.com, port 587, use an App Password</div>
                  <div><span className="text-neutral-700">Outlook:</span> smtp.office365.com, port 587</div>
                  <div><span className="text-neutral-700">Amazon SES:</span> email-smtp.us-east-1.amazonaws.com, port 587</div>
                </div>
              </div>

              <Field label="SMTP Host">
                <Input placeholder="smtp.gmail.com" value={smtp.host} onChange={(e) => setSmtp((s) => ({ ...s, host: e.target.value }))} disabled={!canEdit} className={inputClass} />
              </Field>
              <Field label="Port">
                <Input type="number" placeholder="587" value={smtp.port} onChange={(e) => setSmtp((s) => ({ ...s, port: e.target.value }))} disabled={!canEdit} className={`w-24 ${inputClass}`} />
              </Field>
              <Field label="Username / Email">
                <Input placeholder="your-email@gmail.com" value={smtp.user} onChange={(e) => setSmtp((s) => ({ ...s, user: e.target.value }))} disabled={!canEdit} autoComplete="off" className={inputClass} />
              </Field>
              <Field label="Password / App Password">
                <Input type="password" placeholder="Enter SMTP password" value={smtp.pass} onChange={(e) => setSmtp((s) => ({ ...s, pass: e.target.value }))} disabled={!canEdit} autoComplete="new-password" className={inputClass} />
              </Field>
              <Field label={<>From Address <span className="text-neutral-400">(optional)</span></>}>
                <Input placeholder="SignalFoundry <noreply@yourcompany.com>" value={smtp.from} onChange={(e) => setSmtp((s) => ({ ...s, from: e.target.value }))} disabled={!canEdit} className={inputClass} />
              </Field>

              {!smtp.host && (
                <p className="text-[13px] text-neutral-500">
                  Without SMTP, user invites will show the invite link on-screen for manual sharing.
                </p>
              )}
            </div>
          </Panel>

          <SaveBar onSave={saveEmail} />
        </div>
      )}
    </div>
  );
}
