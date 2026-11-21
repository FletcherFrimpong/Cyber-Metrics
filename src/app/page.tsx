"use client"

import { useState, useEffect } from "react"
import { Target, RefreshCw, FileText, Calendar, BarChart3, Settings, LogOut, User, Users, PanelLeft, LayoutDashboard, Wallet, Bell } from "lucide-react"
import TrendsAnalytics from "@/components/trends-analytics"
import { TacticalDashboardLayout } from "@/components/tactical-dashboard-layout"
import ExecutiveReport from "@/app/executive-reports/page"
import AlertsBrowser from "@/components/alerts-browser"
import { useDataStatus, DataStatusBanner, SidebarDataStatus } from "@/components/data-status"
import SettingsPage from "@/components/settings-page"
import TeamPage from "@/components/team-page"
import { ROLE_LABELS } from "@/lib/auth/rbac"
import ErrorBoundary from "@/components/debug-error-boundary"
import { useAuth } from "@/components/auth-provider"


type NavItem = {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  permission: "dashboard:view" | "reports:view" | "alerts:view" | "settings:view" | "team:access"
}

const NAV_GROUPS: { label: string; items: NavItem[] }[] = [
  {
    label: "Reports",
    items: [
      { id: "trends-analytics", icon: LayoutDashboard, label: "Trends & analytics", permission: "dashboard:view" },
      { id: "executive-reports", icon: FileText, label: "Executive reports", permission: "reports:view" },
      { id: "security-report", icon: Wallet, label: "Executive security report", permission: "reports:view" },
      { id: "alerts", icon: Bell, label: "Alerts", permission: "alerts:view" },
    ],
  },
  {
    label: "Workspace",
    items: [
      { id: "settings", icon: Settings, label: "Settings", permission: "settings:view" },
      { id: "user-management", icon: Users, label: "Team", permission: "team:access" },
    ],
  },
]

export default function HomePage() {
  const { user, hasPermission, logout } = useAuth()
  const [activeSection, setActiveSection] = useState("trends-analytics")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [timeView, setTimeView] = useState<"quarterly" | "yearly">("quarterly")

  // Calculate current quarter dynamically
  const getCurrentQuarter = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3) + 1;
    return `Q${currentQuarter} ${currentYear}`;
  };

  const [selectedQuarter, setSelectedQuarter] = useState<string>(getCurrentQuarter())
  const [lastUpdate, setLastUpdate] = useState<string>("")
  const [refreshKey, setRefreshKey] = useState(0)
  const [settingsTab, setSettingsTab] = useState<"general" | "integrations" | "email">("general")
  // Reload the screens by themselves when alerts arrive or the data source changes
  const [dataStatus, refreshDataStatus] = useDataStatus(() => setRefreshKey((k) => k + 1))
  // Re-check on every screen change, so a source connected in Settings shows up at once
  useEffect(() => { refreshDataStatus() }, [activeSection]) // eslint-disable-line react-hooks/exhaustive-deps
  const openIntegrations = () => {
    setSettingsTab("integrations")
    setActiveSection("settings")
  }

  // Update timestamp on mount and when quarter or view changes
  useEffect(() => {
    setLastUpdate(new Date().toLocaleString());
  }, [selectedQuarter, timeView, activeSection, refreshKey]);

  // Set initial timestamp on client only (avoids hydration mismatch)
  useEffect(() => {
    setLastUpdate(new Date().toLocaleString());
  }, []);

  const navItems = NAV_GROUPS.reduce<NavItem[]>((all, g) => all.concat(g.items), []).filter((item) => hasPermission(item.permission))

  // Generate quarterly data dynamically based on current date - Show only current 4 quarters
  const generateQuarterlyData = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const currentQuarter = Math.floor(currentMonth / 3) + 1;
    
    const quarters = [];
    
    // Calculate the 4 quarters to show (current quarter + previous 3)
    for (let i = 3; i >= 0; i--) {
      let targetQuarter = currentQuarter - i;
      let targetYear = currentYear;
      
      // Handle year boundary crossing
      if (targetQuarter <= 0) {
        targetQuarter += 4;
        targetYear -= 1;
      }
      
      // Only include quarters from 2024 onwards
      if (targetYear >= 2024) {
        quarters.push({ quarter: `Q${targetQuarter} ${targetYear}` });
      }
    }
    
    return quarters;
  };

  const quarterlyData = generateQuarterlyData();

  const renderDashboardContent = () => {
    if (activeSection === "trends-analytics") {
      return <TrendsAnalytics timeView={timeView} selectedQuarter={selectedQuarter} />
    }

    if (activeSection === "executive-reports") {
      return <TacticalDashboardLayout selectedQuarter={selectedQuarter} timeView={timeView} />
    }

    if (activeSection === "security-report") {
      return <ExecutiveReport selectedQuarter={selectedQuarter} timeView={timeView} />
    }

    if (activeSection === "alerts") {
      return <AlertsBrowser timeView={timeView} selectedQuarter={selectedQuarter} />
    }

    if (activeSection === "user-management") {
      return <TeamPage />
    }

    if (activeSection === "settings") {
      return <SettingsPage initialTab={settingsTab} onTabChange={setSettingsTab} />
    }

    // Default to trend analytics if no section is selected
    return <TrendsAnalytics timeView={timeView} selectedQuarter={selectedQuarter} />
  }

  const activeItem = navItems.find((item) => item.id === activeSection) ?? navItems[0]
  const showPeriod = activeSection !== "settings" && activeSection !== "user-management"
  const year = selectedQuarter.split(" ")[1]

  return (
    <ErrorBoundary>
      <div className="flex h-screen bg-white text-neutral-900">
        {/* Sidebar */}
        {!sidebarCollapsed && (
          <aside className="w-56 shrink-0 flex flex-col bg-neutral-50 border-r border-neutral-200 fixed md:relative z-50 md:z-auto h-full">
            <div className="h-12 flex items-center gap-2 px-3">
              <div className="w-5 h-5 rounded bg-neutral-900 flex items-center justify-center">
                <Target className="w-3 h-3 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-[13px] font-semibold text-neutral-900 leading-tight">Signal Foundry</h1>
              </div>
            </div>
            <p className="px-3 -mt-1 mb-3 text-[11px] text-neutral-400">Cyber Risk Quantification Platform</p>

            <nav className="flex-1 overflow-y-auto px-2 space-y-4">
              {NAV_GROUPS.map((group) => {
                const items = group.items.filter((item) => hasPermission(item.permission))
                if (items.length === 0) return null
                return (
                  <div key={group.label}>
                    <div className="px-2 mb-1 text-[11px] text-neutral-400">{group.label}</div>
                    <div className="space-y-0.5">
                      {items.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => { if (item.id === "settings") setSettingsTab("general"); setActiveSection(item.id) }}
                          className={`w-full flex items-center gap-2 h-7 px-2 rounded-md text-[13px] transition-colors ${
                            activeSection === item.id
                              ? "bg-neutral-200/70 text-neutral-900 font-medium"
                              : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                          }`}
                        >
                          <item.icon className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </nav>

            <div className="p-2 border-t border-neutral-200">
              <SidebarDataStatus status={dataStatus} />
              {user && (
                <>
                  <div className="flex items-center gap-2 px-2 h-7 text-[13px] text-neutral-800">
                    <User className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span className="truncate">{user.displayName}</span>
                    <span className="ml-auto text-[11px] text-neutral-400">{ROLE_LABELS[user.role]}</span>
                  </div>
                  <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-2 h-7 rounded-md text-[13px] text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                    Sign out
                  </button>
                </>
              )}
            </div>
          </aside>
        )}

        {/* Mobile Overlay */}
        {!sidebarCollapsed && (
          <div className="fixed inset-0 bg-black/20 z-40 md:hidden" onClick={() => setSidebarCollapsed(true)} />
        )}

        {/* Main Content */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Title bar */}
          <div className="h-12 shrink-0 flex items-center gap-2 px-3 border-b border-neutral-200">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? "Show sidebar" : "Hide sidebar"}
              className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
            <span className="text-[13px] font-medium text-neutral-900">{activeItem?.label}</span>
            {showPeriod && (
              <div className="ml-auto flex items-center gap-2 text-[12px] text-neutral-400">
                <span>Last update: {lastUpdate}</span>
                <button
                  onClick={() => setRefreshKey((k) => k + 1)}
                  aria-label="Refresh data"
                  className="w-7 h-7 flex items-center justify-center rounded-md text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Filter row: one period control for every report screen */}
          {showPeriod && (
            <div className="h-11 shrink-0 flex items-center gap-2 px-3 border-b border-neutral-200">
              <label className="inline-flex items-center gap-1.5 h-7 pl-2 pr-1 rounded-md border border-neutral-200 bg-white text-[13px] text-neutral-800 hover:bg-neutral-50">
                <BarChart3 className="w-3.5 h-3.5 text-neutral-500" />
                <span className="sr-only">Analysis period</span>
                <select
                  value={timeView}
                  onChange={(e) => setTimeView(e.target.value as "quarterly" | "yearly")}
                  className="bg-transparent outline-none cursor-pointer"
                >
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </label>
              <label className="inline-flex items-center gap-1.5 h-7 pl-2 pr-1 rounded-md border border-neutral-200 bg-white text-[13px] text-neutral-800 hover:bg-neutral-50">
                <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                <span className="sr-only">{timeView === "quarterly" ? "Quarter" : "Year"}</span>
                {timeView === "quarterly" ? (
                  <select
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(e.target.value)}
                    className="bg-transparent outline-none cursor-pointer"
                  >
                    {quarterlyData.map((quarter) => (
                      <option key={quarter.quarter} value={quarter.quarter}>
                        {quarter.quarter}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="pr-1.5">{year}</span>
                )}
              </label>
            </div>
          )}

          {/* What the figures are based on: demo data, a first sync, a failing connection */}
          {showPeriod && <DataStatusBanner status={dataStatus} onOpenIntegrations={openIntegrations} canConnect={hasPermission("settings:edit")} />}

          {/* Screen content */}
          {/* New data re-renders the report screens only. Settings and Team keep
              their state, so a sync finishing never wipes a half-filled form. */}
          <div key={showPeriod ? refreshKey : "workspace"} className="flex-1 overflow-auto p-3 bg-white">
            {renderDashboardContent()}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}
