"use client";

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import edrDataService from "@/lib/edr-data-service";

interface BusinessUnitsProps {
  selectedQuarter: string;
}

export default function BusinessUnits({ selectedQuarter }: BusinessUnitsProps) {
  const departments = useMemo(() => {
    return edrDataService.getDepartmentBreakdown(selectedQuarter);
  }, [selectedQuarter]);

  // Take top 5
  const topDepartments = departments.slice(0, 5);

  if (topDepartments.length === 0) {
    return (
      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader className="pb-3 pt-4 px-5">
          <CardTitle className="text-sm font-medium text-neutral-300 uppercase tracking-wide flex items-center gap-2">
            <Target className="w-4 h-4" />
            Top Affected Departments
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <p className="text-sm text-neutral-500">
            No department data available. Connect Microsoft Sentinel with User.Read.All permission
            to automatically detect departments from Azure AD.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getRiskLevel = (dept: typeof topDepartments[0]) => {
    if (dept.critical > 0) return "Critical";
    if (dept.high > 0) return "High";
    if (dept.alerts > 10) return "Medium";
    return "Low";
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Critical": return "bg-red-500/10 border-red-500/30 text-red-400";
      case "High": return "bg-orange-500/10 border-orange-500/30 text-orange-400";
      case "Medium": return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
      default: return "bg-green-500/10 border-green-500/30 text-green-400";
    }
  };

  const maxAlerts = Math.max(...topDepartments.map(d => d.alerts), 1);

  return (
    <Card className="bg-neutral-900 border-neutral-800">
      <CardHeader className="pb-3 pt-4 px-5">
        <CardTitle className="text-sm font-medium text-neutral-300 uppercase tracking-wide flex items-center gap-2">
          <Target className="w-4 h-4" />
          Top Affected Departments
        </CardTitle>
      </CardHeader>
      <CardContent className="px-5 pb-5">
        <p className="text-xs text-neutral-500 mb-4">
          Departments ranked by cost impact from resolved security incidents. Sourced from Azure AD user profiles.
        </p>

        <div className="space-y-2">
          {topDepartments.map((dept, index) => {
            const risk = getRiskLevel(dept);
            return (
              <div key={dept.name} className="flex items-center gap-3 p-3 bg-neutral-800/50 rounded-lg">
                <div className="w-6 h-6 bg-neutral-700 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-white font-medium truncate">{dept.name}</span>
                    <Badge variant="outline" className={`text-[10px] ml-2 flex-shrink-0 ${getRiskColor(risk)}`}>
                      {risk}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1.5 bg-neutral-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${(dept.alerts / maxAlerts) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-neutral-400 tabular-nums w-20 text-right">
                      {dept.alerts} alerts
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-[11px] text-neutral-500">
                    <span>{formatCurrency(dept.costImpact)} impact</span>
                    {dept.critical > 0 && <span className="text-red-400">{dept.critical} critical</span>}
                    {dept.high > 0 && <span className="text-orange-400">{dept.high} high</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
