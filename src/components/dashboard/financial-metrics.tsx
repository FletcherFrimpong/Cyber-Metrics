"use client";

import { Panel } from "@/components/ui/panel";
import { DollarSign } from "lucide-react";
import { useDashboardData } from "@/hooks/useDashboardData";
import { formatCurrency } from "@/lib/utils";

interface FinancialMetricsProps {
  timeView: "quarterly" | "yearly";
  selectedQuarter: string;
}

export default function FinancialMetrics({ timeView, selectedQuarter }: FinancialMetricsProps) {
  const { data } = useDashboardData(timeView === "yearly" ? "yearly" : "quarterly", selectedQuarter);
  const m = data?.costMetrics;
  const metrics = {
    lossAvoided: m?.totalCostImpact ?? 0,
    lossAvoidedLow: m?.lossAvoidedLow ?? 0,
    lossAvoidedHigh: m?.lossAvoidedHigh ?? 0,
    totalInvestment: m?.totalInvestment ?? 0,
    netBenefit: m?.netBenefit ?? 0,
    roi: m?.roi ?? 0,
    roiLow: m?.roiLow ?? 0,
    roiHigh: m?.roiHigh ?? 0,
  };

  const signed = (n: number) => (n < 0 ? `-${formatCurrency(-n)}` : formatCurrency(n));
  const cells = [
    {
      label: "Expected loss avoided",
      value: formatCurrency(metrics.lossAvoided),
      note: `Likely range ${formatCurrency(metrics.lossAvoidedLow)} – ${formatCurrency(metrics.lossAvoidedHigh)}`,
    },
    {
      label: "Total investment",
      value: formatCurrency(metrics.totalInvestment),
      note: "Annual spend prorated to this period",
    },
    {
      label: "Net benefit",
      value: signed(metrics.netBenefit),
      note: "Loss avoided minus investment",
      negative: metrics.netBenefit < 0,
    },
    {
      label: "ROI",
      value: `${metrics.roi.toLocaleString()}%`,
      note: `Range ${metrics.roiLow.toLocaleString()}% to ${metrics.roiHigh.toLocaleString()}%`,
      negative: metrics.roi < 0,
    },
  ];

  return (
    <Panel
      icon={DollarSign}
      title="Financial view"
      subtitle={m ? `${m.controlEffectiveness}% of ${formatCurrency(m.exposure)} exposure removed, anchored to ${m.revenueBand} revenue` : "Loss avoided against security investment"}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-neutral-200">
        {cells.map((cell) => (
          <div key={cell.label} className="px-3 py-3 min-w-0 bg-white">
            <div className="text-[12px] text-neutral-500">{cell.label}</div>
            <div className={`mt-1 text-lg font-semibold tabular-nums ${cell.negative ? "text-red-600" : "text-neutral-900"}`}>
              {cell.value}
            </div>
            <div className="mt-0.5 text-[12px] leading-snug text-neutral-400">{cell.note}</div>
          </div>
        ))}
      </div>
    </Panel>
  );
}
