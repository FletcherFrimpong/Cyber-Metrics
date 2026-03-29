import { useState, useEffect } from "react";
import { calculateCostMetrics, CostCalculationParams } from "@/lib/cost-calculations";

interface FinancialMetrics {
  totalCostSavings: number;
  totalInvestment: number;
  netBenefit: number;
  roi: number;
  breachPrevention: number;
  complianceSavings: number;
}

export function useFinancialMetrics(params: CostCalculationParams) {
  const [metrics, setMetrics] = useState<FinancialMetrics>({
    totalCostSavings: 0,
    totalInvestment: 0,
    netBenefit: 0,
    roi: 0,
    breachPrevention: 0,
    complianceSavings: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMetrics = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const costMetrics = await calculateCostMetrics(params);
        
        setMetrics({
          totalCostSavings: costMetrics.totalCostSavings,
          totalInvestment: costMetrics.totalInvestment,
          netBenefit: costMetrics.netBenefit,
          roi: costMetrics.roi,
          breachPrevention: costMetrics.breachPrevention,
          complianceSavings: costMetrics.complianceSavings,
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
