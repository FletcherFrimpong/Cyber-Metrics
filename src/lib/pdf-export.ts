// PDF Export Utility for Trends Analytics Dashboard
export interface TrendsAnalyticsData {
  timeView: "quarterly" | "yearly";
  selectedQuarter: string;
  timeframeAlerts: {
    edr: any[];
    email: any[];
    network: any[];
    web: any[];
    cloud: any[];
  };
  roiValue: number;
  quarterlyData: any[];
  yearlyData: any[];
  kriMetrics: {
    threatVolume: number;
    costEfficiency: number;
    roi: number;
    detectionAccuracy: number;
    responseTime: number;
    coverageGap: number;
  };
}

export const generateTrendsAnalyticsPDF = async (data: TrendsAnalyticsData): Promise<void> => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    throw new Error('PDF export is only available in browser environment');
  }

  try {
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes,location=no,menubar=no,toolbar=no');
    if (!printWindow) {
      throw new Error('Failed to open print window. Please allow pop-ups for this site.');
    }

    // Generate the beautiful content for the PDF
    const content = generateBeautifulPDFContent(data);
    
    // Write content to the new window
    printWindow.document.write(content);
    printWindow.document.close();
    
    // Wait for content to load
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check if the window is still open
    if (printWindow.closed) {
      throw new Error('Print window was closed before PDF generation');
    }
    
    // Print to PDF (this will show the print dialog)
    printWindow.print();
    
    // Close the window after printing
    setTimeout(() => {
      if (!printWindow.closed) {
        printWindow.close();
      }
    }, 1000);
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
};

const generateBeautifulPDFContent = (data: TrendsAnalyticsData): string => {
  const currentDate = new Date().toLocaleDateString();
  const totalAlerts = data.timeframeAlerts.edr.length + data.timeframeAlerts.email.length + 
                     data.timeframeAlerts.network.length + data.timeframeAlerts.web.length + 
                     data.timeframeAlerts.cloud.length;
  const criticalAlerts = data.timeframeAlerts.edr.filter((a: any) => a.severity === "Critical").length +
                        data.timeframeAlerts.email.filter((a: any) => a.severity === "Critical").length +
                        data.timeframeAlerts.network.filter((a: any) => a.severity === "Critical").length +
                        data.timeframeAlerts.web.filter((a: any) => a.severity === "Critical").length +
                        data.timeframeAlerts.cloud.filter((a: any) => a.severity === "Critical").length;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>SignalFoundry - Executive Security Report</title>
      <style>
        @media print {
          @page {
            margin: 0.3in;
            size: A4;
          }
          
          body { 
            margin: 0; 
            padding: 0; 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
            font-size: 10px;
            line-height: 1.3;
            color: #2c3e50;
            background: white;
          }
          
          .header { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 20px;
            text-align: center;
            margin-bottom: 15px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          
          .header h1 {
            font-size: 20px;
            font-weight: 300;
            margin: 0 0 5px 0;
            letter-spacing: 1px;
          }
          
          .header .subtitle {
            font-size: 12px;
            opacity: 0.9;
            margin: 0;
          }
          
          .header .date {
            font-size: 10px;
            opacity: 0.8;
            margin-top: 5px;
          }
          
          .main-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .section { 
            background: white;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 1px 5px rgba(0,0,0,0.05);
            border: 1px solid #e9ecef;
          }
          
          .section-title { 
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            color: white;
            font-size: 12px; 
            font-weight: 600; 
            margin: 0;
            padding: 8px 12px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .section-content {
            padding: 12px;
          }
          
          .metric-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
            margin-bottom: 10px;
          }
          
          .metric-card {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px;
            border-radius: 6px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          .metric-card.positive {
            background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%);
          }
          
          .metric-card.warning {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }
          
          .metric-card.info {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }
          
          .metric-value {
            font-size: 18px;
            font-weight: 700;
            margin-bottom: 2px;
            text-shadow: 0 1px 2px rgba(0,0,0,0.2);
          }
          
          .metric-label {
            font-size: 9px;
            font-weight: 500;
            opacity: 0.9;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          
          .table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 10px; 
            font-size: 8px;
            background: white;
            border-radius: 4px;
            overflow: hidden;
          }
          
          .table th, .table td { 
            padding: 6px 8px; 
            text-align: left; 
            border-bottom: 1px solid #e9ecef;
          }
          
          .table th { 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-weight: 600; 
            text-transform: uppercase;
            letter-spacing: 0.3px;
            font-size: 7px;
          }
          
          .table tr:nth-child(even) {
            background-color: #f8f9fa;
          }
          
          .status-badge {
            padding: 2px 4px;
            border-radius: 8px;
            font-size: 7px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          
          .status-excellent {
            background: #d4edda;
            color: #155724;
          }
          
          .status-good {
            background: #d1ecf1;
            color: #0c5460;
          }
          
          .status-warning {
            background: #fff3cd;
            color: #856404;
          }
          
          .status-danger {
            background: #f8d7da;
            color: #721c24;
          }
          
          .footer { 
            margin-top: 15px; 
            text-align: center; 
            font-size: 8px; 
            color: #6c757d;
            padding: 10px;
            border-top: 1px solid #e9ecef;
          }
          
          .highlight-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 10px;
            border-radius: 6px;
            margin: 10px 0;
            text-align: center;
          }
          
          .highlight-box h3 {
            margin: 0 0 5px 0;
            font-size: 11px;
            font-weight: 600;
          }
          
          .highlight-box p {
            margin: 0;
            opacity: 0.9;
            font-size: 9px;
          }
          
          .compact-metrics {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 6px;
            margin-bottom: 10px;
          }
          
          .compact-metric {
            background: #f8f9fa;
            padding: 6px;
            border-radius: 4px;
            text-align: center;
            border: 1px solid #e9ecef;
          }
          
          .compact-metric .value {
            font-size: 14px;
            font-weight: 700;
            color: #2c3e50;
          }
          
          .compact-metric .label {
            font-size: 7px;
            color: #6c757d;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>SIGNALFOUNDRY</h1>
        <p class="subtitle">Executive Security Report</p>
        <p class="date">${data.timeView === "quarterly" ? data.selectedQuarter : "Yearly Analysis"} • ${currentDate}</p>
      </div>

      <div class="main-grid">
        <!-- Left Column -->
        <div class="section">
          <h2 class="section-title">Key Metrics</h2>
          <div class="section-content">
            <div class="metric-grid">
              <div class="metric-card positive">
                <div class="metric-value">${data.roiValue}%</div>
                <div class="metric-label">ROI</div>
              </div>
              <div class="metric-card info">
                <div class="metric-value">${totalAlerts}</div>
                <div class="metric-label">Alerts</div>
              </div>
              <div class="metric-card warning">
                <div class="metric-value">${criticalAlerts}</div>
                <div class="metric-label">Critical</div>
              </div>
              <div class="metric-card info">
                <div class="metric-value">${data.timeframeAlerts.edr.length}</div>
                <div class="metric-label">EDR</div>
              </div>
            </div>
            
            <div class="highlight-box">
              <h3>Key Insight</h3>
              <p>${data.roiValue}% ROI • ${totalAlerts} threats blocked • ${criticalAlerts} critical alerts</p>
            </div>
          </div>
        </div>

        <!-- Right Column -->
        <div class="section">
          <h2 class="section-title">Risk Indicators</h2>
          <div class="section-content">
            <div class="compact-metrics">
              <div class="compact-metric">
                <div class="value">${data.kriMetrics.threatVolume}%</div>
                <div class="label">Threat Volume</div>
              </div>
              <div class="compact-metric">
                <div class="value">${data.kriMetrics.costEfficiency}%</div>
                <div class="label">Cost Efficiency</div>
              </div>
              <div class="compact-metric">
                <div class="value">${data.kriMetrics.detectionAccuracy}%</div>
                <div class="label">Detection</div>
              </div>
              <div class="compact-metric">
                <div class="value">${data.kriMetrics.responseTime}%</div>
                <div class="label">Response</div>
              </div>
            </div>
            
            <table class="table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Threat Volume</td>
                  <td><span class="status-badge ${data.kriMetrics.threatVolume < 50 ? 'status-excellent' : data.kriMetrics.threatVolume < 80 ? 'status-warning' : 'status-danger'}">${data.kriMetrics.threatVolume < 50 ? 'Low' : data.kriMetrics.threatVolume < 80 ? 'Medium' : 'High'}</span></td>
                </tr>
                <tr>
                  <td>Cost Efficiency</td>
                  <td><span class="status-badge ${data.kriMetrics.costEfficiency > 80 ? 'status-excellent' : data.kriMetrics.costEfficiency > 60 ? 'status-good' : 'status-warning'}">${data.kriMetrics.costEfficiency > 80 ? 'Excellent' : data.kriMetrics.costEfficiency > 60 ? 'Good' : 'Review'}</span></td>
                </tr>
                <tr>
                  <td>ROI</td>
                  <td><span class="status-badge ${data.kriMetrics.roi > 0 ? 'status-excellent' : 'status-danger'}">${data.kriMetrics.roi > 0 ? 'Positive' : 'Negative'}</span></td>
                </tr>
                <tr>
                  <td>Coverage Gap</td>
                  <td><span class="status-badge ${data.kriMetrics.coverageGap < 20 ? 'status-excellent' : 'status-warning'}">${data.kriMetrics.coverageGap < 20 ? 'Low' : 'High'}</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Bottom Section -->
      <div class="section">
        <h2 class="section-title">Security Alert Summary</h2>
        <div class="section-content">
          ${(() => {
            const categories = [
              { name: 'EDR', data: data.timeframeAlerts.edr },
              { name: 'Email', data: data.timeframeAlerts.email },
              { name: 'Network', data: data.timeframeAlerts.network },
              { name: 'Web', data: data.timeframeAlerts.web },
              { name: 'Cloud', data: data.timeframeAlerts.cloud }
            ];
            
            const categoriesWithData = categories.filter(category => category.data.length > 0);
            
            if (categoriesWithData.length === 0) {
              return '<p style="text-align: center; font-style: italic; color: #6c757d; font-size: 9px;">No security alerts detected - secure environment</p>';
            }
            
            return `
              <table class="table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Total</th>
                    <th>Critical</th>
                    <th>High</th>
                    <th>Medium</th>
                    <th>Low</th>
                  </tr>
                </thead>
                <tbody>
                  ${categoriesWithData.map(category => {
                    const critical = category.data.filter((a: any) => a.severity === "Critical").length;
                    const high = category.data.filter((a: any) => a.severity === "High").length;
                    const medium = category.data.filter((a: any) => a.severity === "Medium").length;
                    const low = category.data.filter((a: any) => a.severity === "Low").length;
                    
                    return `
                      <tr>
                        <td><strong>${category.name}</strong></td>
                        <td>${category.data.length}</td>
                        <td>${critical > 0 ? `<span class="status-badge status-danger">${critical}</span>` : '0'}</td>
                        <td>${high > 0 ? `<span class="status-badge status-warning">${high}</span>` : '0'}</td>
                        <td>${medium > 0 ? `<span class="status-badge status-good">${medium}</span>` : '0'}</td>
                        <td>${low > 0 ? `<span class="status-badge status-excellent">${low}</span>` : '0'}</td>
                      </tr>
                    `;
                  }).join('')}
                </tbody>
              </table>
            `;
          })()}
        </div>
      </div>

      <div class="footer">
        <p><strong>SignalFoundry - Cybersecurity Analytics Platform</strong> • Generated ${currentDate}</p>
      </div>
    </body>
    </html>
  `;
};
