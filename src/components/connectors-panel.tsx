"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Panel, Tag, Field } from "@/components/ui/panel";
import { Plug, Loader2, CheckCircle, XCircle, ChevronDown, AlertTriangle } from "lucide-react";

interface ConnectorField {
  key: string;
  label: string;
  type: "text" | "password" | "select";
  placeholder?: string;
  options?: { value: string; label: string }[];
  required?: boolean;
  help?: string;
}

interface ConnectorInfo {
  id: string;
  name: string;
  kind: "siem" | "tool";
  description: string;
  docsUrl: string;
  setupSteps: string[];
  fields: ConnectorField[];
  values: Record<string, string>;
  configured: boolean;
  status: { running: boolean; polling: boolean; lastPollTime: string | null; lastError: string | null; totalAlerts: number } | null;
  alertsHeld: number;
}

type Result = { success: boolean; message: string } | null;

const inputClass = "h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none";

function ConnectorRow({ connector, canEdit, onChanged }: { connector: ConnectorInfo; canEdit: boolean; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<Record<string, string>>(connector.values);
  const [busy, setBusy] = useState<"test" | "save" | "sync" | "remove" | null>(null);
  const [result, setResult] = useState<Result>(null);

  useEffect(() => setValues(connector.values), [connector.values]);

  const missing = connector.fields.some((f) => f.required && !values[f.key]);

  const call = async (action: "test" | "save" | "sync" | "remove") => {
    setBusy(action);
    setResult(null);
    try {
      const url = action === "test" ? "/api/connectors/test" : action === "sync" ? "/api/connectors/sync" : "/api/connectors";
      const body =
        action === "remove" ? { id: connector.id, config: null } :
        action === "sync" ? { id: connector.id } :
        { id: connector.id, config: values };
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      const ok = !!data.success;
      const message =
        data.message || data.error ||
        (action === "save" ? "Saved. Alerts will be pulled every 15 minutes." :
         action === "remove" ? "Disconnected." :
         action === "sync" ? `Synced: ${data.newAlerts ?? 0} alerts fetched.` : "Done.");
      setResult({ success: ok, message });
      if (action !== "test") onChanged();
    } catch (err: any) {
      setResult({ success: false, message: err?.message || "Request failed" });
    } finally {
      setBusy(null);
    }
  };

  const status = connector.status;
  return (
    <div className="border-b border-neutral-100 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-3 h-11 text-left hover:bg-neutral-50"
      >
        <span className="text-[13px] font-medium text-neutral-900 w-52 shrink-0 truncate">{connector.name}</span>
        <span className="flex-1 min-w-0 text-[13px] text-neutral-500 truncate">{connector.description}</span>
        {status?.lastError ? (
          <Tag tone="red">Error</Tag>
        ) : connector.configured ? (
          <Tag tone="green">Connected</Tag>
        ) : (
          <Tag>Not connected</Tag>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 shrink-0 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-3">
          <div className="bg-neutral-50 border border-neutral-200 rounded-md p-3">
            <p className="text-[13px] text-neutral-800 font-medium mb-1.5">Setup steps:</p>
            <ol className="text-[13px] text-neutral-500 space-y-1 list-decimal list-inside">
              {connector.setupSteps.map((step) => <li key={step}>{step}</li>)}
            </ol>
            <a href={connector.docsUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[13px] text-neutral-900 underline underline-offset-2">
              API documentation
            </a>
          </div>

          {connector.fields.map((field) => (
            <Field key={field.key} label={<>{field.label}{!field.required && <span className="text-neutral-400"> (optional)</span>}</>}>
              {field.type === "select" ? (
                <select
                  value={values[field.key] || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  disabled={!canEdit}
                  className="h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-[13px] text-neutral-900"
                >
                  <option value="">Select…</option>
                  {field.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              ) : (
                <Input
                  type={field.type === "password" ? "password" : "text"}
                  placeholder={field.placeholder}
                  value={values[field.key] || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                  disabled={!canEdit}
                  autoComplete="off"
                  className={inputClass}
                />
              )}
              {field.help && <p className="mt-1 text-[12px] text-neutral-400">{field.help}</p>}
            </Field>
          ))}

          {status && (
            <p className="text-[12px] text-neutral-500">
              Last poll: {status.lastPollTime ? new Date(status.lastPollTime).toLocaleString() : "pending"} · {connector.alertsHeld} alerts held
              {status.lastError && <span className="text-red-600"> · {status.lastError}</span>}
            </p>
          )}

          {canEdit && (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => call("test")} disabled={!!busy || missing} className="h-7 text-xs shadow-none">
                {busy === "test" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Test Connection
              </Button>
              <Button size="sm" onClick={() => call("save")} disabled={!!busy || missing} className="h-7 bg-neutral-900 hover:bg-neutral-800 text-white text-xs">
                {busy === "save" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Save and connect
              </Button>
              {connector.configured && (
                <>
                  <Button variant="outline" size="sm" onClick={() => call("sync")} disabled={!!busy} className="h-7 text-xs shadow-none">
                    {busy === "sync" && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Sync now
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => call("remove")} disabled={!!busy} className="h-7 text-xs text-red-600 hover:text-red-700">
                    Disconnect
                  </Button>
                </>
              )}
              {result && (
                <span className={`flex items-center gap-1.5 text-[13px] ${result.success ? "text-green-600" : "text-red-600"}`}>
                  {result.success ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                  {result.message}
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ConnectorsPanel({ canEdit, sentinelConnected }: { canEdit: boolean; sentinelConnected: boolean }) {
  const [connectors, setConnectors] = useState<ConnectorInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/connectors");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load connectors");
      setConnectors(data.connectors);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <p className="text-[13px] text-red-600">{error}</p>;
  if (!connectors) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
      </div>
    );
  }

  const siems = connectors.filter((c) => c.kind === "siem");
  const tools = connectors.filter((c) => c.kind === "tool");
  const siemConnected = sentinelConnected || siems.some((c) => c.configured);
  const toolConnected = tools.some((c) => c.configured);

  return (
    <>
      {siems.length > 0 && (
        <Panel icon={Plug} title="Other log sources" subtitle="A SIEM covers every alert category, like Sentinel">
          {siems.map((c) => <ConnectorRow key={c.id} connector={c} canEdit={canEdit} onChanged={load} />)}
        </Panel>
      )}

      {tools.length > 0 && (
        <Panel icon={Plug} title="Direct tool connections" subtitle="For security tools that do not feed a SIEM">
          {siemConnected && (
            <div className={`flex items-start gap-2 px-3 py-2 border-b border-neutral-200 text-[13px] ${toolConnected ? "bg-yellow-50 text-yellow-700" : "text-neutral-500"}`}>
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              A log source is connected. Only connect a tool here if its alerts do not already reach that log source; otherwise they are counted twice.
            </div>
          )}
          {tools.map((c) => <ConnectorRow key={c.id} connector={c} canEdit={canEdit} onChanged={load} />)}
        </Panel>
      )}
    </>
  );
}
