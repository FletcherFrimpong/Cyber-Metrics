"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Settings, RefreshCw, Database, Wifi, WifiOff } from "lucide-react";

interface EDRStatus {
  hasAPIClient: boolean;
  useRealData: boolean;
  fallbackToSampleData: boolean;
  cacheSize: number;
}

interface EDRConfigPanelProps {
  onConfigChange?: () => void;
}

export default function EDRConfigPanel({ onConfigChange }: EDRConfigPanelProps) {
  const [status, setStatus] = useState<EDRStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    useRealData: true,
    fallbackToSampleData: true,
    cacheDuration: 5 * 60 * 1000 // 5 minutes
  });

  // Fetch current status
  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/edr-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-status' })
      });
      
      if (response.ok) {
        const data = await response.json();
        setStatus(data.status);
      }
    } catch (error) {
      console.error('Failed to fetch EDR status:', error);
    }
  };

  // Clear cache
  const clearCache = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/edr-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-cache' })
      });
      
      if (response.ok) {
        await fetchStatus();
        onConfigChange?.();
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update configuration
  const updateConfig = async (newConfig: Partial<typeof config>) => {
    setLoading(true);
    try {
      const response = await fetch('/api/edr-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'update-config',
          config: { ...config, ...newConfig }
        })
      });
      
      if (response.ok) {
        setConfig(prev => ({ ...prev, ...newConfig }));
        await fetchStatus();
        onConfigChange?.();
      }
    } catch (error) {
      console.error('Failed to update config:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  return (
    <Card className="bg-neutral-900 border-neutral-700">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Settings className="w-5 h-5" />
            EDR API Configuration
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchStatus}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
          <div className="flex items-center gap-3">
            {status?.hasAPIClient ? (
              <Wifi className="w-5 h-5 text-green-400" />
            ) : (
              <WifiOff className="w-5 h-5 text-red-400" />
            )}
            <div>
              <div className="text-white font-medium">API Connection</div>
              <div className="text-sm text-neutral-400">
                {status?.hasAPIClient ? 'Connected to EDR Platform' : 'Using Sample Data'}
              </div>
            </div>
          </div>
          <Badge 
            variant="outline" 
            className={status?.hasAPIClient ? 
              "bg-green-500/10 border-green-500/30 text-green-400" : 
              "bg-red-500/10 border-red-500/30 text-red-400"
            }
          >
            {status?.hasAPIClient ? 'Connected' : 'Sample Data'}
          </Badge>
        </div>

        {/* Data Source Configuration */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Use Real EDR Data</div>
              <div className="text-sm text-neutral-400">
                Connect to actual EDR platform APIs
              </div>
            </div>
            <Button
              variant={config.useRealData ? "default" : "outline"}
              size="sm"
              onClick={() => updateConfig({ useRealData: !config.useRealData })}
              disabled={loading}
            >
              {config.useRealData ? 'Enabled' : 'Disabled'}
            </Button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Fallback to Sample Data</div>
              <div className="text-sm text-neutral-400">
                Use sample data when API is unavailable
              </div>
            </div>
            <Button
              variant={config.fallbackToSampleData ? "default" : "outline"}
              size="sm"
              onClick={() => updateConfig({ fallbackToSampleData: !config.fallbackToSampleData })}
              disabled={loading}
            >
              {config.fallbackToSampleData ? 'Enabled' : 'Disabled'}
            </Button>
          </div>
        </div>

        {/* Cache Information */}
        <div className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-white font-medium">Cache Status</div>
              <div className="text-sm text-neutral-400">
                {status?.cacheSize || 0} cached queries
              </div>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={clearCache}
            disabled={loading}
          >
            Clear Cache
          </Button>
        </div>

        {/* Environment Variables Info */}
        <div className="p-3 bg-neutral-800/50 rounded-lg border border-neutral-700/50">
          <div className="text-white font-medium mb-2">Required Environment Variables</div>
          <div className="text-sm text-neutral-400 space-y-1">
            <div>• NEXT_PUBLIC_EDR_PLATFORM</div>
            <div>• NEXT_PUBLIC_EDR_BASE_URL</div>
            <div>• NEXT_PUBLIC_EDR_API_KEY (or platform-specific credentials)</div>
          </div>
          <div className="text-xs text-neutral-500 mt-2">
            Check env.example for complete configuration options
          </div>
        </div>

        {/* Status Summary */}
        {status && (
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-neutral-400">API Client:</span>
              <span className={status.hasAPIClient ? "text-green-400" : "text-red-400"}>
                {status.hasAPIClient ? "Available" : "Not Available"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Real Data:</span>
              <span className={status.useRealData ? "text-green-400" : "text-yellow-400"}>
                {status.useRealData ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Fallback:</span>
              <span className={status.fallbackToSampleData ? "text-green-400" : "text-yellow-400"}>
                {status.fallbackToSampleData ? "Enabled" : "Disabled"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-neutral-400">Cache Size:</span>
              <span className="text-blue-400">{status.cacheSize}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
