"use client";

import { Panel, Tag, th, td } from "@/components/ui/panel";
import { Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { useDashboardData } from "@/hooks/useDashboardData";

interface BusinessUnitsProps {
  selectedQuarter: string;
  timeView?: "quarterly" | "yearly";
}

export default function BusinessUnits({ selectedQuarter, timeView = "quarterly" }: BusinessUnitsProps) {
  const { data } = useDashboardData(timeView, selectedQuarter);
  const departments = data?.departments ?? [];

  // Take top 5
  const topDepartments = departments.slice(0, 5);

  const getRiskLevel = (dept: typeof topDepartments[0]) => {
    if (dept.critical > 0) return { label: "Critical", tone: "red" as const };
    if (dept.high > 0) return { label: "High", tone: "orange" as const };
    if (dept.alerts > 10) return { label: "Medium", tone: "yellow" as const };
    return { label: "Low", tone: "green" as const };
  };

  return (
    <Panel
      icon={Target}
      title="Top Affected Departments"
      subtitle="Ranked by expected loss avoided, sourced from Azure AD user profiles"
    >
      {topDepartments.length === 0 ? (
        <p className="p-3 text-[13px] text-neutral-500">
          No department data available. Connect Microsoft Defender XDR with the User.Read.All permission
          to detect departments automatically from Entra ID.
        </p>
      ) : (
        <table className="w-full">
          <thead>
            <tr>
              <th className={`${th} w-8`}>#</th>
              <th className={th}>Department</th>
              <th className={`${th} text-right`}>Alerts</th>
              <th className={`${th} text-right`}>Critical</th>
              <th className={`${th} text-right`}>High</th>
              <th className={`${th} text-right`}>Loss avoided</th>
              <th className={`${th} text-right`}>Risk</th>
            </tr>
          </thead>
          <tbody>
            {topDepartments.map((dept, index) => {
              const risk = getRiskLevel(dept);
              return (
                <tr key={dept.name}>
                  <td className={`${td} text-neutral-400 tabular-nums`}>{index + 1}</td>
                  <td className={`${td} font-medium`}>{dept.name}</td>
                  <td className={`${td} text-right tabular-nums`}>{dept.alerts}</td>
                  <td className={`${td} text-right tabular-nums ${dept.critical > 0 ? "text-red-600" : "text-neutral-300"}`}>{dept.critical}</td>
                  <td className={`${td} text-right tabular-nums ${dept.high > 0 ? "" : "text-neutral-300"}`}>{dept.high}</td>
                  <td className={`${td} text-right tabular-nums`}>{formatCurrency(dept.costImpact)}</td>
                  <td className={`${td} text-right`}><Tag tone={risk.tone}>{risk.label}</Tag></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
