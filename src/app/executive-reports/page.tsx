"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Panel, StatStrip, td } from "@/components/ui/panel";
import {
  Download, TrendingUp, Shield, DollarSign, BarChart3, AlertTriangle, Loader2, ChevronDown
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
  incidentCount: number;
  confirmedIncidents: number;
  unverifiedIncidents: number;
  dismissedIncidents: number;
  confirmedShare: number;
  exposure: number;
  controlEffectiveness: number;
  controlEffectivenessLow: number;
  controlEffectivenessHigh: number;
  residualLoss: number;
  lossProbabilityWithoutControls: number;
  lossProbabilityWithControls: number;
  peerAnnualLoss: number;
  typicalLoss: number;
  severeLoss: number;
  lossPerEvent: number;
  revenueBand: string;
  profileAssumed: boolean;
  typicalControlEffectiveness: number;
  lossEventsSuffered: number;
  lossAvoidedLow: number;
  lossAvoidedMedian: number;
  lossAvoidedHigh: number;
  categoryBreakdown: { category: string; incidents: number; lossAvoided: number }[];
  roiLow: number;
  roiHigh: number;
  totalInvestment: number;
  netBenefit: number;
  roi: number;
}

// Rendered inside the app shell (period comes from the shell's filter row) or
// standalone at /executive-reports (it keeps its own period controls).
export default function ExecutiveReportsPage(props: { selectedQuarter?: string; timeView?: "quarterly" | "yearly" }) {
  const embedded = props.selectedQuarter !== undefined;
  const [ownQuarter, setSelectedQuarter] = useState(getCurrentQuarter());
  const [ownPeriod, setAnalysisPeriod] = useState<"quarterly" | "yearly">("quarterly");
  const selectedQuarter = props.selectedQuarter ?? ownQuarter;
  const analysisPeriod = props.timeView ?? ownPeriod;
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
        metrics,
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
  const CATEGORY_STYLE: Record<string, { label: string; color: string }> = {
    edr: { label: "Endpoint (EDR)", color: "text-neutral-900" },
    email: { label: "Email", color: "text-neutral-900" },
    network: { label: "Network", color: "text-neutral-900" },
    web: { label: "Web", color: "text-neutral-900" },
    cloud: { label: "Cloud", color: "text-neutral-900" },
  };
  const savingsBreakdown = m ? m.categoryBreakdown.map(c => ({
    label: `${CATEGORY_STYLE[c.category]?.label || c.category} · ${c.incidents} incident${c.incidents === 1 ? "" : "s"}`,
    value: c.lossAvoided,
    color: CATEGORY_STYLE[c.category]?.color || "text-green-600",
    pct: m.totalCostImpact > 0 ? Math.round((c.lossAvoided / m.totalCostImpact) * 100) : 0,
  })) : [];

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  return (
    <div className={`space-y-3 overflow-y-auto ${embedded ? "" : "p-6"}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {!embedded && <h1 className="text-lg font-semibold text-neutral-900">Executive Security Report</h1>}
          <p className="text-[13px] text-neutral-500">
            {analysisPeriod === "yearly" ? `Annual Report — ${selectedQuarter.split(" ")[1]}` : `${selectedQuarter}`}
            {" "}&mdash; {getQuarterPeriod(selectedQuarter)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {!embedded && (<>
          {/* Period toggle */}
          <div className="flex items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-lg p-1">
            {(["quarterly", "yearly"] as const).map((p) => (
              <Button
                key={p}
                variant="ghost"
                size="sm"
                onClick={() => setAnalysisPeriod(p)}
                className={`text-xs capitalize ${analysisPeriod === p ? "bg-neutral-900 text-white hover:bg-neutral-800" : "text-neutral-500 hover:text-neutral-900"}`}
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
              <div className="absolute right-0 top-full mt-1 bg-neutral-50 border border-neutral-200 rounded-lg shadow-md z-10 py-1 min-w-[120px]">
                {getQuarterOptions().map((q) => (
                  <button
                    key={q}
                    onClick={() => { setSelectedQuarter(q); setQuarterOpen(false); }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-neutral-100 ${q === selectedQuarter ? "text-neutral-900" : "text-neutral-700"}`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>

          </>)}

          <Button size="sm" onClick={handleExportPDF} className="h-7 bg-neutral-900 hover:bg-neutral-800 text-white text-xs">
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      {m && (
        <>
          {/* Headline figures: risk reduction first. Net benefit and ROI are in the financial table below. */}
          <Panel icon={Shield} title="Summary" subtitle="How far your controls reduce the risk of a loss">
            <StatStrip
              className="md:grid-cols-4"
              stats={[
                {
                  label: "Chance of a material loss this year",
                  value: `${m.lossProbabilityWithControls}%`,
                  note: `Down from ${m.lossProbabilityWithoutControls}% without detection and response`,
                  lead: true,
                },
                {
                  label: "Severe event at your size",
                  value: fmt(m.severeLoss),
                  note: `Typical event ${fmt(m.typicalLoss)}`,
                },
                {
                  label: "Control effectiveness",
                  value: `${m.controlEffectiveness}%`,
                  note: `${m.confirmedIncidents} analyst-confirmed incidents, ${m.unverifiedIncidents} unverified`,
                },
                {
                  label: "Expected Loss Avoided",
                  value: fmt(m.totalCostImpact),
                  note: `Plausible range ${fmt(m.lossAvoidedLow)} – ${fmt(m.lossAvoidedHigh)}`,
                },
              ]}
            />
          </Panel>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Loss avoided by category */}
            <Panel icon={BarChart3} title="Loss Avoided by Category" subtitle="Share of expected loss avoided">
              {savingsBreakdown.length === 0 ? (
                <p className="p-3 text-[13px] text-neutral-500">No incidents counted in this period.</p>
              ) : (
                <div className="p-3 space-y-1.5">
                  {savingsBreakdown.map((item) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="relative flex-1 h-8 rounded-md overflow-hidden">
                        <div className="absolute inset-y-0 left-0 rounded-md bg-neutral-100" style={{ width: `${Math.max(item.pct, 1)}%` }} />
                        <div className="relative h-full flex items-center px-2.5 text-[13px] text-neutral-800 whitespace-nowrap">{item.label}</div>
                      </div>
                      <span className="w-28 text-right text-[13px] text-neutral-900 tabular-nums">{fmt(item.value)}</span>
                      <span className="w-10 text-right text-[13px] text-neutral-500 tabular-nums">{item.pct}%</span>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            {/* Financial impact */}
            <Panel icon={TrendingUp} title="Financial Impact Analysis">
              <table className="w-full">
                <tbody>
                  {[
                    ["Exposure without detection and response (this period)", fmt(m.exposure)],
                    ["Control effectiveness", `${m.controlEffectiveness}% (range ${m.controlEffectivenessLow}% to ${m.controlEffectivenessHigh}%)`],
                    ["Expected Loss Avoided", fmt(m.totalCostImpact)],
                    ["Plausible range", `${fmt(m.lossAvoidedLow)} – ${fmt(m.lossAvoidedHigh)}`],
                    ["Expected loss still carried", fmt(m.residualLoss)],
                    ["Security Investment (this period)", fmt(m.totalInvestment)],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td className={`${td} text-neutral-600`}>{label}</td>
                      <td className={`${td} text-right tabular-nums`}>{value}</td>
                    </tr>
                  ))}
                  <tr>
                    <td className={`${td} font-medium`}>Net Benefit</td>
                    <td className={`${td} text-right tabular-nums font-semibold ${m.netBenefit < 0 ? "text-red-600" : ""}`}>{fmt(m.netBenefit)}</td>
                  </tr>
                  <tr>
                    <td className={`${td} font-medium`}>ROI</td>
                    <td className={`${td} text-right tabular-nums font-semibold ${m.roi < 0 ? "text-red-600" : ""}`}>{m.roi.toLocaleString()}%</td>
                  </tr>
                </tbody>
              </table>
            </Panel>
          </div>

          {/* What the figures are anchored to */}
          <Panel icon={BarChart3} title="Anchored to published loss data" subtitle={`Organisations with ${m.revenueBand} revenue${m.profileAssumed ? " (assumed: set your size in Settings)" : ""}`}>
            <table className="w-full">
              <tbody>
                {[
                  ["Chance of a material loss this year, without detection and response", `${m.lossProbabilityWithoutControls}%`],
                  ["Chance of a material loss this year, with your controls", `${m.lossProbabilityWithControls}%`],
                  ["Typical loss per event at this size (published median)", fmt(m.typicalLoss)],
                  ["Severe loss per event at this size (published 95th percentile)", fmt(m.severeLoss)],
                  ["Expected loss per event used in the model", fmt(m.lossPerEvent)],
                  ["What a peer organisation loses per year", fmt(m.peerAnnualLoss)],
                  ["Assumed effectiveness of a typical organisation's controls", `${m.typicalControlEffectiveness}%`],
                  ["Material loss events you suffered, last 12 months", String(m.lossEventsSuffered)],
                  ["Share of the estimate resting on analyst-confirmed incidents", `${m.confirmedShare}%`],
                ].map(([label, value]) => (
                  <tr key={label}>
                    <td className={`${td} text-neutral-600`}>{label}</td>
                    <td className={`${td} text-right tabular-nums`}>{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Panel>

          {/* Detection performance */}
          <Panel icon={Shield} title="Detection Performance" subtitle="Alerts and incidents in this period">
            <StatStrip
              className="md:grid-cols-6"
              stats={[
                { label: "Total Alerts", value: m.totalAlerts.toLocaleString() },
                { label: "Counted", value: m.truePositiveCount.toLocaleString(), note: `${m.truePositiveRate}% of alerts` },
                { label: "Excluded", value: m.falsePositiveCount.toLocaleString() },
                { label: "Total Incidents", value: m.incidentCount.toLocaleString() },
                { label: "Analyst-Confirmed Incidents", value: m.confirmedIncidents.toLocaleString() },
                { label: "Avg Loss Avoided / Incident", value: m.incidentCount > 0 ? fmt(m.totalCostImpact / m.incidentCount) : "$0" },
              ]}
            />
          </Panel>

          {/* Empty state when no data */}
          {m.totalAlerts === 0 && (
            <Panel icon={AlertTriangle} title="No data">
              <div className="p-6 text-center">
                <p className="text-[13px] text-neutral-600">No incident data available for {selectedQuarter}</p>
                <p className="text-[12px] text-neutral-400 mt-1">Connect a data source under Settings → Integrations to see metrics here.</p>
              </div>
            </Panel>
          )}
        </>
      )}

      <div className="h-8" />
    </div>
  );
}
