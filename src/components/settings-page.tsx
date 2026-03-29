"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Shield, Loader2, CheckCircle, XCircle, ExternalLink } from "lucide-react";

interface SentinelFormState {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  workspaceId: string;
}

export default function SettingsPage() {
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

  // Load current settings
  useEffect(() => {
    const load = async () => {
      try {
        const [settingsRes, statusRes] = await Promise.all([
          fetch("/api/settings"),
          fetch("/api/sentinel/status").catch(() => null),
        ]);
        const settings = await settingsRes.json();
        if (statusRes) {
          const status = await statusRes.json();
          setConnectionStatus(status);
        }

        setInvestmentAmount(settings.investmentAmount ? String(settings.investmentAmount) : "");
        if (settings.sentinel) {
          setSentinel({
            tenantId: settings.sentinel.tenantId || "",
            clientId: settings.sentinel.clientId || "",
            clientSecret: settings.sentinel.clientSecret || "",
            workspaceId: settings.sentinel.workspaceId || "",
          });
          setSentinelConnected(settings.sentinel.connected || false);
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
    <div className="space-y-6 max-w-3xl">
      <div>
        <h2 className="text-lg font-semibold text-white">Settings</h2>
        <p className="text-sm text-neutral-500">Configure your security investment and SIEM connection</p>
      </div>

      {/* Investment Amount */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-medium text-neutral-300 uppercase tracking-wide flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            Security Investment
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <p className="text-xs text-neutral-500 mb-3">
            Enter your total annual security investment (EDR licensing, SOC operations, tooling).
            This is used to calculate ROI and net benefit.
          </p>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 text-sm">$</span>
              <Input
                type="number"
                placeholder="e.g. 700000"
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                className="pl-7 bg-neutral-800 border-neutral-700 text-white"
              />
            </div>
            <span className="text-xs text-neutral-600">per year</span>
          </div>
          {investmentAmount && parseFloat(investmentAmount) > 0 && (
            <p className="text-xs text-neutral-500 mt-2">
              = ${(parseFloat(investmentAmount) / 1000).toFixed(0)}K/year, ${(parseFloat(investmentAmount) / 4 / 1000).toFixed(0)}K/quarter
            </p>
          )}
        </CardContent>
      </Card>

      {/* Sentinel Connection */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-medium text-neutral-300 uppercase tracking-wide flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Microsoft Sentinel Connection
            {sentinelConnected && (
              <Badge variant="outline" className="ml-2 bg-green-500/10 border-green-500/30 text-green-400 text-[10px]">
                Connected
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          <p className="text-xs text-neutral-500">
            Connect your Microsoft Sentinel workspace to ingest resolved incidents.
            SignalFoundry will pull alerts from all your connected security tools (Defender, SentinelOne, CrowdStrike, etc.)
            and quantify the cyber risk based on true positive detections.
          </p>

          {/* Setup instructions */}
          <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-md p-3">
            <p className="text-xs text-neutral-400 font-medium mb-2">Setup steps:</p>
            <ol className="text-xs text-neutral-500 space-y-1 list-decimal list-inside">
              <li>Go to Azure Portal → App Registrations → New Registration</li>
              <li>Add API permission: Microsoft Graph → SecurityIncident.Read.All</li>
              <li>Add API permission: Microsoft Graph → SecurityAlert.Read.All</li>
              <li>Grant admin consent for the permissions</li>
              <li>Create a client secret under Certificates & Secrets</li>
              <li>Copy the Tenant ID, Client ID, and Client Secret below</li>
            </ol>
          </div>

          {/* Credentials form */}
          <div className="space-y-3">
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Tenant ID</label>
              <Input
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={sentinel.tenantId}
                onChange={(e) => setSentinel((s) => ({ ...s, tenantId: e.target.value }))}
                className="bg-neutral-800 border-neutral-700 text-white text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Client ID (Application ID)</label>
              <Input
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                value={sentinel.clientId}
                onChange={(e) => setSentinel((s) => ({ ...s, clientId: e.target.value }))}
                className="bg-neutral-800 border-neutral-700 text-white text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Client Secret</label>
              <Input
                type="password"
                placeholder="Enter client secret"
                value={sentinel.clientSecret}
                onChange={(e) => setSentinel((s) => ({ ...s, clientSecret: e.target.value }))}
                className="bg-neutral-800 border-neutral-700 text-white text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-neutral-500 mb-1 block">Workspace ID <span className="text-neutral-600">(optional)</span></label>
              <Input
                placeholder="Log Analytics workspace ID"
                value={sentinel.workspaceId}
                onChange={(e) => setSentinel((s) => ({ ...s, workspaceId: e.target.value }))}
                className="bg-neutral-800 border-neutral-700 text-white text-sm font-mono"
              />
            </div>
          </div>

          {/* Test connection */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing || !sentinel.tenantId || !sentinel.clientId || !sentinel.clientSecret}
              className="text-xs"
            >
              {testing ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                  Testing...
                </>
              ) : (
                "Test Connection"
              )}
            </Button>
            {testResult && (
              <div className={`flex items-center gap-1.5 text-xs ${testResult.success ? "text-green-400" : "text-red-400"}`}>
                {testResult.success ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                {testResult.message}
              </div>
            )}
          </div>

          {/* Connection status */}
          {connectionStatus && connectionStatus.connected && (
            <div className="bg-neutral-800/50 border border-neutral-700/50 rounded-md p-3">
              <p className="text-xs text-neutral-400 font-medium mb-2">Ingestion Status</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-neutral-500">Status</span>
                  <span className="text-green-400">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-500">Last Poll</span>
                  <span className="text-neutral-300">{connectionStatus.lastPollTime || "Pending..."}</span>
                </div>
                {connectionStatus.categoryBreakdown && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">EDR Alerts</span>
                      <span className="text-neutral-300">{connectionStatus.categoryBreakdown.edr}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Email Alerts</span>
                      <span className="text-neutral-300">{connectionStatus.categoryBreakdown.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Network Alerts</span>
                      <span className="text-neutral-300">{connectionStatus.categoryBreakdown.network}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Web Alerts</span>
                      <span className="text-neutral-300">{connectionStatus.categoryBreakdown.web}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Cloud Alerts</span>
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
      <div className="flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving} className="bg-orange-600 hover:bg-orange-700 text-white">
          {saving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Settings"
          )}
        </Button>
        {saveMessage && (
          <span className="text-xs text-green-400">{saveMessage}</span>
        )}
      </div>
    </div>
  );
}
