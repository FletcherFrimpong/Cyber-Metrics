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

  // How serious a department's alerts are, against the organisation as a whole:
  // the share rated critical or high, compared with the average across departments.
  const seriousShare = (d: { alerts: number; critical: number; high: number }) => (d.alerts > 0 ? (d.critical + d.high) / d.alerts : 0);
  const totals = departments.reduce((t, d) => ({ alerts: t.alerts + d.alerts, critical: t.critical + d.critical, high: t.high + d.high }), { alerts: 0, critical: 0, high: 0 });
  const average = seriousShare(totals);
  const getRiskLevel = (dept: typeof topDepartments[0]) => {
    const diff = seriousShare(dept) - average;
    if (diff > 0.05) return { label: "Above average", tone: "red" as const };
    if (diff < -0.05) return { label: "Below average", tone: "green" as const };
    return { label: "Average", tone: "neutral" as const };
  };

  return (
    <Panel
      icon={Target}
      title="Top Affected Departments"
      subtitle="Ranked by expected loss avoided; the department is the one the affected user belongs to"
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
              <th className={`${th} text-right`}>Critical + high share</th>
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
                  <td className={`${td} text-right whitespace-nowrap`}><span className="mr-2 tabular-nums text-neutral-600">{(seriousShare(dept) * 100).toFixed(0)}%</span><Tag tone={risk.tone}>{risk.label}</Tag></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </Panel>
  );
}
