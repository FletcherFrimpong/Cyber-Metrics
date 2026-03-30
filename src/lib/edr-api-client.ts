// EDR API Client for real-time alert integration
// Supports multiple EDR platforms: CrowdStrike, Microsoft Defender, etc.

export interface EDRConfig {
  platform: 'crowdstrike' | 'microsoft-defender' | 'sentinelone' | 'carbon-black';
  baseUrl: string;
  apiKey: string;
  clientId?: string;
  clientSecret?: string;
  tenantId?: string; // For Microsoft Defender
}

export interface EDRAlert {
  id: string;
  timestamp: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  category: string;
  title: string;
  description: string;
  source: string;
  platform: string;
  rawLog: any;
  mitreTactics: string[];
  mitreTechniques: string[];
  iocIndicators: string[];
  affectedEntities: string[];
  remediationSteps: string[];
  costImpact: number;
  confidence?: number;
  status?: 'Open' | 'In Progress' | 'Resolved' | 'False Positive';
}

export interface EDRQueryParams {
  startTime?: string;
  endTime?: string;
  severity?: string[];
  category?: string[];
  limit?: number;
  offset?: number;
}

class EDRAPIClient {
  private config: EDRConfig;
  private accessToken?: string;
  private tokenExpiry?: Date;

  constructor(config: EDRConfig) {
    this.config = config;
  }

  // Authentication methods
  private async authenticate(): Promise<void> {
    switch (this.config.platform) {
      case 'crowdstrike':
        await this.authenticateCrowdStrike();
        break;
      case 'microsoft-defender':
        await this.authenticateMicrosoftDefender();
        break;
      case 'sentinelone':
        await this.authenticateSentinelOne();
        break;
      case 'carbon-black':
        await this.authenticateCarbonBlack();
        break;
    }
  }

  private async authenticateCrowdStrike(): Promise<void> {
    const response = await fetch(`${this.config.baseUrl}/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId!,
        client_secret: this.config.clientSecret!,
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      throw new Error(`CrowdStrike authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
  }

  private async authenticateMicrosoftDefender(): Promise<void> {
    const response = await fetch(`https://login.microsoftonline.com/${this.config.tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: this.config.clientId!,
        client_secret: this.config.clientSecret!,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    });

    if (!response.ok) {
      throw new Error(`Microsoft Defender authentication failed: ${response.statusText}`);
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.tokenExpiry = new Date(Date.now() + (data.expires_in * 1000));
  }

  private async authenticateSentinelOne(): Promise<void> {
    // SentinelOne uses API key directly
    this.accessToken = this.config.apiKey;
  }

  private async authenticateCarbonBlack(): Promise<void> {
    // Carbon Black uses API key directly
    this.accessToken = this.config.apiKey;
  }

  // Check if token needs refresh
  private async ensureAuthenticated(): Promise<void> {
    if (!this.accessToken || (this.tokenExpiry && new Date() >= this.tokenExpiry)) {
      await this.authenticate();
    }
  }

  // Fetch alerts from EDR platform
  async getAlerts(params: EDRQueryParams = {}): Promise<EDRAlert[]> {
    await this.ensureAuthenticated();

    switch (this.config.platform) {
      case 'crowdstrike':
        return this.getCrowdStrikeAlerts(params);
      case 'microsoft-defender':
        return this.getMicrosoftDefenderAlerts(params);
      case 'sentinelone':
        return this.getSentinelOneAlerts(params);
      case 'carbon-black':
        return this.getCarbonBlackAlerts(params);
      default:
        throw new Error(`Unsupported EDR platform: ${this.config.platform}`);
    }
  }

  private async getCrowdStrikeAlerts(params: EDRQueryParams): Promise<EDRAlert[]> {
    const queryParams = new URLSearchParams();
    
    if (params.startTime) queryParams.append('filter', `created_timestamp:>='${params.startTime}'`);
    if (params.endTime) queryParams.append('filter', `created_timestamp:<='${params.endTime}'`);
    if (params.severity?.length) {
      const severityFilter = params.severity.map(s => `severity:'${s}'`).join('+');
      queryParams.append('filter', severityFilter);
    }
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const response = await fetch(`${this.config.baseUrl}/detects/queries/detects/v1?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CrowdStrike API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformCrowdStrikeAlerts(data.resources || []);
  }

  private async getMicrosoftDefenderAlerts(params: EDRQueryParams): Promise<EDRAlert[]> {
    const queryParams = new URLSearchParams();
    
    if (params.startTime) queryParams.append('$filter', `createdDateTime ge ${params.startTime}`);
    if (params.endTime) queryParams.append('$filter', `createdDateTime le ${params.endTime}`);
    if (params.limit) queryParams.append('$top', params.limit.toString());

    const response = await fetch(`https://graph.microsoft.com/v1.0/security/alerts?${queryParams}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Microsoft Defender API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformMicrosoftDefenderAlerts(data.value || []);
  }

  private async getSentinelOneAlerts(params: EDRQueryParams): Promise<EDRAlert[]> {
    const queryParams = new URLSearchParams();
    
    if (params.startTime) queryParams.append('fromDate', params.startTime);
    if (params.endTime) queryParams.append('toDate', params.endTime);
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await fetch(`${this.config.baseUrl}/web/api/v2.1/threats?${queryParams}`, {
      headers: {
        'Authorization': `ApiToken ${this.accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`SentinelOne API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformSentinelOneAlerts(data.data || []);
  }

  private async getCarbonBlackAlerts(params: EDRQueryParams): Promise<EDRAlert[]> {
    const queryParams = new URLSearchParams();
    
    if (params.startTime) queryParams.append('start', params.startTime);
    if (params.endTime) queryParams.append('end', params.endTime);
    if (params.limit) queryParams.append('rows', params.limit.toString());

    const response = await fetch(`${this.config.baseUrl}/api/v1/alert?${queryParams}`, {
      headers: {
        'X-Auth-Token': this.accessToken!,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Carbon Black API error: ${response.statusText}`);
    }

    const data = await response.json();
    return this.transformCarbonBlackAlerts(data.results || []);
  }

  // Transform platform-specific alerts to common format
  private transformCrowdStrikeAlerts(alerts: any[]): EDRAlert[] {
    return alerts.map(alert => ({
      id: alert.detect_id,
      timestamp: alert.created_timestamp,
      severity: this.mapCrowdStrikeSeverity(alert.max_severity),
      category: alert.detection_type || 'Unknown',
      title: alert.detection_name || 'CrowdStrike Detection',
      description: alert.description || '',
      source: 'CrowdStrike Falcon',
      platform: alert.platform_name || 'Unknown',
      rawLog: alert,
      mitreTactics: alert.mitre_attack_tactics || [],
      mitreTechniques: alert.mitre_attack_techniques || [],
      iocIndicators: alert.ioc_indicators || [],
      affectedEntities: alert.affected_hosts || [],
      remediationSteps: alert.remediation_steps || [],
      costImpact: this.calculateCostImpact(alert.max_severity),
      confidence: alert.confidence || 0,
      status: this.mapCrowdStrikeStatus(alert.status)
    }));
  }

  private transformMicrosoftDefenderAlerts(alerts: any[]): EDRAlert[] {
    return alerts.map(alert => ({
      id: alert.id,
      timestamp: alert.createdDateTime,
      severity: this.mapMicrosoftSeverity(alert.severity),
      category: alert.category || 'Unknown',
      title: alert.title || 'Microsoft Defender Alert',
      description: alert.description || '',
      source: 'Microsoft Defender for Endpoint',
      platform: alert.devicePlatform || 'Unknown',
      rawLog: alert,
      mitreTactics: alert.mitreAttackTactics || [],
      mitreTechniques: alert.mitreAttackTechniques || [],
      iocIndicators: alert.iocIndicators || [],
      affectedEntities: alert.deviceIds || [],
      remediationSteps: alert.remediationSteps || [],
      costImpact: this.calculateCostImpact(alert.severity),
      confidence: alert.confidence || 0,
      status: this.mapMicrosoftStatus(alert.status)
    }));
  }

  private transformSentinelOneAlerts(alerts: any[]): EDRAlert[] {
    return alerts.map(alert => ({
      id: alert.id,
      timestamp: alert.createdAt,
      severity: this.mapSentinelOneSeverity(alert.severity),
      category: alert.category || 'Unknown',
      title: alert.threatName || 'SentinelOne Threat',
      description: alert.description || '',
      source: 'SentinelOne',
      platform: alert.osType || 'Unknown',
      rawLog: alert,
      mitreTactics: alert.mitreTactics || [],
      mitreTechniques: alert.mitreTechniques || [],
      iocIndicators: alert.iocIndicators || [],
      affectedEntities: alert.affectedHosts || [],
      remediationSteps: alert.remediationSteps || [],
      costImpact: this.calculateCostImpact(alert.severity),
      confidence: alert.confidence || 0,
      status: this.mapSentinelOneStatus(alert.status)
    }));
  }

  private transformCarbonBlackAlerts(alerts: any[]): EDRAlert[] {
    return alerts.map(alert => ({
      id: alert.id,
      timestamp: alert.create_time,
      severity: this.mapCarbonBlackSeverity(alert.severity),
      category: alert.category || 'Unknown',
      title: alert.threat_name || 'Carbon Black Alert',
      description: alert.description || '',
      source: 'Carbon Black',
      platform: alert.os_type || 'Unknown',
      rawLog: alert,
      mitreTactics: alert.mitre_tactics || [],
      mitreTechniques: alert.mitre_techniques || [],
      iocIndicators: alert.ioc_indicators || [],
      affectedEntities: alert.affected_hosts || [],
      remediationSteps: alert.remediation_steps || [],
      costImpact: this.calculateCostImpact(alert.severity),
      confidence: alert.confidence || 0,
      status: this.mapCarbonBlackStatus(alert.status)
    }));
  }

  // Severity mapping functions
  private mapCrowdStrikeSeverity(severity: string): 'Low' | 'Medium' | 'High' | 'Critical' {
    const mapping: Record<string, 'Low' | 'Medium' | 'High' | 'Critical'> = {
      '0': 'Low',
      '1': 'Low',
      '2': 'Medium',
      '3': 'High',
      '4': 'Critical',
      '5': 'Critical'
    };
    return mapping[severity] || 'Medium';
  }

  private mapMicrosoftSeverity(severity: string): 'Low' | 'Medium' | 'High' | 'Critical' {
    const mapping: Record<string, 'Low' | 'Medium' | 'High' | 'Critical'> = {
      'Low': 'Low',
      'Medium': 'Medium',
      'High': 'High',
      'Critical': 'Critical'
    };
    return mapping[severity] || 'Medium';
  }

  private mapSentinelOneSeverity(severity: string): 'Low' | 'Medium' | 'High' | 'Critical' {
    const mapping: Record<string, 'Low' | 'Medium' | 'High' | 'Critical'> = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'critical': 'Critical'
    };
    return mapping[severity.toLowerCase()] || 'Medium';
  }

  private mapCarbonBlackSeverity(severity: string): 'Low' | 'Medium' | 'High' | 'Critical' {
    const mapping: Record<string, 'Low' | 'Medium' | 'High' | 'Critical'> = {
      '1': 'Low',
      '2': 'Medium',
      '3': 'High',
      '4': 'Critical',
      '5': 'Critical'
    };
    return mapping[severity] || 'Medium';
  }

  // Status mapping functions
  private mapCrowdStrikeStatus(status: string): 'Open' | 'In Progress' | 'Resolved' | 'False Positive' {
    const mapping: Record<string, 'Open' | 'In Progress' | 'Resolved' | 'False Positive'> = {
      'new': 'Open',
      'in_progress': 'In Progress',
      'true_positive': 'Resolved',
      'false_positive': 'False Positive'
    };
    return mapping[status] || 'Open';
  }

  private mapMicrosoftStatus(status: string): 'Open' | 'In Progress' | 'Resolved' | 'False Positive' {
    const mapping: Record<string, 'Open' | 'In Progress' | 'Resolved' | 'False Positive'> = {
      'newAlert': 'Open',
      'inProgress': 'In Progress',
      'resolved': 'Resolved',
      'falsePositive': 'False Positive'
    };
    return mapping[status] || 'Open';
  }

  private mapSentinelOneStatus(status: string): 'Open' | 'In Progress' | 'Resolved' | 'False Positive' {
    const mapping: Record<string, 'Open' | 'In Progress' | 'Resolved' | 'False Positive'> = {
      'new': 'Open',
      'in_progress': 'In Progress',
      'resolved': 'Resolved',
      'false_positive': 'False Positive'
    };
    return mapping[status] || 'Open';
  }

  private mapCarbonBlackStatus(status: string): 'Open' | 'In Progress' | 'Resolved' | 'False Positive' {
    const mapping: Record<string, 'Open' | 'In Progress' | 'Resolved' | 'False Positive'> = {
      'new': 'Open',
      'in_progress': 'In Progress',
      'resolved': 'Resolved',
      'false_positive': 'False Positive'
    };
    return mapping[status] || 'Open';
  }

  // Cost impact calculation based on severity
  private calculateCostImpact(severity: string): number {
    const baseCosts: Record<string, number> = {
      'Low': 25000,
      'Medium': 75000,
      'High': 150000,
      'Critical': 250000
    };
    return baseCosts[severity] || 50000;
  }
}

export default EDRAPIClient;
