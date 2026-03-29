"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Filter, Download, Eye } from "lucide-react";
import AzureSentinelAlerts from "@/components/azure-sentinel-alerts";
import edrDataService from "@/lib/edr-data-service";



const severityLevels = [
  { id: "all", name: "All Severities", color: "text-neutral-400" },
  { id: "Critical", name: "Critical", color: "text-red-400" },
  { id: "High", name: "High", color: "text-orange-400" },
  { id: "Medium", name: "Medium", color: "text-yellow-400" },
  { id: "Low", name: "Low", color: "text-green-400" }
];

export default function AzureSentinelAlertsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [viewMode, setViewMode] = useState<"summary" | "detailed">("summary");

  // Use current quarter as default timeframe
  const timeframeAlerts = edrDataService.getTimeframeAlerts("Q1 2026");
  const totalCostImpact = Object.values(timeframeAlerts).flat().reduce((sum: number, a: any) => sum + (a.costImpact || 0), 0);
  
  // Calculate dynamic totals
  const totalAlerts = Object.values(timeframeAlerts).reduce((sum, alerts) => sum + alerts.length, 0);
  const criticalAlerts = Object.values(timeframeAlerts).reduce((sum, alerts) => 
    sum + alerts.filter((a: any) => a.severity === "Critical").length, 0);
  const highAlerts = Object.values(timeframeAlerts).reduce((sum, alerts) => 
    sum + alerts.filter((a: any) => a.severity === "High").length, 0);

  const alertCategories = [
    {
      id: "edr",
      name: "EDR Alerts",
      description: "Endpoint Detection & Response alerts from Microsoft Defender and CrowdStrike",
      icon: <Shield className="w-6 h-6" />,
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/30",
      count: timeframeAlerts.edr.length
    },
  ];

  return (
    <div className="p-6 overflow-y-auto scroll-smooth" style={{ scrollBehavior: 'smooth' }}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-wider">CrowdStrike Security Alerts</h1>
<p className="text-sm text-neutral-400">Real-time security alerts from CrowdStrike with comprehensive threat intelligence</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-blue-400 font-medium">LIVE DATA</span>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <Card className="bg-neutral-900 border-neutral-700 mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">ALERT SUMMARY</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-xs text-neutral-400 tracking-wider">TOTAL ALERTS</p>
              <p className="text-2xl font-bold text-white font-mono">{totalAlerts.toLocaleString()}</p>
              <p className="text-xs text-neutral-500">across all categories</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-neutral-400 tracking-wider">CRITICAL ALERTS</p>
              <p className="text-2xl font-bold text-red-400 font-mono">{criticalAlerts.toLocaleString()}</p>
              <p className="text-xs text-neutral-500">immediate attention required</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-neutral-400 tracking-wider">HIGH SEVERITY</p>
              <p className="text-2xl font-bold text-orange-400 font-mono">{highAlerts.toLocaleString()}</p>
              <p className="text-xs text-neutral-500">urgent investigation needed</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-neutral-400 tracking-wider">TOTAL IMPACT</p>
              <p className="text-2xl font-bold text-green-400 font-mono">${(totalCostImpact / 1000000).toFixed(1)}M</p>
              <p className="text-xs text-neutral-500">potential cost avoided</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Selection */}
      <Card className="bg-neutral-900 border-neutral-700 mb-8">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">ALERT CATEGORIES</CardTitle>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-neutral-400" />
              <span className="text-xs text-neutral-400">Filter by category</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="w-full max-w-lg">
            {alertCategories.map((category) => (
              <Button
                key={category.id}
                variant="ghost"
                onClick={() => setSelectedCategory(selectedCategory === category.id ? "all" : category.id)}
                className={`h-auto p-8 flex flex-col items-center gap-6 w-full rounded-xl ${
                  selectedCategory === category.id
                    ? `${category.bgColor} ${category.borderColor} border-2`
                    : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
                }`}
              >
                <div className={`${category.color} text-5xl`}>{category.icon}</div>
                <div className="text-center">
                  <div className="text-xl font-bold text-white">{category.name}</div>
                  <div className="text-base text-neutral-400 mt-3">{category.count} alerts</div>
                </div>
              </Button>
            ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Severity Filter */}
      <Card className="bg-neutral-900 border-neutral-700 mb-8">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">SEVERITY FILTER</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {severityLevels.map((severity) => (
              <Button
                key={severity.id}
                variant="ghost"
                onClick={() => setSelectedSeverity(severity.id)}
                className={`text-xs ${
                  selectedSeverity === severity.id
                    ? "bg-neutral-700 border-neutral-500"
                    : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
                } ${severity.color}`}
              >
                {severity.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* View Mode Toggle */}
      <Card className="bg-neutral-900 border-neutral-700 mb-8">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-white text-lg">VIEW MODE</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === "summary" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("summary")}
                className="text-xs"
              >
                <Eye className="w-4 h-4 mr-1" />
                Summary
              </Button>
              <Button
                variant={viewMode === "detailed" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("detailed")}
                className="text-xs"
              >
                <Download className="w-4 h-4 mr-1" />
                Detailed
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <AzureSentinelAlerts 
            selectedCategory={selectedCategory}
            selectedSeverity={selectedSeverity}
            maxAlerts={viewMode === "summary" ? 5 : 15}
            timeframe="Q3 2025"
          />
        </CardContent>
      </Card>

      {/* Alert Categories Breakdown */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">ALERT CATEGORIES BREAKDOWN</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="w-full max-w-lg">
            {alertCategories.map((category) => (
              <Card key={category.id} className={`bg-neutral-800 border-neutral-700 ${category.borderColor} shadow-lg`}>
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-4">
                    <div className={`${category.color} text-3xl`}>{category.icon}</div>
                    <div>
                      <CardTitle className="text-white text-xl font-bold">{category.name}</CardTitle>
                      <p className="text-sm text-neutral-400 mt-1">{category.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-neutral-700/50 rounded-lg">
                        <div className="text-2xl font-bold text-white">{category.count}</div>
                        <div className="text-xs text-neutral-400">Total Alerts</div>
                      </div>
                      <div className="text-center p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                        <div className="text-2xl font-bold text-red-400">
                          {timeframeAlerts[category.id as keyof typeof timeframeAlerts]?.filter((a: any) => a.severity === "Critical").length || 0}
                        </div>
                        <div className="text-xs text-neutral-400">Critical</div>
                      </div>
                      <div className="text-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                        <div className="text-2xl font-bold text-orange-400">
                          {timeframeAlerts[category.id as keyof typeof timeframeAlerts]?.filter((a: any) => a.severity === "High").length || 0}
                        </div>
                        <div className="text-xs text-neutral-400">High</div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedCategory(category.id)}
                      className="w-full text-sm font-medium"
                    >
                      View {category.name} Alerts
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Spacing */}
      <div className="h-8"></div>
    </div>
  );
}
