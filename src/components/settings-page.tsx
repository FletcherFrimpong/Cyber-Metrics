"use client";

import { useState, useEffect } from "react";
import { Panel, Tag, Field } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Building2, Loader2, Mail, Plug, SlidersHorizontal } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import Integrations from "@/components/integrations";

type TabId = "general" | "integrations" | "email";

const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; description: string }[] = [
  { id: "general", label: "General", icon: SlidersHorizontal, description: "Your organisation and security spend. These drive every dollar figure on the dashboard." },
  { id: "integrations", label: "Integrations", icon: Plug, description: "Where alerts come from. Click a card to set it up or manage it." },
  { id: "email", label: "Email", icon: Mail, description: "Outgoing mail for user invitations." },
];

const inputClass = "h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none";

export default function SettingsPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("settings:edit");
  const [tab, setTab] = useState<TabId>("general");

  const [investmentAmount, setInvestmentAmount] = useState("");
  const [org, setOrg] = useState({ revenueBand: "", lossEvents: "0", typicalPct: "" });
  const [revenueBands, setRevenueBands] = useState<{ id: string; label: string }[]>([]);
  const [defaultTypicalPct, setDefaultTypicalPct] = useState(40);
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

        setInvestmentAmount(settings.investmentAmount ? String(settings.investmentAmount) : "");
        setRevenueBands(settings.revenueBands || []);
        setDefaultTypicalPct(Math.round((settings.defaultTypicalControlEffectiveness ?? 0.4) * 100));
        setOrg({
          revenueBand: settings.organisation?.revenueBand || "",
          lossEvents: String(settings.organisation?.lossEventsLast12Months ?? 0),
          typicalPct: settings.organisation?.typicalControlEffectiveness
            ? String(Math.round(settings.organisation.typicalControlEffectiveness * 100))
            : "",
        });
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

  const saveGeneral = () =>
    save({
      investmentAmount: parseFloat(investmentAmount) || 0,
      organisation: {
        revenueBand: org.revenueBand || null,
        lossEventsLast12Months: parseInt(org.lossEvents, 10) || 0,
        typicalControlEffectiveness: org.typicalPct ? parseFloat(org.typicalPct) / 100 : null,
      },
    });

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
    <div className={`w-full pb-6 ${tab === "integrations" ? "max-w-6xl" : "max-w-3xl"}`}>
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

      {tab === "general" && (
        <div className="space-y-3">
          {/* Organisation profile: what the dollar figures are anchored to */}
          <Panel icon={Building2} title="Organisation profile" subtitle="Anchors the dollar figures to published loss data">
            <div className="p-3 space-y-3">
              <p className="text-[13px] text-neutral-500">
                Loss avoided is capped by what organisations of your size are known to lose (Cyentia Institute, Information Risk
                Insights Study). Until you choose a size, $100M – $1B is assumed.
              </p>
              <Field label="Annual revenue">
                <select
                  value={org.revenueBand}
                  onChange={(e) => setOrg((o) => ({ ...o, revenueBand: e.target.value }))}
                  disabled={!canEdit}
                  className="h-8 w-full max-w-xs rounded-md border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900"
                >
                  <option value="">Not set</option>
                  {revenueBands.map((b) => (
                    <option key={b.id} value={b.id}>{b.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Material loss events, last 12 months">
                <Input
                  type="number"
                  min={0}
                  value={org.lossEvents}
                  onChange={(e) => setOrg((o) => ({ ...o, lossEvents: e.target.value }))}
                  disabled={!canEdit}
                  className={`w-24 ${inputClass}`}
                />
                <p className="mt-1 text-[12px] text-neutral-400">
                  Incidents that got through and caused a real loss. Each one lowers your measured control effectiveness.
                </p>
              </Field>
              <Field label={<>Typical control effectiveness <span className="text-neutral-400">(optional)</span></>}>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={20}
                    max={80}
                    placeholder={String(defaultTypicalPct)}
                    value={org.typicalPct}
                    onChange={(e) => setOrg((o) => ({ ...o, typicalPct: e.target.value }))}
                    disabled={!canEdit}
                    className={`w-24 ${inputClass}`}
                  />
                  <span className="text-[13px] text-neutral-500">%</span>
                </div>
                <p className="mt-1 text-[12px] text-neutral-400">
                  Share of serious attacks a typical organisation stops before a material loss. Default {defaultTypicalPct}%, allowed 20–80.
                  This is the model&apos;s most influential assumption and its evidence is thin: a higher value raises every dollar figure.
                </p>
              </Field>
            </div>
          </Panel>

          {/* Investment Amount */}
          <Panel icon={DollarSign} title="Security Investment" subtitle="Used for net benefit and ROI">
            <div className="p-3 space-y-3">
              <p className="text-[13px] text-neutral-500">
                Enter your total annual security investment (EDR licensing, SOC operations, tooling).
              </p>
              <Field label="Annual investment">
                <div className="flex items-center gap-3">
                  <div className="relative w-48">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-[13px]">$</span>
                    <Input
                      type="number"
                      placeholder="e.g. 700000"
                      value={investmentAmount}
                      onChange={(e) => setInvestmentAmount(e.target.value)}
                      disabled={!canEdit}
                      className={`pl-7 ${inputClass}`}
                    />
                  </div>
                  <span className="text-[13px] text-neutral-500">per year</span>
                </div>
                {investmentAmount && parseFloat(investmentAmount) > 0 && (
                  <p className="mt-1 text-[12px] text-neutral-400">
                    = ${(parseFloat(investmentAmount) / 1000).toFixed(0)}K/year, ${(parseFloat(investmentAmount) / 4 / 1000).toFixed(0)}K/quarter
                  </p>
                )}
              </Field>
            </div>
          </Panel>

          <SaveBar onSave={saveGeneral} />
        </div>
      )}

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
