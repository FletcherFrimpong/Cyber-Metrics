"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Shield, Target } from "lucide-react"
import FinancialMetrics from "@/components/dashboard/financial-metrics"
import edrDataService from "@/lib/edr-data-service"

interface DashboardPageProps {
  selectedQuarter: string;
  timeView: "quarterly" | "yearly";
}

export default function DashboardPage({ selectedQuarter, timeView }: DashboardPageProps) {
  const getQuarterIndex = (quarterStr: string | undefined) => {
    if (!quarterStr) return { q: 1, year: 2024 };
    const match = quarterStr.match(/Q(\d+)\s+(\d+)/);
    if (!match) return { q: 1, year: 2024 };
    const q = match[1];
    const year = match[2];
    return { q: parseInt(q || "1", 10), year: parseInt(year || "2024", 10) };
  };

  const generateQuarterlyBusinessUnits = (quarter: string | undefined) => {
    const { q } = getQuarterIndex(quarter);
    const alerts = edrDataService.getTimeframeAlerts(quarter || "Q1 2024");
    const allAlerts = [
      ...alerts.edr,
      ...alerts.email,
      ...alerts.network,
      ...alerts.web,
      ...alerts.cloud
    ];

    // Derive attack counts and cost from actual alert data
    const totalAlerts = allAlerts.length;
    const totalCost = allAlerts.reduce((sum, a) => sum + a.costImpact, 0);

    // Distribute across business units based on quarter pattern
    const quarterlyBusinessUnitSets: Record<number, { name: string; pct: number; impact: string }[]> = {
      1: [
        { name: "Finance & Banking", pct: 0.44, impact: "High" },
        { name: "IT & Infrastructure", pct: 0.30, impact: "High" },
        { name: "Supply Chain", pct: 0.26, impact: "Medium" }
      ],
      2: [
        { name: "IT & Infrastructure", pct: 0.39, impact: "High" },
        { name: "Finance & Banking", pct: 0.36, impact: "High" },
        { name: "Research & Development", pct: 0.25, impact: "Medium" }
      ],
      3: [
        { name: "Supply Chain", pct: 0.39, impact: "High" },
        { name: "Warehouse Management", pct: 0.33, impact: "High" },
        { name: "Transportation & Logistics", pct: 0.28, impact: "Medium" }
      ],
      4: [
        { name: "Finance & Banking", pct: 0.45, impact: "High" },
        { name: "IT & Infrastructure", pct: 0.30, impact: "High" },
        { name: "Marketing", pct: 0.25, impact: "Medium" }
      ]
    };

    const units = quarterlyBusinessUnitSets[q] || quarterlyBusinessUnitSets[1];
    return units.map(u => ({
      name: u.name,
      attacks: Math.round(totalAlerts * u.pct),
      impact: u.impact,
      costSaved: Math.round((totalCost * u.pct) / 1000000 * 10) / 10 // in $M
    }));
  };

  const topBusinessUnits = generateQuarterlyBusinessUnits(selectedQuarter);

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
              <p className="text-sm font-medium text-neutral-600">Top Affected Unit</p>
              <p className="text-2xl font-bold">{topBusinessUnits[0]?.name || "IT Infrastructure"}</p>
              <p className="text-sm text-neutral-500">{topBusinessUnits[0]?.attacks || 45} attacks detected</p>
              </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-600">Total Incidents</p>
              <p className="text-2xl font-bold">{topBusinessUnits.reduce((sum, unit) => sum + unit.attacks, 0)}</p>
              <p className="text-sm text-neutral-500">Across all business units</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-600">Risk Level</p>
              <p className="text-2xl font-bold text-orange-600">Medium</p>
              <p className="text-sm text-neutral-500">Based on attack patterns</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-neutral-600">Response Time</p>
              <p className="text-2xl font-bold text-green-600">2.3h</p>
              <p className="text-sm text-neutral-500">Average resolution</p>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* TOP AFFECTED UNITS */}
      <Card className="mb-6 border border-gray-200 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Target className="h-4 w-4" />
            TOP AFFECTED UNITS
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="space-y-2">
            {topBusinessUnits.map((unit, index) => (
              <div key={unit.name} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg hover:bg-neutral-50 transition-colors group">
                <div className="flex items-center justify-center w-6 h-6 bg-blue-100 text-blue-700 rounded-full text-xs font-bold flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="font-medium text-sm text-white group-hover:text-gray-900 truncate transition-colors" title={unit.name}>
                        {unit.name}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-300 group-hover:text-gray-600 transition-colors">
                        <span>{unit.attacks} incidents</span>
                        <span className="text-green-400 font-medium">${unit.costSaved}M saved</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge 
                        variant="outline"
                        className={`text-xs px-2 py-0.5 border ${
                          unit.impact === "High" 
                            ? "bg-red-500 text-white border-red-500 group-hover:bg-red-500 group-hover:text-white group-hover:border-red-500" 
                            : unit.impact === "Medium" 
                            ? "bg-orange-500 text-white border-orange-500 group-hover:bg-orange-500 group-hover:text-white group-hover:border-orange-500"
                            : "bg-green-500 text-white border-green-500 group-hover:bg-green-500 group-hover:text-white group-hover:border-green-500"
                        }`}
                      >
                        {unit.impact}
                      </Badge>
                      <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all" 
                          style={{ width: `${Math.min(100, (unit.attacks / 50) * 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Financial Metrics */}
      <FinancialMetrics timeView={timeView} selectedQuarter={selectedQuarter} />
      
    </div>
  )
}
