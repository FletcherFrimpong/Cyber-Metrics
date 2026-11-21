"use client";

import { useEffect, useState } from "react";

export interface DashboardCategory {
  key: "edr" | "email" | "network" | "web" | "cloud";
  count: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  lossAvoided: number;
}

export interface DashboardDepartment {
  name: string;
  alerts: number;
  critical: number;
  high: number;
  costImpact: number;
}

export interface DashboardMetrics {
  totalAlerts: number;
  truePositiveCount: number;
  falsePositiveCount: number;
  truePositiveRate: number;
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
  totalCostImpact: number;
  lossAvoidedLow: number;
  lossAvoidedMedian: number;
  lossAvoidedHigh: number;
  categoryBreakdown: { category: string; incidents: number; lossAvoided: number }[];
  totalInvestment: number;
  totalCostSavings: number;
  netBenefit: number;
  roi: number;
  roiLow: number;
  roiHigh: number;
}

export interface DashboardData {
  period: "quarterly" | "yearly";
  quarter: string;
  usingSampleData: boolean;
  costMetrics: DashboardMetrics;
  totalAlerts: number;
  categories: DashboardCategory[];
  severityCounts: Record<"Critical" | "High" | "Medium" | "Low", number>;
  departments: DashboardDepartment[];
  trend: { quarter: string; alerts: number; cost: number }[];
}

/** Dashboard figures for a period, computed on the server. */
export function useDashboardData(timeView: "quarterly" | "yearly", selectedQuarter: string) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/dashboard?period=${timeView}&quarter=${encodeURIComponent(selectedQuarter)}`)
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success) throw new Error(json.error || `Request failed (${res.status})`);
        if (!cancelled) setData(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Failed to load dashboard data");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [timeView, selectedQuarter]);

  return { data, loading, error };
}
