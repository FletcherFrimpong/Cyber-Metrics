"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Activity, DollarSign, Calendar, TrendingUp } from "lucide-react";
import { Panel, Tag, th, td } from "@/components/ui/panel";
import { useDashboardData, type DashboardMetrics } from "@/hooks/useDashboardData";
import type { TrendsAnalyticsData } from "@/lib/pdf-export";

interface TrendsAnalyticsProps {
  timeView: "quarterly" | "yearly";
  selectedQuarter: string;
}

type SeverityLevel = "Critical" | "High" | "Medium" | "Low";
type CategoryKey = "edr" | "email" | "network" | "web" | "cloud";

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  edr: "Endpoint (EDR)",
  email: "Email Security",
  network: "Network",
  web: "Web Filtering",
  cloud: "Cloud Security",
};

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
    const out = { edr: [] as any[], email: [] as any[], network: [] as any[], web: [] as any[], cloud: [] as any[] };
    for (const c of data?.categories ?? []) {
      for (const [sev, n] of [["Critical", c.critical], ["High", c.high], ["Medium", c.medium], ["Low", c.low]] as const) {
        for (let i = 0; i < n; i++) out[c.key].push({ severity: sev });
      }
    }
    return out;
  }, [data]);

  // KRI metrics derived from data
  const kriMetrics = useMemo(() => {
    const fpRate = totalAlerts > 0 ? (100 - costMetrics.truePositiveRate) : 0;
    return [
      { label: "True Positive Rate", value: costMetrics.truePositiveRate, unit: "%", good: costMetrics.truePositiveRate > 20 },
      { label: "False Positive Rate", value: Math.round(fpRate * 10) / 10, unit: "%", good: fpRate < 80 },
      { label: "Risk Quantified", value: costMetrics.totalCostImpact >= 1000000 ? Math.round(costMetrics.totalCostImpact / 1000000 * 10) / 10 : Math.round(costMetrics.totalCostImpact / 1000), unit: costMetrics.totalCostImpact >= 1000000 ? "M" : "K", good: true },
      { label: "ROI", value: costMetrics.roi, unit: "%", good: costMetrics.roi > 0 },
      { label: "Investment", value: costMetrics.totalInvestment / 1000, unit: "K", good: true },
      { label: "Coverage", value: categoryCounts.filter(c => c.count > 0).length, unit: "/5", good: true },
    ];
  }, [totalAlerts, costMetrics, categoryCounts]);

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
  const maxTrendCost = Math.max(...trendData.map(t => t.cost), 1);
  const tone = (value: string) =>
    value === "High" || value === "Elevated" || value === "Needs Review"
      ? "red"
      : value === "Medium" || value === "Moderate" || value === "Adequate"
      ? "yellow"
      : "green";
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
              <div className="mt-0.5 text-[12px] text-neutral-400 truncate">{stat.note}</div>
            </div>
          ))}
        </div>
      </div>

      {/* What the dollar figures are anchored to */}
      {data && (
        <p className="px-1 text-[12px] text-neutral-500">
          Anchored to published losses for organisations with {costMetrics.revenueBand} revenue
          {costMetrics.profileAssumed && <span className="text-yellow-700"> (assumed: set your size in Settings)</span>}.
          {" "}Against {fmt(costMetrics.totalInvestment)} of security investment for the period: net benefit {signed(costMetrics.netBenefit)}, ROI {costMetrics.roi.toLocaleString()}% (range {costMetrics.roiLow.toLocaleString()}% to {costMetrics.roiHigh.toLocaleString()}%).
          {" "}Like insurance, security spend pays off in the rare severe year, so ROI alone understates it.
        </p>
      )}

      {/* Loss avoided by quarter + categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Panel icon={TrendingUp} title="Quarterly trend" subtitle="Expected loss avoided and alert volume by quarter">
          <div className="flex items-end gap-4 h-52 px-4 pt-4">
            {trendData.map((q, i) => {
              const prev = i > 0 ? trendData[i - 1] : null;
              const change = prev && prev.alerts > 0 ? ((q.alerts - prev.alerts) / prev.alerts) * 100 : 0;
              const isSelected = q.quarter === selectedQuarter;
              return (
                <div key={q.quarter} className="flex-1 h-full flex flex-col items-center justify-end min-w-0">
                  <div className="text-[12px] text-neutral-700 tabular-nums mb-1">{fmt(q.cost)}</div>
                  <div
                    className={`w-full max-w-16 rounded-t ${isSelected ? "bg-neutral-900" : "bg-neutral-200"}`}
                    style={{ height: `${Math.max(2, (q.cost / maxTrendCost) * 100)}%` }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 px-4 py-2 border-t border-neutral-200">
            {trendData.map((q, i) => {
              const prev = i > 0 ? trendData[i - 1] : null;
              const change = prev && prev.alerts > 0 ? ((q.alerts - prev.alerts) / prev.alerts) * 100 : 0;
              const isSelected = q.quarter === selectedQuarter;
              return (
                <div key={q.quarter} className="flex-1 text-center min-w-0">
                  <div className={`text-[12px] ${isSelected ? "font-medium text-neutral-900" : "text-neutral-500"}`}>{q.quarter}</div>
                  <div className="text-[11px] text-neutral-400 tabular-nums">
                    {q.alerts} alerts
                    {i > 0 && change !== 0 && (
                      <span className={change > 0 ? "text-red-600" : "text-green-600"}> {change > 0 ? "+" : ""}{change.toFixed(0)}%</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </Panel>

        <Panel icon={Shield} title="Alert categories" subtitle="Volume and loss avoided by security tool type">
          <table className="w-full">
            <thead>
              <tr>
                <th className={`${th} w-8`}>#</th>
                <th className={th}>Category</th>
                <th className={`${th} text-right`}>Alerts</th>
                <th className={`${th} text-right`}>Critical</th>
                <th className={`${th} text-right`}>Loss avoided</th>
              </tr>
            </thead>
            <tbody>
              {[...categoryCounts].sort((a, b) => b.cost - a.cost || b.count - a.count).map((cat, i) => (
                <tr key={cat.key}>
                  <td className={`${td} text-neutral-400 tabular-nums`}>{i + 1}</td>
                  <td className={`${td} font-medium`}>{cat.label}</td>
                  <td className={`${td} text-right tabular-nums`}>{cat.count}</td>
                  <td className={`${td} text-right tabular-nums ${cat.critical > 0 ? "text-red-600" : "text-neutral-300"}`}>{cat.critical}</td>
                  <td className={`${td} text-right tabular-nums`}>{cat.count > 0 ? fmt(cat.cost) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>

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

        <Panel icon={Activity} title="Key risk indicators" subtitle="Derived from this period's alerts">
          <table className="w-full">
            <thead>
              <tr>
                <th className={th}>Indicator</th>
                <th className={`${th} text-right`}>Value</th>
              </tr>
            </thead>
            <tbody>
              {kriMetrics.map(kri => (
                <tr key={kri.label}>
                  <td className={td}>{kri.label}</td>
                  <td className={`${td} text-right tabular-nums font-medium ${kri.good ? "" : "text-red-600"}`}>
                    {typeof kri.value === "number" && kri.unit === "%" ? kri.value.toFixed(1) : kri.value}
                    <span className="font-normal text-neutral-400">{kri.unit}</span>
                  </td>
                </tr>
              ))}
              {[
                { label: "Threat Level", value: severityCounts.Critical > 10 ? "High" : severityCounts.Critical > 3 ? "Medium" : "Low" },
                { label: "Risk Exposure", value: totalAlerts > 500 ? "Elevated" : totalAlerts > 200 ? "Moderate" : "Controlled" },
                { label: "Posture", value: costMetrics.controlEffectiveness >= 80 ? "Strong" : costMetrics.controlEffectiveness >= 50 ? "Adequate" : "Needs Review" },
              ].map(item => (
                <tr key={item.label}>
                  <td className={td}>{item.label}</td>
                  <td className={`${td} text-right`}>
                    <Tag tone={tone(item.value)}>{item.value}</Tag>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>
      </div>
    </div>
  );
}
