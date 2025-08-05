"use client"

import { useState } from "react"
import { ChevronRight, Monitor, Settings, Target, Bell, RefreshCw, FileText, Database } from "lucide-react"
import { Button } from "@/components/ui/button"
import SystemsPage from "@/app/systems/page"
import DashboardPage from "@/app/dashboard/page"

import AttackCostsPage from "@/app/attack-costs/page"
import AlertsPage from "@/app/alerts/page"
import ExecutiveReportsPage from "@/app/executive-reports/page"

export function TacticalDashboardLayout() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const navItems = [
    { id: "dashboard", icon: Monitor, label: "DASHBOARD" },
    { id: "attack-costs", icon: Target, label: "ATTACK COSTS" },
    { id: "alerts", icon: Bell, label: "REAL-TIME ALERTS" },
    { id: "executive-reports", icon: FileText, label: "EXECUTIVE REPORTS" },
    { id: "systems", icon: Settings, label: "SYSTEMS" },
  ]

  const renderActiveSection = () => {
    switch (activeSection) {
      case "dashboard":
        return <DashboardPage />

      case "attack-costs":
        return <AttackCostsPage />
      case "alerts":
        return <AlertsPage />
      case "executive-reports":
        return <ExecutiveReportsPage />
      case "systems":
        return <SystemsPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <div className="flex h-screen">
      {/* Main Content */}
      <div className="flex-1 flex flex-col">


        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto scroll-smooth">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  )
} 