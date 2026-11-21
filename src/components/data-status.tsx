"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Loader2, FlaskConical, CheckCircle2, Inbox } from "lucide-react";

export interface DataSource {
  id: string;
  name: string;
  state: "syncing" | "ok" | "error";
  alertsHeld: number;
  lastPollTime: string | null;
  error: string | null;
}

export interface DataStatus {
  usingSampleData: boolean;
  alertsHeld: number;
  sources: DataSource[];
}

export type Overall = "loading" | "demo" | "syncing" | "error" | "empty" | "live";

export function overallState(status: DataStatus | null): Overall {
  if (!status) return "loading";
  if (status.sources.some((s) => s.state === "error")) return "error";
  if (status.sources.some((s) => s.state === "syncing")) return "syncing";
  if (status.sources.length === 0) return status.usingSampleData ? "demo" : status.alertsHeld > 0 ? "live" : "demo";
  return status.alertsHeld > 0 ? "live" : "empty";
}

const names = (list: DataSource[]) =>
  list.length <= 2 ? list.map((s) => s.name).join(" and ") : `${list[0].name} and ${list.length - 1} others`;

/** Vendor error text, ended like a sentence so the next one reads cleanly. */
const sentence = (text: string | null) => {
  const t = (text || "The connection failed").trim();
  return /[.!?]$/.test(t) ? t : `${t}.`;
};

function ago(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  return hours < 24 ? `${hours} h ago` : `${Math.round(hours / 24)} d ago`;
}

const IDLE_MS = 20000;
const SYNCING_MS = 4000;

/**
 * Polls the data status: every 4 seconds while a first sync is running, every
 * 20 seconds otherwise, and at once when `refresh` is called or the tab regains
 * focus. Calls onDataChanged when alerts arrive or the source of the data
 * changes, so the screens can reload themselves.
 */
export function useDataStatus(onDataChanged: () => void): [DataStatus | null, () => void] {
  const [status, setStatus] = useState<DataStatus | null>(null);
  const last = useRef<string | null>(null);
  const changed = useRef(onDataChanged);
  changed.current = onDataChanged;
  const refreshRef = useRef<() => void>(() => {});

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const tick = async () => {
      clearTimeout(timer);
      let next = IDLE_MS;
      try {
        const res = await fetch("/api/data-status");
        if (res.ok) {
          const json: DataStatus = await res.json();
          if (cancelled) return;
          setStatus(json);
          const signature = `${json.usingSampleData}|${json.alertsHeld}`;
          if (last.current !== null && last.current !== signature) changed.current();
          last.current = signature;
          if (json.sources.some((s) => s.state === "syncing")) next = SYNCING_MS;
        }
      } catch {
        // keep the last known status; try again on the next tick
      }
      if (!cancelled) timer = setTimeout(tick, next);
    };
    refreshRef.current = tick;
    tick();
    window.addEventListener("focus", tick);
    return () => { cancelled = true; clearTimeout(timer); window.removeEventListener("focus", tick); };
  }, []);

  return [status, () => refreshRef.current()];
}

/** One line under the filter row saying what the figures on screen are based on. */
export function DataStatusBanner({ status, onOpenIntegrations, canConnect = true }: { status: DataStatus | null; onOpenIntegrations: () => void; canConnect?: boolean }) {
  const state = overallState(status);
  if (!status || state === "loading" || state === "live") return null;

  const link = (text: string) => (
    <button type="button" onClick={onOpenIntegrations} className="shrink-0 font-medium underline underline-offset-2 hover:no-underline">
      {text}
    </button>
  );
  const failing = status.sources.filter((s) => s.state === "error");
  const syncing = status.sources.filter((s) => s.state === "syncing");

  if (state === "error") {
    return (
      <div role="alert" className="flex items-start gap-2 px-3 py-2 border-b border-red-200 bg-red-50 text-[13px] text-red-700">
        <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <span className="font-medium">{names(failing)} could not sync.</span>{" "}
          <span className="break-words">{sentence(failing[0].error)}</span>
          {status.alertsHeld > 0
            ? " The figures below use the alerts already received and may be out of date."
            : " No alerts have been received, so the figures below are empty."}
        </div>
        {link("Fix in Integrations")}
      </div>
    );
  }
  if (state === "syncing") {
    return (
      <div role="status" className="flex items-center gap-2 px-3 py-2 border-b border-blue-200 bg-blue-50 text-[13px] text-blue-700">
        <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" />
        <div className="min-w-0 flex-1">
          <span className="font-medium">Connecting to {names(syncing)}.</span> Pulling the last 90 days of closed incidents; this page updates by itself when they arrive.
        </div>
      </div>
    );
  }
  if (state === "empty") {
    return (
      <div role="status" className="flex items-start gap-2 px-3 py-2 border-b border-neutral-200 bg-neutral-50 text-[13px] text-neutral-600">
        <Inbox className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <span className="font-medium text-neutral-900">{names(status.sources)} {status.sources.length === 1 ? "is" : "are"} connected, but returned no closed incidents from the last 90 days.</span>{" "}
          Until some arrive, the dollar figures assume a typical organisation of your size.
        </div>
        {link("Check Integrations")}
      </div>
    );
  }
  // demo
  return (
    <div role="status" className="flex items-center gap-2 px-3 py-2 border-b border-yellow-200 bg-yellow-50 text-[13px] text-yellow-800">
      <FlaskConical className="w-3.5 h-3.5 shrink-0" />
      <div className="min-w-0 flex-1">
        <span className="font-medium">You are looking at demo data.</span>{" "}
        {canConnect ? "Connect your SIEM or security tool to see your own figures." : "An administrator can connect your SIEM or security tool to show your own figures."}
      </div>
      {canConnect && link("Connect a data source")}
    </div>
  );
}

/** The sidebar's status line: the real state of the data, not a fixed "online". */
export function SidebarDataStatus({ status }: { status: DataStatus | null }) {
  const state = overallState(status);
  const latest = status?.sources.map((s) => s.lastPollTime).filter(Boolean).sort().pop() ?? null;
  const view: Record<Overall, { dot: string; text: string; icon?: React.ReactNode }> = {
    loading: { dot: "bg-neutral-300", text: "Checking data sources" },
    demo: { dot: "bg-yellow-500", text: "Demo data" },
    syncing: { dot: "bg-blue-500 animate-pulse", text: "First sync in progress" },
    error: { dot: "bg-red-500", text: "Sync problem" },
    empty: { dot: "bg-neutral-400", text: "Connected, no incidents yet" },
    live: {
      dot: "bg-green-500",
      text: `${status?.sources.length || 0} source${status?.sources.length === 1 ? "" : "s"} live${latest ? ` · synced ${ago(latest)}` : ""}`,
    },
  };
  // Stored alerts with every connector disconnected: still real data.
  const v = state === "live" && status?.sources.length === 0 ? { dot: "bg-neutral-400", text: "Stored alerts, no source connected" } : view[state];
  return (
    <div className="flex items-center gap-2 px-2 h-7 text-[12px] text-neutral-500" title={status?.sources.map((s) => `${s.name}: ${s.state}`).join("\n") || undefined}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${v.dot}`} />
      <span className="truncate">{v.text}</span>
      {state === "live" && <CheckCircle2 className="sr-only" />}
    </div>
  );
}
