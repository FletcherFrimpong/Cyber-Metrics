"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, AlertTriangle, Activity, DollarSign, Calendar, TrendingUp, TrendingDown, Minus } from "lucide-react";
import edrDataService from "@/lib/edr-data-service";
import { calculateCostMetrics } from "@/lib/cost-calculations";
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

export default function TrendsAnalytics({ timeView, selectedQuarter }: TrendsAnalyticsProps) {
  const [costMetrics, setCostMetrics] = useState({
    roi: 0, totalCostSavings: 0, totalCostImpact: 0, totalInvestment: 0, netBenefit: 0,
    truePositiveCount: 0, truePositiveRate: 0,
  });
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // Fetch investment amount from settings
        const settingsRes = await fetch("/api/settings").catch(() => null);
        const settings = settingsRes ? await settingsRes.json() : {};
        const investment = settings.investmentAmount || 0;

        const m = await calculateCostMetrics({
          period: timeView === "yearly" ? "yearly" : "quarterly",
          selectedQuarter,
          investmentAmount: investment,
        });
        setCostMetrics({
          roi: m.roi, totalCostSavings: m.totalCostSavings, totalCostImpact: m.totalCostImpact,
          totalInvestment: m.totalInvestment, netBenefit: m.netBenefit,
          truePositiveCount: m.truePositiveCount, truePositiveRate: m.truePositiveRate,
        });
      } catch {
        setCostMetrics({ roi: 0, totalCostSavings: 0, totalCostImpact: 0, totalInvestment: 0, netBenefit: 0, truePositiveCount: 0, truePositiveRate: 0 });
      }
    };
    load();
  }, [timeView, selectedQuarter]);

  // Aggregate alerts
  const timeframeAlerts = useMemo(() => {
    if (timeView === "quarterly") return edrDataService.getTimeframeAlerts(selectedQuarter);
    const year = selectedQuarter.split(" ")[1];
    const agg = { edr: [] as any[], email: [] as any[], network: [] as any[], web: [] as any[], cloud: [] as any[] };
    for (let q = 1; q <= 4; q++) {
      const qa = edrDataService.getTimeframeAlerts(`Q${q} ${year}`);
      (Object.keys(agg) as CategoryKey[]).forEach(k => agg[k].push(...qa[k]));
    }
    return agg;
  }, [timeView, selectedQuarter]);

  // Derived stats
  const allAlerts = useMemo(() => {
    return (Object.keys(timeframeAlerts) as CategoryKey[]).flatMap(k => timeframeAlerts[k]);
  }, [timeframeAlerts]);

  const totalAlerts = allAlerts.length;
  const totalCostImpact = allAlerts.reduce((s, a: any) => s + (a.costImpact || 0), 0);
  const severityCounts = useMemo(() => {
    const counts: Record<SeverityLevel, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    allAlerts.forEach((a: any) => { if (counts[a.severity as SeverityLevel] !== undefined) counts[a.severity as SeverityLevel]++; });
    return counts;
  }, [allAlerts]);
  const categoryCounts = useMemo(() => {
    return (Object.keys(timeframeAlerts) as CategoryKey[]).map(k => ({
      key: k,
      label: CATEGORY_LABELS[k],
      count: timeframeAlerts[k].length,
      cost: timeframeAlerts[k].reduce((s: number, a: any) => s + (a.costImpact || 0), 0),
      critical: timeframeAlerts[k].filter((a: any) => a.severity === "Critical").length,
      high: timeframeAlerts[k].filter((a: any) => a.severity === "High").length,
    }));
  }, [timeframeAlerts]);

  // Quarterly trend data
  const trendData = useMemo(() => {
    const currentDate = new Date();
    const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
    const currentYear = currentDate.getFullYear();
    const quarters = [];
    for (let i = 3; i >= 0; i--) {
      let tq = currentQuarter - i;
      let ty = currentYear;
      if (tq <= 0) { tq += 4; ty -= 1; }
      if (ty >= 2024) {
        const key = `Q${tq} ${ty}`;
        const qa = edrDataService.getTimeframeAlerts(key);
        const all = (Object.keys(qa) as CategoryKey[]).flatMap(k => qa[k]);
        quarters.push({
          quarter: key,
          alerts: all.length,
          cost: all.reduce((s: number, a: any) => s + (a.costImpact || 0), 0),
        });
      }
    }
    return quarters;
  }, []);

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

  const maxCategoryCount = Math.max(...categoryCounts.map(c => c.count), 1);
  const maxTrendAlerts = Math.max(...trendData.map(t => t.alerts), 1);

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">
            Trends & Analytics
            <span className="ml-3 text-sm font-normal text-neutral-500">
              {timeView === "quarterly" ? selectedQuarter : selectedQuarter.split(" ")[1]}
            </span>
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={handleExportReport} disabled={isExporting} className="text-xs">
          <Calendar className="w-3.5 h-3.5 mr-1.5" />
          {isExporting ? "Exporting..." : "Export PDF"}
        </Button>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Total Alerts</div>
          <div className="text-2xl font-bold text-white tabular-nums">{totalAlerts.toLocaleString()}</div>
          <div className="text-xs text-neutral-500 mt-1">across {categoryCounts.filter(c => c.count > 0).length} categories</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">True Positives</div>
          <div className="text-2xl font-bold text-orange-400 tabular-nums">{costMetrics.truePositiveCount.toLocaleString()}</div>
          <div className="text-xs text-neutral-500 mt-1">{costMetrics.truePositiveRate}% of all alerts — {fmt(costMetrics.totalCostImpact)} risk quantified</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">Net Benefit</div>
          <div className={`text-2xl font-bold tabular-nums ${costMetrics.netBenefit >= 0 ? "text-green-400" : "text-red-400"}`}>
            {fmt(costMetrics.netBenefit)}
          </div>
          <div className="text-xs text-neutral-500 mt-1">savings minus {fmt(costMetrics.totalInvestment)} investment</div>
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4">
          <div className="text-xs text-neutral-500 uppercase tracking-wide mb-1">ROI</div>
          <div className={`text-2xl font-bold tabular-nums ${costMetrics.roi >= 0 ? "text-green-400" : "text-red-400"}`}>
            {costMetrics.roi > 0 ? "+" : ""}{costMetrics.roi.toLocaleString()}%
          </div>
          <div className="text-xs text-neutral-500 mt-1">return on investment</div>
        </div>
      </div>

      {/* Main Grid: Categories + Severity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Alert Categories Table */}
        <Card className="lg:col-span-2 bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-neutral-300 uppercase tracking-wide">Alert Categories</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-1">
              {/* Header row */}
              <div className="grid grid-cols-12 text-[10px] text-neutral-600 uppercase tracking-wider pb-1 border-b border-neutral-800">
                <div className="col-span-3">Category</div>
                <div className="col-span-4">Volume</div>
                <div className="col-span-2 text-right">Critical</div>
                <div className="col-span-3 text-right">Cost Impact</div>
              </div>
              {categoryCounts.map(cat => (
                <div key={cat.key} className="grid grid-cols-12 items-center py-2 text-sm border-b border-neutral-800/50 last:border-0">
                  <div className="col-span-3 text-neutral-300 text-xs font-medium">{cat.label}</div>
                  <div className="col-span-4 flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${(cat.count / maxCategoryCount) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-400 tabular-nums w-10 text-right">{cat.count}</span>
                  </div>
                  <div className="col-span-2 text-right">
                    {cat.critical > 0 ? (
                      <span className="text-xs text-red-400 tabular-nums">{cat.critical}</span>
                    ) : (
                      <span className="text-xs text-neutral-700">0</span>
                    )}
                  </div>
                  <div className="col-span-3 text-right text-xs text-neutral-300 tabular-nums">{fmt(cat.cost)}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Severity Breakdown */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-neutral-300 uppercase tracking-wide">Severity Distribution</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {(["Critical", "High", "Medium", "Low"] as SeverityLevel[]).map(sev => {
                const count = severityCounts[sev];
                const pct = totalAlerts > 0 ? (count / totalAlerts * 100) : 0;
                const cfg = SEVERITY_CONFIG[sev];
                return (
                  <div key={sev}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${cfg.color}`}>{sev}</span>
                      <span className="text-xs text-neutral-500 tabular-nums">{count} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
                      <div className={`h-full ${cfg.bar} rounded-full transition-all`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick stats */}
            <div className="mt-5 pt-4 border-t border-neutral-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500">Avg Cost / Alert</span>
                <span className="text-neutral-300 tabular-nums">{totalAlerts > 0 ? fmt(Math.round(totalCostImpact / totalAlerts)) : "$0"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-neutral-500">High+ Rate</span>
                <span className="text-neutral-300 tabular-nums">
                  {totalAlerts > 0 ? ((severityCounts.Critical + severityCounts.High) / totalAlerts * 100).toFixed(1) : "0"}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quarterly Trend + KRI Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Quarterly Trend */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-neutral-300 uppercase tracking-wide">Quarterly Trend</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="space-y-3">
              {trendData.map((q, i) => {
                const prev = i > 0 ? trendData[i - 1] : null;
                const change = prev ? ((q.alerts - prev.alerts) / prev.alerts * 100) : 0;
                const isSelected = q.quarter === selectedQuarter;
                return (
                  <div key={q.quarter} className={`flex items-center gap-3 p-2.5 rounded-md ${isSelected ? "bg-neutral-800 border border-neutral-700" : ""}`}>
                    <div className="w-16 text-xs font-mono text-neutral-400">{q.quarter}</div>
                    <div className="flex-1">
                      <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${isSelected ? "bg-orange-500" : "bg-neutral-600"}`}
                          style={{ width: `${(q.alerts / maxTrendAlerts) * 100}%` }}
                        />
                      </div>
                    </div>
                    <div className="w-14 text-right text-xs text-neutral-300 tabular-nums">{q.alerts}</div>
                    <div className="w-16 text-right">
                      {i === 0 ? (
                        <Minus className="w-3 h-3 text-neutral-600 ml-auto" />
                      ) : change > 0 ? (
                        <span className="text-xs text-red-400 tabular-nums">+{change.toFixed(0)}%</span>
                      ) : change < 0 ? (
                        <span className="text-xs text-green-400 tabular-nums">{change.toFixed(0)}%</span>
                      ) : (
                        <span className="text-xs text-neutral-600">0%</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-neutral-800 flex justify-between text-[10px] text-neutral-600 uppercase tracking-wider">
              <span>Quarter</span>
              <span>Alerts vs. Prior</span>
            </div>
          </CardContent>
        </Card>

        {/* Key Risk Indicators */}
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-medium text-neutral-300 uppercase tracking-wide">Key Risk Indicators</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid grid-cols-2 gap-3">
              {kriMetrics.map(kri => (
                <div key={kri.label} className="bg-neutral-800/50 border border-neutral-800 rounded-md p-3">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-1.5">{kri.label}</div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-lg font-bold tabular-nums ${kri.good ? "text-white" : "text-red-400"}`}>
                      {typeof kri.value === "number" && kri.unit === "%" ? kri.value.toFixed(1) : kri.value}
                    </span>
                    <span className="text-xs text-neutral-600">{kri.unit}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Risk summary */}
            <div className="mt-4 p-3 bg-neutral-800/30 border border-neutral-800 rounded-md">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-3.5 h-3.5 text-neutral-500" />
                <span className="text-xs text-neutral-400 font-medium">Risk Assessment</span>
              </div>
              <div className="space-y-1.5">
                {[
                  { label: "Threat Level", value: severityCounts.Critical > 10 ? "High" : severityCounts.Critical > 3 ? "Medium" : "Low" },
                  { label: "Risk Exposure", value: totalAlerts > 500 ? "Elevated" : totalAlerts > 200 ? "Moderate" : "Controlled" },
                  { label: "Posture", value: costMetrics.roi > 100 ? "Strong" : costMetrics.roi > 0 ? "Adequate" : "Needs Review" },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-neutral-500">{item.label}</span>
                    <span className={`text-xs font-medium ${
                      item.value === "High" || item.value === "Elevated" || item.value === "Needs Review"
                        ? "text-red-400"
                        : item.value === "Medium" || item.value === "Moderate" || item.value === "Adequate"
                        ? "text-yellow-400"
                        : "text-green-400"
                    }`}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
