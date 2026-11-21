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
    identity?: any[];
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
    exposure?: number;
    controlEffectiveness?: number;
    residualLoss?: number;
    lossProbabilityWithoutControls?: number;
    lossProbabilityWithControls?: number;
    typicalLoss?: number;
    severeLoss?: number;
    revenueBand?: string;
    profileAssumed?: boolean;
    typicalControlEffectiveness?: number;
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
  identity: "Identity",
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

  // Headline: risk reduction first, then dollars. Investment, net benefit and
  // ROI follow in their own table.
  const hasRisk = m?.lossProbabilityWithControls !== undefined && m?.severeLoss !== undefined;
  const summary = m
    ? `<div class="stats">
        ${hasRisk ? stat("Chance of a material loss this year", `${m.lossProbabilityWithControls}%`, `Down from ${m.lossProbabilityWithoutControls}% without detection and response`) : ""}
        ${hasRisk ? stat("Severe event at your size", money(m.severeLoss!), m.typicalLoss !== undefined ? `Typical event ${money(m.typicalLoss)}` : "") : ""}
        ${m.controlEffectiveness !== undefined ? stat("Control effectiveness", `${m.controlEffectiveness}%`, m.exposure !== undefined ? `Of ${money(m.exposure)} exposure without controls` : "") : ""}
        ${stat("Expected loss avoided", money(m.totalCostImpact), m.lossAvoidedLow !== undefined && m.lossAvoidedHigh !== undefined ? `Plausible range ${money(m.lossAvoidedLow)} to ${money(m.lossAvoidedHigh)}` : "")}
      </div>
      <h2>Financial view</h2>
      <table>
        <tr><td>Security investment (annual spend prorated to this period)</td><td class="num">${money(m.totalInvestment)}</td></tr>
        <tr><td>Net benefit (loss avoided minus investment)</td><td class="num">${money(m.netBenefit)}</td></tr>
        <tr><td>ROI${m.roiLow !== undefined && m.roiHigh !== undefined ? ` (range ${m.roiLow.toLocaleString("en-US")}% to ${m.roiHigh.toLocaleString("en-US")}%)` : ""}</td><td class="num">${m.roi.toLocaleString("en-US")}%</td></tr>
      </table>
      <p class="method">Security spend works like insurance: it pays off in the rare severe year, so an expected-value ROI understates it.</p>`
    : "";

  const basis = m && m.confirmedIncidents !== undefined
    ? `<h2>Basis</h2>
       <table>
         <tr><td>Incidents counted</td><td class="num">${((m.confirmedIncidents || 0) + (m.unverifiedIncidents || 0)).toLocaleString("en-US")}</td></tr>
         <tr><td>Confirmed true positive by an analyst</td><td class="num">${(m.confirmedIncidents || 0).toLocaleString("en-US")}</td></tr>
         <tr><td>Counted without an analyst verdict (weighted by tool confidence)</td><td class="num">${(m.unverifiedIncidents || 0).toLocaleString("en-US")}</td></tr>
         <tr><td>Share of loss avoided resting on analyst-confirmed incidents</td><td class="num">${m.confirmedShare ?? 0}%</td></tr>
         ${m.exposure !== undefined ? `<tr><td>Exposure without detection and response (this period)</td><td class="num">${money(m.exposure)}</td></tr>` : ""}
         ${m.controlEffectiveness !== undefined ? `<tr><td>Share of that exposure your controls removed</td><td class="num">${m.controlEffectiveness}%</td></tr>` : ""}
         ${m.residualLoss !== undefined ? `<tr><td>Expected loss still carried</td><td class="num">${money(m.residualLoss)}</td></tr>` : ""}
         ${m.lossProbabilityWithoutControls !== undefined ? `<tr><td>Chance of a material loss this year: without controls / with yours</td><td class="num">${m.lossProbabilityWithoutControls}% / ${m.lossProbabilityWithControls}%</td></tr>` : ""}
         ${m.typicalLoss !== undefined && m.severeLoss !== undefined ? `<tr><td>Published loss per event at this size: typical / severe</td><td class="num">${money(m.typicalLoss)} / ${money(m.severeLoss)}</td></tr>` : ""}
         ${m.revenueBand ? `<tr><td>Anchored to organisations with revenue of</td><td class="num">${esc(m.revenueBand)}${m.profileAssumed ? " (assumed)" : ""}</td></tr>` : ""}
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
  <p class="method">The figures start from published loss data for organisations of this size (Cyentia Institute, Information Risk Insights Study): how often such organisations suffer a loss event, and how large those losses are. Because published losses are the events that got past typical controls, dividing by one minus the typical effectiveness (assumed ${m.typicalControlEffectiveness ?? 40}%) gives the exposure with no detection and response. Your own control effectiveness is then estimated from this period's resolved incidents, each weighted by how likely it was a real attack and how far it had progressed, against the loss events you actually suffered. Loss avoided is exposure times that effectiveness, so it cannot exceed the exposure. The published data covers publicly known incidents and direct losses only, so the figures err low. The range reflects uncertainty in the published frequency and in both effectiveness figures.</p>` : ""}

  <footer>Signal Foundry · Cyber Risk Quantification Platform · ${esc(period)}</footer>
</body>
</html>`;
};
