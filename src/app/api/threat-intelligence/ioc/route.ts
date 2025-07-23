import { NextRequest, NextResponse } from 'next/server';

// Real threat intelligence API integrations
const THREAT_INTELLIGENCE_APIS = {
  // VirusTotal API for file/domain/IP reputation
  virustotal: {
    baseUrl: 'https://www.virustotal.com/vtapi/v2',
    apiKey: process.env.VIRUSTOTAL_API_KEY
  },
  
  // AlienVault OTX for threat intelligence
  alienvault: {
    baseUrl: 'https://otx.alienvault.com/api/v1',
    apiKey: process.env.ALIENVAULT_API_KEY
  },
  
  // AbuseIPDB for IP reputation
  abuseipdb: {
    baseUrl: 'https://api.abuseipdb.com/api/v2',
    apiKey: process.env.ABUSEIPDB_API_KEY
  },
  
  // ThreatFox for malware intelligence
  threatfox: {
    baseUrl: 'https://threatfox-api.abuse.ch/api/v1'
  },
  
  // URLhaus for malicious URL intelligence
  urlhaus: {
    baseUrl: 'https://urlhaus-api.abuse.ch/v1'
  }
};

// Function to fetch real threat intelligence from VirusTotal
async function fetchVirusTotalIntel(ioc: string, type: 'ip' | 'domain' | 'file') {
  if (!THREAT_INTELLIGENCE_APIS.virustotal.apiKey) {
    console.warn('VirusTotal API key not configured');
    return null;
  }

  try {
    const params = new URLSearchParams({
      apikey: THREAT_INTELLIGENCE_APIS.virustotal.apiKey,
      resource: ioc
    });

    const response = await fetch(`${THREAT_INTELLIGENCE_APIS.virustotal.baseUrl}/url/report?${params}`);
    if (!response.ok) return null;

    const data = await response.json();
    return {
      source: 'VirusTotal',
      malicious: data.positives > 0,
      totalScanners: data.total,
      positiveScanners: data.positives,
      scanDate: data.scan_date,
      permalink: data.permalink,
      detectionRate: data.positives / data.total
    };
  } catch (error) {
    console.error('Error fetching VirusTotal data:', error);
    return null;
  }
}

// Function to fetch real threat intelligence from AlienVault OTX
async function fetchAlienVaultIntel(ioc: string, type: 'ip' | 'domain' | 'file') {
  if (!THREAT_INTELLIGENCE_APIS.alienvault.apiKey) {
    console.warn('AlienVault OTX API key not configured');
    return null;
  }

  try {
    const headers = {
      'X-OTX-API-KEY': THREAT_INTELLIGENCE_APIS.alienvault.apiKey
    };

    const response = await fetch(`${THREAT_INTELLIGENCE_APIS.alienvault.baseUrl}/indicators/${type}/${ioc}`, { headers });
    if (!response.ok) return null;

    const data = await response.json();
    return {
      source: 'AlienVault OTX',
      reputation: data.reputation,
      threatScore: data.threat_score,
      pulseCount: data.pulse_info?.count || 0,
      tags: data.tags || [],
      country: data.country_name,
      city: data.city,
      malwareFamilies: data.pulse_info?.pulses?.map((p: any) => p.name) || []
    };
  } catch (error) {
    console.error('Error fetching AlienVault data:', error);
    return null;
  }
}

// Function to fetch real threat intelligence from AbuseIPDB
async function fetchAbuseIPDBIntel(ip: string) {
  if (!THREAT_INTELLIGENCE_APIS.abuseipdb.apiKey) {
    console.warn('AbuseIPDB API key not configured');
    return null;
  }

  try {
    const headers = {
      'Key': THREAT_INTELLIGENCE_APIS.abuseipdb.apiKey,
      'Accept': 'application/json'
    };

    const params = new URLSearchParams({
      ipAddress: ip,
      maxAgeInDays: '90'
    });

    const response = await fetch(`${THREAT_INTELLIGENCE_APIS.abuseipdb.baseUrl}/check?${params}`, { headers });
    if (!response.ok) return null;

    const data = await response.json();
    return {
      source: 'AbuseIPDB',
      abuseConfidenceScore: data.data.abuseConfidenceScore,
      countryCode: data.data.countryCode,
      usageType: data.data.usageType,
      isp: data.data.isp,
      domain: data.data.domain,
      totalReports: data.data.totalReports,
      isAbused: data.data.abuseConfidenceScore > 50
    };
  } catch (error) {
    console.error('Error fetching AbuseIPDB data:', error);
    return null;
  }
}

// Function to fetch real malware intelligence from ThreatFox
async function fetchThreatFoxIntel(malwareHash: string) {
  try {
    const payload = {
      query: 'search_hash',
      hash: malwareHash
    };

    const response = await fetch(THREAT_INTELLIGENCE_APIS.threatfox.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.query_status === 'ok' && data.data.length > 0) {
      const malware = data.data[0];
      return {
        source: 'ThreatFox',
        malwareType: malware.malware_type,
        malwareFamily: malware.malware_family,
        firstSeen: malware.first_seen,
        lastSeen: malware.last_seen,
        confidence: malware.confidence_level,
        isMalicious: true
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching ThreatFox data:', error);
    return null;
  }
}

// Function to fetch real URL intelligence from URLhaus
async function fetchURLhausIntel(url: string) {
  try {
    const payload = {
      url: url
    };

    const response = await fetch(THREAT_INTELLIGENCE_APIS.urlhaus.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) return null;

    const data = await response.json();
    if (data.query_status === 'ok') {
      return {
        source: 'URLhaus',
        threat: data.threat,
        tags: data.tags,
        dateAdded: data.date_added,
        status: data.url_status,
        isMalicious: data.url_status === 'online'
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching URLhaus data:', error);
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ioc = searchParams.get('ioc');
    const type = searchParams.get('type') as 'ip' | 'domain' | 'file' | 'url';
    
    if (!ioc || !type) {
      return NextResponse.json(
        { error: 'IOC and type parameters are required' },
        { status: 400 }
      );
    }

    console.log(`Fetching real threat intelligence for ${type}: ${ioc}`);
    
    const intelPromises = [];
    
    // Fetch from appropriate sources based on IOC type
    if (type === 'ip') {
      intelPromises.push(fetchVirusTotalIntel(ioc, 'ip'));
      intelPromises.push(fetchAlienVaultIntel(ioc, 'ip'));
      intelPromises.push(fetchAbuseIPDBIntel(ioc));
    } else if (type === 'domain') {
      intelPromises.push(fetchVirusTotalIntel(ioc, 'domain'));
      intelPromises.push(fetchAlienVaultIntel(ioc, 'domain'));
    } else if (type === 'file') {
      intelPromises.push(fetchVirusTotalIntel(ioc, 'file'));
      intelPromises.push(fetchAlienVaultIntel(ioc, 'file'));
      intelPromises.push(fetchThreatFoxIntel(ioc));
    } else if (type === 'url') {
      intelPromises.push(fetchVirusTotalIntel(ioc, 'domain'));
      intelPromises.push(fetchURLhausIntel(ioc));
    }
    
    const results = await Promise.all(intelPromises);
    const threatIntel = results.filter(result => result !== null);
    
    // Calculate overall threat score
    let threatScore = 0;
    let maliciousSources = 0;
    let totalSources = threatIntel.length;
    
    threatIntel.forEach(intel => {
      if (intel.source === 'VirusTotal' && 'malicious' in intel && intel.malicious) {
        threatScore += ('detectionRate' in intel ? intel.detectionRate : 0) * 100;
        maliciousSources++;
      } else if (intel.source === 'AbuseIPDB' && 'isAbused' in intel && intel.isAbused) {
        threatScore += 'abuseConfidenceScore' in intel ? intel.abuseConfidenceScore : 0;
        maliciousSources++;
      } else if (intel.source === 'ThreatFox' && 'isMalicious' in intel && intel.isMalicious) {
        threatScore += 80;
        maliciousSources++;
      } else if (intel.source === 'URLhaus' && 'isMalicious' in intel && intel.isMalicious) {
        threatScore += 90;
        maliciousSources++;
      } else if (intel.source === 'AlienVault OTX' && 'threatScore' in intel) {
        threatScore += intel.threatScore || 0;
        if ((intel.threatScore || 0) > 50) maliciousSources++;
      }
    });
    
    const averageThreatScore = totalSources > 0 ? threatScore / totalSources : 0;
    const threatLevel = averageThreatScore > 80 ? 'Critical' : 
                       averageThreatScore > 60 ? 'High' : 
                       averageThreatScore > 30 ? 'Medium' : 'Low';
    
    const iocAnalysis = {
      ioc,
      type,
      timestamp: new Date().toISOString(),
      threatLevel,
      threatScore: Math.round(averageThreatScore),
      maliciousSources,
      totalSources,
      sources: threatIntel,
      summary: {
        isMalicious: maliciousSources > 0,
        confidence: totalSources > 0 ? (maliciousSources / totalSources) * 100 : 0,
        recommendation: maliciousSources > 0 ? 
          'This IOC has been flagged as malicious by multiple threat intelligence sources. Immediate action recommended.' :
          'This IOC appears clean based on available threat intelligence sources.'
      }
    };
    
    return NextResponse.json(iocAnalysis);
  } catch (error) {
    console.error('Error analyzing IOC:', error);
    return NextResponse.json(
      { error: 'Failed to analyze IOC' },
      { status: 500 }
    );
  }
} 