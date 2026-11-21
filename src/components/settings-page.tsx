"use client";

import { useState, useEffect } from "react";
import { Panel, Tag, Field } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, Shield, Loader2, CheckCircle, XCircle, Mail } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import ConnectorsPanel from "@/components/connectors-panel";

interface SentinelFormState {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  workspaceId: string;
}

export default function SettingsPage() {
  const { hasPermission } = useAuth();
  const canEdit = hasPermission("settings:edit");
  const [investmentAmount, setInvestmentAmount] = useState("");
  const [sentinel, setSentinel] = useState<SentinelFormState>({
    tenantId: "",
    clientId: "",
    clientSecret: "",
    workspaceId: "",
  });
  const [smtp, setSmtp] = useState({ host: "", port: "587", user: "", pass: "", from: "" });
  const [smtpConfigured, setSmtpConfigured] = useState(false);
  const [sentinelConnected, setSentinelConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);


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
          smtp: smtp.host
            ? {
                host: smtp.host,
                port: parseInt(smtp.port) || 587,
                user: smtp.user,
                pass: smtp.pass,
                from: smtp.from,
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  return (
    <div className="space-y-3 w-full max-w-3xl pb-6">
      <p className="text-[13px] text-neutral-500">Configure your security investment and SIEM connection</p>

      {/* Investment Amount */}
      <Panel icon={DollarSign} title="Security Investment">
        <div className="p-3 space-y-3">
          <p className="text-[13px] text-neutral-500">
            Enter your total annual security investment (EDR licensing, SOC operations, tooling).
            This is used to calculate ROI and net benefit.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative w-48">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-[13px]">$</span>
              <Input
                type="number"
                placeholder="e.g. 700000"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                disabled={!canEdit}
                className="pl-7 h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none"
              />
            </div>
            <span className="text-[13px] text-neutral-500">per year</span>
          </div>
          {investmentAmount && parseFloat(investmentAmount) > 0 && (
            <p className="text-[12px] text-neutral-400">
              = ${(parseFloat(investmentAmount) / 1000).toFixed(0)}K/year, ${(parseFloat(investmentAmount) / 4 / 1000).toFixed(0)}K/quarter
            </p>
          )}
        </div>
      </Panel>

      {/* Sentinel Connection */}
      <Panel icon={Shield} title="Microsoft Sentinel Connection" subtitle="Primary log source" action={sentinelConnected ? <Tag tone="green">Connected</Tag> : undefined}>
        <div className="p-3 space-y-3">
          <p className="text-[13px] text-neutral-500">
            Connect your Microsoft Sentinel workspace to ingest resolved incidents.
            SignalFoundry will pull alerts from all your connected security tools (Defender, SentinelOne, CrowdStrike, etc.)
            and quantify the cyber risk based on true positive detections.
          </p>

          {/* Setup instructions */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-md p-3">
            <p className="text-[13px] text-neutral-800 font-medium mb-2">Setup steps:</p>
            <ol className="text-[13px] text-neutral-500 space-y-1.5 list-decimal list-inside">
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
            <Field label={<>Tenant ID</>}>
              <Input
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={sentinel.tenantId}
                onChange={(e) => setSentinel((s) => ({ ...s, tenantId: e.target.value }))}
                disabled={!canEdit}
                className="h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none"
              />
              </Field>
            <Field label={<>Client ID (Application ID)</>}>
              <Input
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={sentinel.clientId}
                onChange={(e) => setSentinel((s) => ({ ...s, clientId: e.target.value }))}
                disabled={!canEdit}
                className="h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none"
              />
              </Field>
            <Field label={<>Client Secret</>}>
              <Input
                type="password"
                placeholder="Enter client secret"
                value={sentinel.clientSecret}
                onChange={(e) => setSentinel((s) => ({ ...s, clientSecret: e.target.value }))}
                disabled={!canEdit}
                className="h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none"
              />
              </Field>
            <Field label={<>Workspace ID <span className="text-neutral-400">(optional)</span></>}>
              <Input
                placeholder="Log Analytics workspace ID"
                value={sentinel.workspaceId}
                onChange={(e) => setSentinel((s) => ({ ...s, workspaceId: e.target.value }))}
                disabled={!canEdit}
                className="h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none"
              />
              </Field>
          </div>

          {/* Test connection */}
          {canEdit && (
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
              <div className={`flex items-center gap-2 text-sm ${testResult.success ? "text-green-600" : "text-red-600"}`}>
                {testResult.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {testResult.message}
              </div>
            )}
          </div>
          )}

          {/* Connection status */}
          {connectionStatus && connectionStatus.connected && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-md p-3">
              <p className="text-[13px] text-neutral-800 font-medium mb-3">Ingestion Status</p>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Status</span>
                  <span className="text-green-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Last Poll</span>
                  <span className="text-neutral-700">{connectionStatus.lastPollTime || "Pending..."}</span>
                </div>
                {connectionStatus.categoryBreakdown && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">EDR Alerts</span>
                      <span className="text-neutral-700">{connectionStatus.categoryBreakdown.edr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Email Alerts</span>
                      <span className="text-neutral-700">{connectionStatus.categoryBreakdown.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Network Alerts</span>
                      <span className="text-neutral-700">{connectionStatus.categoryBreakdown.network}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Web Alerts</span>
                      <span className="text-neutral-700">{connectionStatus.categoryBreakdown.web}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Cloud Alerts</span>
                      <span className="text-neutral-700">{connectionStatus.categoryBreakdown.cloud}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </Panel>

      {/* Other log sources and direct tool connections */}
      <ConnectorsPanel canEdit={canEdit} sentinelConnected={sentinelConnected} />

      {/* SMTP / Email Configuration */}
      <Panel icon={Mail} title="Email / SMTP Configuration" action={smtpConfigured ? <Tag tone="green">Configured</Tag> : undefined}>
        <div className="p-3 space-y-3">
          <p className="text-[13px] text-neutral-500">
            Configure SMTP to send invite emails when adding new users.
            Works with any SMTP provider: Gmail, Outlook, Amazon SES, SendGrid, etc.
          </p>

          {/* Gmail help */}
          <div className="bg-neutral-50 border border-neutral-200 rounded-md p-3">
            <p className="text-[13px] text-neutral-800 font-medium mb-2">Common providers:</p>
            <div className="text-[13px] text-neutral-500 space-y-1">
              <div><span className="text-neutral-700">Gmail:</span> smtp.gmail.com, port 587, use an App Password</div>
              <div><span className="text-neutral-700">Outlook:</span> smtp.office365.com, port 587</div>
              <div><span className="text-neutral-700">Amazon SES:</span> email-smtp.us-east-1.amazonaws.com, port 587</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-3">
              <Field label={<>SMTP Host</>}>
                <Input
                  placeholder="smtp.gmail.com"
                  value={smtp.host}
                  onChange={(e) => setSmtp((s) => ({ ...s, host: e.target.value }))}
                  disabled={!canEdit}
                  className="h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none"
                />
              </Field>
              <Field label={<>Port</>}>
                <Input
                  type="number"
                  placeholder="587"
                  value={smtp.port}
                  onChange={(e) => setSmtp((s) => ({ ...s, port: e.target.value }))}
                  disabled={!canEdit}
                  className="h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none"
                />
              </Field>
            </div>
            <div className="space-y-3">
              <Field label={<>Username / Email</>}>
                <Input
                  placeholder="your-email@gmail.com"
                  value={smtp.user}
                  onChange={(e) => setSmtp((s) => ({ ...s, user: e.target.value }))}
                  disabled={!canEdit}
                  className="h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none"
                />
              </Field>
              <Field label={<>Password / App Password</>}>
                <Input
                  type="password"
                  placeholder="Enter SMTP password"
                  value={smtp.pass}
                  onChange={(e) => setSmtp((s) => ({ ...s, pass: e.target.value }))}
                  disabled={!canEdit}
                  className="h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none"
                />
              </Field>
            </div>
            <Field label={<>From Address <span className="text-neutral-400">(optional)</span></>}>
              <Input
                placeholder="SignalFoundry <noreply@yourcompany.com>"
                value={smtp.from}
                onChange={(e) => setSmtp((s) => ({ ...s, from: e.target.value }))}
                disabled={!canEdit}
                className="h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none"
              />
              </Field>
          </div>

          {!smtp.host && (
            <p className="text-[13px] text-neutral-500">
              Without SMTP, user invites will show the invite link on-screen for manual sharing.
            </p>
          )}
        </div>
      </Panel>

      {/* Save button — admin only */}
      {canEdit && (
        <div className="flex items-center gap-4">
          <Button size="sm" onClick={handleSave} disabled={saving} className="bg-neutral-900 hover:bg-neutral-800 text-white text-sm">
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
            <span className="text-sm text-green-600">{saveMessage}</span>
          )}
        </div>
      )}
    </div>
  );
}
