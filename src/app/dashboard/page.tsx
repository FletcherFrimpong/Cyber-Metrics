"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield } from "lucide-react"
import FinancialMetrics from "@/components/dashboard/financial-metrics"
import BusinessUnits from "@/components/dashboard/business-units"
import edrDataService from "@/lib/edr-data-service"
import { formatCurrency } from "@/lib/utils"

interface DashboardPageProps {
  selectedQuarter: string;
  timeView: "quarterly" | "yearly";
}

export default function DashboardPage({ selectedQuarter, timeView }: DashboardPageProps) {
  const summary = useMemo(() => {
    const departments = edrDataService.getDepartmentBreakdown(selectedQuarter);
    const data = edrDataService.getTimeframeAlerts(selectedQuarter);
    const allAlerts = [...data.edr, ...data.email, ...data.network, ...data.web, ...data.cloud];
    const totalAlerts = allAlerts.length;
    const totalCost = allAlerts.reduce((sum, a) => sum + (a.costImpact || 0), 0);
    const criticalCount = allAlerts.filter(a => a.severity === "Critical").length;
    const topDept = departments[0];

    return { totalAlerts, totalCost, criticalCount, topDept, deptCount: departments.length };
  }, [selectedQuarter]);

  const getRiskLabel = () => {
    if (summary.criticalCount > 5) return { label: "High", color: "text-red-600" };
    if (summary.criticalCount > 0 || summary.totalAlerts > 50) return { label: "Medium", color: "text-orange-600" };
    if (summary.totalAlerts > 0) return { label: "Low", color: "text-green-600" };
    return { label: "No Data", color: "text-neutral-500" };
  };

  const risk = getRiskLabel();

  return (
    <div className="space-y-6 pb-12 min-h-full">
      {/* Executive Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Executive Summary
            <Badge variant="secondary" className="ml-auto">
              {timeView === "quarterly" ? selectedQuarter : "Yearly Analysis"}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-600">Top Affected Department</p>
              <p className="text-2xl font-bold">{summary.topDept?.name || "—"}</p>
              <p className="text-sm text-neutral-500">
                {summary.topDept ? `${summary.topDept.alerts} incidents` : "Connect Sentinel to see data"}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-600">Total Incidents</p>
              <p className="text-2xl font-bold">{summary.totalAlerts.toLocaleString()}</p>
              <p className="text-sm text-neutral-500">Across {summary.deptCount} departments</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-600">Risk Level</p>
              <p className={`text-2xl font-bold ${risk.color}`}>{risk.label}</p>
              <p className="text-sm text-neutral-500">{summary.criticalCount} critical incidents</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-600">Cost Impact</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(summary.totalCost)}</p>
              <p className="text-sm text-neutral-500">Potential losses prevented</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Affected Departments — from Azure AD */}
      <BusinessUnits selectedQuarter={selectedQuarter} />

      {/* Financial Metrics */}
      <FinancialMetrics timeView={timeView} selectedQuarter={selectedQuarter} />
    </div>
  )
}
