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
  /** Risk-model output for the period. The report prints money figures only from here. */
  metrics?: {
    totalCostImpact: number;
    totalInvestment: number;
    netBenefit: number;
    roi: number;
    lossAvoidedLow?: number;
    lossAvoidedHigh?: number;
    roiLow?: number;
    roiHigh?: number;
    confirmedIncidents?: number;
    unverifiedIncidents?: number;
    confirmedShare?: number;
    grossExposure?: number;
    categoryBreakdown?: { category: string; incidents: number; lossAvoided: number }[];
  };
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

const money = (n: number): string =>
  `${n < 0 ? "-" : ""}$${Math.round(Math.abs(n)).toLocaleString("en-US")}`;

const CATEGORY_NAMES: Record<string, string> = {
  edr: "Endpoint (EDR)",
  email: "Email",
  network: "Network",
  web: "Web",
  cloud: "Cloud",
};

const esc = (v: unknown): string =>
  String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));

// Every figure in the report comes from the risk model or a count of the
// period's alerts. Nothing here is a fixed or illustrative number.
const generateBeautifulPDFContent = (data: TrendsAnalyticsData): string => {
  const generated = new Date().toLocaleDateString();
  const period = data.timeView === "yearly" ? `Year ${data.selectedQuarter.split(" ")[1] || ""}` : data.selectedQuarter;
  const m = data.metrics;

  const categories = (Object.keys(CATEGORY_NAMES) as (keyof TrendsAnalyticsData["timeframeAlerts"])[]).map((key) => {
    const alerts = data.timeframeAlerts[key] || [];
    const count = (sev: string) => alerts.filter((a: any) => a.severity === sev).length;
    return {
      key,
      name: CATEGORY_NAMES[key],
      total: alerts.length,
      critical: count("Critical"),
      high: count("High"),
      medium: count("Medium"),
      low: count("Low"),
      lossAvoided: m?.categoryBreakdown?.find((c) => c.category === key)?.lossAvoided,
    };
  });
  const totalAlerts = categories.reduce((sum, c) => sum + c.total, 0);

  const stat = (label: string, value: string, note = "") => `
    <div class="stat"><div class="label">${esc(label)}</div><div class="value">${esc(value)}</div><div class="note">${esc(note)}</div></div>`;

  const summary = m
    ? `<div class="stats">
        ${stat("Expected loss avoided", money(m.totalCostImpact), m.lossAvoidedLow !== undefined && m.lossAvoidedHigh !== undefined ? `Likely range ${money(m.lossAvoidedLow)} to ${money(m.lossAvoidedHigh)}` : "")}
        ${stat("Security investment", money(m.totalInvestment), "Annual spend prorated to this period")}
        ${stat("Net benefit", money(m.netBenefit), "Loss avoided minus investment")}
        ${stat("ROI", `${m.roi.toLocaleString("en-US")}%`, m.roiLow !== undefined && m.roiHigh !== undefined ? `Range ${m.roiLow.toLocaleString("en-US")}% to ${m.roiHigh.toLocaleString("en-US")}%` : "")}
      </div>`
    : "";

  const basis = m && m.confirmedIncidents !== undefined
    ? `<h2>Basis</h2>
       <table>
         <tr><td>Incidents counted</td><td class="num">${((m.confirmedIncidents || 0) + (m.unverifiedIncidents || 0)).toLocaleString("en-US")}</td></tr>
         <tr><td>Confirmed true positive by an analyst</td><td class="num">${(m.confirmedIncidents || 0).toLocaleString("en-US")}</td></tr>
         <tr><td>Counted without an analyst verdict (weighted by tool confidence)</td><td class="num">${(m.unverifiedIncidents || 0).toLocaleString("en-US")}</td></tr>
         <tr><td>Share of loss avoided resting on analyst-confirmed incidents</td><td class="num">${m.confirmedShare ?? 0}%</td></tr>
         ${m.grossExposure !== undefined ? `<tr><td>Gross exposure (if every counted incident had escalated)</td><td class="num">${money(m.grossExposure)}</td></tr>` : ""}
       </table>`
    : "";

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>SignalFoundry - Executive Security Report - ${esc(period)}</title>
  <style>
    @page { margin: 18mm 16mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; font-size: 12px; line-height: 1.45; color: #171717; margin: 0; }
    header { display: flex; justify-content: space-between; align-items: baseline; border-bottom: 1px solid #e5e5e5; padding-bottom: 10px; margin-bottom: 16px; }
    header .brand { font-size: 13px; font-weight: 600; }
    header .meta { font-size: 11px; color: #737373; }
    h1 { font-size: 20px; font-weight: 600; margin: 0 0 2px; }
    .period { color: #737373; margin-bottom: 16px; }
    h2 { font-size: 13px; font-weight: 600; margin: 20px 0 6px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid #e5e5e5; border-radius: 6px; overflow: hidden; }
    .stat { padding: 10px 12px; border-right: 1px solid #e5e5e5; }
    .stat:last-child { border-right: 0; }
    .label { font-size: 11px; color: #737373; }
    .value { font-size: 18px; font-weight: 600; font-variant-numeric: tabular-nums; margin-top: 2px; }
    .note { font-size: 10.5px; color: #a3a3a3; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; border: 1px solid #e5e5e5; }
    th { text-align: left; font-weight: 400; font-size: 11px; color: #737373; background: #fafafa; padding: 6px 10px; border-bottom: 1px solid #e5e5e5; }
    td { padding: 6px 10px; border-bottom: 1px solid #f5f5f5; }
    tr:last-child td { border-bottom: 0; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .method { color: #525252; font-size: 11px; margin-top: 6px; }
    footer { margin-top: 24px; padding-top: 8px; border-top: 1px solid #e5e5e5; font-size: 10.5px; color: #a3a3a3; }
  </style>
</head>
<body>
  <header>
    <div class="brand">Signal Foundry</div>
    <div class="meta">Generated ${esc(generated)}</div>
  </header>

  <h1>Executive Security Report</h1>
  <div class="period">${esc(period)} · ${totalAlerts.toLocaleString("en-US")} alerts from resolved incidents</div>

  ${summary}
  ${basis}

  <h2>Alerts by category</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th><th class="num">Alerts</th><th class="num">Critical</th><th class="num">High</th><th class="num">Medium</th><th class="num">Low</th>${m ? '<th class="num">Loss avoided</th>' : ""}
      </tr>
    </thead>
    <tbody>
      ${categories.map((c) => `
      <tr>
        <td>${esc(c.name)}</td>
        <td class="num">${c.total.toLocaleString("en-US")}</td>
        <td class="num">${c.critical}</td><td class="num">${c.high}</td><td class="num">${c.medium}</td><td class="num">${c.low}</td>
        ${m ? `<td class="num">${c.lossAvoided !== undefined ? money(c.lossAvoided) : "—"}</td>` : ""}
      </tr>`).join("")}
    </tbody>
  </table>

  ${m ? `<h2>How the figures are calculated</h2>
  <p class="method">Each incident's loss avoided is the chance it was a real attack, times the chance it would have escalated had it not been contained (set by the furthest MITRE ATT&amp;CK stage observed), times an industry benchmark loss for its category and severity. Incidents an analyst classified as false or benign positives are excluded. The range is the 5th to 95th percentile of a 5,000-trial simulation. Escalation probabilities are model assumptions and should be calibrated to your organisation.</p>` : ""}

  <footer>Signal Foundry · Cyber Risk Quantification Platform · ${esc(period)}</footer>
</body>
</html>`;
};
