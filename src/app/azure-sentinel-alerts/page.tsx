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
  { id: "all", name: "All", icon: <Filter className="w-4 h-4" />, color: "text-neutral-400", bg: "bg-neutral-500/10", border: "border-neutral-500/30" },
  { id: "edr", name: "EDR", icon: <Shield className="w-4 h-4" />, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/30" },
  { id: "email", name: "Email", icon: <Mail className="w-4 h-4" />, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
  { id: "network", name: "Network", icon: <Globe className="w-4 h-4" />, color: "text-cyan-400", bg: "bg-cyan-500/10", border: "border-cyan-500/30" },
  { id: "web", name: "Web", icon: <Lock className="w-4 h-4" />, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/30" },
  { id: "cloud", name: "Cloud", icon: <Monitor className="w-4 h-4" />, color: "text-green-400", bg: "bg-green-500/10", border: "border-green-500/30" },
];

const severityLevels = [
  { id: "all", name: "All", color: "text-neutral-400" },
  { id: "Critical", name: "Critical", color: "text-red-400" },
  { id: "High", name: "High", color: "text-orange-400" },
  { id: "Medium", name: "Medium", color: "text-yellow-400" },
  { id: "Low", name: "Low", color: "text-green-400" },
];

function getSeverityColor(severity: string) {
  switch (severity) {
    case "Critical": return "bg-red-500/10 border-red-500/30 text-red-400";
    case "High": return "bg-orange-500/10 border-orange-500/30 text-orange-400";
    case "Medium": return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
    case "Low": return "bg-green-500/10 border-green-500/30 text-green-400";
    default: return "bg-neutral-500/10 border-neutral-500/30 text-neutral-400";
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
          <h1 className="text-2xl font-bold text-white tracking-wider">Security Alerts</h1>
          <p className="text-sm text-neutral-400">
            Resolved incidents from Microsoft Sentinel &mdash; {timeframe}
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400 text-xs">
          {categoryCounts.all || 0} Total Alerts
        </Badge>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Alerts", value: stats.total.toLocaleString(), color: "text-white" },
          { label: "Critical", value: stats.critical.toLocaleString(), color: "text-red-400" },
          { label: "High", value: stats.high.toLocaleString(), color: "text-orange-400" },
          { label: "Cost Impact", value: formatCost(stats.totalImpact), color: "text-green-400" },
        ].map((s) => (
          <Card key={s.label} className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-neutral-500 uppercase tracking-wide">{s.label}</p>
              <p className={`text-2xl font-bold font-mono ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <Card className="bg-neutral-900 border-neutral-800">
        <CardContent className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <Input
              placeholder="Search alerts by title, source, MITRE tactic, or entity..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setMaxVisible(20); }}
              className="pl-9 bg-neutral-800 border-neutral-700 text-white text-sm"
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
                    : "bg-neutral-800 border-neutral-700 text-neutral-400 hover:bg-neutral-700"
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
                    ? "bg-neutral-700 border-neutral-500 border"
                    : "bg-neutral-800 border-neutral-700 hover:bg-neutral-700"
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
          <Card className="bg-neutral-900 border-neutral-800">
            <CardContent className="p-8 text-center">
              <AlertTriangle className="w-8 h-8 text-neutral-600 mx-auto mb-3" />
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
              className="bg-neutral-900 border-neutral-800 hover:border-neutral-700 transition-colors cursor-pointer"
              onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
            >
              <CardContent className="p-4">
                {/* Alert header row */}
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${catMeta.color}`}>{catMeta.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-semibold text-white truncate">{alert.title}</h4>
                      <Badge variant="outline" className={`text-[10px] shrink-0 ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-xs text-neutral-400 line-clamp-1 mb-2">{alert.description}</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-neutral-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(alert.timestamp).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><Server className="w-3 h-3" />{alert.source}</span>
                      <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatCost(alert.costImpact)}</span>
                      {alert.department && <span className="flex items-center gap-1">Dept: {alert.department}</span>}
                    </div>
                    {alert.mitreTactics.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {alert.mitreTactics.slice(0, 3).map((t, i) => (
                          <Badge key={i} variant="outline" className="text-[10px] bg-purple-500/10 border-purple-500/30 text-purple-400">
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
                  <div className="mt-4 pt-4 border-t border-neutral-800 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-xs font-semibold text-neutral-400 uppercase mb-2">Technical Details</h5>
                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between"><span className="text-neutral-500">Platform</span><span className="text-white">{alert.platform}</span></div>
                        <div className="flex justify-between"><span className="text-neutral-500">Category</span><span className="text-white capitalize">{alert.category}</span></div>
                        <div className="flex justify-between"><span className="text-neutral-500">Source</span><span className="text-white">{alert.source}</span></div>
                        <div className="flex justify-between"><span className="text-neutral-500">Confidence</span><span className="text-white">{alert.confidence ?? "N/A"}%</span></div>
                        <div className="flex justify-between"><span className="text-neutral-500">Status</span><span className="text-white">{alert.status ?? "Resolved"}</span></div>
                      </div>
                    </div>

                    {alert.affectedEntities.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-neutral-400 uppercase mb-2">Affected Entities</h5>
                        <div className="flex flex-wrap gap-1">
                          {alert.affectedEntities.map((e, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] bg-blue-500/10 border-blue-500/30 text-blue-400">{e}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {alert.iocIndicators.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-neutral-400 uppercase mb-2">IOC Indicators</h5>
                        <div className="space-y-1">
                          {alert.iocIndicators.map((ioc, i) => (
                            <div key={i} className="text-xs font-mono text-red-400 bg-red-500/10 px-2 py-1 rounded">{ioc}</div>
                          ))}
                        </div>
                      </div>
                    )}

                    {alert.remediationSteps.length > 0 && (
                      <div>
                        <h5 className="text-xs font-semibold text-neutral-400 uppercase mb-2">Remediation</h5>
                        <div className="space-y-1">
                          {alert.remediationSteps.map((step, i) => (
                            <div key={i} className="text-xs text-neutral-300 flex items-start gap-2">
                              <span className="text-green-400 mt-0.5">•</span>{step}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Raw log */}
                    <div className="md:col-span-2">
                      <h5 className="text-xs font-semibold text-neutral-400 uppercase mb-2">Raw Log</h5>
                      <div className="bg-neutral-800 p-3 rounded text-xs font-mono text-neutral-300 overflow-x-auto max-h-48">
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
            className="text-xs text-neutral-400"
          >
            Load more ({filteredAlerts.length - maxVisible} remaining)
          </Button>
        </div>
      )}

      <div className="h-8" />
    </div>
  );
}
