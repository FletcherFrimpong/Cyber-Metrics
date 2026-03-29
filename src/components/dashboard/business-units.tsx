"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface BusinessUnit {
  name: string;
  attacks: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  costSaved: number;
}

interface BusinessUnitsProps {
  selectedQuarter: string;
}

export default function BusinessUnits({ selectedQuarter }: BusinessUnitsProps) {
  // Generate dynamic business unit data based on selected quarter
  const generateQuarterlyBusinessUnits = () => {
    const quarterlyBusinessUnitSets = {
      "Q1": [
        { name: "Finance & Banking", baseAttacks: 42, baseCostSaved: 6300000, riskLevel: "High" },
        { name: "IT & Infrastructure", baseAttacks: 28, baseCostSaved: 4200000, riskLevel: "High" },
        { name: "Supply Chain Operations", baseAttacks: 25, baseCostSaved: 3750000, riskLevel: "High" },
      ],
      "Q2": [
        { name: "IT & Infrastructure", baseAttacks: 35, baseCostSaved: 5250000, riskLevel: "High" },
        { name: "Finance & Banking", baseAttacks: 32, baseCostSaved: 4800000, riskLevel: "High" },
        { name: "Research & Development", baseAttacks: 22, baseCostSaved: 2200000, riskLevel: "High" },
      ],
      "Q3": [
        { name: "Supply Chain Operations", baseAttacks: 38, baseCostSaved: 5700000, riskLevel: "High" },
        { name: "Warehouse Management", baseAttacks: 32, baseCostSaved: 4800000, riskLevel: "High" },
        { name: "Transportation & Logistics", baseAttacks: 28, baseCostSaved: 4200000, riskLevel: "High" },
      ],
      "Q4": [
        { name: "Finance & Banking", baseAttacks: 45, baseCostSaved: 6750000, riskLevel: "High" },
        { name: "IT & Infrastructure", baseAttacks: 30, baseCostSaved: 4500000, riskLevel: "High" },
        { name: "Marketing", baseAttacks: 25, baseCostSaved: 3750000, riskLevel: "High" },
      ]
    };

    const quarterKey = selectedQuarter.split(" ")[0];
    const baseBusinessUnits = quarterlyBusinessUnitSets[quarterKey as keyof typeof quarterlyBusinessUnitSets] || quarterlyBusinessUnitSets["Q2"];

      // Calculate quarter index for growth
  const getQuarterIndex = (quarter: string) => {
    const [q, year] = quarter.split(' ');
    const quarterNum = parseInt(q?.replace('Q', '') || '1');
    const yearNum = parseInt(year || '2024');
    return (yearNum - 2024) * 4 + quarterNum - 1;
  };

    const quarterIndex = getQuarterIndex(selectedQuarter);
    const growthRate = 1.02; // 2% growth per quarter
    const growthMultiplier = Math.pow(growthRate, quarterIndex);

    return baseBusinessUnits.map(unit => ({
      name: unit.name,
      attacks: Math.round(unit.baseAttacks * growthMultiplier),
      riskLevel: unit.riskLevel,
      costSaved: Math.round(unit.baseCostSaved * growthMultiplier)
    }));
  };

  const businessUnits = generateQuarterlyBusinessUnits();
  const topBusinessUnit = businessUnits[0];
  
  if (!topBusinessUnit) {
    return (
      <Card className="bg-neutral-900 border-neutral-700">
        <CardContent>
          <div className="text-neutral-400">No business unit data available</div>
        </CardContent>
      </Card>
    );
  }

  const getRiskLevelColor = (riskLevel: string) => {
    switch (riskLevel) {
      case "Critical": return "bg-red-500/10 border-red-500/30 text-red-400";
      case "High": return "bg-orange-500/10 border-orange-500/30 text-orange-400";
      case "Medium": return "bg-yellow-500/10 border-yellow-500/30 text-yellow-400";
      case "Low": return "bg-green-500/10 border-green-500/30 text-green-400";
      default: return "bg-neutral-500/10 border-neutral-500/30 text-neutral-400";
    }
  };

  return (
    <div className="space-y-4">
      {/* Executive Summary */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            TOP AFFECTED UNITS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-neutral-400 mb-4">
            {topBusinessUnit.name} experienced {topBusinessUnit.attacks} attacks, 
            preventing {formatCurrency(topBusinessUnit.costSaved)} in potential losses.
          </div>
          
          <div className="space-y-3">
            {businessUnits.map((unit, index) => (
              <div key={unit.name} className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-neutral-700 rounded-full flex items-center justify-center text-sm font-bold text-white">
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-white font-medium">{unit.name}</div>
                    <div className="text-sm text-neutral-400">
                      {unit.attacks} attacks prevented
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-white font-medium">
                      {formatCurrency(unit.costSaved)}
                    </div>
                    <div className="text-sm text-neutral-400">cost saved</div>
                  </div>
                  <Badge variant="outline" className={getRiskLevelColor(unit.riskLevel)}>
                    {unit.riskLevel}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
