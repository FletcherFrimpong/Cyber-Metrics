# SignalFoundry - AI-Powered Cybersecurity Detection Platform

SignalFoundry is an advanced cybersecurity detection platform that centralizes detection rules and analytics from multiple security platforms like Microsoft Sentinel, Splunk, and CrowdStrike. It provides comprehensive analytics, false positive rate calculations, risk assessment, and AI-powered threat intelligence integration.

## 🚀 Features

### Core Analytics
- **False Positive Rate Calculation**: Advanced algorithms with baseline noise adjustment
- **Risk Assessment**: NIST framework-based risk scoring
- **Cost Analysis**: Alert cost calculations and savings
- **Real Data Integration**: Authentic threat intelligence from verified sources

### Real Threat Intelligence Integration
- **MITRE ATT&CK Framework**: Real technique IDs, names, and tactics
- **CISA Cybersecurity Advisories**: Real threat actor profiles and recent attacks
- **FBI Flash Alerts**: Real threat intelligence and attack patterns
- **DetectionLab Project**: Real detection logs and incident data
- **DFIR Artifact Museum**: Real forensic artifacts and analysis tools
- **Blue Team Labs**: Real attack scenarios and detection rules

### AI-Powered Features
- **Threat Benchmarking**: Real-time threat intelligence integration
- **Cost Analysis**: Alert cost calculations and savings
- **MITRE ATT&CK Mapping**: Technique and tactic correlation

### Cost Analysis
SignalFoundry provides comprehensive cost analysis:
- **Alert Cost Calculations**: Cost per alert and total alert costs
- **False Positive Savings**: Cost savings from preventing false positives
- **Industry Multipliers**: Industry-specific cost adjustments
- **Real Attack Examples**: Documented incidents with verified costs

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd signal-foundry
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:3000`

## 📊 Dashboard Features

### Real-Time Analytics
- **Detection Rule Performance**: Real-time scoring and metrics
- **Threat Intelligence**: Live threat actor correlation
- **Cost Analysis**: Industry-specific attack cost calculations
- **Compliance Impact**: Regulatory requirement mapping

### Alert Management
- **Real-Time Alerts**: Live alert generation with financial impact
- **Threat Correlation**: MITRE ATT&CK technique mapping
- **Response Recommendations**: Actionable security guidance

### Executive Reporting
- **PDF Generation**: Automated executive reports
- **ROI Analysis**: Cost savings and financial impact
- **Compliance Tracking**: Regulatory requirement monitoring

## 🔧 API Endpoints

### Analytics
- `GET /api/analytics/rules` - Get detection rules with analytics
- `GET /api/analytics/attack-costs` - Calculate attack costs by industry

### Alerts
- `GET /api/alerts/realtime` - Generate real-time alerts
- `GET /api/alerts` - List and manage alerts

### Real Data Sources
- `GET /api/real-data-sources` - Access real threat intelligence data

## 🎯 Key Benefits

### Real Data Integration
- **100% Authentic Sources**: No mock data, only verified threat intelligence
- **Source Attribution**: Proper citations and data lineage
- **Data Quality**: Validation and freshness tracking

### Financial Impact
- **Real Attack Costs**: Based on documented incidents
- **Industry-Specific**: Tailored to your sector
- **ROI Calculation**: Quantified security investments

### Enterprise Ready
- **Production-Ready**: Scalable architecture
- **Compliance**: Regulatory requirement mapping
- **Audit Trail**: Complete data lineage

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions, please open an issue in the GitHub repository.
