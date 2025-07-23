"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Shield, Building, Target } from "lucide-react"

export default function AttackCostsPage() {
  const [viewMode, setViewMode] = useState("summary")

  const industryMultipliers = {
    technology: 1.2,
    financial: 2.8,
    healthcare: 3.4,
    retail: 1.6,
    manufacturing: 1.4,
  }

  const attackCosts = [
    {
      id: "COST-001",
      ruleName: "ADVANCED PERSISTENT THREAT DETECTION",
      ruleId: "RULE-001",
      baseCost: 5200000,
      industryMultiplier: industryMultipliers.financial,
      totalCost: 14560000,
      threatActor: "APT29",
      mitreTechnique: "T1055.012",
      complianceCost: 2400000,
      industry: "Financial Services",
      preventedAttacks: 12,
      costSaved: 174720000,
    },
    {
      id: "COST-002",
      ruleName: "LATERAL MOVEMENT DETECTION",
      ruleId: "RULE-002",
      baseCost: 3800000,
      industryMultiplier: industryMultipliers.healthcare,
      totalCost: 12920000,
      threatActor: "FIN7",
      mitreTechnique: "T1021.001",
      complianceCost: 1800000,
      industry: "Healthcare",
      preventedAttacks: 8,
      costSaved: 103360000,
    },
    {
      id: "COST-003",
      ruleName: "DATA EXFILTRATION MONITORING",
      ruleId: "RULE-003",
      baseCost: 6200000,
      industryMultiplier: industryMultipliers.technology,
      totalCost: 7440000,
      threatActor: "Lazarus Group",
      mitreTechnique: "T1041",
      complianceCost: 980000,
      industry: "Technology",
      preventedAttacks: 15,
      costSaved: 111600000,
    },
    {
      id: "COST-004",
      ruleName: "CREDENTIAL DUMPING DETECTION",
      ruleId: "RULE-004",
      baseCost: 4100000,
      industryMultiplier: industryMultipliers.retail,
      totalCost: 6560000,
      threatActor: "APT1",
      mitreTechnique: "T1003.001",
      complianceCost: 1200000,
      industry: "Retail",
      preventedAttacks: 6,
      costSaved: 39360000,
    },
    {
      id: "COST-005",
      ruleName: "COMMAND AND CONTROL DETECTION",
      ruleId: "RULE-005",
      baseCost: 4800000,
      industryMultiplier: industryMultipliers.manufacturing,
      totalCost: 6720000,
      threatActor: "APT28",
      mitreTechnique: "T1071.001",
      complianceCost: 890000,
      industry: "Manufacturing",
      preventedAttacks: 9,
      costSaved: 60480000,
    },
  ]

  const totalCostSaved = attackCosts.reduce((sum, cost) => sum + cost.costSaved, 0)
  const totalPreventedAttacks = attackCosts.reduce((sum, cost) => sum + cost.preventedAttacks, 0)
  const avgCostPerAttack = totalCostSaved / totalPreventedAttacks

  const getIndustryColor = (industry) => {
    switch (industry) {
      case "Financial Services":
        return "bg-red-500/20 text-red-500"
      case "Healthcare":
        return "bg-orange-500/20 text-orange-500"
      case "Technology":
        return "bg-white/20 text-white"
      case "Retail":
        return "bg-neutral-500/20 text-neutral-300"
      case "Manufacturing":
        return "bg-neutral-600/20 text-neutral-400"
      default:
        return "bg-neutral-500/20 text-neutral-300"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wider">REAL-TIME ATTACK COSTS</h1>
          <p className="text-sm text-neutral-400">Financial impact analysis with industry-specific multipliers</p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setViewMode("summary")}
            className={viewMode === "summary" ? "bg-orange-500 text-white" : "bg-neutral-800 text-neutral-400"}
          >
            Summary
          </Button>
          <Button
            onClick={() => setViewMode("detailed")}
            className={viewMode === "detailed" ? "bg-orange-500 text-white" : "bg-neutral-800 text-neutral-400"}
          >
            Detailed
          </Button>
          <Button
            onClick={() => setViewMode("all")}
            className={viewMode === "all" ? "bg-orange-500 text-white" : "bg-neutral-800 text-neutral-400"}
          >
            All Rules
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">TOTAL COST SAVED</p>
                <p className="text-2xl font-bold text-white font-mono">${(totalCostSaved / 1000000).toFixed(0)}M</p>
              </div>
              <DollarSign className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">PREVENTED ATTACKS</p>
                <p className="text-2xl font-bold text-white font-mono">{totalPreventedAttacks}</p>
              </div>
              <Shield className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">AVG COST/ATTACK</p>
                <p className="text-2xl font-bold text-white font-mono">${(avgCostPerAttack / 1000000).toFixed(1)}M</p>
              </div>
              <Target className="w-8 h-8 text-white" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-neutral-400 tracking-wider">HIGH RISK INDUSTRY</p>
                <p className="text-2xl font-bold text-red-500 font-mono">3.4x</p>
                <p className="text-xs text-neutral-500">Healthcare multiplier</p>
              </div>
              <Building className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Industry Multipliers */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
            INDUSTRY COST MULTIPLIERS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {Object.entries(industryMultipliers).map(([industry, multiplier]) => (
              <div key={industry} className="text-center p-4 border border-neutral-700 rounded">
                <div className="text-lg font-bold text-white font-mono">{multiplier}x</div>
                <div className="text-xs text-neutral-400 capitalize">{industry}</div>
                <div className="w-full bg-neutral-800 rounded-full h-2 mt-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(multiplier / 3.4) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Attack Cost Analysis */}
      {viewMode === "summary" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
                TOP COST SAVINGS BY RULE
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {attackCosts.slice(0, 3).map((cost) => (
                  <div key={cost.id} className="border border-neutral-700 rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-sm font-bold text-white">{cost.ruleName}</div>
                        <div className="text-xs text-neutral-400 font-mono">{cost.ruleId}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-white font-mono">
                          ${(cost.costSaved / 1000000).toFixed(0)}M
                        </div>
                        <div className="text-xs text-neutral-400">Saved</div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Badge className={getIndustryColor(cost.industry)}>{cost.industry}</Badge>
                      <div className="text-xs text-orange-500">{cost.preventedAttacks} attacks prevented</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-700">
            <CardHeader>
              <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">COST BREAKDOWN</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">Base Attack Costs</span>
                  <span className="text-white font-mono">
                    ${(attackCosts.reduce((sum, cost) => sum + cost.baseCost, 0) / 1000000).toFixed(0)}M
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">Industry Multiplied</span>
                  <span className="text-white font-mono">
                    ${(attackCosts.reduce((sum, cost) => sum + cost.totalCost, 0) / 1000000).toFixed(0)}M
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-neutral-400">Compliance Costs</span>
                  <span className="text-white font-mono">
                    ${(attackCosts.reduce((sum, cost) => sum + cost.complianceCost, 0) / 1000000).toFixed(0)}M
                  </span>
                </div>
                <div className="border-t border-neutral-700 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-white">Total Potential Loss</span>
                    <span className="text-lg font-bold text-red-500 font-mono">
                      $
                      {(
                        attackCosts.reduce((sum, cost) => sum + cost.totalCost + cost.complianceCost, 0) / 1000000
                      ).toFixed(0)}
                      M
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {viewMode === "all" && (
        <Card className="bg-neutral-900 border-neutral-700">
          <CardHeader>
            <CardTitle className="text-sm font-medium text-neutral-300 tracking-wider">
              COMPREHENSIVE ATTACK COST ANALYSIS
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-neutral-700">
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">RULE</th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                      INDUSTRY
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                      BASE COST
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                      MULTIPLIER
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                      TOTAL COST
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                      PREVENTED
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">
                      COST SAVED
                    </th>
                    <th className="text-left py-3 px-4 text-xs font-medium text-neutral-400 tracking-wider">THREAT</th>
                  </tr>
                </thead>
                <tbody>
                  {attackCosts.map((cost, index) => (
                    <tr
                      key={cost.id}
                      className={`border-b border-neutral-800 hover:bg-neutral-800 transition-colors ${
                        index % 2 === 0 ? "bg-neutral-900" : "bg-neutral-850"
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-sm text-white font-medium">{cost.ruleName}</div>
                          <div className="text-xs text-neutral-400 font-mono">{cost.ruleId}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={getIndustryColor(cost.industry)}>{cost.industry}</Badge>
                      </td>
                      <td className="py-3 px-4 text-sm text-white font-mono">
                        ${(cost.baseCost / 1000000).toFixed(1)}M
                      </td>
                      <td className="py-3 px-4 text-sm text-orange-500 font-mono">{cost.industryMultiplier}x</td>
                      <td className="py-3 px-4 text-sm text-white font-mono">
                        ${(cost.totalCost / 1000000).toFixed(1)}M
                      </td>
                      <td className="py-3 px-4 text-sm text-white font-mono">{cost.preventedAttacks}</td>
                      <td className="py-3 px-4 text-sm text-white font-mono">
                        ${(cost.costSaved / 1000000).toFixed(0)}M
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-xs text-red-500">{cost.threatActor}</div>
                          <div className="text-xs text-neutral-400">{cost.mitreTechnique}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
