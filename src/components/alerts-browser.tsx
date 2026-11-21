"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel, Tag, th, td } from "@/components/ui/panel";
import { Input } from "@/components/ui/input";
import { CATEGORY_LABELS, type AlertCategory } from "@/lib/connectors/types";
import { Bell, Loader2, Plug, ExternalLink } from "lucide-react";

interface AlertRow {
  id: string;
  timestamp: string;
  title: string;
  integration: string;
  source: string;
  category: AlertCategory;
  severity: "Critical" | "High" | "Medium" | "Low";
  verdict: "confirmed" | "dismissed" | "unverified";
  tactic: string;
  stage: string | null;
  techniques: string[];
  department: string;
  entities: string[];
  url: string | null;
}

interface AlertsResponse {
  usingSampleData: boolean;
  total: number;
  byIntegration: { name: string; alerts: number }[];
  byCategory: { name: string; alerts: number }[];
  byVerdict: { name: string; alerts: number }[];
  alerts: AlertRow[];
}

const SEVERITY_TONE = { Critical: "red", High: "orange", Medium: "yellow", Low: "neutral" } as const;
const VERDICT = {
  confirmed: { label: "Confirmed", tone: "green" },
  dismissed: { label: "Dismissed", tone: "neutral" },
  unverified: { label: "No verdict", tone: "yellow" },
} as const;

const selectClass = "h-7 rounded-md border border-neutral-200 bg-white px-2 text-[13px] text-neutral-800";
const PAGE = 50;

export default function AlertsBrowser({ timeView, selectedQuarter }: { timeView: "quarterly" | "yearly"; selectedQuarter: string }) {
  const [data, setData] = useState<AlertsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [integration, setIntegration] = useState("all");
  const [category, setCategory] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [verdict, setVerdict] = useState("all");
  const [query, setQuery] = useState("");
  const [visible, setVisible] = useState(PAGE);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/alerts?period=${timeView}&quarter=${encodeURIComponent(selectedQuarter)}&limit=2000`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || `Request failed (${res.status})`);
        if (!cancelled) setData(json);
      })
      .catch((err) => !cancelled && setError(err.message || "Failed to load alerts"))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [timeView, selectedQuarter]);

  useEffect(() => setVisible(PAGE), [integration, category, severity, verdict, query, data]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.alerts ?? []).filter(
      (a) =>
        (integration === "all" || a.integration === integration) &&
        (category === "all" || a.category === category) &&
        (severity === "all" || a.severity === severity) &&
        (verdict === "all" || a.verdict === verdict) &&
        (!q ||
          a.title.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q) ||
          a.department.toLowerCase().includes(q) ||
          a.tactic.toLowerCase().includes(q) ||
          a.techniques.some((t) => t.toLowerCase().includes(q)) ||
          a.entities.some((e) => e.toLowerCase().includes(q)))
    );
  }, [data, integration, category, severity, verdict, query]);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
      </div>
    );
  }
  if (error) return <p className="text-[13px] text-red-600">{error}</p>;
  if (!data) return null;

  const period = timeView === "quarterly" ? selectedQuarter : selectedQuarter.split(" ")[1];
  const loaded = data.alerts.length;

  return (
    <div className="space-y-3 pb-6">
      {/* Where the alerts came from */}
      <Panel
        icon={Plug}
        title="Alerts by integration"
        subtitle={`${data.total.toLocaleString()} alerts from resolved incidents, ${period}`}
        action={data.usingSampleData ? <Tag tone="yellow">Demo data</Tag> : undefined}
      >
        {data.byIntegration.length === 0 ? (
          <p className="p-3 text-[13px] text-neutral-500">No alerts in this period. Connect a data source under Settings → Integrations.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-200">
            {data.byIntegration.map((s) => (
              <button
                key={s.name}
                type="button"
                onClick={() => setIntegration(integration === s.name ? "all" : s.name)}
                className={`px-3 py-3 text-left min-w-0 ${integration === s.name ? "bg-neutral-100" : "bg-white hover:bg-neutral-50"}`}
              >
                <div className="text-[12px] text-neutral-500 truncate">{s.name}</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-neutral-900">{s.alerts.toLocaleString()}</div>
              </button>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        icon={Bell}
        title="Alerts"
        subtitle={`${rows.length.toLocaleString()} shown${loaded < data.total ? ` of the newest ${loaded.toLocaleString()}` : ""}`}
      >
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-neutral-200">
          <Input
            placeholder="Search title, host, user, technique…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search alerts"
            className="h-7 w-64 bg-white border-neutral-200 text-[13px] shadow-none"
          />
          <select aria-label="Integration" value={integration} onChange={(e) => setIntegration(e.target.value)} className={selectClass}>
            <option value="all">All integrations</option>
            {data.byIntegration.map((s) => <option key={s.name} value={s.name}>{s.name}</option>)}
          </select>
          <select aria-label="Category" value={category} onChange={(e) => setCategory(e.target.value)} className={selectClass}>
            <option value="all">All categories</option>
            {Object.entries(CATEGORY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select aria-label="Severity" value={severity} onChange={(e) => setSeverity(e.target.value)} className={selectClass}>
            <option value="all">All severities</option>
            {(["Critical", "High", "Medium", "Low"] as const).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <select aria-label="Verdict" value={verdict} onChange={(e) => setVerdict(e.target.value)} className={selectClass}>
            <option value="all">All verdicts</option>
            <option value="confirmed">Confirmed</option>
            <option value="dismissed">Dismissed</option>
            <option value="unverified">No verdict</option>
          </select>
        </div>

        {rows.length === 0 ? (
          <p className="p-6 text-center text-[13px] text-neutral-500">No alerts match these filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px]">
              <thead>
                <tr>
                  <th className={th}>Time</th>
                  <th className={th}>Alert</th>
                  <th className={th}>Integration</th>
                  <th className={th}>Category</th>
                  <th className={th}>Severity</th>
                  <th className={th}>Verdict</th>
                  <th className={th}>Tactic</th>
                  <th className={th}>Department</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, visible).map((a) => (
                  <tr key={a.id}>
                    <td className={`${td} whitespace-nowrap text-neutral-500 tabular-nums`}>{new Date(a.timestamp).toISOString().slice(0, 16).replace("T", " ")}</td>
                    <td className={`${td} max-w-[320px]`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="truncate font-medium" title={a.title}>{a.title}</span>
                        {a.url && (
                          <a href={a.url} target="_blank" rel="noreferrer" aria-label="Open in source system" className="shrink-0 text-neutral-400 hover:text-neutral-900">
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                      {a.entities.length > 0 && <div className="truncate text-[12px] text-neutral-400">{a.entities.join(", ")}</div>}
                    </td>
                    <td className={`${td} whitespace-nowrap`}>
                      {a.integration}
                      {a.source && a.source !== a.integration && <div className="text-[12px] text-neutral-400 truncate max-w-[180px]">{a.source}</div>}
                    </td>
                    <td className={`${td} whitespace-nowrap`}>{CATEGORY_LABELS[a.category]}</td>
                    <td className={td}><Tag tone={SEVERITY_TONE[a.severity]}>{a.severity}</Tag></td>
                    <td className={td}><Tag tone={VERDICT[a.verdict].tone}>{VERDICT[a.verdict].label}</Tag></td>
                    <td className={`${td} whitespace-nowrap`}>
                      {a.tactic || <span className="text-neutral-300">—</span>}
                      {a.techniques.length > 0 && <div className="text-[12px] text-neutral-400">{a.techniques.slice(0, 3).join(", ")}</div>}
                    </td>
                    <td className={`${td} whitespace-nowrap ${a.department === "Unattributed" ? "text-neutral-400" : ""}`}>{a.department}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length > visible && (
          <div className="border-t border-neutral-200 p-2 text-center">
            <button type="button" onClick={() => setVisible((v) => v + PAGE)} className="h-7 px-3 rounded-md text-[13px] text-neutral-700 hover:bg-neutral-100">
              Show {Math.min(PAGE, rows.length - visible)} more
            </button>
          </div>
        )}
      </Panel>
    </div>
  );
}
