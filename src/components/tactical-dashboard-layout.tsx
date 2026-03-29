"use client"

import DashboardPage from "@/app/dashboard/page"

interface TacticalDashboardLayoutProps {
  selectedQuarter?: string;
  timeView?: "quarterly" | "yearly";
}

export function TacticalDashboardLayout({ selectedQuarter = "Q2 2025", timeView = "quarterly" }: TacticalDashboardLayoutProps) {
  return (
    <div className="min-h-full">
      <DashboardPage selectedQuarter={selectedQuarter} timeView={timeView} />
    </div>
  )
} 