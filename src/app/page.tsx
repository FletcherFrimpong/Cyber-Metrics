"use client"

import { useState } from "react"
import { ChevronRight, Monitor, Settings, Target, RefreshCw, FileText, AlertTriangle, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import CostSavingsView from "@/components/cost-savings-view"

export default function HomePage() {
  const [activeSection, setActiveSection] = useState("dashboard")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const navItems = [
    { id: "dashboard", icon: Monitor, label: "DASHBOARD" },
    { id: "attack-costs", icon: Target, label: "ATTACK COSTS" },
    { id: "executive-reports", icon: FileText, label: "EXECUTIVE REPORTS" },
    { id: "systems", icon: Settings, label: "SYSTEMS" },
  ]

  const renderDashboardContent = () => {
    if (activeSection === "attack-costs") {
      return <CostSavingsView />
    }

    return (
      <div className="p-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wider">SECURITY OPERATIONS DASHBOARD</h1>
            <p className="text-sm text-neutral-400">Real-time threat detection and financial impact analysis</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <span>LAST UPDATE: {new Date().toLocaleString()}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">ACTIVE RULES</p>
                  <p className="text-2xl font-bold text-white font-mono">847</p>
                  <p className="text-xs text-neutral-500">of 847 total</p>
                </div>
                <Target className="w-8 h-8 text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">AVG PERFORMANCE</p>
                  <p className="text-2xl font-bold text-white font-mono">94.2%</p>
                  <p className="text-xs text-white">+2.3% from last week</p>
                </div>
                <Target className="w-8 h-8 text-white" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-neutral-400 tracking-wider">CRITICAL ALERTS</p>
                  <p className="text-2xl font-bold text-red-400 font-mono">23</p>
                  <p className="text-xs text-neutral-500">This quarter</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border-green-700/50 hover:border-green-600/50 transition-all duration-300 hover:scale-105">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-green-300 tracking-wider">COST SAVINGS</p>
                  <p className="text-2xl font-bold text-green-400 font-mono">$24.5M</p>
                  <p className="text-xs text-green-300">+340% ROI</p>
                  <p className="text-xs text-green-400 mt-1">Click for details</p>
                </div>
                <div className="p-2 bg-green-500/20 rounded-full">
                  <DollarSign className="w-8 h-8 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cost Savings Highlight Section */}
        <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-700/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <DollarSign className="w-6 h-6 text-green-400" />
              Financial Impact Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                <p className="text-3xl font-bold text-green-400">$24.5M</p>
                <p className="text-sm text-neutral-300">Total Savings</p>
                <p className="text-xs text-green-400 mt-1">This fiscal year</p>
              </div>
              <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                <p className="text-3xl font-bold text-blue-400">340%</p>
                <p className="text-sm text-neutral-300">ROI</p>
                <p className="text-xs text-blue-400 mt-1">Return on investment</p>
              </div>
              <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
                <p className="text-3xl font-bold text-purple-400">$17.3M</p>
                <p className="text-sm text-neutral-300">Net Savings</p>
                <p className="text-xs text-purple-400 mt-1">After $7.2M investment</p>
              </div>
            </div>
            <div className="p-3 bg-neutral-800/30 rounded-lg">
              <p className="text-sm text-neutral-300">
                <strong className="text-green-400">Executive Summary:</strong> Our cybersecurity program has delivered exceptional financial returns, 
                saving the company $24.5M while preventing 72,337 potential threats. Every dollar invested in security 
                has returned $3.40 in savings. <span className="text-green-400 font-medium">Click "ATTACK COSTS" for detailed analysis.</span>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-white">Security Tools Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-300">Email Security</span>
                  <Badge className="bg-green-500/20 text-green-400">100%</Badge>
                </div>
                <Progress value={100} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-300">Antivirus Protection</span>
                  <Badge className="bg-green-500/20 text-green-400">100%</Badge>
                </div>
                <Progress value={100} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-300">Network Firewall</span>
                  <Badge className="bg-green-500/20 text-green-400">99.6%</Badge>
                </div>
                <Progress value={99.6} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-300">Endpoint Protection</span>
                  <Badge className="bg-green-500/20 text-green-400">98.9%</Badge>
                </div>
                <Progress value={98.9} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-300">Identity & Access Mgmt</span>
                  <Badge className="bg-green-500/20 text-green-400">99.2%</Badge>
                </div>
                <Progress value={99.2} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-300">Data Loss Prevention</span>
                  <Badge className="bg-green-500/20 text-green-400">97.8%</Badge>
                </div>
                <Progress value={97.8} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-300">Web Application Firewall</span>
                  <Badge className="bg-green-500/20 text-green-400">99.4%</Badge>
                </div>
                <Progress value={99.4} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-300">Intrusion Detection System</span>
                  <Badge className="bg-green-500/20 text-green-400">96.7%</Badge>
                </div>
                <Progress value={96.7} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-300">Security Information & Event Mgmt</span>
                  <Badge className="bg-green-500/20 text-green-400">99.1%</Badge>
                </div>
                <Progress value={99.1} className="h-2" />
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-300">Vulnerability Management</span>
                  <Badge className="bg-green-500/20 text-green-400">95.3%</Badge>
                </div>
                <Progress value={95.3} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700 hover:border-neutral-600 transition-all duration-300">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-orange-400" />
                Threat Intelligence Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-700/30 rounded-lg">
                  <p className="text-3xl font-bold text-red-400 font-mono">23</p>
                  <p className="text-xs text-red-300">Critical Threats</p>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/30 rounded-lg">
                  <p className="text-3xl font-bold text-green-400 font-mono">72,337</p>
                  <p className="text-xs text-green-300">Total Threats</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-neutral-800/50 rounded">
                  <span className="text-sm text-neutral-300">Email Security</span>
                  <Badge className="bg-green-500/20 text-green-400">1,247 blocked</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-neutral-800/50 rounded">
                  <span className="text-sm text-neutral-300">Network Attacks</span>
                  <Badge className="bg-green-500/20 text-green-400">45,678 blocked</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-neutral-800/50 rounded">
                  <span className="text-sm text-neutral-300">Web Application</span>
                  <Badge className="bg-green-500/20 text-green-400">23,456 blocked</Badge>
                </div>
                <div className="flex items-center justify-between p-2 bg-neutral-800/50 rounded">
                  <span className="text-sm text-neutral-300">Endpoint Protection</span>
                  <Badge className="bg-green-500/20 text-green-400">456 neutralized</Badge>
                </div>
              </div>
              <div className="pt-2 border-t border-neutral-700">
                <p className="text-xs text-neutral-500 text-center">
                  For detailed analysis, see executive reports or cost savings breakdown.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-70"} bg-neutral-900 border-r border-neutral-700 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full md:h-auto ${!sidebarCollapsed ? "md:block" : ""}`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
              <h1 className="text-orange-500 font-bold text-lg tracking-wider">TACTICAL OPS</h1>
              <p className="text-neutral-500 text-xs">v2.1.7 CLASSIFIED</p>
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
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                <span className="text-xs text-white">SYSTEM ONLINE</span>
              </div>
              <div className="text-xs text-neutral-500">
                <div>UPTIME: 99.7%</div>
                <div>RULES: 847 ACTIVE</div>
                <div>ALERTS: 23 CRITICAL</div>
                <div>COST SAVED: $2.4M</div>
              </div>
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
        {/* Top Toolbar */}
        <div className="h-16 bg-neutral-800 border-b border-neutral-700 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-400">
              TACTICAL COMMAND / <span className="text-orange-500">{activeSection.toUpperCase().replace('-', ' ')}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-xs text-neutral-500">LAST UPDATE: {new Date().toLocaleString()}</div>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <AlertTriangle className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="text-neutral-400 hover:text-orange-500">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto">
          {renderDashboardContent()}
        </div>
      </div>
    </div>
  )
}
