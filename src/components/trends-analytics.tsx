"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Activity, DollarSign, Calendar, TrendingUp, Plug } from "lucide-react";
import { Panel, Tag, th, td } from "@/components/ui/panel";
import { CATEGORY_LABELS, emptyByCategory, type AlertCategory } from "@/lib/connectors/types";
import { useDashboardData, type DashboardMetrics } from "@/hooks/useDashboardData";
import type { TrendsAnalyticsData } from "@/lib/pdf-export";

interface TrendsAnalyticsProps {
  timeView: "quarterly" | "yearly";
  selectedQuarter: string;
}

type SeverityLevel = "Critical" | "High" | "Medium" | "Low";
type CategoryKey = AlertCategory;

const SEVERITY_CONFIG: Record<SeverityLevel, { color: string; bg: string; bar: string }> = {
  Critical: { color: "text-red-400", bg: "bg-red-500/10", bar: "bg-red-500" },
  High: { color: "text-orange-400", bg: "bg-orange-500/10", bar: "bg-orange-500" },
  Medium: { color: "text-yellow-400", bg: "bg-yellow-500/10", bar: "bg-yellow-500" },
  Low: { color: "text-neutral-400", bg: "bg-neutral-500/10", bar: "bg-neutral-500" },
};

function fmt(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toLocaleString()}`;
}

const EMPTY_METRICS: DashboardMetrics = {
  totalAlerts: 0, truePositiveCount: 0, falsePositiveCount: 0, truePositiveRate: 0,
  incidentCount: 0, confirmedIncidents: 0, unverifiedIncidents: 0, dismissedIncidents: 0,
  confirmedShare: 0, exposure: 0, controlEffectiveness: 0, controlEffectivenessLow: 0, controlEffectivenessHigh: 0,
  residualLoss: 0, lossProbabilityWithoutControls: 0, lossProbabilityWithControls: 0, peerAnnualLoss: 0,
  typicalLoss: 0, severeLoss: 0, lossPerEvent: 0, revenueBand: "", profileAssumed: true,
  typicalControlEffectiveness: 0, lossEventsSuffered: 0, totalCostImpact: 0, lossAvoidedLow: 0, lossAvoidedMedian: 0,
  lossAvoidedHigh: 0, categoryBreakdown: [], totalInvestment: 0, totalCostSavings: 0, netBenefit: 0,
  roi: 0, roiLow: 0, roiHigh: 0,
};

export default function TrendsAnalytics({ timeView, selectedQuarter }: TrendsAnalyticsProps) {
  const { data, loading, error } = useDashboardData(timeView, selectedQuarter);
  const [isExporting, setIsExporting] = useState(false);
  const [trendMetric, setTrendMetric] = useState<"alerts" | "incidentsCounted" | "truePositiveRate" | "triageCoverage" | "cost">("alerts");

  const costMetrics = data?.costMetrics ?? EMPTY_METRICS;
  const totalAlerts = data?.totalAlerts ?? 0;
  // Loss avoided from the anchored model: exposure x control effectiveness
  const totalCostImpact = costMetrics.totalCostImpact;
  const severityCounts: Record<SeverityLevel, number> = data?.severityCounts ?? { Critical: 0, High: 0, Medium: 0, Low: 0 };
  const categoryCounts = useMemo(
    () =>
      (Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((k) => {
        const c = data?.categories.find((x) => x.key === k);
        return { key: k, label: CATEGORY_LABELS[k], count: c?.count ?? 0, cost: c?.lossAvoided ?? 0, critical: c?.critical ?? 0, high: c?.high ?? 0 };
      }),
    [data]
  );
  const trendData = data?.trend ?? [];

  // Per-category severity rows for the PDF, rebuilt from the server's counts
  const timeframeAlerts = useMemo(() => {
    const out = emptyByCategory<any>();
    for (const c of data?.categories ?? []) {
      for (const [sev, n] of [["Critical", c.critical], ["High", c.high], ["Medium", c.medium], ["Low", c.low]] as const) {
        for (let i = 0; i < n; i++) out[c.key].push({ severity: sev });
      }
    }
    return out;
  }, [data]);

  // The selected quarter against the one before it
  // In a yearly view that is the latest quarter that has started.
  const yearly = timeView === "yearly";
  const started = trendData.filter((t) => !t.future);
  const current = (yearly ? undefined : trendData.find((t) => t.quarter === selectedQuarter)) ?? started[started.length - 1] ?? trendData[trendData.length - 1];
  const previous = current ? trendData[trendData.indexOf(current) - 1] : undefined;

  type Indicator = { label: string; now: string; before: string; delta: number | null; unit: "%" | "pts"; goodWhen: "up" | "down" | "none"; hint: string };
  const indicators: Indicator[] = useMemo(() => {
    if (!current) return [];
    const pctChange = (a: number, b?: number) => (b && b > 0 ? ((a - b) / b) * 100 : null);
    const ptChange = (a: number, b?: number) => (b === undefined ? null : a - b);
    // A quarter that is still running is compared on pace: its count so far scaled to a full quarter
    const paced = (n: number) => n / current.elapsedShare;
    return [
      { label: "Alerts", now: current.alerts.toLocaleString(), before: previous ? previous.alerts.toLocaleString() : "—", delta: pctChange(paced(current.alerts), previous?.alerts), unit: "%", goodWhen: "none", hint: "Alerts from closed incidents" },
      { label: "Critical alerts", now: String(current.critical), before: previous ? String(previous.critical) : "—", delta: pctChange(paced(current.critical), previous?.critical), unit: "%", goodWhen: "down", hint: "Alerts rated critical by the source" },
      { label: "Incidents counted", now: current.incidentsCounted.toLocaleString(), before: previous ? previous.incidentsCounted.toLocaleString() : "—", delta: pctChange(paced(current.incidentsCounted), previous?.incidentsCounted), unit: "%", goodWhen: "none", hint: "Real incidents your controls caught" },
      { label: "True-positive rate", now: `${current.truePositiveRate.toFixed(1)}%`, before: previous ? `${previous.truePositiveRate.toFixed(1)}%` : "—", delta: ptChange(current.truePositiveRate, previous?.truePositiveRate), unit: "pts", goodWhen: "up", hint: "Share of alerts that were real: higher means less noise" },
      { label: "Triage coverage", now: `${current.triageCoverage.toFixed(1)}%`, before: previous ? `${previous.triageCoverage.toFixed(1)}%` : "—", delta: ptChange(current.triageCoverage, previous?.triageCoverage), unit: "pts", goodWhen: "up", hint: "Share of alerts an analyst gave a verdict" },
      { label: "Control effectiveness", now: `${current.controlEffectiveness.toFixed(1)}%`, before: previous ? `${previous.controlEffectiveness.toFixed(1)}%` : "—", delta: ptChange(current.controlEffectiveness, previous?.controlEffectiveness), unit: "pts", goodWhen: "up", hint: "Share of exposure your controls removed" },
      { label: "Expected loss avoided", now: fmt(current.cost), before: previous ? fmt(previous.cost) : "—", delta: pctChange(current.cost, previous?.cost), unit: "%", goodWhen: "up", hint: "Exposure × control effectiveness" },
    ];
  }, [current, previous]);

  // What moved most since the previous quarter, in a sentence
  const headline = useMemo(() => {
    if (!current || !previous || previous.alerts === 0) return null;
    const scale = 1 / current.elapsedShare;
    const volume = ((current.alerts * scale - previous.alerts) / previous.alerts) * 100;
    const moves = (Object.keys(CATEGORY_LABELS) as CategoryKey[])
      .map((k) => {
        const before = previous.byCategory[k] ?? 0;
        const now = (current.byCategory[k] ?? 0) * scale;
        return { label: CATEGORY_LABELS[k], change: before > 0 ? ((now - before) / before) * 100 : 0, diff: now - before };
      })
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff));
    const top = moves[0];
    const parts: string[] = [];
    if (current.inProgress) {
      parts.push(
        `${current.quarter} is ${Math.round(current.elapsedShare * 100)}% through with ${current.alerts.toLocaleString()} alerts so far, on pace for about ${Math.round(current.alerts * scale).toLocaleString()} (${previous.quarter}: ${previous.alerts.toLocaleString()})`
      );
    } else {
      parts.push(Math.abs(volume) < 1 ? `Alert volume is level with ${previous.quarter}` : `Alert volume is ${volume > 0 ? "up" : "down"} ${Math.abs(volume).toFixed(0)}% on ${previous.quarter}`);
    }
    if (top && Math.abs(top.change) >= 1) parts.push(`the biggest move is ${top.label}, ${top.change > 0 ? "up" : "down"} ${Math.abs(top.change).toFixed(0)}%${current.inProgress ? " on pace" : ""}`);
    const triage = current.triageCoverage - previous.triageCoverage;
    if (Math.abs(triage) >= 1) parts.push(`analysts gave a verdict on ${current.triageCoverage.toFixed(0)}% of alerts, ${triage > 0 ? "up" : "down"} from ${previous.triageCoverage.toFixed(0)}%`);
    return parts.join("; ") + ".";
  }, [current, previous]);

  type TrendMetric = "alerts" | "incidentsCounted" | "truePositiveRate" | "triageCoverage" | "cost";
  const TREND_METRICS: { id: TrendMetric; label: string; format: (n: number) => string; note: string }[] = [
    { id: "alerts", label: "Alerts", format: (n) => n.toLocaleString(), note: "Alerts from closed incidents" },
    { id: "incidentsCounted", label: "Incidents", format: (n) => n.toLocaleString(), note: "Real incidents your controls caught" },
    { id: "truePositiveRate", label: "True-positive rate", format: (n) => `${n.toFixed(1)}%`, note: "Share of alerts that were real" },
    { id: "triageCoverage", label: "Triage", format: (n) => `${n.toFixed(1)}%`, note: "Share of alerts given an analyst verdict" },
    { id: "cost", label: "Loss avoided", format: fmt, note: "Steady by design: it follows your size and how reliably incidents are caught, not alert volume" },
  ];

  const handleExportReport = async () => {
    if (typeof window === "undefined") return;
    try {
      setIsExporting(true);
      const { generateTrendsAnalyticsPDF } = await import("@/lib/pdf-export");
      const exportData: TrendsAnalyticsData = {
        timeView,
        selectedQuarter,
        timeframeAlerts,
        roiValue: costMetrics.roi,
        metrics: costMetrics,
        quarterlyData: trendData.map(t => ({ quarter: t.quarter, attacks: t.alerts, costSaved: t.cost, categories: {} })),
        yearlyData: [],
        kriMetrics: {
          threatVolume: Math.min(100, (totalAlerts / 300) * 100),
          costEfficiency: Math.min(100, (totalCostImpact / 50000000) * 100),
          roi: costMetrics.roi,
          detectionAccuracy: 97.8,
          responseTime: 85,
          coverageGap: 15,
        },
      };
      await generateTrendsAnalyticsPDF(exportData);
    } catch (error) {
      console.error("Failed to export PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };


  const periodLabel = timeView === "quarterly" ? selectedQuarter : selectedQuarter.split(" ")[1];
  const metric = TREND_METRICS.find((m) => m.id === trendMetric)!;
  const maxTrend = Math.max(...trendData.map((t) => t[trendMetric]), 1);
  const maxCategoryCell = Math.max(...trendData.flatMap((t) => Object.values(t.byCategory)), 1);
  const signed = (n: number) => (n < 0 ? `-${fmt(-n)}` : fmt(n));

  // Headline: how much the risk of a loss is reduced, then the dollars.
  // ROI sits in the financial line below: in expected-value terms security
  // spend behaves like insurance, so ROI alone understates it.
  const stats = [
    {
      label: "Chance of a material loss this year",
      value: `${costMetrics.lossProbabilityWithControls}%`,
      note: `Down from ${costMetrics.lossProbabilityWithoutControls}% without detection and response`,
      lead: true,
    },
    {
      label: "Severe event at your size",
      value: fmt(costMetrics.severeLoss),
      note: `Typical event ${fmt(costMetrics.typicalLoss)}`,
    },
    {
      label: "Control effectiveness",
      value: `${costMetrics.controlEffectiveness}%`,
      note: `Of ${fmt(costMetrics.exposure)} exposure without controls`,
    },
    {
      label: "Expected loss avoided",
      value: fmt(costMetrics.totalCostImpact),
      note: `Range ${fmt(costMetrics.lossAvoidedLow)} – ${fmt(costMetrics.lossAvoidedHigh)}`,
    },
    {
      label: "True positives",
      value: costMetrics.truePositiveCount.toLocaleString(),
      note: `${costMetrics.truePositiveRate}% of ${totalAlerts.toLocaleString()} alerts, ${categoryCounts.filter(c => c.count > 0).length} categories`,
    },
  ];

  return (
    <div className="space-y-3 pb-6">
      {/* Headline figures: risk reduction leads, then dollars, then counts */}
      <div className="rounded-lg border border-neutral-200 bg-white overflow-hidden">
        <div className="flex items-center gap-2 h-10 px-3 border-b border-neutral-200">
          <DollarSign className="w-3.5 h-3.5 text-neutral-500" />
          <h2 className="text-[13px] font-medium text-neutral-900">Trends &amp; analytics</h2>
          <span className="text-[13px] text-neutral-400">· {periodLabel}</span>
          {data?.usingSampleData && <Tag tone="yellow">Demo data</Tag>}
          {loading && <span className="text-[12px] text-neutral-400">Loading…</span>}
          {error && <span className="text-[12px] text-red-600">{error}</span>}
          <Button variant="outline" size="sm" onClick={handleExportReport} disabled={isExporting} className="ml-auto h-7 text-xs shadow-none">
            <Calendar className="w-3.5 h-3.5" />
            {isExporting ? "Exporting..." : "Export PDF"}
          </Button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-neutral-200">
          {stats.map(stat => (
            <div key={stat.label} className="px-3 py-3 min-w-0 bg-white">
              <div className="text-[12px] text-neutral-500">{stat.label}</div>
              <div className={`mt-1 font-semibold tabular-nums ${stat.lead ? "text-2xl" : "text-lg"} text-neutral-900`}>
                {stat.value}
              </div>
              <div className="mt-0.5 text-[12px] leading-snug text-neutral-400">{stat.note}</div>
            </div>
          ))}
        </div>
      </div>

      {data && !data.usingSampleData && totalAlerts === 0 && (
        <p className="px-1 text-[13px] text-neutral-600">
          No closed incidents in {periodLabel}. The figures below assume a typical organisation of your size; they will reflect your own
          controls once incidents for this period arrive.
        </p>
      )}

      {/* What the dollar figures are anchored to */}
      {data && (
        <p className="px-1 text-[12px] text-neutral-500">
          Anchored to published losses for organisations with {costMetrics.revenueBand} revenue
          {costMetrics.profileAssumed && <span className="text-yellow-700"> (assumed: set your size in Settings)</span>}.
          {" "}Against {fmt(costMetrics.totalInvestment)} of security investment for the period: net benefit {signed(costMetrics.netBenefit)}, ROI {costMetrics.roi.toLocaleString()}% (range {costMetrics.roiLow.toLocaleString()}% to {costMetrics.roiHigh.toLocaleString()}%).
          {" "}Like insurance, security spend pays off in the rare severe year, so ROI alone understates it.
        </p>
      )}

      {headline && (
        <p className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[13px] text-neutral-700">
          <span className="font-medium text-neutral-900">{yearly ? "Latest quarter: " : "What changed: "}</span>{headline}
        </p>
      )}

      {/* The last four quarters: one metric at a time, then by category */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <Panel
          icon={TrendingUp}
          title="Four-quarter trend"
          subtitle={metric.note}
        >
          <div className="px-3 pt-3 overflow-x-auto">
            <div role="tablist" aria-label="Trend metric" className="inline-flex items-center gap-0.5 rounded-md border border-neutral-200 bg-neutral-50 p-0.5">
              {TREND_METRICS.map((m) => (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={trendMetric === m.id}
                  onClick={() => setTrendMetric(m.id)}
                  className={`h-6 px-2 rounded text-[12px] whitespace-nowrap ${trendMetric === m.id ? "bg-white text-neutral-900 font-medium shadow-sm" : "text-neutral-600 hover:text-neutral-900"}`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-end gap-4 h-44 px-4 pt-3">
            {trendData.map((q) => {
              const isSelected = !yearly && q.quarter === selectedQuarter;
              const value = q[trendMetric];
              return (
                <div key={q.quarter} className="flex-1 h-full flex flex-col items-center justify-end min-w-0">
                  <div className={`text-[12px] tabular-nums mb-1 ${isSelected ? "font-medium text-neutral-900" : "text-neutral-600"}`}>{metric.format(value)}</div>
                  <div
                    className={`w-full max-w-16 rounded-t ${isSelected ? "bg-neutral-900" : "bg-neutral-300"} ${q.inProgress ? "opacity-60" : ""}`}
                    style={{ height: `${Math.max(2, (value / maxTrend) * 100)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 px-4 py-2 border-t border-neutral-200">
            {trendData.map((q, i) => {
              const prev = i > 0 ? trendData[i - 1] : null;
              const isRate = trendMetric === "truePositiveRate" || trendMetric === "triageCoverage";
              const change = !prev ? null : isRate ? q[trendMetric] - prev[trendMetric] : prev[trendMetric] > 0 ? ((q[trendMetric] - prev[trendMetric]) / prev[trendMetric]) * 100 : null;
              const isSelected = !yearly && q.quarter === selectedQuarter;
              return (
                <div key={q.quarter} className="flex-1 text-center min-w-0">
                  <div className={`text-[12px] ${isSelected ? "font-medium text-neutral-900" : "text-neutral-500"}`}>{q.quarter}</div>
                  <div className="text-[11px] text-neutral-400 tabular-nums">
                    {q.future ? "not started" : q.inProgress ? "in progress" : i === 0 || change === null ? "\u00a0" : Math.abs(change) < 0.5 ? "no change" : `${change > 0 ? "+" : ""}${change.toFixed(0)}${isRate ? " pts" : "%"}`}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>
        <Panel icon={Shield} title="Categories by quarter" subtitle="Alert volume for each control area; darker is busier">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className={th}>Category</th>
                  {trendData.map((q) => (
                    <th key={q.quarter} className={`${th} text-right ${!yearly && q.quarter === selectedQuarter ? "text-neutral-900 font-medium" : ""}`}>{q.quarter.replace(" 20", " '")}</th>
                  ))}
                  <th className={`${th} text-right`}>Change</th>
                  <th className={`${th} text-right`}>Loss avoided</th>
                </tr>
              </thead>
              <tbody>
                {[...categoryCounts].sort((a, b) => b.count - a.count).map((cat) => {
                  const nowCount = current?.byCategory[cat.key] ?? 0;
                  const beforeCount = previous?.byCategory[cat.key];
                  const change = beforeCount ? ((nowCount / (current?.elapsedShare ?? 1) - beforeCount) / beforeCount) * 100 : null;
                  return (
                    <tr key={cat.key}>
                      <td className={`${td} font-medium whitespace-nowrap`}>{cat.label}</td>
                      {trendData.map((q) => {
                        const n = q.byCategory[cat.key] ?? 0;
                        const strength = n / maxCategoryCell;
                        return (
                          <td key={q.quarter} className={`${td} text-right tabular-nums`}>
                            <span
                              className={`inline-block min-w-9 rounded px-1.5 py-0.5 ${strength > 0.6 ? "text-white" : "text-neutral-800"}`}
                              style={{ backgroundColor: n === 0 ? "transparent" : `rgba(23,23,23,${(0.06 + strength * 0.8).toFixed(2)})` }}
                            >
                              {n === 0 ? <span className="text-neutral-300">0</span> : n}
                            </span>
                          </td>
                        );
                      })}
                      <td className={`${td} text-right tabular-nums text-neutral-600 whitespace-nowrap`}>
                        {change === null ? "—" : Math.abs(change) < 0.5 ? "0%" : `${change > 0 ? "+" : ""}${change.toFixed(0)}%`}
                      </td>
                      <td className={`${td} text-right tabular-nums`}>{cat.count > 0 ? fmt(cat.cost) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="px-3 py-2 border-t border-neutral-200 text-[12px] text-neutral-400">
            Change compares {current?.quarter} with {previous?.quarter ?? "the previous quarter"}
            {current?.inProgress ? `, scaling ${current.quarter} to a full quarter because it is still in progress` : ""}. Loss avoided is for {periodLabel}.
          </p>
        </Panel>
      </div>

      {/* Which integrations the figures come from */}
      <Panel icon={Plug} title="Data sources" subtitle="Alerts and loss avoided by integration">
        <table className="w-full">
          <thead>
            <tr>
              <th className={th}>Integration</th>
              <th className={`${th} text-right`}>Alerts</th>
              <th className={`${th} text-right`}>Incidents counted</th>
              <th className={`${th} text-right`}>Loss avoided</th>
            </tr>
          </thead>
          <tbody>
            {(data?.sources ?? []).map((src) => (
              <tr key={src.source}>
                <td className={`${td} font-medium`}>{src.source}</td>
                <td className={`${td} text-right tabular-nums`}>{src.alerts.toLocaleString()}</td>
                <td className={`${td} text-right tabular-nums`}>{src.incidents.toLocaleString()}</td>
                <td className={`${td} text-right tabular-nums`}>{src.incidents > 0 ? fmt(src.lossAvoided) : "—"}</td>
              </tr>
            ))}
            {(data?.sources ?? []).length === 0 && (
              <tr><td className={`${td} text-neutral-500`} colSpan={4}>No alerts in this period.</td></tr>
            )}
          </tbody>
        </table>
      </Panel>

      {/* Severity + key risk indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel icon={AlertTriangle} title="Severity distribution" subtitle="Share of alerts at each severity">
          <div className="p-3 space-y-1.5">
            {(["Critical", "High", "Medium", "Low"] as SeverityLevel[]).map(sev => {
              const count = severityCounts[sev];
              const pct = totalAlerts > 0 ? (count / totalAlerts) * 100 : 0;
              return (
                <div key={sev} className="flex items-center gap-3">
                  <div className="relative flex-1 h-8 rounded-md overflow-hidden">
                    <div className="absolute inset-y-0 left-0 rounded-md bg-neutral-100" style={{ width: `${Math.max(pct, 1)}%` }} />
                    <div className="relative h-full flex items-center gap-2 px-2.5 text-[13px] text-neutral-800 whitespace-nowrap">
                      <span className={`w-1.5 h-1.5 rounded-full ${SEVERITY_CONFIG[sev].bar}`} />
                      {sev}
                      <span className="text-neutral-400 tabular-nums">{count}</span>
                    </div>
                  </div>
                  <span className="w-12 text-right text-[13px] text-neutral-600 tabular-nums">{pct.toFixed(1)}%</span>
                </div>
              );
            })}
          </div>
          <div className="grid grid-cols-2 divide-x divide-neutral-200 border-t border-neutral-200">
            <div className="px-3 py-2">
              <div className="text-[12px] text-neutral-500">Avg loss avoided / alert</div>
              <div className="text-[13px] font-medium text-neutral-900 tabular-nums">{totalAlerts > 0 ? fmt(Math.round(totalCostImpact / totalAlerts)) : "$0"}</div>
            </div>
            <div className="px-3 py-2">
              <div className="text-[12px] text-neutral-500">High+ rate</div>
              <div className="text-[13px] font-medium text-neutral-900 tabular-nums">
                {totalAlerts > 0 ? (((severityCounts.Critical + severityCounts.High) / totalAlerts) * 100).toFixed(1) : "0"}%
              </div>
            </div>
          </div>
        </Panel>

        <Panel
          icon={Activity}
          title="Key risk indicators"
          subtitle={current ? `${current.quarter}${previous ? ` against ${previous.quarter}` : ""}` : undefined}
        >
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Indicator</th>
                <th className={`${th} text-right`}>{current?.quarter ?? "Now"}</th>
                <th className={`${th} text-right`}>{previous?.quarter ?? "Before"}</th>
                <th className={`${th} text-right`}>{current?.inProgress ? "Change (on pace)" : "Change"}</th>
              </tr>
            </thead>
            <tbody>
              {indicators.map((k) => {
                const flat = k.delta === null || Math.abs(k.delta) < 0.5;
                // Mid-quarter, effectiveness and loss avoided are lower only because fewer incidents have closed yet
                const judged = k.goodWhen !== "none" && !(current?.inProgress && (k.label === "Control effectiveness" || k.label === "Expected loss avoided"));
                const better = !flat && judged && (k.goodWhen === "up" ? k.delta! > 0 : k.delta! < 0);
                const worse = !flat && judged && !better;
                return (
                  <tr key={k.label}>
                    <td className={td}>
                      {k.label}
                      <span className="block text-[11px] text-neutral-400">{k.hint}</span>
                    </td>
                    <td className={`${td} text-right tabular-nums font-medium`}>{k.now}</td>
                    <td className={`${td} text-right tabular-nums text-neutral-500`}>{k.before}</td>
                    <td className={`${td} text-right tabular-nums whitespace-nowrap`}>
                      {/* colour on a child: the cell's own text colour would otherwise win */}
                      <span className={better ? "text-green-600" : worse ? "text-red-600" : "text-neutral-500"}>
                        {k.delta === null ? "—" : flat ? "no change" : `${k.delta > 0 ? "+" : ""}${k.delta.toFixed(k.unit === "pts" ? 1 : 0)}${k.unit === "pts" ? " pts" : "%"}`}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
