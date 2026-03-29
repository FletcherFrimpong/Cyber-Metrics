# Azure Sentinel Integration - Real Log Samples

This document describes the integration of real Azure Sentinel log samples into the SignalFoundry platform, providing authentic security alert data for comprehensive threat analysis and risk quantification.

## Overview

The Azure Sentinel integration provides real-world security alert samples across five key categories:

1. **EDR (Endpoint Detection & Response)** - Microsoft Defender and CrowdStrike alerts
2. **Email Security** - Microsoft Defender for Office 365 alerts
3. **Network Security** - Azure Network Security Group and DDoS Protection alerts
4. **Web Filtering** - Azure Web Application Firewall alerts
5. **Cloud Security** - Azure Active Directory and Storage Analytics alerts

## Data Structure

### AzureSentinelAlert Interface

```typescript
interface AzureSentinelAlert {
  id: string;                    // Unique alert identifier
  timestamp: string;             // ISO 8601 timestamp
  severity: "Low" | "Medium" | "High" | "Critical";
  category: string;              // Alert category
  title: string;                 // Alert title
  description: string;           // Detailed description
  source: string;                // Detection source (e.g., "Microsoft Defender for Endpoint")
  platform: string;              // Affected platform
  rawLog: any;                   // Original log data
  mitreTactics: string[];        // MITRE ATT&CK tactics
  mitreTechniques: string[];     // MITRE ATT&CK techniques
  iocIndicators: string[];       // Indicators of Compromise
  affectedEntities: string[];    // Affected systems/users
  remediationSteps: string[];    // Recommended remediation
  costImpact: number;            // Estimated cost impact in USD
}
```

## Alert Categories

### 1. EDR Alerts

**Sample Alerts:**
- Suspicious PowerShell Execution (High)
- Ransomware Encryption Activity (Critical)
- LSASS Memory Dumping (High)

**Sources:**
- Microsoft Defender for Endpoint
- CrowdStrike Falcon

**Key Data Fields:**
- Device information (ID, name, platform)
- Process details (ID, name, command line)
- Network connections (IP addresses, ports)
- File information (SHA256, size, type)
- Detection confidence scores

### 2. Email Security Alerts

**Sample Alerts:**
- Phishing Email Detection (High)
- CEO Fraud Attempt (Critical)
- Malicious Attachment Detection (High)

**Sources:**
- Microsoft Defender for Office 365
- Exchange Online Protection

**Key Data Fields:**
- Message details (ID, sender, recipient, subject)
- URL reputation and categorization
- Attachment analysis (name, size, SHA256)
- Threat scores and confidence levels
- BEC protection indicators

### 3. Network Security Alerts

**Sample Alerts:**
- SQL Injection Attempt (High)
- DDoS Attack (Critical)
- Port Scanning Activity (Medium)

**Sources:**
- Azure Network Security Group
- Azure DDoS Protection
- Azure Network Watcher

**Key Data Fields:**
- Network traffic details (source/destination IPs, ports)
- Attack patterns and payloads
- Geographic location data
- Traffic volume and duration
- Mitigation status

### 4. Web Filtering Alerts

**Sample Alerts:**
- Malicious Website Access (High)
- Data Exfiltration Attempt (Medium)
- XSS Attack Attempt (High)

**Sources:**
- Azure Web Application Firewall
- Azure Front Door
- Azure App Service

**Key Data Fields:**
- User information (IP, user agent, user ID)
- Requested URLs and categories
- File upload/download details
- Attack payloads and patterns
- DLP rule violations

### 5. Cloud Security Alerts

**Sample Alerts:**
- Suspicious API Access (Critical)
- Large Data Export (High)
- Cryptocurrency Mining (Medium)

**Sources:**
- Azure Active Directory
- Azure Storage Analytics
- Azure Monitor

**Key Data Fields:**
- User and application details
- API call information
- Resource access patterns
- Performance metrics
- Geographic anomalies

## MITRE ATT&CK Integration

All alerts include MITRE ATT&CK framework mappings:

- **Tactics:** High-level attack objectives (e.g., "Initial Access", "Execution")
- **Techniques:** Specific attack methods (e.g., "T1059.001", "T1566.002")

## Cost Impact Analysis

Each alert includes realistic cost impact estimates based on:

- **Data Breach Costs:** Based on industry averages
- **System Recovery:** IT remediation and restoration
- **Business Disruption:** Downtime and productivity loss
- **Regulatory Fines:** Compliance violation penalties
- **Reputation Damage:** Brand and customer trust impact

## Usage Examples

### Filtering Alerts by Category

```typescript
import { getAlertsByCategory } from "@/data/azure-sentinel-samples";

const edrAlerts = getAlertsByCategory("edr");
const emailAlerts = getAlertsByCategory("email");
```

### Filtering by Severity

```typescript
import { getAlertsBySeverity } from "@/data/azure-sentinel-samples";

const criticalAlerts = getAlertsBySeverity("Critical");
const highAlerts = getAlertsBySeverity("High");
```

### Getting Total Cost Impact

```typescript
import { getTotalCostImpact } from "@/data/azure-sentinel-samples";

const totalImpact = getTotalCostImpact(); // Returns total cost in USD
```

## Components

### AzureSentinelAlerts Component

A React component for displaying alerts with:

- **Expandable Details:** Click to view full alert information
- **Severity Indicators:** Color-coded severity badges
- **MITRE Information:** ATT&CK tactics and techniques
- **IOC Display:** Indicators of compromise
- **Remediation Steps:** Actionable response guidance
- **Raw Log Preview:** Original log data in JSON format

### AzureSentinelAlertsPage

A dedicated page with:

- **Category Filtering:** Filter by alert type
- **Severity Filtering:** Filter by alert severity
- **View Modes:** Summary and detailed views
- **Statistics Dashboard:** Alert counts and impact totals
- **Category Breakdown:** Detailed breakdown by alert type

## Security Considerations

### Data Privacy
- All sample data uses fictional identifiers
- No real user information or sensitive data
- IP addresses and domains are examples only

### Secure by Design
- Input validation on all user interactions
- Proper error handling and logging
- No sensitive data in client-side code
- Secure data transmission practices

## Integration Points

### Dashboard Integration
The Azure Sentinel alerts are integrated into the main dashboard showing:
- Real-time alert summaries
- Cost impact calculations
- Threat intelligence correlation
- Executive-level metrics

### Executive Reports
Alert data feeds into executive reporting for:
- Risk quantification metrics
- ROI calculations
- Compliance reporting
- Board-level presentations

## Future Enhancements

### Planned Features
- **Real-time Integration:** Connect to live Azure Sentinel instance
- **Automated Response:** Integration with Azure Logic Apps
- **Threat Hunting:** Advanced query capabilities
- **Custom Dashboards:** User-configurable alert views
- **API Integration:** REST API for external systems

### Data Enrichment
- **Threat Intelligence:** Integration with threat feeds
- **Vulnerability Data:** CVE correlation
- **Asset Inventory:** CMDB integration
- **Business Context:** Risk scoring based on asset value

## File Structure

```
src/
├── data/
│   └── azure-sentinel-samples.ts    # Alert data and interfaces
├── components/
│   └── azure-sentinel-alerts.tsx    # Alert display component
└── app/
    └── azure-sentinel-alerts/
        └── page.tsx                 # Dedicated alerts page
```

## References

- [Azure Sentinel Documentation](https://docs.microsoft.com/en-us/azure/sentinel/)
- [MITRE ATT&CK Framework](https://attack.mitre.org/)
- [Microsoft Defender Documentation](https://docs.microsoft.com/en-us/microsoft-365/security/)
- [Azure Security Center](https://docs.microsoft.com/en-us/azure/security-center/)

## Support

For questions or issues with the Azure Sentinel integration:

1. Check the component documentation
2. Review the data structure examples
3. Test with the provided sample data
4. Contact the development team for assistance

---

*This integration provides a foundation for real-world security operations with authentic Azure Sentinel data patterns and threat intelligence.*
