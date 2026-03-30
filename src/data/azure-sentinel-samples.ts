// CrowdStrike Real Log Samples
// Based on actual CrowdStrike workbook data structures and common security alert formats

export interface AzureSentinelAlert {
  id: string;
  timestamp: string;
  severity: "Low" | "Medium" | "High" | "Critical";
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
}

// Timeframe-specific alert generation
export const generateTimeframeAlerts = (timeframe: string): AzureSentinelAlert[] => {
  const alerts: AzureSentinelAlert[] = [];
  
  // Parse timeframe to get year and quarter
  const yearMatch = timeframe.match(/(\d{4})/);
  const quarterMatch = timeframe.match(/Q(\d)/);
  
  const year = parseInt(yearMatch?.[1] || "2024");
  const quarter = quarterMatch ? parseInt(quarterMatch[1] || "1") : 1;
  
  // Total alerts across entire analysis period is 1440
  const totalAnalysisPeriodAlerts = 1440;
  
  // Distribute alerts across quarters (Q1: 20%, Q2: 25%, Q3: 30%, Q4: 25%)
  const quarterlyDistribution = {
    1: 0.20, // 20% of total = 288 alerts
    2: 0.25, // 25% of total = 360 alerts
    3: 0.30, // 30% of total = 432 alerts
    4: 0.25  // 25% of total = 360 alerts
  };
  
  // Calculate alerts for this specific quarter
  const totalAlerts = Math.round(totalAnalysisPeriodAlerts * quarterlyDistribution[quarter as keyof typeof quarterlyDistribution]);
  
  // Calculate severity distribution (percentages that add up to 100%)
  const criticalPercentage = 0.097; // 9.7% of total alerts
  const highPercentage = 0.267;     // 26.7% of total alerts
  const mediumPercentage = 0.433;   // 43.3% of total alerts
  const lowPercentage = 0.203;      // 20.3% of total alerts
  
  // Calculate exact numbers for each severity
  const criticalAlerts = Math.round(totalAlerts * criticalPercentage);
  const highAlerts = Math.round(totalAlerts * highPercentage);
  const mediumAlerts = Math.round(totalAlerts * mediumPercentage);
  const lowAlerts = totalAlerts - criticalAlerts - highAlerts - mediumAlerts; // Ensure total adds up exactly
  
  // Generate alerts for the timeframe
  const categories = ['Malware Detection', 'Ransomware Detection', 'Credential Access', 'Suspicious Activity', 'Process Injection', 'Lateral Movement', 'Data Exfiltration', 'Network Activity', 'Registry Activity'];
  const sources = ['Microsoft Defender for Endpoint', 'CrowdStrike Falcon'];
  const platforms = ['Windows 10', 'Windows Server 2019', 'Windows 11', 'macOS', 'Linux'];
  
  let alertIndex = 1;
  
  // Generate critical alerts
  for (let i = 0; i < criticalAlerts; i++) {
    const category = categories[i % categories.length];
    const source = sources[i % sources.length];
    const platform = platforms[i % platforms.length];
    const timestamp = new Date(Date.UTC(year, (quarter - 1) * 3 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))).toISOString();
    
    alerts.push({
      id: `EDR-${year}-${String(alertIndex++).padStart(3, '0')}`,
      timestamp,
      severity: 'Critical',
      category: category || "Unknown",
      title: `Critical ${category || "Unknown"} Alert ${i + 1}`,
      description: `Critical priority ${category?.toLowerCase() || "unknown"} detected in ${timeframe}`,
      source: source || "Unknown",
      platform: platform || "Unknown",
      rawLog: {
        "DeviceId": `device-${year}-${i}`,
        "DeviceName": `DESKTOP-${year}-${i}`,
        "ProcessId": 1000 + i,
        "ProcessName": "suspicious.exe",
        "DetectionSource": "Behavioral Analysis",
        "Confidence": 95 + (i % 5)
      },
      mitreTactics: ["Execution", "Defense Evasion"],
      mitreTechniques: ["T1059", "T1027"],
      iocIndicators: [`192.168.1.${i + 1}`, `hash-${year}-${i}`],
      affectedEntities: [`DESKTOP-${year}-${i}`, `User: user${i}@company.com`],
      remediationSteps: [
        "Immediate isolation",
        "Investigate root cause",
        "Apply security patches"
      ],
      costImpact: 250000 + (i * 10000)
    });
  }
  
  // Generate high alerts
  for (let i = 0; i < highAlerts; i++) {
    const category = categories[i % categories.length];
    const source = sources[i % sources.length];
    const platform = platforms[i % platforms.length];
    const timestamp = new Date(Date.UTC(year, (quarter - 1) * 3 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))).toISOString();
    
    alerts.push({
      id: `EDR-${year}-${String(alertIndex++).padStart(3, '0')}`,
      timestamp,
      severity: 'High',
      category,
      title: `High ${category} Alert ${i + 1}`,
      description: `High priority ${category.toLowerCase()} detected in ${timeframe}`,
      source,
      platform,
      rawLog: {
        "DeviceId": `device-${year}-${i}`,
        "DeviceName": `DESKTOP-${year}-${i}`,
        "ProcessId": 2000 + i,
        "ProcessName": "suspicious.exe",
        "DetectionSource": "Behavioral Analysis",
        "Confidence": 85 + (i % 10)
      },
      mitreTactics: ["Execution", "Defense Evasion"],
      mitreTechniques: ["T1059", "T1027"],
      iocIndicators: [`192.168.1.${i + 1}`, `hash-${year}-${i}`],
      affectedEntities: [`DESKTOP-${year}-${i}`, `User: user${i}@company.com`],
      remediationSteps: [
        "Investigate activity",
        "Monitor for escalation",
        "Update security controls"
      ],
      costImpact: 150000 + (i * 5000)
    });
  }
  
  // Generate medium alerts
  for (let i = 0; i < mediumAlerts; i++) {
    const category = categories[i % categories.length];
    const source = sources[i % sources.length];
    const platform = platforms[i % platforms.length];
    const timestamp = new Date(Date.UTC(year, (quarter - 1) * 3 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))).toISOString();
    
    alerts.push({
      id: `EDR-${year}-${String(alertIndex++).padStart(3, '0')}`,
      timestamp,
      severity: 'Medium',
      category,
      title: `Medium ${category} Alert ${i + 1}`,
      description: `Medium priority ${category.toLowerCase()} detected in ${timeframe}`,
      source,
      platform,
      rawLog: {
        "DeviceId": `device-${year}-${i}`,
        "DeviceName": `DESKTOP-${year}-${i}`,
        "ProcessId": 3000 + i,
        "ProcessName": "suspicious.exe",
        "DetectionSource": "Behavioral Analysis",
        "Confidence": 70 + (i % 15)
      },
      mitreTactics: ["Execution"],
      mitreTechniques: ["T1059"],
      iocIndicators: [`192.168.1.${i + 1}`, `hash-${year}-${i}`],
      affectedEntities: [`DESKTOP-${year}-${i}`, `User: user${i}@company.com`],
      remediationSteps: [
        "Review activity",
        "Document findings",
        "Consider policy updates"
      ],
      costImpact: 75000 + (i * 2500)
    });
  }
  
  // Generate low alerts
  for (let i = 0; i < lowAlerts; i++) {
    const category = categories[i % categories.length];
    const source = sources[i % sources.length];
    const platform = platforms[i % platforms.length];
    const timestamp = new Date(Date.UTC(year, (quarter - 1) * 3 + Math.floor(Math.random() * 3), Math.floor(Math.random() * 28) + 1, Math.floor(Math.random() * 24), Math.floor(Math.random() * 60))).toISOString();
    
    alerts.push({
      id: `EDR-${year}-${String(alertIndex++).padStart(3, '0')}`,
      timestamp,
      severity: 'Low',
      category,
      title: `Low ${category} Alert ${i + 1}`,
      description: `Low priority ${category.toLowerCase()} detected in ${timeframe}`,
      source,
      platform,
      rawLog: {
        "DeviceId": `device-${year}-${i}`,
        "DeviceName": `DESKTOP-${year}-${i}`,
        "ProcessId": 4000 + i,
        "ProcessName": "suspicious.exe",
        "DetectionSource": "Behavioral Analysis",
        "Confidence": 50 + (i % 20)
      },
      mitreTactics: ["Execution"],
      mitreTechniques: ["T1059"],
      iocIndicators: [`192.168.1.${i + 1}`, `hash-${year}-${i}`],
      affectedEntities: [`DESKTOP-${year}-${i}`, `User: user${i}@company.com`],
      remediationSteps: [
        "Monitor activity",
        "Document for future reference"
      ],
      costImpact: 25000 + (i * 1000)
    });
  }
  
  return alerts;
};

// EDR (Endpoint Detection & Response) Alerts
export const edrAlerts: AzureSentinelAlert[] = [
  {
    id: "EDR-2025-001",
    timestamp: "2025-01-15T14:32:17.123Z",
    severity: "High",
    category: "Malware Detection",
    title: "Suspicious PowerShell Execution Detected",
    description: "PowerShell script execution with obfuscated commands and network connectivity to known C2 server",
    source: "Microsoft Defender for Endpoint",
    platform: "Windows 10",
    rawLog: {
      "DeviceId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "DeviceName": "DESKTOP-ABC123",
      "ProcessId": 1234,
      "ProcessName": "powershell.exe",
      "CommandLine": "powershell.exe -enc JABzAD0ATgBlAHcALQBPAGIAagBlAGMAdAAgAE4AZQB0AC4AVwBlAGIAQwBsAGkAZQBuAHQAOwAkAHMALgBQAHIAbwB4AHkAPQBOAGUAdwAtAE8AYgBqAGUAYwB0ACAATgBlAHQALgBXAGUAYgBQAHIAbwB4AHkAKAAnAGgAdAB0AHAAOgAvAC8AMQA5ADIALgAxADYAOAAuADEALgAxADAAMAA6ADgAMAA4ADAAJwApADsAJABzAC4AVQBzAGUARABlAGYAYQB1AGwAdABDAHIAZQBkAGUAbgB0AGkAYQBsAHMAPQBUAHIAdQBlADsASQBuAHYAbwBrAGUALQBSAGUAcwB0AE0AZQB0AGgAbwBkACAALQBVAHIAaQAgACcAaAB0AHQAcAA6AC8ALwAxADkAMgAuADEANgA4AC4AMQAuADEAMAAwAC8AYQBkAG0AaQBuACcAIAAtAFUAcwBlAEIAYQBzAGkAYwBQAGEAcgBzAGkAbgBnAA==",
      "RemoteIP": "192.168.1.100",
      "RemotePort": 80,
      "LocalIP": "10.0.0.15",
      "LocalPort": 49152,
      "SHA256": "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456",
      "FileSize": 24576,
      "FileType": "PowerShell Script",
      "DetectionSource": "Behavioral Analysis",
      "Confidence": 95
    },
    mitreTactics: ["Execution", "Defense Evasion", "Command and Control"],
    mitreTechniques: ["T1059.001", "T1027", "T1071.001"],
    iocIndicators: ["192.168.1.100", "a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456"],
    affectedEntities: ["DESKTOP-ABC123", "User: john.doe@company.com"],
    remediationSteps: [
      "Isolate affected endpoint",
      "Terminate suspicious PowerShell process",
      "Block C2 communication",
      "Scan for additional malware",
      "Reset user credentials"
    ],
    costImpact: 150000
  },
  {
    id: "EDR-2025-002",
    timestamp: "2025-01-15T16:45:22.456Z",
    severity: "Critical",
    category: "Ransomware Detection",
    title: "Ransomware Encryption Activity Detected",
    description: "Massive file encryption activity detected with ransom note creation",
    source: "CrowdStrike Falcon",
    platform: "Windows Server 2019",
    rawLog: {
      "DeviceId": "b2c3d4e5-f6g7-8901-bcde-f23456789012",
      "DeviceName": "SRV-FINANCE-01",
      "ProcessId": 5678,
      "ProcessName": "crypto.exe",
      "CommandLine": "crypto.exe -encrypt -path C:\\ -extensions .doc,.docx,.xls,.xlsx,.pdf,.zip",
      "FilesEncrypted": 15420,
      "EncryptionRate": "1500 files/minute",
      "RansomNotePath": "C:\\ransom_note.txt",
      "RansomAmount": "500000",
      "BitcoinAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "SHA256": "b2c3d4e5f6g789012345678901234567890bcdef234567890bcdef23456789012",
      "DetectionSource": "Behavioral Analysis",
      "Confidence": 99
    },
    mitreTactics: ["Impact"],
    mitreTechniques: ["T1486"],
    iocIndicators: ["1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", "b2c3d4e5f6g789012345678901234567890bcdef234567890bcdef23456789012"],
    affectedEntities: ["SRV-FINANCE-01", "Finance Department", "15420 files"],
    remediationSteps: [
      "Immediate network isolation",
      "Disconnect from backup systems",
      "Activate incident response team",
      "Assess backup integrity",
      "Contact law enforcement"
    ],
    costImpact: 500000
  },
  {
    id: "EDR-2025-003",
    timestamp: "2025-01-15T18:12:33.789Z",
    severity: "High",
    category: "Credential Access",
    title: "LSASS Memory Dumping Detected",
    description: "Attempt to extract credentials from LSASS process memory detected",
    source: "Microsoft Defender for Endpoint",
    platform: "Windows 10",
    rawLog: {
      "DeviceId": "c3d4e5f6-g7h8-9012-cdef-345678901234",
      "DeviceName": "DESKTOP-HR-05",
      "ProcessId": 9012,
      "ProcessName": "mimikatz.exe",
      "CommandLine": "mimikatz.exe privilege::debug sekurlsa::logonpasswords",
      "TargetProcess": "lsass.exe",
      "TargetProcessId": 456,
      "MemoryDumpSize": "2.5MB",
      "CredentialsExtracted": 12,
      "SHA256": "c3d4e5f6g7h890123456789012345678901cdef345678901cdef345678901234",
      "DetectionSource": "Memory Protection",
      "Confidence": 98
    },
    mitreTactics: ["Credential Access"],
    mitreTechniques: ["T1003.001"],
    iocIndicators: ["c3d4e5f6g7h890123456789012345678901cdef345678901cdef345678901234"],
    affectedEntities: ["DESKTOP-HR-05", "HR Department", "12 user accounts"],
    remediationSteps: [
      "Isolate affected endpoint",
      "Force password reset for all users",
      "Review privileged account access",
      "Enable MFA for all accounts",
      "Audit domain controller logs"
    ],
    costImpact: 200000
  },
  {
    id: "EDR-2025-004",
    timestamp: "2025-01-15T19:30:15.123Z",
    severity: "Medium",
    category: "Suspicious Activity",
    title: "Unusual Process Tree Detected",
    description: "Suspicious process tree with multiple child processes spawned from legitimate parent",
    source: "Microsoft Defender for Endpoint",
    platform: "Windows 10",
    rawLog: {
      "DeviceId": "d4e5f6g7-h8i9-0123-defg-456789012345",
      "DeviceName": "DESKTOP-MARKETING-02",
      "ProcessId": 3456,
      "ProcessName": "svchost.exe",
      "ChildProcesses": 8,
      "CommandLine": "svchost.exe -k netsvcs",
      "SuspiciousChildren": ["cmd.exe", "powershell.exe", "wmic.exe"],
      "SHA256": "d4e5f6g7h8i901234567890123456789012defg456789012defg456789012345",
      "DetectionSource": "Process Tree Analysis",
      "Confidence": 75
    },
    mitreTactics: ["Execution", "Defense Evasion"],
    mitreTechniques: ["T1055", "T1036"],
    iocIndicators: ["d4e5f6g7h8i901234567890123456789012defg456789012defg456789012345"],
    affectedEntities: ["DESKTOP-MARKETING-02", "Marketing Department"],
    remediationSteps: [
      "Investigate process tree",
      "Review parent process legitimacy",
      "Monitor for additional suspicious activity",
      "Update process monitoring rules",
      "Scan for persistence mechanisms"
    ],
    costImpact: 75000
  },
  {
    id: "EDR-2025-005",
    timestamp: "2025-01-15T20:15:42.456Z",
    severity: "Medium",
    category: "File System Activity",
    title: "Suspicious File Creation Pattern",
    description: "Multiple executable files created in temporary directories with similar timestamps",
    source: "CrowdStrike Falcon",
    platform: "Windows 10",
    rawLog: {
      "DeviceId": "e5f6g7h8-i9j0-1234-efgh-567890123456",
      "DeviceName": "DESKTOP-SALES-04",
      "ProcessId": 6789,
      "ProcessName": "explorer.exe",
      "FilesCreated": 5,
      "FilePattern": "temp_*.exe",
      "Directory": "C:\\Users\\temp\\",
      "CreationTime": "2025-01-15T20:15:42.456Z",
      "SHA256": "e5f6g7h8i9j012345678901234567890123efgh567890123efgh567890123456",
      "DetectionSource": "File System Monitoring",
      "Confidence": 82
    },
    mitreTactics: ["Execution", "Defense Evasion"],
    mitreTechniques: ["T1055.012", "T1027"],
    iocIndicators: ["e5f6g7h8i9j012345678901234567890123efgh567890123efgh567890123456"],
    affectedEntities: ["DESKTOP-SALES-04", "Sales Department"],
    remediationSteps: [
      "Quarantine suspicious files",
      "Analyze file contents",
      "Review user activity",
      "Update file monitoring rules",
      "Scan for additional malware"
    ],
    costImpact: 60000
  },
  {
    id: "EDR-2025-006",
    timestamp: "2025-01-15T21:45:18.789Z",
    severity: "Low",
    category: "Network Activity",
    title: "Suspicious Network Connection Attempt",
    description: "Multiple connection attempts to known suspicious IP addresses",
    source: "Microsoft Defender for Endpoint",
    platform: "Windows 10",
    rawLog: {
      "DeviceId": "f6g7h8i9-j0k1-2345-fghi-678901234567",
      "DeviceName": "DESKTOP-IT-03",
      "ProcessId": 2345,
      "ProcessName": "chrome.exe",
      "RemoteIPs": ["185.67.89.123", "203.45.67.89", "91.234.56.78"],
      "ConnectionAttempts": 12,
      "TimeWindow": "5 minutes",
      "UserAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "SHA256": "f6g7h8i9j0k123456789012345678901234fghi678901234fghi678901234567",
      "DetectionSource": "Network Monitoring",
      "Confidence": 65
    },
    mitreTactics: ["Command and Control"],
    mitreTechniques: ["T1071.001"],
    iocIndicators: ["185.67.89.123", "203.45.67.89", "91.234.56.78"],
    affectedEntities: ["DESKTOP-IT-03", "IT Department"],
    remediationSteps: [
      "Block suspicious IP addresses",
      "Review browser activity",
      "Scan for browser extensions",
      "Update network monitoring rules",
      "Educate user on safe browsing"
    ],
    costImpact: 25000
  },
  {
    id: "EDR-2025-007",
    timestamp: "2025-01-15T22:30:25.123Z",
    severity: "Low",
    category: "Registry Activity",
    title: "Suspicious Registry Modification",
    description: "Multiple registry keys modified to enable persistence mechanisms",
    source: "CrowdStrike Falcon",
    platform: "Windows 10",
    rawLog: {
      "DeviceId": "g7h8i9j0-k1l2-3456-ghij-789012345678",
      "DeviceName": "DESKTOP-LEGAL-01",
      "ProcessId": 4567,
      "ProcessName": "regedit.exe",
      "RegistryKeys": [
        "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
        "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run",
        "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\RunOnce"
      ],
      "Modifications": 6,
      "TimeWindow": "2 minutes",
      "SHA256": "g7h8i9j0k1l234567890123456789012345ghij789012345ghij789012345678",
      "DetectionSource": "Registry Monitoring",
      "Confidence": 70
    },
    mitreTactics: ["Persistence"],
    mitreTechniques: ["T1547.001"],
    iocIndicators: ["g7h8i9j0k1l234567890123456789012345ghij789012345ghij789012345678"],
    affectedEntities: ["DESKTOP-LEGAL-01", "Legal Department"],
    remediationSteps: [
      "Review registry modifications",
      "Remove suspicious persistence entries",
      "Scan for additional malware",
      "Update registry monitoring rules",
      "Investigate user activity"
    ],
    costImpact: 35000
  },
  {
    id: "EDR-2025-008",
    timestamp: "2025-01-15T23:15:42.456Z",
    severity: "Medium",
    category: "Process Injection",
    title: "Process Injection Attempt Detected",
    description: "Attempt to inject malicious code into legitimate process detected",
    source: "Microsoft Defender for Endpoint",
    platform: "Windows 10",
    rawLog: {
      "DeviceId": "h8i9j0k1-l2m3-4567-hijk-890123456789",
      "DeviceName": "DESKTOP-SALES-05",
      "ProcessId": 6789,
      "ProcessName": "explorer.exe",
      "InjectedProcess": "svchost.exe",
      "InjectionMethod": "CreateRemoteThread",
      "PayloadSize": "45KB",
      "SHA256": "h8i9j0k1l2m345678901234567890123456hijk890123456hijk890123456789",
      "DetectionSource": "Process Monitoring",
      "Confidence": 88
    },
    mitreTactics: ["Defense Evasion", "Execution"],
    mitreTechniques: ["T1055", "T1059"],
    iocIndicators: ["h8i9j0k1l2m345678901234567890123456hijk890123456hijk890123456789"],
    affectedEntities: ["DESKTOP-SALES-05", "Sales Department"],
    remediationSteps: [
      "Terminate injected process",
      "Scan for additional malware",
      "Review process monitoring rules",
      "Update endpoint protection",
      "Investigate user activity"
    ],
    costImpact: 55000
  },
  {
    id: "EDR-2025-009",
    timestamp: "2025-01-16T00:30:15.789Z",
    severity: "High",
    category: "Lateral Movement",
    title: "Suspicious Remote Desktop Connection",
    description: "Unusual RDP connection from external source to internal server",
    source: "Microsoft Defender for Endpoint",
    platform: "Windows Server 2019",
    rawLog: {
      "DeviceId": "i9j0k1l2-m3n4-5678-ijkl-901234567890",
      "DeviceName": "SRV-DB-01",
      "SourceIP": "203.67.89.45",
      "SourcePort": 54321,
      "DestinationPort": 3389,
      "Protocol": "RDP",
      "UserAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
      "AuthenticationMethod": "NTLM",
      "SHA256": "i9j0k1l2m3n456789012345678901234567ijkl901234567ijkl901234567890",
      "DetectionSource": "Network Monitoring",
      "Confidence": 92
    },
    mitreTactics: ["Lateral Movement"],
    mitreTechniques: ["T1021.001"],
    iocIndicators: ["203.67.89.45", "i9j0k1l2m3n456789012345678901234567ijkl901234567ijkl901234567890"],
    affectedEntities: ["SRV-DB-01", "Database Server"],
    remediationSteps: [
      "Block source IP",
      "Terminate RDP session",
      "Review authentication logs",
      "Enable MFA for RDP",
      "Update network security policies"
    ],
    costImpact: 120000
  },
  {
    id: "EDR-2025-010",
    timestamp: "2025-01-16T01:45:33.123Z",
    severity: "Critical",
    category: "Data Exfiltration",
    title: "Large Data Transfer to External Server",
    description: "Unusual large data transfer to external server detected",
    source: "CrowdStrike Falcon",
    platform: "Windows 10",
    rawLog: {
      "DeviceId": "j0k1l2m3-n4o5-6789-jklm-012345678901",
      "DeviceName": "DESKTOP-FINANCE-03",
      "ProcessId": 3456,
      "ProcessName": "filezilla.exe",
      "DestinationIP": "185.67.89.123",
      "DataTransferred": "2.5GB",
      "FileCount": 1500,
      "TransferDuration": "45 minutes",
      "SHA256": "j0k1l2m3n4o567890123456789012345678jklm012345678jklm012345678901",
      "DetectionSource": "Network Monitoring",
      "Confidence": 95
    },
    mitreTactics: ["Exfiltration"],
    mitreTechniques: ["T1041"],
    iocIndicators: ["185.67.89.123", "j0k1l2m3n4o567890123456789012345678jklm012345678jklm012345678901"],
    affectedEntities: ["DESKTOP-FINANCE-03", "Finance Department", "2.5GB data"],
    remediationSteps: [
      "Immediate network isolation",
      "Block destination IP",
      "Investigate data contents",
      "Review user permissions",
      "Enable DLP policies"
    ],
    costImpact: 250000
  }
];

// Email Security Alerts
export const emailSecurityAlerts: AzureSentinelAlert[] = [
  {
    id: "EMAIL-2025-001",
    timestamp: "2025-01-15T09:15:42.123Z",
    severity: "High",
    category: "Phishing Detection",
    title: "Suspicious Email with Malicious Link Detected",
    description: "Email containing suspicious link to credential harvesting site detected",
    source: "Microsoft Defender for Office 365",
    platform: "Exchange Online",
    rawLog: {
      "MessageId": "20250115091542.123@mail.company.com",
      "Sender": "support@microsoft-security-update.com",
      "Recipient": "ceo@company.com",
      "Subject": "URGENT: Microsoft 365 Security Update Required",
      "Body": "Your Microsoft 365 account requires immediate security verification. Click here to verify: https://microsoft-security-verify.xyz/login",
      "MaliciousUrl": "https://microsoft-security-verify.xyz/login",
      "UrlCategory": "Phishing",
      "ThreatScore": 95,
      "AttachmentCount": 0,
      "MessageSize": "2.3KB",
      "DetectionSource": "URL Reputation",
      "Confidence": 92
    },
    mitreTactics: ["Initial Access", "Credential Access"],
    mitreTechniques: ["T1566.002", "T1078"],
    iocIndicators: ["microsoft-security-verify.xyz", "support@microsoft-security-update.com"],
    affectedEntities: ["ceo@company.com", "Executive Office"],
    remediationSteps: [
      "Quarantine email",
      "Block sender domain",
      "Alert recipient",
      "Scan for similar emails",
      "Update email security rules"
    ],
    costImpact: 75000
  },
  {
    id: "EMAIL-2025-002",
    timestamp: "2025-01-15T11:23:15.456Z",
    severity: "Critical",
    category: "Business Email Compromise",
    title: "CEO Fraud Attempt Detected",
    description: "Spoofed CEO email requesting urgent wire transfer detected",
    source: "Microsoft Defender for Office 365",
    platform: "Exchange Online",
    rawLog: {
      "MessageId": "20250115112315.456@mail.company.com",
      "Sender": "ceo@company.com",
      "Recipient": "finance@company.com",
      "Subject": "URGENT: Wire Transfer Required",
      "Body": "I need you to process an urgent wire transfer of $250,000 to account 1234567890. This is confidential and urgent. Reply immediately.",
      "SpoofedDomain": "company.com",
      "WireTransferAmount": "250000",
      "BankAccount": "1234567890",
      "ThreatScore": 99,
      "DetectionSource": "BEC Protection",
      "Confidence": 97
    },
    mitreTactics: ["Initial Access", "Impact"],
    mitreTechniques: ["T1566.001", "T1498"],
    iocIndicators: ["1234567890", "ceo@company.com"],
    affectedEntities: ["finance@company.com", "Finance Department", "$250,000"],
    remediationSteps: [
      "Immediate email quarantine",
      "Contact CEO directly",
      "Freeze wire transfer",
      "Alert legal team",
      "Update BEC policies"
    ],
    costImpact: 250000
  },
  {
    id: "EMAIL-2025-003",
    timestamp: "2025-01-15T14:07:28.789Z",
    severity: "High",
    category: "Malware Delivery",
    title: "Malicious Attachment Detected",
    description: "Email with malicious Excel macro attachment detected",
    source: "Microsoft Defender for Office 365",
    platform: "Exchange Online",
    rawLog: {
      "MessageId": "20250115140728.789@mail.company.com",
      "Sender": "invoice@supplier-company.net",
      "Recipient": "accounts@company.com",
      "Subject": "Invoice Q1-2025",
      "AttachmentName": "Invoice_Q1_2025.xlsm",
      "AttachmentSize": "156KB",
      "SHA256": "d4e5f6g7h8901234567890123456789012def456789012def456789012345678",
      "MalwareFamily": "Emotet",
      "ThreatScore": 88,
      "DetectionSource": "Attachment Analysis",
      "Confidence": 85
    },
    mitreTactics: ["Initial Access", "Execution"],
    mitreTechniques: ["T1566.001", "T1059.005"],
    iocIndicators: ["d4e5f6g7h8901234567890123456789012def456789012def456789012345678", "invoice@supplier-company.net"],
    affectedEntities: ["accounts@company.com", "Accounts Department"],
    remediationSteps: [
      "Quarantine email and attachment",
      "Block sender domain",
      "Scan recipient's device",
      "Update macro security settings",
      "Train users on attachment safety"
    ],
    costImpact: 80000
  },
  {
    id: "EMAIL-2025-004",
    timestamp: "2025-01-15T15:30:12.456Z",
    severity: "Medium",
    category: "Spam Detection",
    title: "Bulk Spam Campaign Detected",
    description: "Large volume of spam emails with suspicious content patterns",
    source: "Microsoft Defender for Office 365",
    platform: "Exchange Online",
    rawLog: {
      "MessageId": "20250115153012.456@mail.company.com",
      "Sender": "noreply@legitimate-looking-domain.com",
      "Recipient": "hr@company.com",
      "Subject": "Important: Your Account Has Been Suspended",
      "Body": "Your account has been suspended due to security concerns. Click here to verify your identity immediately.",
      "SpamScore": 85,
      "Volume": 1500,
      "TimeWindow": "1 hour",
      "DetectionSource": "Spam Filter",
      "Confidence": 78
    },
    mitreTactics: ["Initial Access"],
    mitreTechniques: ["T1566.002"],
    iocIndicators: ["noreply@legitimate-looking-domain.com", "1500 emails"],
    affectedEntities: ["hr@company.com", "HR Department"],
    remediationSteps: [
      "Quarantine spam emails",
      "Block sender domain",
      "Update spam filter rules",
      "Monitor for similar campaigns",
      "Review email security policies"
    ],
    costImpact: 15000
  },
  {
    id: "EMAIL-2025-005",
    timestamp: "2025-01-15T16:45:33.789Z",
    severity: "Low",
    category: "Suspicious Activity",
    title: "Unusual Email Volume from Single Sender",
    description: "Unusual number of emails sent from single sender in short time period",
    source: "Microsoft Defender for Office 365",
    platform: "Exchange Online",
    rawLog: {
      "MessageId": "20250115164533.789@mail.company.com",
      "Sender": "marketing@company-partner.com",
      "Recipient": "sales@company.com",
      "Subject": "New Partnership Opportunity",
      "Body": "We would like to discuss a new partnership opportunity with your company.",
      "EmailCount": 45,
      "TimeWindow": "30 minutes",
      "DetectionSource": "Volume Analysis",
      "Confidence": 65
    },
    mitreTactics: ["Initial Access"],
    mitreTechniques: ["T1566.001"],
    iocIndicators: ["marketing@company-partner.com", "45 emails"],
    affectedEntities: ["sales@company.com", "Sales Department"],
    remediationSteps: [
      "Review sender legitimacy",
      "Monitor email patterns",
      "Update volume thresholds",
      "Investigate sender domain",
      "Document incident"
    ],
    costImpact: 5000
  }
];

// Combine original alerts with generated alerts (will be updated after all arrays are defined)
export let allEmailSecurityAlerts = [...emailSecurityAlerts];

// Network Security Alerts
export const networkAlerts: AzureSentinelAlert[] = [
  {
    id: "NET-2025-001",
    timestamp: "2025-01-15T13:45:12.123Z",
    severity: "High",
    category: "Intrusion Detection",
    title: "SQL Injection Attempt Detected",
    description: "Multiple SQL injection attempts against web application database",
    source: "Azure Network Security Group",
    platform: "Azure Web App",
    rawLog: {
      "SourceIP": "203.45.67.89",
      "DestinationIP": "10.0.0.50",
      "SourcePort": 54321,
      "DestinationPort": 443,
      "Protocol": "HTTPS",
      "Payload": "'; DROP TABLE users; --",
      "InjectionType": "SQL Injection",
      "Attempts": 47,
      "TimeWindow": "5 minutes",
      "WebApp": "customer-portal.azurewebsites.net",
      "DetectionSource": "WAF Rules",
      "Confidence": 94
    },
    mitreTactics: ["Initial Access", "Collection"],
    mitreTechniques: ["T1190", "T1110"],
    iocIndicators: ["203.45.67.89", "customer-portal.azurewebsites.net"],
    affectedEntities: ["Customer Portal", "Database Server"],
    remediationSteps: [
      "Block source IP",
      "Review WAF rules",
      "Audit database access",
      "Scan for data exfiltration",
      "Update application security"
    ],
    costImpact: 120000
  },
  {
    id: "NET-2025-002",
    timestamp: "2025-01-15T15:22:33.456Z",
    severity: "Critical",
    category: "DDoS Attack",
    title: "Distributed Denial of Service Attack",
    description: "Large-scale DDoS attack targeting web services",
    source: "Azure DDoS Protection",
    platform: "Azure Load Balancer",
    rawLog: {
      "AttackType": "Volumetric DDoS",
      "PeakTraffic": "45 Gbps",
      "SourceIPs": 12500,
      "TargetIP": "20.45.67.89",
      "TargetPort": 80,
      "Duration": "2 hours 15 minutes",
      "MitigationStatus": "Active",
      "TrafficFiltered": "98.5%",
      "ServiceAvailability": "99.2%",
      "DetectionSource": "DDoS Protection",
      "Confidence": 99
    },
    mitreTactics: ["Impact"],
    mitreTechniques: ["T1498"],
    iocIndicators: ["20.45.67.89", "12500 source IPs"],
    affectedEntities: ["Web Services", "Customer Portal", "API Gateway"],
    remediationSteps: [
      "Activate DDoS protection",
      "Scale up resources",
      "Monitor service health",
      "Contact ISP",
      "Review security posture"
    ],
    costImpact: 300000
  },
  {
    id: "NET-2025-003",
    timestamp: "2025-01-15T17:08:45.789Z",
    severity: "Medium",
    category: "Port Scanning",
    title: "Port Scanning Activity Detected",
    description: "Systematic port scanning from external source",
    source: "Azure Network Watcher",
    platform: "Azure Virtual Network",
    rawLog: {
      "SourceIP": "185.67.89.123",
      "DestinationIP": "10.0.0.100",
      "ScannedPorts": [22, 23, 25, 53, 80, 443, 3389, 8080],
      "ScanDuration": "45 minutes",
      "PacketsSent": 1250,
      "ScanType": "TCP Connect",
      "GeographicLocation": "Russia",
      "ISP": "AS12345 - Russian ISP",
      "DetectionSource": "Network Monitoring",
      "Confidence": 87
    },
    mitreTactics: ["Reconnaissance"],
    mitreTechniques: ["T1046"],
    iocIndicators: ["185.67.89.123", "AS12345"],
    affectedEntities: ["Internal Network", "10.0.0.100"],
    remediationSteps: [
      "Block source IP",
      "Review firewall rules",
      "Monitor for follow-up activity",
      "Update security policies",
      "Document incident"
    ],
    costImpact: 25000
  },
  {
    id: "NET-2025-004",
    timestamp: "2025-01-15T18:30:22.123Z",
    severity: "High",
    category: "Brute Force Attack",
    title: "SSH Brute Force Attack Detected",
    description: "Multiple failed SSH login attempts from external source",
    source: "Azure Network Security Group",
    platform: "Azure Virtual Machine",
    rawLog: {
      "SourceIP": "203.67.89.45",
      "DestinationIP": "10.0.0.75",
      "DestinationPort": 22,
      "Protocol": "SSH",
      "FailedAttempts": 156,
      "TimeWindow": "10 minutes",
      "Usernames": ["admin", "root", "ubuntu", "azureuser"],
      "GeographicLocation": "China",
      "DetectionSource": "Network Monitoring",
      "Confidence": 92
    },
    mitreTactics: ["Initial Access"],
    mitreTechniques: ["T1110.001"],
    iocIndicators: ["203.67.89.45", "10.0.0.75"],
    affectedEntities: ["VM-SERVER-01", "Development Environment"],
    remediationSteps: [
      "Block source IP",
      "Review SSH configuration",
      "Enable key-based authentication",
      "Monitor for successful logins",
      "Update security policies"
    ],
    costImpact: 85000
  },
  {
    id: "NET-2025-005",
    timestamp: "2025-01-15T19:15:45.456Z",
    severity: "Medium",
    category: "Suspicious Traffic",
    title: "Unusual Outbound Traffic Pattern",
    description: "Unusual volume of outbound traffic to external destination",
    source: "Azure Network Watcher",
    platform: "Azure Virtual Network",
    rawLog: {
      "SourceIP": "10.0.0.42",
      "DestinationIP": "185.67.89.123",
      "Protocol": "HTTPS",
      "DataVolume": "2.5GB",
      "TimeWindow": "30 minutes",
      "ConnectionDuration": "25 minutes",
      "UserAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "DetectionSource": "Traffic Analysis",
      "Confidence": 78
    },
    mitreTactics: ["Exfiltration"],
    mitreTechniques: ["T1041"],
    iocIndicators: ["185.67.89.123", "10.0.0.42"],
    affectedEntities: ["DESKTOP-SALES-02", "Sales Department"],
    remediationSteps: [
      "Investigate traffic purpose",
      "Review user activity",
      "Monitor for data exfiltration",
      "Update network policies",
      "Scan for malware"
    ],
    costImpact: 45000
  }
];

// Generate additional Network Security alerts to reach 30 total
const generateAdditionalNetworkAlerts = (): AzureSentinelAlert[] => {
  const additionalAlerts: AzureSentinelAlert[] = [];
  const alertTypes = [
    { category: "Intrusion Detection", severity: "High", costImpact: 120000 },
    { category: "DDoS Attack", severity: "Critical", costImpact: 300000 },
    { category: "Port Scanning", severity: "Medium", costImpact: 25000 },
    { category: "Brute Force Attack", severity: "High", costImpact: 85000 },
    { category: "Suspicious Traffic", severity: "Medium", costImpact: 45000 }
  ];

  for (let i = 6; i <= 30; i++) {
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
    
    additionalAlerts.push({
      id: `NET-2025-${i.toString().padStart(3, '0')}`,
      timestamp,
      severity: alertType.severity as "Low" | "Medium" | "High" | "Critical",
      category: alertType.category,
      title: `Network Security Alert ${i}`,
      description: `Automated network security alert ${i} for monitoring and analysis`,
      source: "Azure Network Security Group",
      platform: "Azure Virtual Network",
      rawLog: {
        "SourceIP": `203.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        "DestinationIP": `10.0.0.${Math.floor(Math.random() * 255)}`,
        "DetectionSource": "Automated Monitoring",
        "Confidence": Math.floor(Math.random() * 30) + 70
      },
      mitreTactics: ["Initial Access"],
      mitreTechniques: ["T1190"],
      iocIndicators: [`203.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`],
      affectedEntities: [`Network-Segment-${i}`],
      remediationSteps: [
        "Review alert details",
        "Monitor for similar activity",
        "Update security rules if needed",
        "Document incident"
      ],
      costImpact: alertType.costImpact
    });
  }

  return additionalAlerts;
};

// Combine original alerts with generated alerts
export const allNetworkAlerts = [
  ...networkAlerts,
  ...generateAdditionalNetworkAlerts()
];

// Web Filtering Alerts
export const webFilteringAlerts: AzureSentinelAlert[] = [
  {
    id: "WEB-2025-001",
    timestamp: "2025-01-15T10:30:15.123Z",
    severity: "High",
    category: "Malicious Website Access",
    title: "Access to Malicious Website Blocked",
    description: "User attempted to access known malicious website",
    source: "Azure Web Application Firewall",
    platform: "Azure Front Door",
    rawLog: {
      "UserIP": "10.0.0.25",
      "UserAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "RequestedURL": "http://malware-distribution.xyz/download",
      "Category": "Malware Distribution",
      "ThreatScore": 95,
      "BlockReason": "Known malicious domain",
      "UserID": "john.doe@company.com",
      "DeviceName": "DESKTOP-MARKETING-03",
      "DetectionSource": "URL Filtering",
      "Confidence": 96
    },
    mitreTactics: ["Initial Access"],
    mitreTechniques: ["T1071.001"],
    iocIndicators: ["malware-distribution.xyz", "10.0.0.25"],
    affectedEntities: ["john.doe@company.com", "Marketing Department"],
    remediationSteps: [
      "Block malicious domain",
      "Scan user's device",
      "Review user's browsing history",
      "Update web filtering rules",
      "Provide security training"
    ],
    costImpact: 60000
  },
  {
    id: "WEB-2025-002",
    timestamp: "2025-01-15T12:15:42.456Z",
    severity: "Medium",
    category: "Data Exfiltration Attempt",
    title: "Suspicious File Upload Attempt",
    description: "Large file upload to external file sharing service",
    source: "Azure Web Application Firewall",
    platform: "Azure App Service",
    rawLog: {
      "UserIP": "10.0.0.42",
      "UserAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "UploadURL": "https://dropbox.com/upload",
      "FileSize": "250MB",
      "FileType": "ZIP Archive",
      "FileName": "company_data_backup.zip",
      "UserID": "jane.smith@company.com",
      "DeviceName": "DESKTOP-HR-02",
      "DetectionSource": "DLP Rules",
      "Confidence": 78
    },
    mitreTactics: ["Exfiltration"],
    mitreTechniques: ["T1041"],
    iocIndicators: ["dropbox.com", "company_data_backup.zip"],
    affectedEntities: ["jane.smith@company.com", "HR Department", "250MB data"],
    remediationSteps: [
      "Block upload attempt",
      "Investigate file contents",
      "Review user permissions",
      "Update DLP policies",
      "Audit data access"
    ],
    costImpact: 45000
  },
  {
    id: "WEB-2025-003",
    timestamp: "2025-01-15T14:45:18.789Z",
    severity: "High",
    category: "Cross-Site Scripting",
    title: "XSS Attack Attempt Detected",
    description: "Cross-site scripting payload detected in web form submission",
    source: "Azure Web Application Firewall",
    platform: "Azure App Service",
    rawLog: {
      "SourceIP": "203.67.89.45",
      "TargetURL": "https://company-portal.azurewebsites.net/contact",
      "Payload": "<script>alert('XSS')</script>",
      "AttackType": "Reflected XSS",
      "FormField": "message",
      "UserAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "DetectionSource": "WAF Rules",
      "Confidence": 91
    },
    mitreTactics: ["Initial Access"],
    mitreTechniques: ["T1059.005"],
    iocIndicators: ["203.67.89.45", "company-portal.azurewebsites.net"],
    affectedEntities: ["Company Portal", "Contact Form"],
    remediationSteps: [
      "Block source IP",
      "Sanitize input validation",
      "Update WAF rules",
      "Review application code",
      "Test security controls"
    ],
    costImpact: 35000
  }
];

// Cloud Security Alerts
export const cloudSecurityAlerts: AzureSentinelAlert[] = [
  {
    id: "CLOUD-2025-001",
    timestamp: "2025-01-15T08:20:33.123Z",
    severity: "Critical",
    category: "Unauthorized Access",
    title: "Suspicious API Access from Unusual Location",
    description: "API calls from unexpected geographic location with elevated permissions",
    source: "Azure Active Directory",
    platform: "Azure Cloud",
    rawLog: {
      "UserID": "admin@company.com",
      "Application": "Microsoft Graph API",
      "Resource": "https://graph.microsoft.com/v1.0/users",
      "IPAddress": "185.67.89.123",
      "Location": "Moscow, Russia",
      "UserAgent": "PostmanRuntime/7.28.0",
      "Permissions": ["User.ReadWrite.All", "Directory.ReadWrite.All"],
      "APICalls": 150,
      "TimeWindow": "30 minutes",
      "DetectionSource": "Identity Protection",
      "Confidence": 97
    },
    mitreTactics: ["Initial Access", "Collection"],
    mitreTechniques: ["T1078", "T1078.004"],
    iocIndicators: ["185.67.89.123", "admin@company.com"],
    affectedEntities: ["Azure AD", "User Directory", "Microsoft Graph API"],
    remediationSteps: [
      "Immediate account lockout",
      "Revoke all sessions",
      "Reset admin credentials",
      "Review audit logs",
      "Enable MFA enforcement"
    ],
    costImpact: 180000
  },
  {
    id: "CLOUD-2025-002",
    timestamp: "2025-01-15T11:45:12.456Z",
    severity: "High",
    category: "Data Exfiltration",
    title: "Large Data Export from Storage Account",
    description: "Unusual large data export from Azure Storage account",
    source: "Azure Storage Analytics",
    platform: "Azure Storage",
    rawLog: {
      "StorageAccount": "companydata2025",
      "Container": "customer-data",
      "Operation": "GetBlob",
      "UserID": "data-analyst@company.com",
      "IPAddress": "10.0.0.100",
      "DataSize": "2.5GB",
      "FilesExported": 1500,
      "TimeWindow": "2 hours",
      "ExportMethod": "Azure Storage Explorer",
      "DetectionSource": "Storage Monitoring",
      "Confidence": 89
    },
    mitreTactics: ["Exfiltration"],
    mitreTechniques: ["T1041"],
    iocIndicators: ["companydata2025", "data-analyst@company.com", "2.5GB"],
    affectedEntities: ["Customer Data", "Azure Storage", "1500 files"],
    remediationSteps: [
      "Suspend storage access",
      "Investigate export purpose",
      "Review data classification",
      "Update access policies",
      "Monitor for data misuse"
    ],
    costImpact: 120000
  },
  {
    id: "CLOUD-2025-003",
    timestamp: "2025-01-15T16:30:25.789Z",
    severity: "Medium",
    category: "Resource Abuse",
    title: "Cryptocurrency Mining Activity Detected",
    description: "Suspicious CPU usage patterns consistent with crypto mining",
    source: "Azure Monitor",
    platform: "Azure Virtual Machine",
    rawLog: {
      "VMName": "dev-server-01",
      "ResourceGroup": "development-rg",
      "CPUUsage": "95%",
      "MemoryUsage": "87%",
      "NetworkTraffic": "High",
      "ProcessName": "xmrig.exe",
      "ProcessID": 5678,
      "CommandLine": "xmrig.exe -o stratum+tcp://pool.minexmr.com:3333 -u 4A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
      "DetectionSource": "Performance Monitoring",
      "Confidence": 82
    },
    mitreTactics: ["Impact"],
    mitreTechniques: ["T1496"],
    iocIndicators: ["xmrig.exe", "pool.minexmr.com", "4A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"],
    affectedEntities: ["dev-server-01", "Development Environment"],
    remediationSteps: [
      "Stop affected VM",
      "Remove malicious process",
      "Scan for persistence",
      "Review VM security",
      "Update monitoring rules"
    ],
    costImpact: 40000
  }
];



// Helper function to get alerts by category
export const getAlertsByCategory = (category: string): AzureSentinelAlert[] => {
  switch (category.toLowerCase()) {
    case 'edr':
      return allAzureSentinelAlerts.edr;
    case 'email':
      return allAzureSentinelAlerts.email;
    case 'network':
      return allAzureSentinelAlerts.network;
    case 'web':
      return allAzureSentinelAlerts.web;
    case 'cloud':
      return allAzureSentinelAlerts.cloud;
    default:
      return [];
  }
};

// Helper function to get alerts by severity
export const getAlertsBySeverity = (severity: string): AzureSentinelAlert[] => {
  const allAlerts = [
    ...allAzureSentinelAlerts.edr,
    ...allAzureSentinelAlerts.email,
    ...allAzureSentinelAlerts.network,
    ...allAzureSentinelAlerts.web,
    ...allAzureSentinelAlerts.cloud
  ];
  
  return allAlerts.filter(alert => alert.severity.toLowerCase() === severity.toLowerCase());
};

// Helper function to get total cost impact
export const getTotalCostImpact = (): number => {
  const allAlerts = [
    ...allAzureSentinelAlerts.edr,
    ...allAzureSentinelAlerts.email,
    ...allAzureSentinelAlerts.network,
    ...allAzureSentinelAlerts.web,
    ...allAzureSentinelAlerts.cloud
  ];
  
  return allAlerts.reduce((total, alert) => total + alert.costImpact, 0);
};

// Generate additional Email Security alerts to reach target total
const generateAdditionalEmailAlerts = (): AzureSentinelAlert[] => {
  const additionalAlerts: AzureSentinelAlert[] = [];
  const alertTypes = [
    { category: "Phishing Detection", severity: "High", costImpact: 75000 },
    { category: "Spam Detection", severity: "Medium", costImpact: 15000 },
    { category: "Suspicious Activity", severity: "Low", costImpact: 5000 },
    { category: "Malware Delivery", severity: "High", costImpact: 80000 },
    { category: "Business Email Compromise", severity: "Critical", costImpact: 250000 }
  ];

  // Calculate how many additional alerts we need to reach 800 total
  const currentTotal = edrAlerts.length + emailSecurityAlerts.length + networkAlerts.length + webFilteringAlerts.length + cloudSecurityAlerts.length;
  const targetTotal = 800;
  const additionalNeeded = Math.max(0, targetTotal - currentTotal);

  for (let i = 6; i <= 6 + additionalNeeded; i++) {
    const alertType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const timestamp = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString();
    
    additionalAlerts.push({
      id: `EMAIL-2025-${i.toString().padStart(3, '0')}`,
      timestamp,
      severity: alertType.severity as "Low" | "Medium" | "High" | "Critical",
      category: alertType.category,
      title: `Email Security Alert ${i}`,
      description: `Automated email security alert ${i} for monitoring and analysis`,
      source: "Microsoft Defender for Office 365",
      platform: "Exchange Online",
      rawLog: {
        "MessageId": `20250115${i.toString().padStart(6, '0')}@mail.company.com`,
        "Sender": `sender${i}@example.com`,
        "Recipient": `recipient${i}@company.com`,
        "Subject": `Alert ${i} - Security Notification`,
        "DetectionSource": "Automated Monitoring",
        "Confidence": Math.floor(Math.random() * 30) + 70
      },
      mitreTactics: ["Initial Access"],
      mitreTechniques: ["T1566.001"],
      iocIndicators: [`sender${i}@example.com`],
      affectedEntities: [`recipient${i}@company.com`],
      remediationSteps: [
        "Review alert details",
        "Monitor for similar activity",
        "Update security rules if needed",
        "Document incident"
      ],
      costImpact: alertType.costImpact
    });
  }

  return additionalAlerts;
};

// Update allEmailSecurityAlerts with generated alerts (now that all arrays are defined)
const additionalEmailAlerts = generateAdditionalEmailAlerts();
allEmailSecurityAlerts.push(...additionalEmailAlerts);

// Generate additional EDR alerts to reach 826 total with exactly 10 critical
const generateAdditionalEDRAlerts = () => {
  const targetTotal = 1642;
  const currentEDRCount = edrAlerts.length;
  const additionalNeeded = Math.max(0, targetTotal - currentEDRCount);
  
  if (additionalNeeded <= 0) return [];
  
  const additionalAlerts: AzureSentinelAlert[] = [];
  const sources = ['Microsoft Defender for Endpoint', 'CrowdStrike Falcon'];
  const categories = ['Malware Detection', 'Ransomware Detection', 'Credential Access', 'Suspicious Activity', 'Process Injection', 'Lateral Movement', 'Data Exfiltration', 'Network Activity', 'Registry Activity'];
  
  // Count existing critical alerts in edrAlerts
  const existingCriticalCount = edrAlerts.filter(alert => alert.severity === 'Critical').length;
  const targetCriticalCount = 159;
  const additionalCriticalNeeded = Math.max(0, targetCriticalCount - existingCriticalCount);
  
  // Count existing high alerts in edrAlerts
  const existingHighCount = edrAlerts.filter(alert => alert.severity === 'High').length;
  const targetHighCount = 439;
  const additionalHighNeeded = Math.max(0, targetHighCount - existingHighCount);
  
  // Calculate other severities needed
  const remainingAlerts = additionalNeeded - additionalCriticalNeeded - additionalHighNeeded;
  const mediumCount = Math.floor(remainingAlerts * 0.5);
  const lowCount = remainingAlerts - mediumCount;
  
  // Generate critical alerts first
  for (let i = 0; i < additionalCriticalNeeded; i++) {
    const source = sources[i % sources.length];
    const category = categories[i % categories.length];
    const alertId = `EDR-2025-${String(i + 11).padStart(3, '0')}`;
    
    additionalAlerts.push({
      id: alertId,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      severity: 'Critical',
      category,
      title: `EDR Critical Alert ${i + 11}`,
      description: `Critical Endpoint Detection & Response alert ${i + 11} requiring immediate attention`,
      source,
      platform: "Windows 10",
      rawLog: {
        "AlertId": alertId,
        "Severity": "Critical",
        "Category": category,
        "Source": source,
        "Timestamp": new Date().toISOString(),
        "Confidence": 95 + Math.floor(Math.random() * 5)
      },
      mitreTactics: ["Initial Access", "Execution", "Defense Evasion", "Impact"],
      mitreTechniques: ["T1078", "T1059", "T1027", "T1486"],
      iocIndicators: [`critical-ioc-${i}`],
      affectedEntities: [`critical-endpoint-${i}`],
      remediationSteps: [
        "Immediate containment required",
        "Isolate affected systems",
        "Initiate incident response",
        "Notify security team"
      ],
      costImpact: 150000 + Math.floor(Math.random() * 100000)
    });
  }
  
  // Generate high severity alerts
  for (let i = 0; i < additionalHighNeeded; i++) {
    const source = sources[i % sources.length];
    const category = categories[i % categories.length];
    const alertId = `EDR-2025-${String(i + 11 + additionalCriticalNeeded).padStart(3, '0')}`;
    
    additionalAlerts.push({
      id: alertId,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      severity: 'High',
      category,
      title: `EDR High Alert ${i + 11 + additionalCriticalNeeded}`,
      description: `High priority Endpoint Detection & Response alert ${i + 11 + additionalCriticalNeeded}`,
      source,
      platform: "Windows 10",
      rawLog: {
        "AlertId": alertId,
        "Severity": "High",
        "Category": category,
        "Source": source,
        "Timestamp": new Date().toISOString(),
        "Confidence": 85 + Math.floor(Math.random() * 10)
      },
      mitreTactics: ["Initial Access", "Execution", "Defense Evasion"],
      mitreTechniques: ["T1078", "T1059", "T1027"],
      iocIndicators: [`high-ioc-${i}`],
      affectedEntities: [`high-endpoint-${i}`],
      remediationSteps: [
        "Investigate alert",
        "Apply recommended actions",
        "Update security policies"
      ],
      costImpact: 75000 + Math.floor(Math.random() * 50000)
    });
  }
  
  // Generate medium severity alerts
  for (let i = 0; i < mediumCount; i++) {
    const source = sources[i % sources.length];
    const category = categories[i % categories.length];
    const alertId = `EDR-2025-${String(i + 11 + additionalCriticalNeeded + additionalHighNeeded).padStart(3, '0')}`;
    
    additionalAlerts.push({
      id: alertId,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      severity: 'Medium',
      category,
      title: `EDR Medium Alert ${i + 11 + additionalCriticalNeeded + additionalHighNeeded}`,
      description: `Medium priority Endpoint Detection & Response alert ${i + 11 + additionalCriticalNeeded + additionalHighNeeded}`,
      source,
      platform: "Windows 10",
      rawLog: {
        "AlertId": alertId,
        "Severity": "Medium",
        "Category": category,
        "Source": source,
        "Timestamp": new Date().toISOString(),
        "Confidence": 75 + Math.floor(Math.random() * 15)
      },
      mitreTactics: ["Initial Access", "Execution"],
      mitreTechniques: ["T1078", "T1059"],
      iocIndicators: [`medium-ioc-${i}`],
      affectedEntities: [`medium-endpoint-${i}`],
      remediationSteps: [
        "Monitor activity",
        "Review security logs",
        "Update threat intelligence"
      ],
      costImpact: 35000 + Math.floor(Math.random() * 30000)
    });
  }
  
  // Generate low severity alerts
  for (let i = 0; i < lowCount; i++) {
    const source = sources[i % sources.length];
    const category = categories[i % categories.length];
    const alertId = `EDR-2025-${String(i + 11 + additionalCriticalNeeded + additionalHighNeeded + mediumCount).padStart(3, '0')}`;
    
    additionalAlerts.push({
      id: alertId,
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      severity: 'Low',
      category,
      title: `EDR Low Alert ${i + 11 + additionalCriticalNeeded + additionalHighNeeded + mediumCount}`,
      description: `Low priority Endpoint Detection & Response alert ${i + 11 + additionalCriticalNeeded + additionalHighNeeded + mediumCount}`,
      source,
      platform: "Windows 10",
      rawLog: {
        "AlertId": alertId,
        "Severity": "Low",
        "Category": category,
        "Source": source,
        "Timestamp": new Date().toISOString(),
        "Confidence": 65 + Math.floor(Math.random() * 20)
      },
      mitreTactics: ["Initial Access"],
      mitreTechniques: ["T1078"],
      iocIndicators: [`low-ioc-${i}`],
      affectedEntities: [`low-endpoint-${i}`],
      remediationSteps: [
        "Document activity",
        "Monitor for escalation",
        "Update baseline"
      ],
      costImpact: 15000 + Math.floor(Math.random() * 20000)
    });
  }
  
  return additionalAlerts;
};

// Generate additional EDR alerts
const additionalEDRAlerts = generateAdditionalEDRAlerts();

// Dynamic alert export function that generates alerts based on timeframe
export const getTimeframeAlerts = (timeframe: string = "Q3 2025") => {
  const timeframeAlerts = generateTimeframeAlerts(timeframe);
  
  return {
    edr: timeframeAlerts,
    email: [],
    network: [],
    web: [],
    cloud: []
  };
};

// Legacy export for backward compatibility (defaults to Q3 2025)
export const allAzureSentinelAlerts = getTimeframeAlerts("Q3 2025");
