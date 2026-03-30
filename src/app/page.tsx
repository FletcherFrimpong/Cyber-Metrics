"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Target, RefreshCw, FileText, AlertTriangle, Calendar, BarChart3, Settings, LogOut, User, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import TrendsAnalytics from "@/components/trends-analytics"
import { TacticalDashboardLayout } from "@/components/tactical-dashboard-layout"
import SettingsPage from "@/components/settings-page"
import UserManagement from "@/components/user-management"
import ErrorBoundary from "@/components/debug-error-boundary"
import { useAuth } from "@/components/auth-provider"


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

  // Update timestamp on mount and when quarter or view changes
  useEffect(() => {
    setLastUpdate(new Date().toLocaleString());
  }, [selectedQuarter, timeView, activeSection]);

  // Set initial timestamp on client only (avoids hydration mismatch)
  useEffect(() => {
    setLastUpdate(new Date().toLocaleString());
  }, []);

  const allNavItems = [
    { id: "executive-reports", icon: FileText, label: "EXECUTIVE REPORTS", permission: "reports:view" as const },
    { id: "trends-analytics", icon: Target, label: "TRENDS & ANALYTICS", permission: "dashboard:view" as const },
    { id: "user-management", icon: Users, label: "USER MANAGEMENT", permission: "users:manage" as const },
    { id: "settings", icon: Settings, label: "SETTINGS", permission: "settings:view" as const },
  ]

  const navItems = allNavItems.filter((item) => hasPermission(item.permission))

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

    if (activeSection === "user-management") {
      return <UserManagement />
    }

    if (activeSection === "settings") {
      return <SettingsPage />
    }

    // Default to trend analytics if no section is selected
    return <TrendsAnalytics timeView={timeView} selectedQuarter={selectedQuarter} />
  }

  return (
    <ErrorBoundary>
      <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-70"} bg-neutral-900 border-r border-neutral-700 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full md:h-auto ${!sidebarCollapsed ? "md:block" : ""}`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
              <h1 className="text-orange-500 font-bold text-lg tracking-wider">SIGNAL FOUNDRY</h1>
                                        <p className="text-neutral-500 text-xs">Cyber Risk Quantification Platform</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-neutral-400 hover:text-orange-500"
            >
              <ChevronRight
                className={`w-4 h-4 sm:w-5 sm:h-5 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                  activeSection === item.id
                    ? "bg-orange-500 text-white"
                    : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                }`}
              >
                <item.icon className="w-5 h-5 md:w-5 md:h-5 sm:w-6 sm:h-6" />
                {!sidebarCollapsed && <span className="text-sm font-medium">{item.label}</span>}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="mt-8 p-4 bg-neutral-800 border border-neutral-700 rounded">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-white">SYSTEM ONLINE</span>
              </div>
              {user && (
                <div className="mt-3 pt-3 border-t border-neutral-700">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="w-3.5 h-3.5 text-neutral-400" />
                    <span className="text-xs text-white truncate">{user.displayName}</span>
                  </div>
                  <div className="text-xs text-neutral-500 mb-3 uppercase">{user.role}</div>
                  <button
                    onClick={logout}
                    className="flex items-center gap-2 text-xs text-neutral-500 hover:text-red-400 transition-colors w-full"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}

      {/* Main Content */}
      <div className={`flex-1 flex flex-col ${!sidebarCollapsed ? "md:ml-0" : ""}`}>
        {/* Top Toolbar — hidden on settings page */}
        {activeSection !== "settings" && activeSection !== "user-management" && (
        <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6">
          {/* Left Section */}
          <div className="flex items-center gap-6">
            {/* Analysis Period Controls */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-neutral-300">Analysis Period:</span>
              <div className="flex bg-neutral-800 rounded-md p-1">
                <Button
                  variant={timeView === "quarterly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeView("quarterly")}
                  className="text-xs"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Quarterly
                </Button>
                <Button
                  variant={timeView === "yearly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeView("yearly")}
                  className="text-xs"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Yearly
                </Button>
              </div>
            </div>

            {/* Quarter Selection */}
            {timeView === "quarterly" && (
              <div className="flex items-center gap-3">
                <span className="text-sm text-neutral-300">Select Quarter:</span>
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {quarterlyData.map((quarter) => (
                    <option key={quarter.quarter} value={quarter.quarter}>
                      {quarter.quarter}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <AlertTriangle className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <RefreshCw className="w-4 h-4" />
            </Button>
            <div className="text-xs text-neutral-500 ml-8">LAST UPDATE: {lastUpdate}</div>
          </div>
        </div>
        )}

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto p-6">
          {renderDashboardContent()}
        </div>
      </div>
      </div>
    </ErrorBoundary>
  )
}
