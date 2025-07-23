export interface MITRETechnique {
  id: string;
  name: string;
  description: string;
  tactic: string;
  subtechniques?: MITRETechnique[];
  detectionRules: string[];
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface MITRETactic {
  id: string;
  name: string;
  description: string;
  techniques: MITRETechnique[];
}

export class MITREAttackMapper {
  private tactics: MITRETactic[] = [];
  private techniques: MITRETechnique[] = [];

  constructor() {
    this.initializeMITREData();
  }

  private initializeMITREData() {
    // Initialize with common MITRE ATT&CK tactics and techniques
    this.tactics = [
      {
        id: 'TA0001',
        name: 'Initial Access',
        description: 'The adversary is trying to get into your network.',
        techniques: [
          {
            id: 'T1078',
            name: 'Valid Accounts',
            description: 'Adversaries may obtain and abuse credentials of existing accounts as a means of gaining Initial Access, Persistence, Privilege Escalation, or Defense Evasion.',
            tactic: 'Initial Access',
            detectionRules: ['rule-001', 'rule-002'],
            severity: 'high'
          },
          {
            id: 'T1566',
            name: 'Phishing',
            description: 'Adversaries may send phishing messages to gain access to victim systems.',
            tactic: 'Initial Access',
            detectionRules: ['rule-003'],
            severity: 'medium'
          }
        ]
      },
      {
        id: 'TA0002',
        name: 'Execution',
        description: 'The adversary is trying to run malicious code.',
        techniques: [
          {
            id: 'T1059',
            name: 'Command and Scripting Interpreter',
            description: 'Adversaries may abuse command and script interpreters to execute commands, scripts, or binaries.',
            tactic: 'Execution',
            detectionRules: ['rule-004'],
            severity: 'critical'
          }
        ]
      },
      {
        id: 'TA0003',
        name: 'Persistence',
        description: 'The adversary is trying to maintain their foothold.',
        techniques: [
          {
            id: 'T1098',
            name: 'Account Manipulation',
            description: 'Adversaries may manipulate accounts to maintain access to victim systems.',
            tactic: 'Persistence',
            detectionRules: ['rule-005'],
            severity: 'high'
          }
        ]
      },
      {
        id: 'TA0004',
        name: 'Privilege Escalation',
        description: 'The adversary is trying to gain higher-level permissions.',
        techniques: [
          {
            id: 'T1068',
            name: 'Exploitation for Privilege Escalation',
            description: 'Adversaries may exploit software vulnerabilities in an attempt to collect privileges.',
            tactic: 'Privilege Escalation',
            detectionRules: ['rule-006'],
            severity: 'critical'
          }
        ]
      },
      {
        id: 'TA0005',
        name: 'Defense Evasion',
        description: 'The adversary is trying to avoid being detected.',
        techniques: [
          {
            id: 'T1070',
            name: 'Indicator Removal on Host',
            description: 'Adversaries may delete or modify artifacts generated on a host system to remove evidence of their presence or hinder defenses.',
            tactic: 'Defense Evasion',
            detectionRules: ['rule-007'],
            severity: 'high'
          }
        ]
      },
      {
        id: 'TA0006',
        name: 'Credential Access',
        description: 'The adversary is trying to steal account names and passwords.',
        techniques: [
          {
            id: 'T1003',
            name: 'OS Credential Dumping',
            description: 'Adversaries may attempt to dump credentials to obtain account login and credential material.',
            tactic: 'Credential Access',
            detectionRules: ['rule-008'],
            severity: 'critical'
          }
        ]
      },
      {
        id: 'TA0007',
        name: 'Discovery',
        description: 'The adversary is trying to figure out your environment.',
        techniques: [
          {
            id: 'T1082',
            name: 'System Information Discovery',
            description: 'Adversaries may attempt to get detailed information about the operating system and hardware.',
            tactic: 'Discovery',
            detectionRules: ['rule-009'],
            severity: 'medium'
          }
        ]
      },
      {
        id: 'TA0008',
        name: 'Lateral Movement',
        description: 'The adversary is trying to move through your environment.',
        techniques: [
          {
            id: 'T1021',
            name: 'Remote Services',
            description: 'Adversaries may use Valid Accounts to log into a service specifically designed to accept remote connections.',
            tactic: 'Lateral Movement',
            detectionRules: ['rule-010'],
            severity: 'high'
          }
        ]
      },
      {
        id: 'TA0009',
        name: 'Collection',
        description: 'The adversary is trying to gather data of interest to their goal.',
        techniques: [
          {
            id: 'T1005',
            name: 'Data from Local System',
            description: 'Adversaries may search local system sources, such as file systems and configuration files or local databases.',
            tactic: 'Collection',
            detectionRules: ['rule-011'],
            severity: 'high'
          }
        ]
      },
      {
        id: 'TA0011',
        name: 'Command and Control',
        description: 'The adversary is trying to communicate with compromised systems to control them.',
        techniques: [
          {
            id: 'T1071',
            name: 'Application Layer Protocol',
            description: 'Adversaries may communicate using application layer protocols to avoid detection/network filtering by blending in with existing traffic.',
            tactic: 'Command and Control',
            detectionRules: ['rule-012'],
            severity: 'critical'
          }
        ]
      },
      {
        id: 'TA0010',
        name: 'Exfiltration',
        description: 'The adversary is trying to steal data.',
        techniques: [
          {
            id: 'T1041',
            name: 'Exfiltration Over C2 Channel',
            description: 'Adversaries may steal data by exfiltrating it over an existing command and control channel.',
            tactic: 'Exfiltration',
            detectionRules: ['rule-013'],
            severity: 'critical'
          }
        ]
      },
      {
        id: 'TA0040',
        name: 'Impact',
        description: 'The adversary is trying to manipulate, interrupt, or destroy your systems and data.',
        techniques: [
          {
            id: 'T1486',
            name: 'Data Encrypted for Impact',
            description: 'Adversaries may encrypt data on target systems or on large numbers of systems in a network to interrupt availability to system and network resources.',
            tactic: 'Impact',
            detectionRules: ['rule-014'],
            severity: 'critical'
          }
        ]
      }
    ];

    // Flatten all techniques for easier access
    this.techniques = this.tactics.flatMap(tactic => tactic.techniques);
  }

  public getAllTactics(): MITRETactic[] {
    return this.tactics;
  }

  public getAllTechniques(): MITRETechnique[] {
    return this.techniques;
  }

  public getTacticById(id: string): MITRETactic | undefined {
    return this.tactics.find(tactic => tactic.id === id);
  }

  public getTechniqueById(id: string): MITRETechnique | undefined {
    return this.techniques.find(technique => technique.id === id);
  }

  public getTechniquesByTactic(tacticId: string): MITRETechnique[] {
    const tactic = this.getTacticById(tacticId);
    return tactic ? tactic.techniques : [];
  }

  public getTechniquesBySeverity(severity: string): MITRETechnique[] {
    return this.techniques.filter(technique => technique.severity === severity);
  }

  public getTechniquesByDetectionRule(ruleId: string): MITRETechnique[] {
    return this.techniques.filter(technique => 
      technique.detectionRules.includes(ruleId)
    );
  }

  public getCoverageMetrics() {
    const totalTechniques = this.techniques.length;
    const coveredTechniques = this.techniques.filter(technique => 
      technique.detectionRules.length > 0
    ).length;
    const coveragePercentage = (coveredTechniques / totalTechniques) * 100;

    const severityBreakdown = {
      critical: this.getTechniquesBySeverity('critical').length,
      high: this.getTechniquesBySeverity('high').length,
      medium: this.getTechniquesBySeverity('medium').length,
      low: this.getTechniquesBySeverity('low').length
    };

    return {
      totalTechniques,
      coveredTechniques,
      uncoveredTechniques: totalTechniques - coveredTechniques,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100,
      severityBreakdown
    };
  }

  public searchTechniques(query: string): MITRETechnique[] {
    const lowerQuery = query.toLowerCase();
    return this.techniques.filter(technique =>
      technique.name.toLowerCase().includes(lowerQuery) ||
      technique.description.toLowerCase().includes(lowerQuery) ||
      technique.id.toLowerCase().includes(lowerQuery)
    );
  }
} 