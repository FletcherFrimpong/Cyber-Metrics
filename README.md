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

### 2. Log in

On first launch, a default admin account is created automatically:

| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `SignalFoundry2024!` |

**Change the default password immediately** via Settings > User Management.

For production, set the `AUTH_SECRET` environment variable:
```bash
# Generate a secure secret
openssl rand -base64 32
# Add to .env
AUTH_SECRET=your-generated-secret
```

### 3. Configure (Settings page)

1. Enter your **Security Investment** amount (annual EDR/SOC/tooling spend)
2. Connect **Microsoft Sentinel**:
   - Create an Azure AD App Registration
   - Add API permissions: `SecurityIncident.Read.All`, `SecurityAlert.Read.All`, `User.Read.All`, `Device.Read.All`
   - Grant admin consent
   - Enter Tenant ID, Client ID, Client Secret in Settings
   - Click "Test Connection" to verify
   - Click "Save Settings" to start ingesting

### 4. Data starts flowing

SignalFoundry polls Sentinel every 15 minutes for resolved incidents. Each incident's alerts are:
- Categorized by product name (EDR, Email, Network, Web, Cloud)
- Validated against MITRE ATT&CK techniques (36 techniques, risk scoring)
- Filtered for true positives (confidence >= 85% or Critical/High severity + valid MITRE)
- Cost impact summed from validated alerts

## Architecture

### System Architecture

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SYSTEMS                                 │
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────────┐  │
│  │ Security Tools   │    │ Microsoft       │    │ Azure Active        │  │
│  │ (Defender, EDR,  │───▸│ Sentinel        │    │ Directory           │  │
│  │  Email, Network) │    │ (SIEM)          │    │ (User/Department)   │  │
│  └─────────────────┘    └────────┬────────┘    └──────────┬──────────┘  │
│                                  │                         │             │
└──────────────────────────────────┼─────────────────────────┼─────────────┘
                                   │                         │
                    ┌──────────────┼─────────────────────────┼──────────┐
                    │   SIGNALFOUNDRY SERVER                  │          │
                    │              │                          │          │
                    │   ┌──────────▼────────┐    ┌───────────▼───────┐  │
                    │   │ SentinelClient    │    │ DepartmentResolver│  │
                    │   │ (OAuth2 + Graph   │    │ (Azure AD lookup  │  │
                    │   │  Security API)    │    │  + 24h cache)     │  │
                    │   └──────────┬────────┘    └───────────────────┘  │
                    │              │                                     │
                    │   ┌──────────▼────────┐                           │
                    │   │ SentinelPoller    │ ◀── 15-min polling loop   │
                    │   │ (high-water mark, │     + on-demand sync      │
                    │   │  batch alerts)    │     + webhook receiver    │
                    │   └──────────┬────────┘                           │
                    │              │                                     │
                    │   ┌──────────▼────────────────────────────────┐   │
                    │   │ EDRDataService (Singleton)                │   │
                    │   │                                           │   │
                    │   │  ┌─────────────────────────────────────┐  │   │
                    │   │  │ In-Memory Alert Store               │  │   │
                    │   │  │ EDR | Email | Network | Web | Cloud │  │   │
                    │   │  └─────────────────────────────────────┘  │   │
                    │   │                                           │   │
                    │   │  • Sample data fallback (auto-replaced   │   │
                    │   │    when Sentinel connects)                │   │
                    │   │  • Deduplication by alert ID              │   │
                    │   │  • Timeframe filtering (quarterly)       │   │
                    │   │  • 5-min query cache                     │   │
                    │   └──────────┬────────────────────────────────┘   │
                    │              │                                     │
                    │   ┌──────────▼────────┐                           │
                    │   │ Cost Calculations │                           │
                    │   │                   │                           │
                    │   │ 1. True Positive  │ ◀── MITRE ATT&CK DB      │
                    │   │    Validation     │     (200+ techniques)     │
                    │   │ 2. Risk Scoring   │                           │
                    │   │ 3. Cost Benchmark │ ◀── Industry benchmarks   │
                    │   │    Lookup         │     (IBM, FBI, Ponemon)   │
                    │   │ 4. ROI Calc       │                           │
                    │   └──────────┬────────┘                           │
                    │              │                                     │
                    │   ┌──────────▼─────────────────────────────────┐  │
                    │   │ API Layer (Next.js API Routes)             │  │
                    │   │                                            │  │
                    │   │  /api/metrics     → Cost metrics + ROI     │  │
                    │   │  /api/edr-alerts  → Alert data + filters   │  │
                    │   │  /api/settings    → Config management      │  │
                    │   │  /api/sentinel/*  → SIEM control           │  │
                    │   │  /api/auth/*      → Login, users, RBAC     │  │
                    │   │                                            │  │
                    │   │  All routes protected by requireAuth()     │  │
                    │   └──────────┬─────────────────────────────────┘  │
                    │              │                                     │
                    │   ┌──────────▼────────┐                           │
                    │   │ Auth & Middleware  │                           │
                    │   │                   │                           │
                    │   │ • JWT sessions    │                           │
                    │   │ • RBAC (3 roles)  │                           │
                    │   │ • Rate limiting   │                           │
                    │   │ • File-backed     │                           │
                    │   │   user store      │                           │
                    │   └──────────┬────────┘                           │
                    └──────────────┼────────────────────────────────────┘
                                   │
                    ┌──────────────▼────────────────────────────────────┐
                    │   FRONTEND (React 19 / Next.js App Router)        │
                    │                                                    │
                    │  ┌──────────────────────────────────────────────┐  │
                    │  │ Login Screen                                 │  │
                    │  │ • First-run setup detection                  │  │
                    │  │ • JWT cookie auth                            │  │
                    │  └──────────────────────────────────────────────┘  │
                    │                                                    │
                    │  ┌──────────────────────────────────────────────┐  │
                    │  │ Dashboard (role-aware sidebar navigation)    │  │
                    │  │                                              │  │
                    │  │  ┌─────────────┐  ┌──────────────────────┐  │  │
                    │  │  │ Executive   │  │ Trends & Analytics   │  │  │
                    │  │  │ Reports     │  │                      │  │  │
                    │  │  │             │  │ • Alert categories   │  │  │
                    │  │  │ • KPI cards │  │ • Quarterly trends   │  │  │
                    │  │  │ • Top depts │  │ • Severity dist.     │  │  │
                    │  │  │ • Cost data │  │ • KRI metrics        │  │  │
                    │  │  └─────────────┘  │ • PDF export         │  │  │
                    │  │                   └──────────────────────┘  │  │
                    │  │  ┌──────────────────────────────────────┐   │  │
                    │  │  │ Settings (admin)                     │   │  │
                    │  │  │ • Investment config                  │   │  │
                    │  │  │ • Sentinel credentials               │   │  │
                    │  │  │ • User management (CRUD + RBAC)      │   │  │
                    │  │  └──────────────────────────────────────┘   │  │
                    │  └──────────────────────────────────────────────┘  │
                    └───────────────────────────────────────────────────┘
```

### Data Flow: Sentinel → Dashboard

```
Sentinel Poller (every 15 min)
  → SentinelClient.getResolvedIncidentsWithAlerts()
    → OAuth2 token (cached, 60s buffer)
    → GET /security/incidents?$filter=status eq 'resolved'
    → GET /security/incidents/{id}/alerts (batches of 10)
  → DepartmentResolver (Azure AD user/device → department, 24h cache)
  → transformIncident()
    → mapProductToCategory() (80+ product keywords → 5 categories)
    → getIncidentCost() (benchmark lookup by category + severity)
  → EDRDataService.ingestAlerts() (deduplicate, store, invalidate cache)
  → Dashboard components query via getTimeframeAlerts()
  → CostCalculations pipeline validates true positives → ROI
```

### Sample Data Behavior

When Sentinel is not connected, the dashboard automatically loads sample data for demonstration purposes. This data is **not hardcoded** into the system — it is dynamically generated and **automatically cleared and replaced** the moment real Sentinel credentials are saved and the connection is established. No configuration needed.

### File Structure

```
src/
├── app/
│   ├── page.tsx                    # Main dashboard with sidebar navigation
│   ├── login/page.tsx              # Login screen with first-run setup
│   ├── dashboard/                  # Executive summary + business units
│   ├── executive-reports/          # Detailed security tool metrics
│   ├── azure-sentinel-alerts/      # Alert browser with filtering
│   └── api/
│       ├── auth/                   # Authentication endpoints
│       │   ├── login/              # POST - authenticate credentials
│       │   ├── logout/             # POST - clear session
│       │   ├── me/                 # GET - current user + permissions
│       │   ├── setup/              # GET/POST - first-run admin creation
│       │   └── users/              # CRUD - user management (admin only)
│       ├── settings/               # GET/POST platform settings
│       ├── metrics/                # GET - cost metrics + ROI calculations
│       ├── sentinel/
│       │   ├── webhook/            # POST - receive pushed incidents
│       │   ├── status/             # GET - connection health + alert counts
│       │   ├── sync/               # POST - trigger manual pull
│       │   └── test/               # POST - test connection credentials
│       └── edr-alerts/             # GET - alert data with filtering
├── components/
│   ├── auth-provider.tsx           # React auth context + useAuth() hook
│   ├── trends-analytics.tsx        # Main analytics dashboard with PDF export
│   ├── settings-page.tsx           # Investment + Sentinel + user management
│   └── dashboard/
│       ├── financial-metrics.tsx   # Cost savings, ROI, net benefit
│       └── business-units.tsx      # Top affected business units
├── lib/
│   ├── auth/                      # Authentication & RBAC system
│   │   ├── types.ts               # Role, User, Session, Permission types
│   │   ├── rbac.ts                # Permission map (admin/analyst/viewer)
│   │   ├── password.ts            # bcrypt hashing (12 salt rounds)
│   │   ├── jwt.ts                 # JWT sign/verify (jose, Edge-compatible)
│   │   ├── user-store.ts          # File-backed user store (.data/users.json)
│   │   ├── session.ts             # HttpOnly cookie session (8h expiry)
│   │   └── api-guard.ts           # requireAuth() wrapper for API routes
│   ├── sentinel-client.ts         # Graph Security API client (OAuth2)
│   ├── sentinel-poller.ts         # Polling service (15min interval)
│   ├── sentinel-category-mapper.ts # Product name → category mapping (80+ products)
│   ├── sentinel-config.ts         # Sentinel credential config
│   ├── edr-data-service.ts        # Single source of truth + sample data fallback
│   ├── cost-calculations.ts       # True positive filter + MITRE (200+ techniques)
│   ├── cost-benchmarks.ts         # Industry benchmark cost matrix (IBM, FBI, Ponemon)
│   ├── department-resolver.ts     # Azure AD user/device → department (24h cache)
│   ├── settings-store.ts          # Persistent settings store (file-backed)
│   └── pdf-export.ts              # PDF report generation
├── data/
│   └── azure-sentinel-samples.ts  # Sample data generator (fallback only)
├── middleware.ts                   # Route protection (JWT verification)
└── types/
    └── alerts.ts                  # SecurityAlert + EDRQueryParams type definitions
```

## Key Calculations

**True Positive Identification:**

An alert is validated as a true positive if ANY of these conditions are met:
```
Path 1: Has MITRE ATT&CK technique(s) with avg risk >= 0.6 AND confidence >= 70%
Path 2: Severity is Critical or High (strong signal from the detection tool)
Path 3: Confidence >= 90% (detection tool is highly certain)
```

This ensures high-severity alerts from products that don't emit MITRE data (common with newer tools) are still counted, while filtering out genuine noise.

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

## Authentication & RBAC

SignalFoundry uses JWT-based authentication with role-based access control. Sessions are stored as HttpOnly cookies (8-hour expiry).

### Roles

| Role | Permissions |
|------|-------------|
| **Administrator** | Full access: dashboard, reports, alerts, settings (edit), user management, Sentinel config |
| **Viewer** | Read-only: dashboard, reports, alerts, settings (view only, cannot edit) |

### User Management

Admins can create, edit, and delete users via **Settings > User Management**. Users are stored in `.data/users.json`.

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/auth/login` | Authenticate with username/password | Public |
| POST | `/api/auth/logout` | Clear session cookie | Public |
| GET | `/api/auth/me` | Get current user + permissions | Authenticated |
| GET | `/api/auth/setup` | Check if first-run setup needed | Public |
| POST | `/api/auth/setup` | Create first admin account | Public (only when no users exist) |
| GET | `/api/auth/users` | List all users | Admin |
| POST | `/api/auth/users` | Create user | Admin |
| PUT | `/api/auth/users` | Update user | Admin |
| DELETE | `/api/auth/users?id=` | Delete user | Admin |

### Platform

| Method | Endpoint | Description | Required Permission |
|--------|----------|-------------|------|
| GET | `/api/settings` | Get platform settings (secrets masked) | `settings:view` |
| POST | `/api/settings` | Save investment amount + Sentinel credentials | `settings:edit` |
| GET | `/api/metrics` | Cost metrics, ROI, savings breakdown | `dashboard:view` |
| GET | `/api/edr-alerts` | Alert data with filtering | `alerts:view` |
| POST | `/api/sentinel/test` | Test Sentinel connection with credentials | `sentinel:configure` |
| GET | `/api/sentinel/status` | Connection health, polling state | `settings:view` |
| POST | `/api/sentinel/sync` | Trigger manual sync from Sentinel | `sentinel:sync` |
| POST | `/api/sentinel/webhook` | Receive pushed incidents (HMAC auth) | HMAC signature |

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
- Settings persisted to disk (`.data/settings.json`), alerts re-fetched from Sentinel on restart

## Environment Variables

```bash
# Authentication (required in production)
AUTH_SECRET=your-secure-random-secret    # openssl rand -base64 32

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
