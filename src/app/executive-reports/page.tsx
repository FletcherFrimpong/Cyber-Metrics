"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  FileText, Download, TrendingUp, Shield, DollarSign, Target,
  BarChart3, Lock, Eye, AlertTriangle, CheckCircle, XCircle,
  Clock, Users, Server, Database, Smartphone, Loader2, ChevronDown
} from "lucide-react";

function getCurrentQuarter() {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

function getQuarterOptions() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const quarters: string[] = [];
  // Current year and previous year
  for (const year of [currentYear, currentYear - 1]) {
    for (let q = 4; q >= 1; q--) {
      quarters.push(`Q${q} ${year}`);
    }
  }
  return quarters;
}

function getQuarterPeriod(qstr: string) {
  const [q, y] = qstr.split(" ");
  const qn = parseInt(q.replace("Q", ""), 10);
  const months = [
    ["January", "March"], ["April", "June"],
    ["July", "September"], ["October", "December"],
  ];
  const [start, end] = months[qn - 1];
  return `${start} 1 - ${end} ${qn === 1 || qn === 4 ? 31 : 30}, ${y}`;
}

function fmt(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
}

interface CostMetrics {
  totalAlerts: number;
  truePositiveCount: number;
  falsePositiveCount: number;
  truePositiveRate: number;
  totalCostImpact: number;
  totalCostSavings: number;
  breachPrevention: number;
  complianceSavings: number;
  insuranceSavings: number;
  productivityGains: number;
  regulatoryFines: number;
  reputationDamage: number;
  totalInvestment: number;
  netBenefit: number;
  roi: number;
}

export default function ExecutiveReportsPage() {
  const [selectedQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const [analysisPeriod, setAnalysisPeriod] = useState<"quarterly" | "yearly">("quarterly");
  const [metrics, setMetrics] = useState<CostMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [quarterOpen, setQuarterOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/metrics?period=${analysisPeriod}&quarter=${encodeURIComponent(selectedQuarter)}`
        );
        const json = await res.json();
        if (json.success) {
          setMetrics(json.costMetrics);
        }
      } catch (err) {
        console.error("Failed to load metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [analysisPeriod, selectedQuarter]);

  const handleExportPDF = async () => {
    try {
      // Fetch alert data for PDF
      const res = await fetch(`/api/edr-alerts?timeframe=${encodeURIComponent(selectedQuarter)}`);
      const json = await res.json();
      if (!json.success || !metrics) return;

      const { generateTrendsAnalyticsPDF } = await import("@/lib/pdf-export");
      await generateTrendsAnalyticsPDF({
        timeView: analysisPeriod === "yearly" ? "yearly" : "quarterly",
        selectedQuarter,
        timeframeAlerts: json.data,
        roiValue: metrics.roi,
        quarterlyData: [],
        yearlyData: [],
        kriMetrics: {
          threatVolume: metrics.totalAlerts > 100 ? 75 : Math.min(metrics.totalAlerts, 100),
          costEfficiency: metrics.totalInvestment > 0 ? Math.min(99, Math.round((metrics.totalCostImpact / Math.max(1, metrics.totalInvestment)) * 100)) : 0,
          roi: metrics.roi,
          detectionAccuracy: metrics.truePositiveRate,
          responseTime: 85,
          coverageGap: metrics.falsePositiveCount > 0 ? Math.min(50, Math.round((metrics.falsePositiveCount / Math.max(1, metrics.totalAlerts)) * 100)) : 5,
        },
      });
    } catch (error) {
      console.error("PDF export failed:", error);
    }
  };

  const m = metrics;
  const savingsBreakdown = m ? [
    { label: "Breach Prevention", value: m.breachPrevention, color: "text-red-400", pct: 35 },
    { label: "Productivity Gains", value: m.productivityGains, color: "text-blue-400", pct: 20 },
    { label: "Compliance Savings", value: m.complianceSavings, color: "text-purple-400", pct: 15 },
    { label: "Regulatory Fines Avoided", value: m.regulatoryFines, color: "text-orange-400", pct: 12 },
    { label: "Insurance Savings", value: m.insuranceSavings, color: "text-cyan-400", pct: 10 },
    { label: "Reputation Damage Avoided", value: m.reputationDamage, color: "text-green-400", pct: 8 },
  ] : [];

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">Executive Security Report</h1>
          <p className="text-sm text-neutral-400">
            {analysisPeriod === "yearly" ? `Annual Report — ${selectedQuarter.split(" ")[1]}` : `${selectedQuarter}`}
            {" "}&mdash; {getQuarterPeriod(selectedQuarter)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Period toggle */}
          <div className="flex items-center gap-1 bg-neutral-800 border border-neutral-700 rounded-lg p-1">
            {(["quarterly", "yearly"] as const).map((p) => (
              <Button
                key={p}
                variant="ghost"
                size="sm"
                onClick={() => setAnalysisPeriod(p)}
                className={`text-xs capitalize ${analysisPeriod === p ? "bg-orange-600 text-white hover:bg-orange-700" : "text-neutral-400 hover:text-white"}`}
              >
                {p}
              </Button>
            ))}
          </div>

          {/* Quarter selector */}
          <div className="relative">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuarterOpen(!quarterOpen)}
              className="text-xs gap-1"
            >
              {selectedQuarter}
              <ChevronDown className={`w-3 h-3 transition-transform ${quarterOpen ? "rotate-180" : ""}`} />
            </Button>
            {quarterOpen && (
              <div className="absolute right-0 top-full mt-1 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl z-10 py-1 min-w-[120px]">
                {getQuarterOptions().map((q) => (
                  <button
                    key={q}
                    onClick={() => { setSelectedQuarter(q); setQuarterOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-700 ${q === selectedQuarter ? "text-orange-400" : "text-neutral-300"}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleExportPDF} className="bg-orange-600 hover:bg-orange-700 text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      {m && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">Total Cost Impact</p>
                    <p className="text-2xl font-bold text-green-400 font-mono">{fmt(m.totalCostImpact)}</p>
                    <p className="text-xs text-neutral-500">threats quantified</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-green-400/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">ROI</p>
                    <p className={`text-2xl font-bold font-mono ${m.roi >= 0 ? "text-green-400" : "text-red-400"}`}>{m.roi}%</p>
                    <p className="text-xs text-neutral-500">return on investment</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-400/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">True Positives</p>
                    <p className="text-2xl font-bold text-blue-400 font-mono">{m.truePositiveCount}</p>
                    <p className="text-xs text-neutral-500">{m.truePositiveRate}% detection rate</p>
                  </div>
                  <Shield className="w-8 h-8 text-blue-400/30" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">Net Benefit</p>
                    <p className={`text-2xl font-bold font-mono ${m.netBenefit >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(m.netBenefit)}</p>
                    <p className="text-xs text-neutral-500">savings − investment</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-orange-400/30" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Financial Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Savings Breakdown */}
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-neutral-300 uppercase tracking-wide flex items-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  Savings Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {savingsBreakdown.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-neutral-400">{item.label}</span>
                      <span className={`font-mono ${item.color}`}>{fmt(item.value)}</span>
                    </div>
                    <Progress value={item.pct} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Financial Impact */}
            <Card className="bg-neutral-900 border-neutral-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-neutral-300 uppercase tracking-wide flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Financial Impact Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">Security Investment</span>
                  <span className="font-mono text-red-400">{fmt(m.totalInvestment)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">Total Cost Impact (Threats)</span>
                  <span className="font-mono text-green-400">{fmt(m.totalCostImpact)}</span>
                </div>
                <div className="border-t border-neutral-800 my-2" />
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">Net Benefit</span>
                  <span className={`font-mono font-bold ${m.netBenefit >= 0 ? "text-green-400" : "text-red-400"}`}>{fmt(m.netBenefit)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-neutral-400">ROI</span>
                  <span className={`font-mono font-bold ${m.roi >= 0 ? "text-green-400" : "text-red-400"}`}>{m.roi}%</span>
                </div>

                <div className="border-t border-neutral-800 my-2" />
                <p className="text-xs text-neutral-500 uppercase tracking-wide mb-2">Incident Summary</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 bg-neutral-800 rounded">
                    <p className="text-lg font-bold text-white font-mono">{m.totalAlerts}</p>
                    <p className="text-[10px] text-neutral-500">Total Alerts</p>
                  </div>
                  <div className="text-center p-2 bg-neutral-800 rounded">
                    <p className="text-lg font-bold text-green-400 font-mono">{m.truePositiveCount}</p>
                    <p className="text-[10px] text-neutral-500">True Positives</p>
                  </div>
                  <div className="text-center p-2 bg-neutral-800 rounded">
                    <p className="text-lg font-bold text-yellow-400 font-mono">{m.falsePositiveCount}</p>
                    <p className="text-[10px] text-neutral-500">False Positives</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Detection Performance */}
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-neutral-300 uppercase tracking-wide flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Detection Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-neutral-800 rounded-lg">
                  <p className="text-3xl font-bold text-green-400 font-mono">{m.truePositiveRate}%</p>
                  <p className="text-xs text-neutral-500 mt-1">True Positive Rate</p>
                </div>
                <div className="text-center p-4 bg-neutral-800 rounded-lg">
                  <p className="text-3xl font-bold text-blue-400 font-mono">{m.truePositiveCount}</p>
                  <p className="text-xs text-neutral-500 mt-1">Validated Threats</p>
                </div>
                <div className="text-center p-4 bg-neutral-800 rounded-lg">
                  <p className="text-3xl font-bold text-orange-400 font-mono">{m.totalAlerts}</p>
                  <p className="text-xs text-neutral-500 mt-1">Total Incidents</p>
                </div>
                <div className="text-center p-4 bg-neutral-800 rounded-lg">
                  <p className="text-3xl font-bold text-purple-400 font-mono">
                    {m.totalAlerts > 0 ? fmt(m.totalCostImpact / m.totalAlerts) : "$0"}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Avg Cost / Incident</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Empty state when no data */}
          {m.totalAlerts === 0 && (
            <Card className="bg-neutral-900 border-neutral-800">
              <CardContent className="p-8 text-center">
                <AlertTriangle className="w-10 h-10 text-neutral-600 mx-auto mb-3" />
                <p className="text-sm text-neutral-400">No incident data available for {selectedQuarter}</p>
                <p className="text-xs text-neutral-500 mt-1">Connect Microsoft Sentinel and sync incidents to see metrics here.</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div className="h-8" />
    </div>
  );
}
