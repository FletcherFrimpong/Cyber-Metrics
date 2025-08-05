"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Shield, Target, DollarSign, TrendingUp, TrendingDown, Calendar, BarChart3, PieChart } from "lucide-react";

export default function TrendsAnalytics() {
  const [timeView, setTimeView] = useState<"quarterly" | "yearly">("quarterly");
  const [selectedQuarter, setSelectedQuarter] = useState<string>("Q1 2025");

  // Time-based aggregation and trends
  const getTimeBasedData = () => {
    const currentDate = new Date();
    const currentQuarter = Math.floor(currentDate.getMonth() / 3) + 1;
    const currentYear = currentDate.getFullYear();
    
    // Mock historical data for trends
    const quarterlyData = [
      { 
        quarter: "Q1 2024", 
        attacks: 180, 
        costSaved: 25000000, 
        categories: { 
          "EDR Solution": { attacks: 120, falsePositives: 15 }, 
          "Email Security Solution": { attacks: 35, falsePositives: 8 }, 
          "Network Security Solution": { attacks: 15, falsePositives: 3 }, 
          "Web Filtering Solution": { attacks: 10, falsePositives: 2 } 
        } 
      },
      { 
        quarter: "Q2 2024", 
        attacks: 210, 
        costSaved: 29000000, 
        categories: { 
          "EDR Solution": { attacks: 140, falsePositives: 18 }, 
          "Email Security Solution": { attacks: 40, falsePositives: 10 }, 
          "Network Security Solution": { attacks: 18, falsePositives: 4 }, 
          "Web Filtering Solution": { attacks: 12, falsePositives: 3 } 
        } 
      },
      { 
        quarter: "Q3 2024", 
        attacks: 195, 
        costSaved: 27000000, 
        categories: { 
          "EDR Solution": { attacks: 130, falsePositives: 16 }, 
          "Email Security Solution": { attacks: 38, falsePositives: 9 }, 
          "Network Security Solution": { attacks: 16, falsePositives: 3 }, 
          "Web Filtering Solution": { attacks: 11, falsePositives: 2 } 
        } 
      },
      { 
        quarter: "Q4 2024", 
        attacks: 240, 
        costSaved: 33000000, 
        categories: { 
          "EDR Solution": { attacks: 160, falsePositives: 20 }, 
          "Email Security Solution": { attacks: 45, falsePositives: 12 }, 
          "Network Security Solution": { attacks: 20, falsePositives: 5 }, 
          "Web Filtering Solution": { attacks: 15, falsePositives: 4 } 
        } 
      },
      { 
        quarter: "Q1 2025", 
        attacks: 255, 
        costSaved: 36000000, 
        categories: { 
          "EDR Solution": { attacks: 123, falsePositives: 14 }, 
          "Email Security Solution": { attacks: 68, falsePositives: 16 }, 
          "Network Security Solution": { attacks: 18, falsePositives: 4 }, 
          "Web Filtering Solution": { attacks: 34, falsePositives: 8 }, 
          cloud: { attacks: 12, falsePositives: 3 } 
        } 
      }
    ];

    const yearlyData = [
      { 
        year: "2022", 
        attacks: 680, 
        costSaved: 95000000, 
        categories: { 
          "EDR Solution": { attacks: 450, falsePositives: 55 }, 
          "Email Security Solution": { attacks: 120, falsePositives: 30 }, 
          "Network Security Solution": { attacks: 60, falsePositives: 12 }, 
          "Web Filtering Solution": { attacks: 50, falsePositives: 10 } 
        } 
      },
      { 
        year: "2023", 
        attacks: 820, 
        costSaved: 115000000, 
        categories: { 
          "EDR Solution": { attacks: 540, falsePositives: 65 }, 
          "Email Security Solution": { attacks: 150, falsePositives: 38 }, 
          "Network Security Solution": { attacks: 70, falsePositives: 15 }, 
          "Web Filtering Solution": { attacks: 60, falsePositives: 12 } 
        } 
      },
      { 
        year: "2024", 
        attacks: 825, 
        costSaved: 114000000, 
        categories: { 
          "EDR Solution": { attacks: 550, falsePositives: 68 }, 
          "Email Security Solution": { attacks: 158, falsePositives: 40 }, 
          "Network Security Solution": { attacks: 69, falsePositives: 14 }, 
          "Web Filtering Solution": { attacks: 48, falsePositives: 10 } 
        } 
      },
      { 
        year: "2025", 
        attacks: 255, 
        costSaved: 36000000, 
        categories: { 
          "EDR Solution": { attacks: 123, falsePositives: 14 }, 
          "Email Security Solution": { attacks: 68, falsePositives: 16 }, 
          "Network Security Solution": { attacks: 18, falsePositives: 4 }, 
          "Web Filtering Solution": { attacks: 34, falsePositives: 8 }, 
          cloud: { attacks: 12, falsePositives: 3 } 
        } 
      }
    ];

    // Calculate trends
    const getQuarterlyTrend = () => {
      const currentQ = quarterlyData[quarterlyData.length - 1];
      const previousQ = quarterlyData[quarterlyData.length - 2];
      const attackChange = ((currentQ.attacks - previousQ.attacks) / previousQ.attacks) * 100;
      const costChange = ((currentQ.costSaved - previousQ.costSaved) / previousQ.costSaved) * 100;
      return { attackChange, costChange };
    };

    const getYearlyTrend = () => {
      const currentY = yearlyData[yearlyData.length - 1];
      const previousY = yearlyData[yearlyData.length - 2];
      const attackChange = ((currentY.attacks - previousY.attacks) / previousY.attacks) * 100;
      const costChange = ((currentY.costSaved - previousY.costSaved) / previousY.costSaved) * 100;
      return { attackChange, costChange };
    };

    return {
      quarterlyData,
      yearlyData,
      quarterlyTrend: getQuarterlyTrend(),
      yearlyTrend: getYearlyTrend(),
      currentQuarter: `Q${currentQuarter} ${currentYear}`,
      currentYear: currentYear.toString()
    };
  };

  const timeData = getTimeBasedData();

  // Get aggregated data based on selected time view
  const getAggregatedData = () => {
    switch (timeView) {
      case "quarterly":
        const selectedQuarterData = timeData.quarterlyData.find(q => q.quarter === selectedQuarter);
        const currentQuarterIndex = timeData.quarterlyData.findIndex(q => q.quarter === selectedQuarter);
        const previousQuarterIndex = currentQuarterIndex > 0 ? currentQuarterIndex - 1 : 0;
        const previousQuarterData = timeData.quarterlyData[previousQuarterIndex];
        
        if (selectedQuarterData && previousQuarterData) {
          const attackChange = ((selectedQuarterData.attacks - previousQuarterData.attacks) / previousQuarterData.attacks) * 100;
          const costChange = ((selectedQuarterData.costSaved - previousQuarterData.costSaved) / previousQuarterData.costSaved) * 100;
          
          return {
            attacks: selectedQuarterData.attacks,
            costSaved: selectedQuarterData.costSaved,
            trend: { attackChange, costChange }
          };
        }
        return {
          attacks: selectedQuarterData?.attacks || 0,
          costSaved: selectedQuarterData?.costSaved || 0,
          trend: { attackChange: 0, costChange: 0 }
        };
      case "yearly":
        return {
          attacks: timeData.yearlyData[timeData.yearlyData.length - 1].attacks,
          costSaved: timeData.yearlyData[timeData.yearlyData.length - 1].costSaved,
          trend: timeData.yearlyTrend
        };
      default:
        return {
          attacks: 0,
          costSaved: 0,
          trend: { attackChange: 0, costChange: 0 }
        };
    }
  };

  const aggregatedData = getAggregatedData();

  // Key Risk Indicators (KRI) data based on time period
  const getKRIData = () => {
    const selectedData = timeView === "quarterly" 
      ? timeData.quarterlyData.find(q => q.quarter === selectedQuarter)
      : timeData.yearlyData.find(y => y.year === timeData.currentYear);

    if (!selectedData) return null;

    const totalAttacks = selectedData.attacks;
    const totalCostSaved = selectedData.costSaved;
    const categories = selectedData.categories;

    // Calculate KRI metrics based on the selected time period
    const kriMetrics = {
      threatVolume: Math.min(100, (totalAttacks / 300) * 100), // Normalized to 100
      costEfficiency: Math.min(100, (totalCostSaved / 50000000) * 100), // Normalized to 100
      detectionAccuracy: 97.8, // Based on overall accuracy
      responseTime: 85, // Response time efficiency (1.2s avg)
      coverageGap: 15, // Coverage gap percentage
      riskExposure: Math.min(100, (totalAttacks / 250) * 100), // Risk exposure level
      complianceScore: 92, // Compliance adherence
      incidentSeverity: Math.min(100, (totalAttacks / 200) * 100) // Incident severity index
    };

    return kriMetrics;
  };

  const kriData = getKRIData();

  // Radar chart component
  const RadarChart = ({ data }: { data: any }) => {
    if (!data) return null;

    const metrics = [
      { name: "Threat Volume", value: data.threatVolume, color: "from-red-500 to-red-600" },
      { name: "Cost Efficiency", value: data.costEfficiency, color: "from-green-500 to-green-600" },
      { name: "Detection Accuracy", value: data.detectionAccuracy, color: "from-blue-500 to-blue-600" },
      { name: "Response Time", value: data.responseTime, color: "from-purple-500 to-purple-600" },
      { name: "Coverage Gap", value: data.coverageGap, color: "from-orange-500 to-orange-600" },
      { name: "Risk Exposure", value: data.riskExposure, color: "from-red-400 to-red-500" },
      { name: "Compliance Score", value: data.complianceScore, color: "from-emerald-500 to-emerald-600" },
      { name: "Incident Severity", value: data.incidentSeverity, color: "from-amber-500 to-amber-600" }
    ];

    const radius = 120;
    const centerX = 150;
    const centerY = 150;

    return (
      <div className="relative w-full h-80 flex items-center justify-center">
        <svg width="300" height="300" className="transform -rotate-90">
          {/* Background circles */}
          {[20, 40, 60, 80, 100].map((level) => (
            <circle
              key={level}
              cx={centerX}
              cy={centerY}
              r={(radius * level) / 100}
              fill="none"
              stroke="rgba(75, 85, 99, 0.2)"
              strokeWidth="1"
            />
          ))}

          {/* Radial lines */}
          {metrics.map((metric, index) => {
            const angle = (index * 360) / metrics.length;
            const radian = (angle * Math.PI) / 180;
            const x = centerX + radius * Math.cos(radian);
            const y = centerY + radius * Math.sin(radian);
            
            return (
              <line
                key={index}
                x1={centerX}
                y1={centerY}
                x2={x}
                y2={y}
                stroke="rgba(75, 85, 99, 0.3)"
                strokeWidth="1"
              />
            );
          })}

          {/* Data polygon */}
          <polygon
            points={metrics.map((metric, index) => {
              const angle = (index * 360) / metrics.length;
              const radian = (angle * Math.PI) / 180;
              const valueRadius = (radius * metric.value) / 100;
              const x = centerX + valueRadius * Math.cos(radian);
              const y = centerY + valueRadius * Math.sin(radian);
              return `${x},${y}`;
            }).join(" ")}
            fill="url(#radarGradient)"
            fillOpacity="0.3"
            stroke="url(#radarGradient)"
            strokeWidth="2"
          />

          {/* Data points */}
          {metrics.map((metric, index) => {
            const angle = (index * 360) / metrics.length;
            const radian = (angle * Math.PI) / 180;
            const valueRadius = (radius * metric.value) / 100;
            const x = centerX + valueRadius * Math.cos(radian);
            const y = centerY + valueRadius * Math.sin(radian);
            
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="4"
                fill={`hsl(${index * 45}, 70%, 60%)`}
                stroke="white"
                strokeWidth="2"
              />
            );
          })}

          {/* Gradient definition */}
          <defs>
            <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="text-2xl font-bold text-white">
              {timeView === "quarterly" ? selectedQuarter : timeData.currentYear}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute -bottom-8 left-0 right-0">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {metrics.map((metric, index) => (
              <div key={index} className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: `hsl(${index * 45}, 70%, 60%)` }}
                ></div>
                <span className="text-neutral-300">{metric.name}</span>
                <span className="text-white font-medium">{Math.round(metric.value)}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-h-screen overflow-y-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Trends & Analytics</h2>
          <p className="text-sm text-neutral-400">Historical analysis and trend insights for security investments</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Calendar className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Time View Selector */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Time Period Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <span className="text-sm text-neutral-300">Analysis Period:</span>
              <div className="flex bg-neutral-800 rounded-md p-1">
                <Button
                  variant={timeView === "quarterly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeView("quarterly")}
                  className="text-xs"
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Quarterly
                </Button>
                <Button
                  variant={timeView === "yearly" ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setTimeView("yearly")}
                  className="text-xs"
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Yearly
                </Button>
              </div>
            </div>
            
            {timeView === "quarterly" && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-neutral-300">Select Quarter:</span>
                <select
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                  className="bg-neutral-800 border border-neutral-700 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {timeData.quarterlyData.map((quarter) => (
                    <option key={quarter.quarter} value={quarter.quarter}>
                      {quarter.quarter}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Current Period Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-neutral-800 rounded-lg border border-neutral-700">
              <p className="text-xs text-neutral-400 tracking-wider">
                {timeView === "quarterly" ? selectedQuarter : timeData.currentYear} ATTACKS
              </p>
              <p className="text-2xl font-bold text-white font-mono">{aggregatedData.attacks}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {aggregatedData.trend.attackChange >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-xs ${aggregatedData.trend.attackChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {Math.abs(aggregatedData.trend.attackChange).toFixed(1)}%
                </span>
                <span className="text-xs text-neutral-400">vs previous</span>
              </div>
            </div>
            <div className="text-center p-4 bg-neutral-800 rounded-lg border border-neutral-700">
              <p className="text-xs text-neutral-400 tracking-wider">
                {timeView === "quarterly" ? selectedQuarter : timeData.currentYear} COST SAVED
              </p>
              <p className="text-2xl font-bold text-green-500 font-mono">${(aggregatedData.costSaved / 1000000).toFixed(1)}M</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                {aggregatedData.trend.costChange >= 0 ? (
                  <TrendingUp className="w-4 h-4 text-green-400" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-400" />
                )}
                <span className={`text-xs ${aggregatedData.trend.costChange >= 0 ? "text-green-400" : "text-red-400"}`}>
                  {Math.abs(aggregatedData.trend.costChange).toFixed(1)}%
                </span>
                <span className="text-xs text-neutral-400">vs previous</span>
              </div>
            </div>
            <div className="text-center p-4 bg-neutral-800 rounded-lg border border-neutral-700">
              <p className="text-xs text-neutral-400 tracking-wider">TREND ANALYSIS</p>
              <p className="text-lg font-bold text-orange-400">
                {aggregatedData.trend.attackChange >= 0 ? "Increasing" : "Decreasing"}
              </p>
              <p className="text-xs text-neutral-400">
                {timeView === "quarterly" ? "Quarter-over-quarter" : "Year-over-year"} threat activity
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Visualization */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">
            {timeView === "quarterly" ? "Quarterly Trend Analysis" : "Yearly Trend Analysis"}
          </CardTitle>
          {timeView === "quarterly" && (
            <p className="text-sm text-neutral-400">
              Click on any quarter bar to select it for detailed analysis
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Trend Bars */}
            {timeView === "quarterly" ? (
              <div className="grid grid-cols-5 gap-4">
                {timeData.quarterlyData.map((quarter, index) => (
                  <div 
                    key={quarter.quarter} 
                    className="text-center cursor-pointer hover:scale-105 transition-transform duration-200"
                    onClick={() => setSelectedQuarter(quarter.quarter)}
                  >
                    <div className={`relative h-40 bg-neutral-800 rounded-t border transition-all duration-200 ${
                      quarter.quarter === selectedQuarter 
                        ? "border-orange-500 shadow-lg shadow-orange-500/20" 
                        : "border-neutral-700"
                    }`}>
                      <div 
                        className={`absolute bottom-0 w-full rounded-t transition-all duration-200 ${
                          quarter.quarter === selectedQuarter
                            ? "bg-gradient-to-t from-orange-400 to-orange-600"
                            : "bg-gradient-to-t from-orange-500 to-red-500"
                        }`}
                        style={{ height: `${(quarter.attacks / Math.max(...timeData.quarterlyData.map(q => q.attacks))) * 100}%` }}
                      ></div>
                      <div className="absolute bottom-2 left-2 right-2 text-center">
                        <div className="text-sm font-bold text-white">{quarter.attacks}</div>
                        <div className="text-xs text-green-400">${(quarter.costSaved / 1000000).toFixed(0)}M</div>
                      </div>
                      {quarter.quarter === selectedQuarter && (
                        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                          <div className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                            SELECTED
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`text-sm mt-2 font-medium transition-colors duration-200 ${
                      quarter.quarter === selectedQuarter 
                        ? "text-orange-400 font-bold" 
                        : "text-neutral-400"
                    }`}>
                      {quarter.quarter}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-6">
                {timeData.yearlyData.map((year, index) => (
                  <div key={year.year} className="text-center">
                    <div className="relative h-40 bg-neutral-800 rounded-t border border-neutral-700">
                      <div 
                        className="absolute bottom-0 w-full bg-gradient-to-t from-blue-500 to-purple-500 rounded-t"
                        style={{ height: `${(year.attacks / Math.max(...timeData.yearlyData.map(y => y.attacks))) * 100}%` }}
                      ></div>
                      <div className="absolute bottom-2 left-2 right-2 text-center">
                        <div className="text-sm font-bold text-white">{year.attacks}</div>
                        <div className="text-xs text-green-400">${(year.costSaved / 1000000).toFixed(0)}M</div>
                      </div>
                    </div>
                    <div className="text-sm text-neutral-400 mt-2 font-medium">{year.year}</div>
                  </div>
                ))}
              </div>
            )}
            

          </div>
        </CardContent>
      </Card>

      {/* Key Risk Indicators Radar Chart */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Key Risk Indicators (KRI) Radar Analysis</CardTitle>
          <p className="text-sm text-neutral-400">
            Multi-dimensional risk assessment for {timeView === "quarterly" ? selectedQuarter : timeData.currentYear}
          </p>
        </CardHeader>
        <CardContent>
          {kriData ? (
            <div className="space-y-6">
              {/* Radar Chart */}
              <div className="flex justify-center">
                <RadarChart data={kriData} />
              </div>
              
              {/* KRI Summary Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                <div className="text-center p-3 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="text-lg font-bold text-blue-400">
                    {Math.round(kriData.threatVolume)}%
                  </div>
                  <div className="text-xs text-neutral-400">Threat Volume</div>
                </div>
                <div className="text-center p-3 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="text-lg font-bold text-green-400">
                    {Math.round(kriData.costEfficiency)}%
                  </div>
                  <div className="text-xs text-neutral-400">Cost Efficiency</div>
                </div>
                <div className="text-center p-3 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="text-lg font-bold text-purple-400">
                    {Math.round(kriData.detectionAccuracy)}%
                  </div>
                  <div className="text-xs text-neutral-400">Detection Accuracy</div>
                </div>
                <div className="text-center p-3 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="text-lg font-bold text-orange-400">
                    {Math.round(kriData.riskExposure)}%
                  </div>
                  <div className="text-xs text-neutral-400">Risk Exposure</div>
                </div>
              </div>

              {/* Risk Assessment Summary */}
              <div className="bg-gradient-to-r from-blue-500/5 to-purple-500/5 border border-blue-500/20 rounded-xl p-4">
                <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Risk Assessment Summary
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      kriData.threatVolume > 70 ? "bg-red-500" : 
                      kriData.threatVolume > 40 ? "bg-yellow-500" : "bg-green-500"
                    }`}></div>
                    <div>
                      <span className="text-white font-medium">Threat Level:</span>
                      <span className={`ml-1 ${
                        kriData.threatVolume > 70 ? "text-red-400" : 
                        kriData.threatVolume > 40 ? "text-yellow-400" : "text-green-400"
                      }`}>
                        {kriData.threatVolume > 70 ? "High" : 
                         kriData.threatVolume > 40 ? "Medium" : "Low"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      kriData.riskExposure > 70 ? "bg-red-500" : 
                      kriData.riskExposure > 40 ? "bg-yellow-500" : "bg-green-500"
                    }`}></div>
                    <div>
                      <span className="text-white font-medium">Risk Exposure:</span>
                      <span className={`ml-1 ${
                        kriData.riskExposure > 70 ? "text-red-400" : 
                        kriData.riskExposure > 40 ? "text-yellow-400" : "text-green-400"
                      }`}>
                        {kriData.riskExposure > 70 ? "Critical" : 
                         kriData.riskExposure > 40 ? "Elevated" : "Controlled"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      kriData.complianceScore > 90 ? "bg-green-500" : 
                      kriData.complianceScore > 80 ? "bg-yellow-500" : "bg-red-500"
                    }`}></div>
                    <div>
                      <span className="text-white font-medium">Compliance:</span>
                      <span className={`ml-1 ${
                        kriData.complianceScore > 90 ? "text-green-400" : 
                        kriData.complianceScore > 80 ? "text-yellow-400" : "text-red-400"
                      }`}>
                        {kriData.complianceScore > 90 ? "Excellent" : 
                         kriData.complianceScore > 80 ? "Good" : "Needs Attention"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-neutral-400">
              <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No KRI data available for the selected period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Distribution Over Time */}
      <Card className="bg-neutral-900 border-neutral-700">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-lg">Category Distribution Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(timeView === "quarterly" ? 
              timeData.quarterlyData.find(q => q.quarter === selectedQuarter)?.categories || timeData.quarterlyData[timeData.quarterlyData.length - 1].categories : 
              timeData.yearlyData[timeData.yearlyData.length - 1].categories
            ).map(([category, data]) => {
              const categoryData = data as { attacks: number; falsePositives: number };
              const totalAlerts = categoryData.attacks + categoryData.falsePositives;
              const maxTotal = Math.max(...Object.values(timeView === "quarterly" ? 
                timeData.quarterlyData.find(q => q.quarter === selectedQuarter)?.categories || timeData.quarterlyData[timeData.quarterlyData.length - 1].categories : 
                timeData.yearlyData[timeData.yearlyData.length - 1].categories
              ).map(val => (val as { attacks: number; falsePositives: number }).attacks + (val as { attacks: number; falsePositives: number }).falsePositives));
              
              return (
                <div key={category} className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-white capitalize">{category}</h4>
                                         <div className="flex gap-1">
                       <Badge variant="outline" className="text-xs bg-red-500/20 text-red-400 border-red-500/30">
                         {categoryData.attacks} TP
                       </Badge>
                       <Badge variant="outline" className="text-xs bg-green-500/20 text-green-400 border-green-500/30">
                         {categoryData.falsePositives} FP
                       </Badge>
                     </div>
                  </div>
                  
                                     {/* Stacked Progress Bar */}
                   <div className="relative h-3 bg-neutral-700 rounded-full overflow-hidden mb-2">
                     {/* True Positives (Red) */}
                     <div 
                       className="absolute left-0 top-0 h-full bg-red-500 transition-all duration-300"
                       style={{ 
                         width: `${(categoryData.attacks / maxTotal) * 100}%` 
                       }}
                     ></div>
                     {/* False Positives (Green) */}
                     <div 
                       className="absolute h-full bg-green-500 transition-all duration-300"
                       style={{ 
                         left: `${(categoryData.attacks / maxTotal) * 100}%`,
                         width: `${(categoryData.falsePositives / maxTotal) * 100}%` 
                       }}
                     ></div>
                   </div>
                  
                  <div className="flex justify-between text-xs text-neutral-400">
                    <span>Total: {totalAlerts}</span>
                    <span>Accuracy: {Math.round((categoryData.attacks / totalAlerts) * 100)}%</span>
                  </div>
                  
                                     {/* Legend */}
                   <div className="flex items-center gap-3 mt-2 text-xs">
                     <div className="flex items-center gap-1">
                       <div className="w-3 h-3 bg-red-500 rounded"></div>
                       <span className="text-red-400">True Positives</span>
                     </div>
                     <div className="flex items-center gap-1">
                       <div className="w-3 h-3 bg-green-500 rounded"></div>
                       <span className="text-green-400">False Positives</span>
                     </div>
                   </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
      
      {/* Bottom Spacing */}
      <div className="h-8"></div>
    </div>
  );
} 