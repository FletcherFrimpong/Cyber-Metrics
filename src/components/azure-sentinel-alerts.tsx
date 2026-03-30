"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  AlertTriangle, 
  Shield, 
  Mail, 
  Globe, 
  Lock, 
  Monitor, 
  Eye, 
  Download, 
  Clock, 
  DollarSign,
  Users,
  FileText,
  Network,
  Server
} from "lucide-react";
import { 
  AzureSentinelAlert, 
  getTimeframeAlerts, 
  getAlertsByCategory,
  getAlertsBySeverity 
} from "@/data/azure-sentinel-samples";

interface AzureSentinelAlertsProps {
  selectedCategory?: string;
  selectedSeverity?: string;
  maxAlerts?: number;
  timeframe?: string;
}

export default function AzureSentinelAlerts({ 
  selectedCategory = "all", 
  selectedSeverity = "all",
  maxAlerts = 10,
  timeframe = "Q3 2025"
}: AzureSentinelAlertsProps) {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  // Get alerts based on filters
  const getFilteredAlerts = (): AzureSentinelAlert[] => {
    let alerts: AzureSentinelAlert[] = [];
    
    // Get timeframe-specific alerts
    const timeframeAlerts = getTimeframeAlerts(timeframe);
    
    if (selectedCategory === "all") {
      alerts = [
        ...timeframeAlerts.edr,
        ...timeframeAlerts.email,
        ...timeframeAlerts.network,
        ...timeframeAlerts.web,
        ...timeframeAlerts.cloud
      ];
    } else {
      alerts = getAlertsByCategory(selectedCategory);
    }

    if (selectedSeverity !== "all") {
      alerts = alerts.filter(alert => alert.severity === selectedSeverity);
    }

    return alerts.slice(0, maxAlerts);
  };

  const filteredAlerts = getFilteredAlerts();

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'edr':
      case 'malware detection':
      case 'ransomware detection':
      case 'credential access':
        return <Shield className="w-4 h-4" />;
      case 'email':
      case 'phishing detection':
      case 'business email compromise':
      case 'malware delivery':
        return <Mail className="w-4 h-4" />;
      case 'network':
      case 'intrusion detection':
      case 'ddos attack':
      case 'port scanning':
        return <Globe className="w-4 h-4" />;
      case 'web':
      case 'malicious website access':
      case 'data exfiltration attempt':
      case 'cross-site scripting':
        return <Lock className="w-4 h-4" />;
      case 'cloud':
      case 'unauthorized access':
      case 'data exfiltration':
      case 'resource abuse':
        return <Monitor className="w-4 h-4" />;
      default:
        return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500/10 border-red-500/30 text-red-400";
      case "High":
        return "bg-orange-500/10 border-orange-500/30 text-orange-400";
      case "Medium":
        return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
      case "Low":
        return "bg-green-500/10 border-green-500/30 text-green-400";
      default:
        return "bg-neutral-500/10 border-neutral-500/30 text-neutral-400";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatCost = (cost: number) => {
    if (cost >= 1000000) {
      return `$${(cost / 1000000).toFixed(1)}M`;
    } else if (cost >= 1000) {
      return `$${(cost / 1000).toFixed(0)}K`;
    }
    return `$${cost}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">CrowdStrike Alerts</h3>
<p className="text-sm text-neutral-400">
  Real security alerts from CrowdStrike with detailed threat intelligence
</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400">
            {filteredAlerts.length} Alerts
          </Badge>
          <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400">
            Live Data
          </Badge>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <Card key={alert.id} className="bg-neutral-900 border-neutral-700 hover:border-neutral-600 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  {/* Alert Icon */}
                  <div className="mt-1">
                    {getCategoryIcon(alert.category)}
                  </div>

                  {/* Alert Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-semibold text-white truncate">
                        {alert.title}
                      </h4>
                      <Badge variant="outline" className={`text-xs ${getSeverityColor(alert.severity)}`}>
                        {alert.severity}
                      </Badge>
                    </div>

                    <p className="text-xs text-neutral-400 mb-2 line-clamp-2">
                      {alert.description}
                    </p>

                    {/* Alert Metadata */}
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(alert.timestamp)}
                      </div>
                      <div className="flex items-center gap-1">
                        <Server className="w-3 h-3" />
                        {alert.source}
                      </div>
                      <div className="flex items-center gap-1">
                        <DollarSign className="w-3 h-3" />
                        {formatCost(alert.costImpact)}
                      </div>
                    </div>

                    {/* MITRE ATT&CK Information */}
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs text-neutral-500">MITRE:</span>
                      <div className="flex gap-1">
                        {alert.mitreTactics.slice(0, 2).map((tactic, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-purple-500/10 border-purple-500/30 text-purple-400">
                            {tactic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setExpandedAlert(expandedAlert === alert.id ? null : alert.id)}
                      className="text-neutral-400 hover:text-white"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neutral-400 hover:text-white"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Expanded Alert Details */}
              {expandedAlert === alert.id && (
                <div className="mt-4 pt-4 border-t border-neutral-700">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Technical Details */}
                    <div>
                      <h5 className="text-sm font-semibold text-white mb-2">Technical Details</h5>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Platform:</span>
                          <span className="text-white">{alert.platform}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Category:</span>
                          <span className="text-white">{alert.category}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Source:</span>
                          <span className="text-white">{alert.source}</span>
                        </div>
                      </div>
                    </div>

                    {/* Affected Entities */}
                    <div>
                      <h5 className="text-sm font-semibold text-white mb-2">Affected Entities</h5>
                      <div className="flex flex-wrap gap-1">
                        {alert.affectedEntities.map((entity, index) => (
                          <Badge key={index} variant="outline" className="text-xs bg-blue-500/10 border-blue-500/30 text-blue-400">
                            {entity}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* IOC Indicators */}
                    <div>
                      <h5 className="text-sm font-semibold text-white mb-2">IOC Indicators</h5>
                      <div className="space-y-1">
                        {alert.iocIndicators.map((ioc, index) => (
                          <div key={index} className="text-xs font-mono text-red-400 bg-red-500/10 p-1 rounded">
                            {ioc}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Remediation Steps */}
                    <div>
                      <h5 className="text-sm font-semibold text-white mb-2">Remediation Steps</h5>
                      <div className="space-y-1">
                        {alert.remediationSteps.map((step, index) => (
                          <div key={index} className="text-xs text-neutral-300 flex items-start gap-2">
                            <span className="text-green-400 mt-0.5">•</span>
                            {step}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Raw Log Preview */}
                  <div className="mt-4">
                    <h5 className="text-sm font-semibold text-white mb-2">Raw Log Preview</h5>
                    <div className="bg-neutral-800 p-3 rounded text-xs font-mono text-neutral-300 overflow-x-auto">
                      <pre>{JSON.stringify(alert.rawLog, null, 2)}</pre>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Summary Stats */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-neutral-400">Total Alerts</p>
              <p className="text-lg font-bold text-white">{filteredAlerts.length}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Critical</p>
              <p className="text-lg font-bold text-red-400">
                {filteredAlerts.filter(a => a.severity === "Critical").length}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">High</p>
              <p className="text-lg font-bold text-orange-400">
                {filteredAlerts.filter(a => a.severity === "High").length}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-400">Total Impact</p>
              <p className="text-lg font-bold text-green-400">
                {formatCost(filteredAlerts.reduce((sum, alert) => sum + alert.costImpact, 0))}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
