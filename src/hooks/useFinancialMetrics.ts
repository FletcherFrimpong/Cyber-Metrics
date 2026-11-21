import { useState, useEffect } from "react";
import type { CostCalculationParams } from "@/lib/cost-calculations";

interface FinancialMetrics {
  totalCostSavings: number;
  totalInvestment: number;
  netBenefit: number;
  roi: number;
  lossAvoided: number;
  lossAvoidedLow: number;
  lossAvoidedHigh: number;
}

export function useFinancialMetrics(params: CostCalculationParams) {
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalCostSavings: 0,
    totalInvestment: 0,
    netBenefit: 0,
    roi: 0,
    lossAvoided: 0,
    lossAvoidedLow: 0,
    lossAvoidedHigh: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const period = params.period === "yearly" ? "yearly" : "quarterly";
        const res = await fetch(`/api/dashboard?period=${period}&quarter=${encodeURIComponent(params.selectedQuarter || "")}`);
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || "Failed to load financial metrics");
        const costMetrics = json.costMetrics;
        
        setMetrics({
          totalCostSavings: costMetrics.totalCostSavings,
          totalInvestment: costMetrics.totalInvestment,
          netBenefit: costMetrics.netBenefit,
          roi: costMetrics.roi,
          lossAvoided: costMetrics.totalCostImpact,
          lossAvoidedLow: costMetrics.lossAvoidedLow,
          lossAvoidedHigh: costMetrics.lossAvoidedHigh,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load financial metrics');
        console.error('Financial metrics error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [params.period, params.selectedQuarter]);

  return { metrics, loading, error };
}
