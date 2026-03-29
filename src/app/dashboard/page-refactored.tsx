"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Target, Calendar } from "lucide-react";
import FinancialMetrics from "@/components/dashboard/financial-metrics";
import BusinessUnits from "@/components/dashboard/business-units";
import { useFinancialMetrics } from "@/hooks/useFinancialMetrics";

interface DashboardPageProps {
  selectedQuarter?: string;
  timeView?: "quarterly" | "yearly";
}

export default function DashboardPage({ selectedQuarter = "Q2 2025", timeView = "quarterly" }: DashboardPageProps) {
  const { metrics, loading, error } = useFinancialMetrics({ 
    period: timeView, 
    selectedQuarter 
  });

  // Simple attack statistics
  const attackStats = {
    totalAttacksBlocked: 255,
    avgResponseTime: "2.3 minutes",
    detectionRate: 98.7,
    falsePositiveRate: 1.3
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Tactical Dashboard</h1>
            <p className="text-neutral-400 mt-2">
              Real-time security analytics and financial impact analysis
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400">
              <Calendar className="w-3 h-3 mr-1" />
              {selectedQuarter}
            </Badge>
            <Badge variant="outline" className="bg-green-500/10 border-green-500/30 text-green-400">
              {timeView === "quarterly" ? "Quarterly View" : "Yearly View"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center h-64">
          <div className="text-neutral-400">Loading financial metrics...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6">
          <div className="text-red-400">Error: {error}</div>
        </div>
      )}

      {/* Financial Metrics */}
      <div className="mb-8">
        <FinancialMetrics timeView={timeView} selectedQuarter={selectedQuarter} />
      </div>

      {/* Business Units */}
      <div className="mb-8">
        <BusinessUnits selectedQuarter={selectedQuarter} />
      </div>

      {/* Attack Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              ATTACKS BLOCKED
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">
              {attackStats.totalAttacksBlocked.toLocaleString()}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Total threats prevented
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-400" />
              DETECTION RATE
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">
              {attackStats.detectionRate}%
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Threat detection accuracy
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              RESPONSE TIME
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-400">
              {attackStats.avgResponseTime}
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              Average incident response
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-white text-sm flex items-center gap-2">
              <Target className="w-4 h-4 text-yellow-400" />
              FALSE POSITIVES
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {attackStats.falsePositiveRate}%
            </div>
            <div className="text-xs text-neutral-400 mt-1">
              False positive rate
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Executive Summary */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-neutral-400 space-y-2">
            <p>
              • EDR solution prevented {attackStats.totalAttacksBlocked.toLocaleString()} attacks in {selectedQuarter}
            </p>
            <p>
              • Generated {formatCurrency(metrics.totalCostSavings)} in cost savings
            </p>
            <p>
              • Achieved {metrics.roi}% ROI on security investment
            </p>
            <p>
              • Maintained {attackStats.detectionRate}% threat detection accuracy
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
