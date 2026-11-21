"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Shield, Mail, Globe, Lock, Monitor, Filter, Search, Eye,
  ChevronDown, Clock, DollarSign, Server, AlertTriangle, Loader2
} from "lucide-react";
import type { SecurityAlert, CategorizedAlerts } from "@/types/alerts";

const categories = [
  { id: "all", name: "All", icon: <Filter className="w-4 h-4" />, color: "text-neutral-500", bg: "bg-neutral-500/10", border: "border-neutral-500/30" },
  { id: "edr", name: "EDR", icon: <Shield className="w-4 h-4" />, color: "text-blue-600", bg: "bg-blue-50", border: "border-blue-200" },
  { id: "email", name: "Email", icon: <Mail className="w-4 h-4" />, color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200" },
  { id: "network", name: "Network", icon: <Globe className="w-4 h-4" />, color: "text-cyan-600", bg: "bg-cyan-50", border: "border-cyan-200" },
  { id: "web", name: "Web", icon: <Lock className="w-4 h-4" />, color: "text-yellow-600", bg: "bg-yellow-50", border: "border-yellow-200" },
  { id: "cloud", name: "Cloud", icon: <Monitor className="w-4 h-4" />, color: "text-green-600", bg: "bg-green-50", border: "border-green-200" },
];

const severityLevels = [
  { id: "all", name: "All", color: "text-neutral-500" },
  { id: "Critical", name: "Critical", color: "text-red-600" },
  { id: "High", name: "High", color: "text-neutral-900" },
  { id: "Medium", name: "Medium", color: "text-yellow-600" },
  { id: "Low", name: "Low", color: "text-green-600" },
];

function getSeverityColor(severity: string) {
  switch (severity) {
    case "Critical": return "bg-red-50 border-red-200 text-red-600";
    case "High": return "bg-orange-50 border-orange-200 text-neutral-900";
    case "Medium": return "bg-yellow-50 border-yellow-200 text-yellow-600";
    case "Low": return "bg-green-50 border-green-200 text-green-600";
    default: return "bg-neutral-500/10 border-neutral-500/30 text-neutral-500";
  }
}

function formatCost(cost: number) {
  if (cost >= 1_000_000) return `$${(cost / 1_000_000).toFixed(1)}M`;
  if (cost >= 1_000) return `$${(cost / 1_000).toFixed(0)}K`;
  return `$${cost.toLocaleString()}`;
}

function getCurrentQuarter() {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `Q${q} ${now.getFullYear()}`;
}

export default function AzureSentinelAlertsPage() {
  const [alertData, setAlertData] = useState<CategorizedAlerts | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSeverity, setSelectedSeverity] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [maxVisible, setMaxVisible] = useState(20);

  const timeframe = getCurrentQuarter();

  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch(`/api/edr-alerts?timeframe=${encodeURIComponent(timeframe)}`);
        const json = await res.json();
        if (json.success) {
          setAlertData(json.data);
        }
      } catch (err) {
        console.error("Failed to fetch alerts:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAlerts();
  }, [timeframe]);

  // Flatten and filter alerts
  const filteredAlerts = useMemo(() => {
    if (!alertData) return [];

    let alerts: SecurityAlert[] = [];
    if (selectedCategory === "all") {
      alerts = [...alertData.edr, ...alertData.email, ...alertData.network, ...alertData.web, ...alertData.cloud];
    } else {
      alerts = alertData[selectedCategory as keyof CategorizedAlerts] || [];
    }

    if (selectedSeverity !== "all") {
      alerts = alerts.filter((a) => a.severity === selectedSeverity);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      alerts = alerts.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.source.toLowerCase().includes(q) ||
          a.mitreTactics.some((t) => t.toLowerCase().includes(q)) ||
          a.affectedEntities.some((e) => e.toLowerCase().includes(q))
      );
    }

    // Sort: Critical first, then by timestamp descending
    alerts.sort((a, b) => {
      const severityOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 };
      const diff = (severityOrder[a.severity] ?? 4) - (severityOrder[b.severity] ?? 4);
      if (diff !== 0) return diff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return alerts;
  }, [alertData, selectedCategory, selectedSeverity, searchQuery]);

  // Category counts
  const categoryCounts = useMemo(() => {
    if (!alertData) return {} as Record<string, number>;
    return {
      all: alertData.edr.length + alertData.email.length + alertData.network.length + alertData.web.length + alertData.cloud.length,
      edr: alertData.edr.length,
      email: alertData.email.length,
      network: alertData.network.length,
      web: alertData.web.length,
      cloud: alertData.cloud.length,
    };
  }, [alertData]);

  // Summary stats from filtered alerts
  const stats = useMemo(() => {
    const critical = filteredAlerts.filter((a) => a.severity === "Critical").length;
    const high = filteredAlerts.filter((a) => a.severity === "High").length;
    const totalImpact = filteredAlerts.reduce((sum, a) => sum + (a.costImpact || 0), 0);
    return { total: filteredAlerts.length, critical, high, totalImpact };
  }, [filteredAlerts]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-neutral-500" />
      </div>
    );
  }

  return (
    <div className="p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Security Alerts</h1>
          <p className="text-sm text-neutral-500">
            Resolved incidents from Microsoft Sentinel &mdash; {timeframe}
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-600 text-xs">
          {categoryCounts.all || 0} Total Alerts
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Alerts", value: stats.total.toLocaleString(), color: "text-neutral-900" },
          { label: "Critical", value: stats.critical.toLocaleString(), color: "text-red-600" },
          { label: "High", value: stats.high.toLocaleString(), color: "text-neutral-900" },
          { label: "Cost Impact", value: formatCost(stats.totalImpact), color: "text-green-600" },
        ].map((s) => (
          <Card key={s.label} className="bg-white border-neutral-200">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-neutral-500">{s.label}</p>
              <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-white border-neutral-200">
        <CardContent className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder="Search alerts by title, source, MITRE tactic, or entity..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setMaxVisible(20); }}
              className="pl-9 bg-neutral-50 border-neutral-200 text-neutral-900 text-sm"
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedCategory(cat.id); setMaxVisible(20); }}
                className={`text-xs gap-1.5 ${
                  selectedCategory === cat.id
                    ? `${cat.bg} ${cat.border} border ${cat.color}`
                    : "bg-neutral-50 border-neutral-200 text-neutral-500 hover:bg-neutral-100"
                }`}
              >
                {cat.icon}
                {cat.name}
                <span className="ml-1 text-neutral-500">{categoryCounts[cat.id] ?? 0}</span>
              </Button>
            ))}
          </div>

          {/* Severity pills */}
          <div className="flex flex-wrap gap-2">
            {severityLevels.map((sev) => (
              <Button
                key={sev.id}
                variant="ghost"
                size="sm"
                onClick={() => { setSelectedSeverity(sev.id); setMaxVisible(20); }}
                className={`text-xs ${
                  selectedSeverity === sev.id
                    ? "bg-neutral-100 border-neutral-500 border"
                    : "bg-neutral-50 border-neutral-200 hover:bg-neutral-100"
                } ${sev.color}`}
              >
                {sev.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Results count */}
      <p className="text-xs text-neutral-500">
        Showing {Math.min(maxVisible, filteredAlerts.length)} of {filteredAlerts.length} alerts
      </p>

      {/* Alert list */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 && (
          <Card className="bg-white border-neutral-200">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-neutral-400 mx-auto mb-3" />
              <p className="text-sm text-neutral-500">No alerts match your filters</p>
            </CardContent>
          </Card>
        )}

        {filteredAlerts.slice(0, maxVisible).map((alert) => {
          const isExpanded = expandedAlert === alert.id;
          const catMeta = categories.find((c) => c.id === alert.category) || categories[0];

          return (
            <Card
              key={alert.id}
              className="bg-white border-neutral-200 hover:border-neutral-200 transition-colors cursor-pointer"
              onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
            >
              <CardContent className="p-4">
                {/* Alert header row */}
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${catMeta.color}`}>{catMeta.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-neutral-900 truncate">{alert.title}</h4>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-1 mb-2">{alert.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(alert.timestamp).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Server className="w-3 h-3" />{alert.source}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatCost(alert.costImpact)}</span>
                      {alert.department && <span className="flex items-center gap-1">Dept: {alert.department}</span>}
                    </div>
                    {alert.mitreTactics.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {alert.mitreTactics.slice(0, 3).map((t, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] bg-purple-50 border-purple-200 text-purple-600">
                            {t}
                          </Badge>
                        ))}
                        {alert.mitreTactics.length > 3 && (
                          <span className="text-[10px] text-neutral-500">+{alert.mitreTactics.length - 3} more</span>
                        )}
                      </div>
                    )}
                  </div>
                  <ChevronDown className={`w-4 h-4 text-neutral-500 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-neutral-200 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs font-semibold text-neutral-500 mb-2">Technical Details</h5>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between"><span className="text-neutral-500">Platform</span><span className="text-neutral-900">{alert.platform}</span></div>
                        <div className="flex justify-between"><span className="text-neutral-500">Category</span><span className="text-neutral-900 capitalize">{alert.category}</span></div>
                        <div className="flex justify-between"><span className="text-neutral-500">Source</span><span className="text-neutral-900">{alert.source}</span></div>
                        <div className="flex justify-between"><span className="text-neutral-500">Confidence</span><span className="text-neutral-900">{alert.confidence ?? "N/A"}%</span></div>
                        <div className="flex justify-between"><span className="text-neutral-500">Status</span><span className="text-neutral-900">{alert.status ?? "Resolved"}</span></div>
                      </div>
                    </div>

                    {alert.affectedEntities.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-neutral-500 mb-2">Affected Entities</h5>
                        <div className="flex flex-wrap gap-1">
                          {alert.affectedEntities.map((e, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] bg-blue-50 border-blue-200 text-blue-600">{e}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {alert.iocIndicators.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-neutral-500 mb-2">IOC Indicators</h5>
                        <div className="space-y-1">
                          {alert.iocIndicators.map((ioc, i) => (
                            <div key={i} className="text-xs tabular-nums text-red-600 bg-red-50 px-2 py-1 rounded">{ioc}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {alert.remediationSteps.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-neutral-500 mb-2">Remediation</h5>
                        <div className="space-y-1">
                          {alert.remediationSteps.map((step, i) => (
                            <div key={i} className="text-xs text-neutral-700 flex items-start gap-2">
                              <span className="text-green-600 mt-0.5">•</span>{step}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw log */}
                    <div className="md:col-span-2">
                      <h5 className="text-xs font-semibold text-neutral-500 mb-2">Raw Log</h5>
                      <div className="bg-neutral-50 p-3 rounded text-xs tabular-nums text-neutral-700 overflow-x-auto max-h-48">
                        <pre>{JSON.stringify(alert.rawLog, null, 2)}</pre>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Load more */}
      {maxVisible < filteredAlerts.length && (
        <div className="text-center">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMaxVisible((v) => v + 20)}
            className="text-xs text-neutral-500"
          >
            Load more ({filteredAlerts.length - maxVisible} remaining)
          </Button>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
