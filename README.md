# SignalFoundry - Cyber Risk Quantification Platform

SignalFoundry connects to your Microsoft Sentinel SIEM and quantifies the financial impact of your security operations. It pulls resolved incidents, identifies true positives using MITRE ATT&CK validation, and calculates the actual cyber risk your security tools are preventing.

## How It Works

```
Your Security Tools (Defender, SentinelOne, CrowdStrike, Abnormal, etc.)
        |
        v
Microsoft Sentinel (your SIEM - aggregates everything)
        |
        v
SignalFoundry (pulls resolved incidents via Graph Security API)
        |
        v
True Positive Filter (MITRE ATT&CK validation + confidence scoring)
        |
        v
Risk Quantification (actual cost impact from validated threats)
        |
        v
Dashboard (ROI, net benefit, category breakdown, trends)
```

## Alert Categories

SignalFoundry maps alerts from 80+ security products into 5 categories:

| Category | Example Products |
|----------|-----------------|
| **EDR** | Defender for Endpoint, SentinelOne, CrowdStrike, Carbon Black, Cortex XDR |
| **Email** | Defender for Office 365, Abnormal Security, Proofpoint, Mimecast |
| **Network** | Azure Firewall, Palo Alto, Fortinet, Cisco, Darktrace |
| **Web** | Azure WAF, Cloudflare, Akamai, Imperva, F5 |
| **Cloud** | Defender for Cloud, AWS GuardDuty, Prisma Cloud, Wiz, Orca |

## Quick Start

### 1. Install and run

```bash
cd signal-foundry
npm install
npm run dev
```

Open http://localhost:3000

### 2. Configure (Settings page)

1. Enter your **Security Investment** amount (annual EDR/SOC/tooling spend)
2. Connect **Microsoft Sentinel**:
   - Create an Azure AD App Registration
   - Add API permissions: `SecurityIncident.Read.All`, `SecurityAlert.Read.All`, `User.Read.All`, `Device.Read.All`
   - Grant admin consent
   - Enter Tenant ID, Client ID, Client Secret in Settings
   - Click "Test Connection" to verify
   - Click "Save Settings" to start ingesting

### 3. Data starts flowing

SignalFoundry polls Sentinel every 15 minutes for resolved incidents. Each incident's alerts are:
- Categorized by product name (EDR, Email, Network, Web, Cloud)
- Validated against MITRE ATT&CK techniques (36 techniques, risk scoring)
- Filtered for true positives (confidence >= 85% or Critical/High severity + valid MITRE)
- Cost impact summed from validated alerts

## Architecture

```
src/
├── app/
│   ├── page.tsx                    # Main dashboard with sidebar navigation
│   ├── dashboard/                  # Executive summary + business units
│   ├── executive-reports/          # Detailed security tool metrics
│   ├── azure-sentinel-alerts/      # Alert browser with filtering
│   └── api/
│       ├── settings/               # GET/POST platform settings
│       ├── sentinel/
│       │   ├── webhook/            # POST - receive pushed incidents from Logic Apps
│       │   ├── status/             # GET - connection health + alert counts
│       │   ├── sync/               # POST - trigger manual pull
│       │   └── test/               # POST - test connection credentials
│       └── edr-alerts/             # Legacy alert endpoint
├── components/
│   ├── trends-analytics.tsx        # Main analytics dashboard
│   ├── settings-page.tsx           # Investment + Sentinel configuration
│   ├── azure-sentinel-alerts.tsx   # Alert list component
│   └── dashboard/
│       ├── financial-metrics.tsx   # Cost savings, ROI, net benefit
│       └── business-units.tsx      # Top affected business units
├── lib/
│   ├── sentinel-client.ts         # Graph Security API client (OAuth2)
│   ├── sentinel-poller.ts         # Polling service (15min interval)
│   ├── sentinel-category-mapper.ts # Product name → category mapping
│   ├── sentinel-config.ts         # Sentinel credential config
│   ├── edr-data-service.ts        # Single source of truth for all alert data
│   ├── cost-calculations.ts       # True positive filter + risk quantification
│   ├── cost-benchmarks.ts         # Industry benchmark cost matrix (IBM, FBI, Ponemon)
│   ├── department-resolver.ts     # Azure AD user/device → department lookup with caching
│   └── settings-store.ts          # Platform settings (investment, credentials)
└── types/
    └── alerts.ts                  # SecurityAlert type definition
```

## Key Calculations

**True Positive Identification:**
```
isValid = (confidence >= 85% OR severity in [Critical, High])
          AND (has valid MITRE ATT&CK technique with risk score >= 0.7)
```

**Cost Per Incident (Industry Benchmarks):**

Each alert's `costImpact` is derived from its category + severity using published research:

| | Critical | High | Medium | Low | Source |
|---|---|---|---|---|---|
| **EDR** | $750K | $200K | $45K | $8K | IBM 2024: ransomware $5.13M, containment ≈ 15% |
| **Email** | $125K | $65K | $12K | $2K | FBI IC3 2024: median BEC loss $125K |
| **Network** | $500K | $175K | $30K | $5K | IBM 2024: C2 containment before staging |
| **Web** | $350K | $100K | $15K | $2.5K | IBM 2024: web app attack response costs |
| **Cloud** | $650K | $225K | $50K | $10K | IBM 2024: cloud breaches 12% premium |

Sources: IBM Cost of a Data Breach 2024, FBI IC3 2024, Ponemon Institute 2023, Verizon DBIR 2024, SANS Institute.

**Risk Quantification:**
```
costImpact = lookup(alert.category, alert.severity)  -- from benchmark matrix
totalCostImpact = SUM(truePositive.costImpact)        -- only validated alerts
totalCostSavings = totalCostImpact - investmentAmount  -- your configured spend
ROI = (totalCostSavings / investmentAmount) * 100
```

Every number is traceable: benchmark cites its source, category comes from the product name, severity comes from the alert.

**Department Resolution (Top Affected Units):**

Departments are resolved automatically from your Azure AD — no manual mapping needed:

```
Alert evidence → userPrincipalName → GET /users/{upn}?$select=department → "Finance"
Alert evidence → deviceName → GET /devices → registeredOwners → user department → "IT"
No user/device → "Unattributed"
```

The resolver caches user→department mappings for 24 hours (departments rarely change). Batch lookups are used during polling to minimize API calls. Requires `User.Read.All` and `Device.Read.All` permissions.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/settings` | Get platform settings (secrets masked) |
| POST | `/api/settings` | Save investment amount + Sentinel credentials |
| POST | `/api/sentinel/test` | Test Sentinel connection with credentials |
| GET | `/api/sentinel/status` | Connection health, alert counts per category |
| POST | `/api/sentinel/sync` | Trigger manual sync from Sentinel |
| POST | `/api/sentinel/webhook` | Receive pushed incidents (for Logic Apps) |

## Sentinel Webhook Setup (Optional)

For real-time ingestion (instead of waiting for the 15-min poll):

1. In Sentinel, create an Automation Rule triggered on incident status change to "Resolved"
2. Set action to call a Logic App
3. In the Logic App, POST the incident payload to `https://your-domain/api/sentinel/webhook`
4. Set the `x-sentinel-signature` header with HMAC-SHA256 of the body using your webhook secret

## Tech Stack

- Next.js 15, React 19, TypeScript, Tailwind CSS
- Radix UI / Shadcn components
- Microsoft Graph Security API (OAuth2 client_credentials)
- No external database required (in-memory store, PostgreSQL ready via `pg` dependency)

## Environment Variables

```bash
# Required for Sentinel connection
SENTINEL_TENANT_ID=your-azure-ad-tenant-id
SENTINEL_CLIENT_ID=your-app-registration-client-id
SENTINEL_CLIENT_SECRET=your-client-secret

# Optional
SENTINEL_WORKSPACE_ID=your-log-analytics-workspace-id
SENTINEL_POLLING_INTERVAL=900000
SENTINEL_WEBHOOK_SECRET=your-hmac-secret
```

Or configure everything via the Settings page in the UI.

## License

MIT
