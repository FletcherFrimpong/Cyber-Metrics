"use client";

import { Panel, Tag } from "@/components/ui/panel"
import { Shield } from "lucide-react"
import FinancialMetrics from "@/components/dashboard/financial-metrics"
import BusinessUnits from "@/components/dashboard/business-units"
import { useDashboardData } from "@/hooks/useDashboardData"
import { formatCurrency } from "@/lib/utils"

interface DashboardPageProps {
  selectedQuarter: string;
  timeView: "quarterly" | "yearly";
}

export default function DashboardPage({ selectedQuarter, timeView }: DashboardPageProps) {
  const { data } = useDashboardData(timeView, selectedQuarter);
  const summary = {
    totalAlerts: data?.totalAlerts ?? 0,
    // Risk-adjusted expected loss avoided, from the server
    totalCost: data?.costMetrics.totalCostImpact ?? 0,
    criticalCount: data?.severityCounts.Critical ?? 0,
    topDept: data?.departments[0],
    deptCount: data?.departments.length ?? 0,
  };

  const m = data?.costMetrics;
  const cells = [
    {
      label: "Chance of a material loss this year",
      value: m ? `${m.lossProbabilityWithControls}%` : "—",
      note: m ? `Down from ${m.lossProbabilityWithoutControls}% without detection and response` : "",
      lead: true,
    },
    {
      label: "Severe event at your size",
      value: m ? formatCurrency(m.severeLoss) : "—",
      note: m ? `${m.revenueBand} revenue${m.profileAssumed ? " (assumed)" : ""}` : "",
    },
    {
      label: "Expected loss avoided",
      value: formatCurrency(summary.totalCost),
      note: m ? `Range ${formatCurrency(m.lossAvoidedLow)} – ${formatCurrency(m.lossAvoidedHigh)}` : "",
    },
    {
      label: "Critical alerts",
      value: summary.criticalCount.toLocaleString(),
      note: summary.totalAlerts > 0
        ? `${((summary.criticalCount / summary.totalAlerts) * 100).toFixed(1)}% of ${summary.totalAlerts.toLocaleString()} alerts`
        : "No alerts in this period",
    },
    {
      label: "Top Affected Department",
      value: summary.topDept?.name || "—",
      note: summary.topDept ? `${summary.topDept.alerts} alerts, ${summary.deptCount} ${summary.deptCount === 1 ? "department" : "departments"} affected` : "Connect a data source to see data",
    },
  ];

  return (
    <div className="space-y-3 pb-6 min-h-full">
      {/* Executive Summary */}
      <Panel
        icon={Shield}
        title="Executive Summary"
        subtitle={timeView === "quarterly" ? selectedQuarter : "Yearly Analysis"}
        action={data?.usingSampleData ? <Tag tone="yellow">Demo data</Tag> : undefined}
      >
        <div className="grid grid-cols-2 md:grid-cols-5 gap-px bg-neutral-200">
          {cells.map((cell) => (
            <div key={cell.label} className="px-3 py-3 min-w-0 bg-white">
              <div className="text-[12px] text-neutral-500">{cell.label}</div>
              <div className={`mt-1 font-semibold tabular-nums text-neutral-900 truncate ${cell.lead ? "text-2xl" : "text-lg"}`}>
                {cell.value}
              </div>
              <div className="mt-0.5 text-[12px] leading-snug text-neutral-400">{cell.note}</div>
            </div>
          ))}
        </div>
      </Panel>

      {/* Financial Metrics */}
      <FinancialMetrics timeView={timeView} selectedQuarter={selectedQuarter} />

      {/* Top Affected Departments — from Azure AD */}
      <BusinessUnits selectedQuarter={selectedQuarter} timeView={timeView} />
    </div>
  )
}
