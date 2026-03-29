// Centralized data providers for consistent data access across components

import edrDataService from "./edr-data-service";

export interface DataProviderConfig {
  useRealData: boolean;
  cacheEnabled: boolean;
  cacheDuration: number;
}

class DataProvider {
  private config: DataProviderConfig;

  constructor(config: DataProviderConfig = {
    useRealData: true,
    cacheEnabled: true,
    cacheDuration: 5 * 60 * 1000 // 5 minutes
  }) {
    this.config = config;
  }

  // Get alerts data from the data service
  async getAlerts(timeframe: string) {
    return edrDataService.getTimeframeAlerts(timeframe);
  }

  // Get business unit data
  getBusinessUnits(selectedQuarter: string) {
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
    if (!(quarterKey in quarterlyBusinessUnitSets)) {
      console.warn(`Unknown quarter key "${quarterKey}", defaulting to Q1`);
    }
    return quarterlyBusinessUnitSets[quarterKey as keyof typeof quarterlyBusinessUnitSets] || quarterlyBusinessUnitSets["Q1"];
  }

  // Get time-based data
  getTimeBasedData() {
    const currentDate = new Date();
    const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
    const currentYear = currentDate.getFullYear();
    
    const quarters = [];
    const baseData = {
      "EDR Solution": { baseAttacks: 120, baseFalsePositives: 15, growthRate: 1.05 }
    };
    
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
        const quarterKey = `Q${targetQuarter} ${targetYear}`;
        
        // Calculate quarter index for growth (0 = oldest, 3 = current)
        const quarterIndex = 3 - i;
        const growthMultiplier = Math.pow(1.02, quarterIndex); // 2% growth per quarter
        
        const categories: Record<string, { attacks: number; falsePositives: number }> = {};
        let totalAttacks = 0;
        
        Object.entries(baseData).forEach(([category, data]) => {
          const categoryGrowth = Math.pow(data.growthRate, quarterIndex);
          const attacks = Math.round(data.baseAttacks * categoryGrowth * growthMultiplier);
          const falsePositives = Math.round(data.baseFalsePositives * categoryGrowth * growthMultiplier);
          
          categories[category] = { attacks, falsePositives };
          totalAttacks += attacks;
        });
        
        const costSaved = Math.round(25000000 * growthMultiplier);
        
        quarters.push({
          quarter: quarterKey,
          attacks: totalAttacks,
          costSaved,
          categories
        });
      }
    }
    
    return quarters;
  }

  // Update configuration
  updateConfig(newConfig: Partial<DataProviderConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
}

// Export singleton instance
export const dataProvider = new DataProvider();
export default dataProvider;
