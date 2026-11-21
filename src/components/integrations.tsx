"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import { Tag, Field } from "@/components/ui/panel";
import { Loader2, CheckCircle, XCircle, AlertTriangle, ChevronRight } from "lucide-react";

// ─── Types ──────────────────────────────────────────────────────────────────

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

interface SentinelValues {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  workspaceId: string;
}

type Result = { success: boolean; message: string } | null;
type State = "connected" | "error" | "off";

const inputClass = "h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none";

const SENTINEL = {
  id: "sentinel",
  name: "Microsoft Sentinel",
  description: "Resolved incidents and their alerts from every tool connected to your Sentinel workspace.",
  setupSteps: [
    "Go to Azure Portal → App Registrations → New Registration",
    "Add API permission: Microsoft Graph → SecurityIncident.Read.All",
    "Add API permission: Microsoft Graph → SecurityAlert.Read.All",
    "Grant admin consent for the permissions",
    "Create a client secret under Certificates & Secrets",
    "Copy the Tenant ID, Client ID, and Client Secret below",
  ],
};

// ─── Shared pieces ──────────────────────────────────────────────────────────

function Logo({ id, name, className = "" }: { id: string; name: string; className?: string }) {
  // Files live in /public/logos; see NOTICE.md there for sources.
  return <img src={`/logos/${id}.svg`} alt={`${name} logo`} className={`object-contain object-left ${className}`} />;
}

function StateTag({ state }: { state: State }) {
  if (state === "connected") return <Tag tone="green">Connected</Tag>;
  if (state === "error") return <Tag tone="red">Error</Tag>;
  return <Tag>Not connected</Tag>;
}

function SetupSteps({ steps, docsUrl }: { steps: string[]; docsUrl?: string }) {
  return (
    <div className="bg-neutral-50 border border-neutral-200 rounded-md p-3">
      <p className="text-[13px] text-neutral-800 font-medium mb-1.5">Setup steps</p>
      <ol className="text-[13px] text-neutral-500 space-y-1 list-decimal list-inside">
        {steps.map((step) => <li key={step}>{step}</li>)}
      </ol>
      {docsUrl && (
        <a href={docsUrl} target="_blank" rel="noreferrer" className="inline-block mt-2 text-[13px] text-neutral-900 underline underline-offset-2">
          API documentation
        </a>
      )}
    </div>
  );
}

function ResultLine({ result }: { result: Result }) {
  if (!result) return null;
  return (
    <p className={`flex items-start gap-1.5 text-[13px] ${result.success ? "text-green-600" : "text-red-600"}`}>
      {result.success ? <CheckCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />}
      <span className="min-w-0 break-words">{result.message}</span>
    </p>
  );
}

function Spinner({ show }: { show: boolean }) {
  return show ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null;
}

// ─── Card ───────────────────────────────────────────────────────────────────

function IntegrationCard({
  id, name, description, state, detail, onOpen,
}: {
  id: string; name: string; description: string; state: State; detail?: string; onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex flex-col text-left rounded-lg border border-neutral-200 bg-white p-4 hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-900"
    >
      <div className="flex items-center justify-between gap-3 w-full h-8">
        <Logo id={id} name={name} className="h-7 max-w-[60%]" />
        <StateTag state={state} />
      </div>
      <div className="mt-3 text-[14px] font-medium text-neutral-900">{name}</div>
      <p className="mt-1 text-[13px] text-neutral-500 flex-1">{description}</p>
      <div className="mt-3 flex items-center justify-between w-full text-[12px]">
        <span className="text-neutral-400 truncate">{detail}</span>
        <span className="flex items-center gap-0.5 text-neutral-700 group-hover:text-neutral-900 shrink-0">
          {state === "off" ? "Set up" : "Manage"}
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </button>
  );
}

// ─── Connector form (Splunk, CrowdStrike, SentinelOne) ──────────────────────

function ConnectorForm({ connector, canEdit, onChanged }: { connector: ConnectorInfo; canEdit: boolean; onChanged: () => void }) {
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
      setResult({
        success: !!data.success,
        message:
          data.message || data.error ||
          (action === "save" ? "Saved. Alerts will be pulled every 15 minutes." :
           action === "remove" ? "Disconnected. Its alerts were removed." :
           action === "sync" ? `Synced: ${data.newAlerts ?? 0} alerts fetched.` : "Done."),
      });
      if (action !== "test") onChanged();
    } catch (err: any) {
      setResult({ success: false, message: err?.message || "Request failed" });
    } finally {
      setBusy(null);
    }
  };

  const status = connector.status;
  return (
    <div className="space-y-3">
      <SetupSteps steps={connector.setupSteps} docsUrl={connector.docsUrl} />

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
          {status.lastError && <span className="block text-red-600 break-words">{status.lastError}</span>}
        </p>
      )}

      {canEdit ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => call("test")} disabled={!!busy || missing} className="h-7 text-xs shadow-none">
            <Spinner show={busy === "test"} />
            Test Connection
          </Button>
          <Button size="sm" onClick={() => call("save")} disabled={!!busy || missing} className="h-7 bg-neutral-900 hover:bg-neutral-800 text-white text-xs">
            <Spinner show={busy === "save"} />
            Save and connect
          </Button>
          {connector.configured && (
            <>
              <Button variant="outline" size="sm" onClick={() => call("sync")} disabled={!!busy} className="h-7 text-xs shadow-none">
                <Spinner show={busy === "sync"} />
                Sync now
              </Button>
              <Button variant="ghost" size="sm" onClick={() => call("remove")} disabled={!!busy} className="h-7 text-xs text-red-600 hover:text-red-700">
                Disconnect
              </Button>
            </>
          )}
        </div>
      ) : (
        <p className="text-[12px] text-neutral-400">Only administrators can change integrations.</p>
      )}
      <ResultLine result={result} />
    </div>
  );
}

// ─── Sentinel form ──────────────────────────────────────────────────────────

function SentinelForm({
  initial, configured, status, canEdit, onChanged,
}: {
  initial: SentinelValues; configured: boolean; status: any; canEdit: boolean; onChanged: () => void;
}) {
  const [values, setValues] = useState<SentinelValues>(initial);
  const [busy, setBusy] = useState<"test" | "save" | "sync" | "remove" | null>(null);
  const [result, setResult] = useState<Result>(null);

  useEffect(() => setValues(initial), [initial]);

  const missing = !values.tenantId || !values.clientId || !values.clientSecret;
  const set = (key: keyof SentinelValues) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));

  const post = async (url: string, body: unknown) => {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    return res.json();
  };

  const run = async (action: "test" | "save" | "sync" | "remove") => {
    setBusy(action);
    setResult(null);
    try {
      if (action === "test") {
        const data = await post("/api/sentinel/test", { tenantId: values.tenantId, clientId: values.clientId, clientSecret: values.clientSecret });
        setResult({ success: !!data.success, message: data.message || data.error || (data.success ? "Connection works." : "Connection failed.") });
      } else if (action === "save") {
        const data = await post("/api/settings", { sentinel: values });
        setResult({ success: !!data.success, message: data.success ? "Saved. Incidents will be pulled every 15 minutes." : data.error || "Failed to save." });
        onChanged();
      } else if (action === "sync") {
        const data = await post("/api/sentinel/sync", {});
        setResult({ success: !!data.success, message: data.success ? "Sync started." : data.error || "Sync failed." });
        onChanged();
      } else {
        const data = await post("/api/settings", { sentinel: null });
        setResult({ success: !!data.success, message: data.success ? "Disconnected. Its alerts were removed." : data.error || "Failed to disconnect." });
        onChanged();
      }
    } catch (err: any) {
      setResult({ success: false, message: err?.message || "Request failed" });
    } finally {
      setBusy(null);
    }
  };

  const breakdown = status?.categoryBreakdown;
  return (
    <div className="space-y-3">
      <SetupSteps steps={SENTINEL.setupSteps} />

      <Field label="Tenant ID">
        <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={values.tenantId} onChange={set("tenantId")} disabled={!canEdit} autoComplete="off" className={inputClass} />
      </Field>
      <Field label="Client ID (Application ID)">
        <Input placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" value={values.clientId} onChange={set("clientId")} disabled={!canEdit} autoComplete="off" className={inputClass} />
      </Field>
      <Field label="Client Secret">
        <Input type="password" placeholder="Enter client secret" value={values.clientSecret} onChange={set("clientSecret")} disabled={!canEdit} autoComplete="off" className={inputClass} />
      </Field>
      <Field label={<>Workspace ID <span className="text-neutral-400">(optional)</span></>}>
        <Input placeholder="Log Analytics workspace ID" value={values.workspaceId} onChange={set("workspaceId")} disabled={!canEdit} autoComplete="off" className={inputClass} />
      </Field>

      {status?.connected && (
        <div className="bg-neutral-50 border border-neutral-200 rounded-md p-3">
          <p className="text-[13px] text-neutral-800 font-medium mb-2">Ingestion Status</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-[13px]">
            <div className="flex justify-between"><span className="text-neutral-500">Status</span><span className="text-green-600">Active</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Last Poll</span><span className="text-neutral-700">{status.lastPollTime ? new Date(status.lastPollTime).toLocaleString() : "Pending..."}</span></div>
            {breakdown && (["edr", "email", "network", "web", "cloud"] as const).map((k) => (
              <div key={k} className="flex justify-between">
                <span className="text-neutral-500">{k === "edr" ? "EDR" : k.charAt(0).toUpperCase() + k.slice(1)} Alerts</span>
                <span className="text-neutral-700 tabular-nums">{breakdown[k]}</span>
              </div>
            ))}
          </div>
          {status.recentErrors?.length > 0 && <p className="mt-2 text-[12px] text-red-600 break-words">{status.recentErrors[status.recentErrors.length - 1]}</p>}
        </div>
      )}

      {canEdit ? (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button variant="outline" size="sm" onClick={() => run("test")} disabled={!!busy || missing} className="h-7 text-xs shadow-none">
            <Spinner show={busy === "test"} />
            Test Connection
          </Button>
          <Button size="sm" onClick={() => run("save")} disabled={!!busy || missing} className="h-7 bg-neutral-900 hover:bg-neutral-800 text-white text-xs">
            <Spinner show={busy === "save"} />
            Save and connect
          </Button>
          {configured && (
            <>
              <Button variant="outline" size="sm" onClick={() => run("sync")} disabled={!!busy} className="h-7 text-xs shadow-none">
                <Spinner show={busy === "sync"} />
                Sync now
              </Button>
              <Button variant="ghost" size="sm" onClick={() => run("remove")} disabled={!!busy} className="h-7 text-xs text-red-600 hover:text-red-700">
                Disconnect
              </Button>
            </>
          )}
        </div>
      ) : (
        <p className="text-[12px] text-neutral-400">Only administrators can change integrations.</p>
      )}
      <ResultLine result={result} />
    </div>
  );
}

// ─── The Integrations tab ───────────────────────────────────────────────────

export default function Integrations({ canEdit }: { canEdit: boolean }) {
  const [connectors, setConnectors] = useState<ConnectorInfo[] | null>(null);
  const [sentinel, setSentinel] = useState<{ values: SentinelValues; configured: boolean; status: any }>({
    values: { tenantId: "", clientId: "", clientSecret: "", workspaceId: "" },
    configured: false,
    status: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [cRes, sRes, stRes] = await Promise.all([fetch("/api/connectors"), fetch("/api/settings"), fetch("/api/sentinel/status")]);
      const c = await cRes.json();
      if (!cRes.ok) throw new Error(c.error || "Failed to load integrations");
      const s = sRes.ok ? await sRes.json() : {};
      const st = stRes.ok ? await stRes.json() : null;
      setConnectors(c.connectors);
      setSentinel({
        values: {
          tenantId: s.sentinel?.tenantId || "",
          clientId: s.sentinel?.clientId || "",
          clientSecret: s.sentinel?.clientSecret || "",
          workspaceId: s.sentinel?.workspaceId || "",
        },
        configured: !!s.sentinel?.connected,
        status: st,
      });
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (error) return <p className="text-[13px] text-red-600">{error}</p>;
  if (!connectors) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
      </div>
    );
  }

  const stateOf = (c: ConnectorInfo): State => (c.status?.lastError ? "error" : c.configured ? "connected" : "off");
  const detailOf = (c: ConnectorInfo) => (c.configured ? `${c.alertsHeld.toLocaleString()} alerts held` : "");
  const sentinelState: State = sentinel.status?.recentErrors?.length ? "error" : sentinel.configured ? "connected" : "off";
  const sentinelHeld = sentinel.status?.categoryBreakdown
    ? Object.values(sentinel.status.categoryBreakdown as Record<string, number>).reduce((a, b) => a + b, 0)
    : 0;

  const siems = connectors.filter((c) => c.kind === "siem");
  const tools = connectors.filter((c) => c.kind === "tool");
  const siemConnected = sentinel.configured || siems.some((c) => c.configured);
  const toolConnected = tools.some((c) => c.configured);
  const open = connectors.find((c) => c.id === openId);

  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-[13px] font-medium text-neutral-900">Log sources</h3>
        <p className="mt-0.5 mb-3 text-[13px] text-neutral-500">
          A SIEM already collects alerts from all your security tools, so one log source covers every alert category. Connect the one you use.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <IntegrationCard
            id={SENTINEL.id}
            name={SENTINEL.name}
            description={SENTINEL.description}
            state={sentinelState}
            detail={sentinel.configured ? `${sentinelHeld.toLocaleString()} alerts held` : ""}
            onOpen={() => setOpenId(SENTINEL.id)}
          />
          {siems.map((c) => (
            <IntegrationCard key={c.id} id={c.id} name={c.name} description={c.description} state={stateOf(c)} detail={detailOf(c)} onOpen={() => setOpenId(c.id)} />
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-[13px] font-medium text-neutral-900">Direct tool connections</h3>
        <p className="mt-0.5 mb-3 text-[13px] text-neutral-500">
          For a security tool that does not feed a log source above. Each covers only its own alert category.
        </p>
        {siemConnected && (
          <div className={`mb-3 flex items-start gap-2 rounded-md border px-3 py-2 text-[13px] ${toolConnected ? "border-yellow-200 bg-yellow-50 text-yellow-700" : "border-neutral-200 bg-neutral-50 text-neutral-600"}`}>
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            A log source is connected. Only connect a tool here if its alerts do not already reach that log source; otherwise they are counted twice.
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {tools.map((c) => (
            <IntegrationCard key={c.id} id={c.id} name={c.name} description={c.description} state={stateOf(c)} detail={detailOf(c)} onOpen={() => setOpenId(c.id)} />
          ))}
        </div>
      </section>

      {/* Configuration opens in a dialog */}
      <Dialog
        open={openId === SENTINEL.id}
        onOpenChange={(o) => !o && setOpenId(null)}
        title={SENTINEL.name}
        description={SENTINEL.description}
        header={<Logo id={SENTINEL.id} name={SENTINEL.name} className="h-7 w-7 mt-0.5" />}
      >
        <SentinelForm initial={sentinel.values} configured={sentinel.configured} status={sentinel.status} canEdit={canEdit} onChanged={load} />
      </Dialog>
      <Dialog
        open={!!open}
        onOpenChange={(o) => !o && setOpenId(null)}
        title={open?.name || ""}
        description={open?.description}
        header={open ? <Logo id={open.id} name={open.name} className="h-7 w-16 mt-0.5" /> : undefined}
      >
        {open && <ConnectorForm connector={open} canEdit={canEdit} onChanged={load} />}
      </Dialog>
    </div>
  );
}
