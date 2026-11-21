"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";
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

type Result = { success: boolean; message: string } | null;
type State = "connected" | "error" | "off";
type Filter = "all" | "siem" | "tool" | "connected";

const inputClass = "h-8 bg-white border-neutral-200 text-[13px] text-neutral-900 shadow-none";

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

const KIND_LABEL = { siem: "Log source", tool: "Direct tool" } as const;

function IntegrationCard({ connector, state, onOpen }: { connector: ConnectorInfo; state: State; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`group flex h-full flex-col text-left rounded-lg border bg-white p-4 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-neutral-900 ${
        state === "connected" ? "border-green-300" : state === "error" ? "border-red-300" : "border-neutral-200 hover:border-neutral-300"
      }`}
    >
      {/* Every logo sits in the same box, so wordmarks and square marks line up */}
      <div className="flex items-start justify-between gap-3 w-full">
        <div className="flex h-9 w-32 items-center">
          <Logo id={connector.id} name={connector.name} className="max-h-7 max-w-full" />
        </div>
        <StateTag state={state} />
      </div>
      <div className="mt-3 text-[14px] font-medium text-neutral-900">{connector.name}</div>
      {/* Two lines for every card keeps the grid rows even */}
      <p className="mt-1 text-[13px] leading-snug text-neutral-500 line-clamp-2 min-h-[2.6em]">{connector.description}</p>
      <div className="mt-auto pt-3 flex items-center justify-between w-full text-[12px]">
        <span className="text-neutral-400">
          {KIND_LABEL[connector.kind]}
          {connector.configured && ` · ${connector.alertsHeld.toLocaleString()} alerts held`}
        </span>
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
  const canSync = useAuth().hasPermission("sentinel:sync");
  // Disconnecting deletes that source's alerts, so it takes a second click
  const [confirmRemove, setConfirmRemove] = useState(false);

  // Reset the form only when the saved values really change (after a save or a
  // disconnect), not on every background reload, so typing is never wiped.
  const savedValues = JSON.stringify(connector.values);
  useEffect(() => setValues(JSON.parse(savedValues)), [savedValues]);

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
              aria-label={field.label}
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
              aria-label={field.label}
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
              {confirmRemove ? (
                <span className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-2 py-1 text-[12px] text-red-700">
                  Remove its {status?.totalAlerts ?? 0} alerts and disconnect?
                  <Button size="sm" onClick={() => { setConfirmRemove(false); call("remove"); }} disabled={!!busy} className="h-6 bg-red-600 hover:bg-red-700 text-white text-xs">
                    Yes, disconnect
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(false)} className="h-6 text-xs">
                    Cancel
                  </Button>
                </span>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => setConfirmRemove(true)} disabled={!!busy} className="h-7 text-xs text-red-600 hover:text-red-700">
                  <Spinner show={busy === "remove"} />
                  Disconnect
                </Button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {/* Analysts and managers cannot change an integration, but they can ask it to pull now */}
          {canSync && connector.configured && (
            <Button variant="outline" size="sm" onClick={() => call("sync")} disabled={!!busy} className="h-7 text-xs shadow-none">
              <Spinner show={busy === "sync"} />
              Sync now
            </Button>
          )}
          <p className="text-[12px] text-neutral-400">Only administrators can change integrations.</p>
        </div>
      )}
      <ResultLine result={result} />
    </div>
  );
}

// ─── The Integrations tab ───────────────────────────────────────────────────

export default function Integrations({ canEdit }: { canEdit: boolean }) {
  const [connectors, setConnectors] = useState<ConnectorInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/connectors");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load integrations");
      setConnectors(data.connectors);
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

  const siems = connectors.filter((c) => c.kind === "siem");
  const tools = connectors.filter((c) => c.kind === "tool");
  const connected = connectors.filter((c) => c.configured);
  const siemsConnected = siems.filter((c) => c.configured).length;
  const toolsConnected = tools.filter((c) => c.configured).length;
  const open = connectors.find((c) => c.id === openId);

  const FILTERS: { id: Filter; label: string; count: number; note: string }[] = [
    { id: "all", label: "All", count: connectors.length, note: "Connect the system your analysts close incidents in. One log source is usually all you need." },
    { id: "siem", label: "Log sources", count: siems.length, note: "A SIEM or XDR portal already collects alerts from your security tools, so one log source covers every alert category." },
    { id: "tool", label: "Direct tools", count: tools.length, note: "For a security tool whose alerts do not reach a log source you have connected." },
    { id: "connected", label: "Connected", count: connected.length, note: "Sources currently feeding the dashboard." },
  ];
  const active = FILTERS.find((f) => f.id === filter)!;

  // Connected sources first, then log sources before direct tools, in catalogue order.
  const shown = connectors
    .filter((c) => filter === "all" || (filter === "connected" ? c.configured : c.kind === filter))
    .map((c, i) => ({ c, i }))
    .sort((a, b) => Number(b.c.configured) - Number(a.c.configured) || a.i - b.i)
    .map(({ c }) => c);

  // Counting the same alerts twice is the one mistake this page can cause.
  const warning =
    siemsConnected > 1
      ? "More than one log source is connected. If the same incidents reach both (for example Sentinel onboarded to the Defender portal), they are counted twice."
      : siemsConnected > 0 && toolsConnected > 0
      ? "A log source and a direct tool are both connected. If that tool's alerts already reach the log source, they are counted twice."
      : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <div role="tablist" aria-label="Filter integrations" className="inline-flex items-center gap-0.5 rounded-lg border border-neutral-200 bg-neutral-50 p-0.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              role="tab"
              aria-selected={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`flex items-center gap-1.5 h-7 px-2.5 rounded-md text-[13px] ${
                filter === f.id ? "bg-white text-neutral-900 font-medium shadow-sm" : "text-neutral-600 hover:text-neutral-900"
              }`}
            >
              {f.label}
              <span className="tabular-nums text-neutral-400">{f.count}</span>
            </button>
          ))}
        </div>
        <span className="text-[13px] text-neutral-500">
          {connected.length === 0 ? "Nothing connected yet: the dashboard is showing demo data." : `${connected.length} of ${connectors.length} connected`}
        </span>
      </div>

      <p className="text-[13px] text-neutral-500">{active.note}</p>

      {warning && (
        <div className="flex items-start gap-2 rounded-md border border-yellow-200 bg-yellow-50 px-3 py-2 text-[13px] text-yellow-700">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {warning}
        </div>
      )}

      {shown.length === 0 ? (
        <p className="rounded-lg border border-dashed border-neutral-200 px-4 py-8 text-center text-[13px] text-neutral-500">
          Nothing connected yet. Choose All to pick a source.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {shown.map((c) => (
            <IntegrationCard key={c.id} connector={c} state={stateOf(c)} onOpen={() => setOpenId(c.id)} />
          ))}
        </div>
      )}

      {/* Configuration opens in a dialog */}
      <Dialog
        open={!!open}
        onOpenChange={(o) => !o && setOpenId(null)}
        title={open?.name || ""}
        description={open?.description}
        header={open ? <Logo id={open.id} name={open.name} className="h-7 w-16 mt-0.5" /> : undefined}
      >
        {open && <ConnectorForm key={open.id} connector={open} canEdit={canEdit} onChanged={load} />}
      </Dialog>
    </div>
  );
}
