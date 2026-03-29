// Test file for PDF Export functionality
import { generateTrendsAnalyticsPDF, TrendsAnalyticsData } from './pdf-export';

// Mock data for testing
const mockData: TrendsAnalyticsData = {
  timeView: "quarterly",
  selectedQuarter: "Q3 2025",
  timeframeAlerts: {
    edr: [
      { severity: "Critical", costImpact: 50000 },
      { severity: "High", costImpact: 25000 },
      { severity: "Medium", costImpact: 10000 }
    ],
    email: [
      { severity: "High", costImpact: 15000 },
      { severity: "Medium", costImpact: 5000 }
    ],
    network: [
      { severity: "Critical", costImpact: 75000 },
      { severity: "High", costImpact: 30000 }
    ],
    web: [
      { severity: "Medium", costImpact: 8000 }
    ],
    cloud: [
      { severity: "Low", costImpact: 2000 }
    ]
  },
  roiValue: 85.5,
  quarterlyData: [
    { quarter: "Q1 2025", attacks: 120, costSaved: 2500000 },
    { quarter: "Q2 2025", attacks: 145, costSaved: 3200000 },
    { quarter: "Q3 2025", attacks: 180, costSaved: 4500000 },
    { quarter: "Q4 2025", attacks: 165, costSaved: 3800000 }
  ],
  yearlyData: [
    { year: "2024", attacks: 480, costSaved: 8500000, roi: 75 },
    { year: "2025", attacks: 610, costSaved: 14000000, roi: 85 }
  ],
  kriMetrics: {
    threatVolume: 65,
    costEfficiency: 88,
    roi: 85.5,
    detectionAccuracy: 97.8,
    responseTime: 85,
    coverageGap: 15
  }
};

// Test function to verify PDF export
export const testPDFExport = async (): Promise<void> => {
  try {
    console.log('Testing PDF export functionality...');
    
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.log('❌ Test failed: Not in browser environment');
      return;
    }

    // Test the PDF generation
    await generateTrendsAnalyticsPDF(mockData);
    console.log('✅ PDF export test completed successfully');
    
  } catch (error) {
    console.error('❌ PDF export test failed:', error);
  }
};

// Export for manual testing
export { mockData };
