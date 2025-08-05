"use client"

import { useState, useEffect } from "react"
import { 
  DollarSign, 
  TrendingUp, 
  Shield, 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  BarChart3,
  PieChart,
  Calendar,
  Users,
  Building,
  Zap,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  ChevronDown,
  ChevronRight
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface CostSavingsData {
  category: string
  amount: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
  description: string
  icon: any
  color: string
  bgColor: string
  threats: {
    name: string
    mitreTechnique: string
    mitreId: string
    impact: string
    maliciousFiles: string[]
  }[]
  realWorldIncidents: {
    company: string
    year: string
    loss: string
    description: string
    source: string
  }[]
}

interface QuarterlyData {
  quarter: string
  savings: number
  threats: number
  roi: number
}

export default function CostSavingsView() {
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('quarter')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const totalSavings = 24.5 // in millions
  const totalInvestment = 7.2 // in millions
  const roi = ((totalSavings - totalInvestment) / totalInvestment) * 100

  const costSavingsBreakdown: CostSavingsData[] = [
    {
      category: "Ransomware Prevention",
      amount: 8.2,
      percentage: 33.5,
      trend: 'up',
      description: "EDR blocked 23 ransomware attempts",
      icon: Shield,
      color: 'text-green-400',
      bgColor: 'bg-green-500/20',
      threats: [
        { 
          name: "Data Encrypted for Impact", 
          mitreTechnique: "Data Encrypted for Impact", 
          mitreId: "T1486", 
          impact: "Data loss, Ransomware",
          maliciousFiles: ["crypto_locker.exe", "wannacry_encryptor.dll", "locky_ransomware.bat", "cerber_encryptor.vbs", "ryuk_encryptor.ps1", "sodinokibi_loader.exe", "maze_ransomware.dll", "conti_encryptor.bat"]
        },
        { 
          name: "Data Manipulation", 
          mitreTechnique: "Data Manipulation", 
          mitreId: "T1565", 
          impact: "Data integrity, Ransomware",
          maliciousFiles: ["data_corruptor.ps1", "file_modifier.exe", "integrity_breaker.dll", "malware_manipulator.bat", "bitmap_manipulator.exe", "registry_modifier.dll", "file_encryptor.ps1", "data_destroyer.bat"]
        },
        { 
          name: "Service Stop", 
          mitreTechnique: "Service Stop", 
          mitreId: "T1489", 
          impact: "Service disruption, Ransomware",
          maliciousFiles: ["service_killer.exe", "process_terminator.dll", "system_disruptor.ps1", "service_blocker.bat", "svchost_terminator.exe", "windows_service_killer.dll", "process_eliminator.ps1", "system_crasher.bat"]
        }
      ],
      realWorldIncidents: [
        { 
          company: "MGM Resorts", 
          year: "2023", 
          loss: "$100M+", 
          description: "Ransomware attack using T1486 (Data Encrypted for Impact) and T1489 (Service Stop) causing system shutdowns and data theft", 
          source: "SEC Filing" 
        },
        { 
          company: "Caesars Entertainment", 
          year: "2023", 
          loss: "$15M", 
          description: "Ransomware attack using T1565 (Data Manipulation) with customer data compromise and encryption", 
          source: "SEC Filing" 
        },
        { 
          company: "Colonial Pipeline", 
          year: "2021", 
          loss: "$4.4M", 
          description: "Ransomware attack using T1486 (Data Encrypted for Impact) disrupting fuel supply chain operations", 
          source: "DOJ Report" 
        }
      ]
    },
    {
      category: "Data Breach Avoidance",
      amount: 6.8,
      percentage: 27.8,
      trend: 'up',
      description: "EDR blocked 156 data exfiltration attempts",
      icon: Target,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
      threats: [
        { 
          name: "Automated Exfiltration", 
          mitreTechnique: "Automated Exfiltration", 
          mitreId: "T1020", 
          impact: "Data loss, Privacy breach",
          maliciousFiles: ["data_stealer.exe", "auto_exfiltrator.dll", "batch_data_thief.ps1", "automated_harvester.bat", "credential_harvester.exe", "password_dumper.dll", "cookie_stealer.ps1", "session_hijacker.bat"]
        },
        { 
          name: "Data Transfer Size Limits", 
          mitreTechnique: "Data Transfer Size Limits", 
          mitreId: "T1030", 
          impact: "Data loss, Privacy breach",
          maliciousFiles: ["chunked_exfiltrator.exe", "data_splitter.dll", "transfer_limiter.ps1", "size_evader.bat", "ftp_data_thief.exe", "sftp_stealer.dll", "webdav_exfiltrator.ps1", "cloud_storage_thief.bat"]
        },
        { 
          name: "Exfiltration Over Alternative Protocol", 
          mitreTechnique: "Exfiltration Over Alternative Protocol", 
          mitreId: "T1048", 
          impact: "Data loss, Privacy breach",
          maliciousFiles: ["dns_exfiltrator.exe", "ftp_data_thief.dll", "http_stealer.ps1", "protocol_abuser.bat", "icmp_data_thief.exe", "smtp_exfiltrator.dll", "irc_channel_stealer.ps1", "tor_exit_node_thief.bat"]
        }
      ],
      realWorldIncidents: [
        { 
          company: "T-Mobile", 
          year: "2023", 
          loss: "$350M", 
          description: "Data breach using T1020 (Automated Exfiltration) affecting 37M customers through API exploitation", 
          source: "SEC Filing" 
        },
        { 
          company: "LastPass", 
          year: "2022", 
          loss: "$25M", 
          description: "Data breach using T1048 (Exfiltration Over Alternative Protocol) with password vault compromise via cloud storage", 
          source: "Company Report" 
        },
        { 
          company: "Optus", 
          year: "2022", 
          loss: "$140M", 
          description: "Data breach using T1030 (Data Transfer Size Limits) affecting 9.8M customers through API abuse", 
          source: "Australian Government" 
        }
      ]
    },
    {
      category: "Business Continuity",
      amount: 4.5,
      percentage: 18.4,
      trend: 'stable',
      description: "EDR prevented service disruptions",
      icon: CheckCircle,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/20',
      threats: [
        { 
          name: "Network Denial of Service", 
          mitreTechnique: "Network Denial of Service", 
          mitreId: "T1498", 
          impact: "Service disruption, Revenue loss",
          maliciousFiles: ["ddos_botnet.exe", "network_flooder.dll", "traffic_generator.ps1", "bandwidth_killer.bat", "syn_flooder.exe", "udp_amplifier.dll", "http_flooder.ps1", "slowloris_attacker.bat"]
        },
        { 
          name: "Endpoint Denial of Service", 
          mitreTechnique: "Endpoint Denial of Service", 
          mitreId: "T1499", 
          impact: "Service disruption, Productivity loss",
          maliciousFiles: ["cpu_exhaustor.exe", "memory_flooder.dll", "resource_drainer.ps1", "system_crasher.bat", "fork_bomb.exe", "memory_leaker.dll", "disk_filler.ps1", "process_spammer.bat"]
        },
        { 
          name: "Application or System Exploitation", 
          mitreTechnique: "Application or System Exploitation", 
          mitreId: "T1499.002", 
          impact: "Service disruption, Data loss",
          maliciousFiles: ["app_exploiter.exe", "system_breaker.dll", "service_killer.ps1", "process_terminator.bat", "buffer_overflow_exploit.exe", "heap_corruption.dll", "integer_overflow.ps1", "format_string_attacker.bat"]
        }
      ],
      realWorldIncidents: [
        { 
          company: "Cloudflare", 
          year: "2023", 
          loss: "$50M+", 
          description: "Largest DDoS attack using T1498 (Network Denial of Service) with 71M requests/sec targeting HTTP/2", 
          source: "Cloudflare Report" 
        },
        { 
          company: "Microsoft", 
          year: "2023", 
          loss: "$25M", 
          description: "DDoS attack using T1498 (Network Denial of Service) affecting Azure services with 3.47 Tbps traffic", 
          source: "Microsoft Security Blog" 
        },
        { 
          company: "Google", 
          year: "2022", 
          loss: "$40M", 
          description: "DDoS attack using T1498 (Network Denial of Service) with 46M requests per second targeting Google Cloud", 
          source: "Google Security Blog" 
        }
      ]
    },
    {
      category: "Compliance Fines Avoided",
      amount: 3.2,
      percentage: 13.1,
      trend: 'up',
      description: "EDR prevented compliance violations",
      icon: Building,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/20',
      threats: [
        { 
          name: "Trusted Relationship", 
          mitreTechnique: "Trusted Relationship", 
          mitreId: "T1199", 
          impact: "Compliance violation, Financial penalty",
          maliciousFiles: ["trusted_abuser.exe", "relationship_exploiter.dll", "partner_compromise.ps1", "vendor_attack.bat", "supply_chain_attacker.exe", "third_party_exploiter.dll", "vendor_backdoor.ps1", "partner_credential_thief.bat"]
        },
        { 
          name: "Valid Accounts", 
          mitreTechnique: "Valid Accounts", 
          mitreId: "T1078", 
          impact: "Compliance violation, Data breach",
          maliciousFiles: ["credential_stealer.exe", "account_hijacker.dll", "password_cracker.ps1", "login_abuser.bat", "kerberoasting_attacker.exe", "pass_the_hash.dll", "golden_ticket_forger.ps1", "silver_ticket_creator.bat"]
        },
        { 
          name: "Default Accounts", 
          mitreTechnique: "Default Accounts", 
          mitreId: "T1078.001", 
          impact: "Compliance violation, Security breach",
          maliciousFiles: ["default_exploiter.exe", "admin_abuser.dll", "root_access.ps1", "privilege_escalator.bat", "admin_account_abuser.exe", "root_kit_installer.dll", "privilege_escalation.ps1", "sudo_abuser.bat"]
        }
      ],
      realWorldIncidents: [
        { 
          company: "Anthem", 
          year: "2015", 
          loss: "$115M", 
          description: "HIPAA violation using T1078 (Valid Accounts) affecting 78.8M customers through credential theft", 
          source: "HHS Settlement" 
        },
        { 
          company: "Equifax", 
          year: "2017", 
          loss: "$700M", 
          description: "Data breach using T1078.001 (Default Accounts) affecting 147M consumers through unpatched vulnerability", 
          source: "FTC Settlement" 
        },
        { 
          company: "Capital One", 
          year: "2019", 
          loss: "$190M", 
          description: "Data breach using T1199 (Trusted Relationship) affecting 100M customers through misconfigured firewall", 
          source: "FTC Settlement" 
        }
      ]
    },
    {
      category: "Reputation Protection",
      amount: 1.8,
      percentage: 7.2,
      trend: 'stable',
      description: "EDR prevented brand damage",
      icon: Users,
      color: 'text-pink-400',
      bgColor: 'bg-pink-500/20',
      threats: [
        { 
          name: "Phishing", 
          mitreTechnique: "Phishing", 
          mitreId: "T1566", 
          impact: "Brand damage, Customer trust loss",
          maliciousFiles: ["phishing_kit.exe", "fake_login.dll", "credential_harvester.ps1", "social_engineer.bat", "evilginx_proxy.exe", "credential_harvester.dll", "phishing_simulator.ps1", "social_engineering_toolkit.bat"]
        },
        { 
          name: "Drive-by Compromise", 
          mitreTechnique: "Drive-by Compromise", 
          mitreId: "T1189", 
          impact: "Brand damage, Customer compromise",
          maliciousFiles: ["driveby_exploit.exe", "browser_hijacker.dll", "malicious_redirect.ps1", "web_compromise.bat", "watering_hole_attacker.exe", "malicious_ad_injector.dll", "iframe_injector.ps1", "malware_dropper.bat"]
        },
        { 
          name: "Spearphishing Link", 
          mitreTechnique: "Spearphishing Link", 
          mitreId: "T1566.002", 
          impact: "Brand damage, Targeted attack",
          maliciousFiles: ["targeted_phish.exe", "spear_attacker.dll", "custom_lure.ps1", "precision_strike.bat", "whaling_attacker.exe", "ceo_fraud_simulator.dll", "business_email_compromise.ps1", "invoice_fraud_attacker.bat"]
        }
      ],
      realWorldIncidents: [
        { 
          company: "Twitter", 
          year: "2020", 
          loss: "$40M", 
          description: "Phishing attack using T1566.002 (Spearphishing Link) compromising high-profile accounts through social engineering", 
          source: "SEC Filing" 
        },
        { 
          company: "Facebook", 
          year: "2018", 
          loss: "$5B", 
          description: "Data misuse using T1199 (Trusted Relationship) affecting 87M users through third-party app exploitation", 
          source: "FTC Settlement" 
        },
        { 
          company: "Uber", 
          year: "2016", 
          loss: "$148M", 
          description: "Data breach using T1566 (Phishing) affecting 57M users followed by cover-up attempt", 
          source: "FTC Settlement" 
        }
      ]
    }
  ]

  const quarterlyData: QuarterlyData[] = [
    { quarter: 'Q1 2024', savings: 5.2, threats: 12450, roi: 280 },
    { quarter: 'Q2 2024', savings: 6.8, threats: 18750, roi: 320 },
    { quarter: 'Q3 2024', savings: 7.5, threats: 22340, roi: 340 },
    { quarter: 'Q4 2024', savings: 5.0, threats: 18797, roi: 240 }
  ]

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="w-4 h-4 text-green-400" />
      case 'down': return <ArrowDownRight className="w-4 h-4 text-red-400" />
      default: return <Activity className="w-4 h-4 text-blue-400" />
    }
  }

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading Cost Savings Analysis...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-wider flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-green-500" />
            COST SAVINGS & ROI ANALYSIS
          </h1>
          <p className="text-sm text-neutral-400 mt-2">Financial impact of security investments and threat prevention</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>FINANCIAL STATUS: EXCELLENT</span>
          </div>
          <Badge variant="outline" className="border-green-500 text-green-400">
            <Calendar className="w-3 h-3 mr-1" />
            Q4 2024 Report
          </Badge>
        </div>
      </div>

      {/* Key Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/50 hover:border-green-600/50 transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-300 tracking-wider">TOTAL SAVINGS</p>
                <p className="text-3xl font-bold text-green-400 font-mono">${totalSavings}M</p>
                <p className="text-xs text-green-300">This fiscal year</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-full">
                <DollarSign className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50 hover:border-blue-600/50 transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-300 tracking-wider">ROI PERCENTAGE</p>
                <p className="text-3xl font-bold text-blue-400 font-mono">{roi.toFixed(0)}%</p>
                <p className="text-xs text-blue-300">Return on investment</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-full">
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700/50 hover:border-purple-600/50 transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-300 tracking-wider">INVESTMENT</p>
                <p className="text-3xl font-bold text-purple-400 font-mono">${totalInvestment}M</p>
                <p className="text-xs text-purple-300">Security budget</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-full">
                <Shield className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/30 border-orange-700/50 hover:border-orange-600/50 transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-orange-300 tracking-wider">NET SAVINGS</p>
                <p className="text-3xl font-bold text-orange-400 font-mono">${(totalSavings - totalInvestment).toFixed(1)}M</p>
                <p className="text-xs text-orange-300">After investment</p>
              </div>
              <div className="p-3 bg-orange-500/20 rounded-full">
                <Zap className="w-8 h-8 text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Savings Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-neutral-900/80 border-neutral-700 hover:border-neutral-600 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <PieChart className="w-5 h-5 text-green-400" />
              Cost Savings Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {costSavingsBreakdown.map((item, index) => {
              const isExpanded = expandedCategories.has(item.category)
              return (
                <div key={index} className="bg-neutral-800/50 rounded-lg hover:bg-neutral-800 transition-colors">
                  <div 
                    className="flex items-center justify-between p-3 border-b border-neutral-700 cursor-pointer hover:bg-neutral-700/50 transition-colors"
                    onClick={() => toggleCategory(item.category)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${item.bgColor}`}>
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{item.category}</p>
                        <p className="text-xs text-neutral-400">{item.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className="text-sm font-bold text-green-400">${item.amount}M</p>
                        <p className="text-xs text-neutral-400">{item.percentage}%</p>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-neutral-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-neutral-400" />
                      )}
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                      <div className="p-3 space-y-2">
                        <p className="text-xs text-neutral-400 font-medium">Sample Threats (MITRE ATT&CK):</p>
                        {item.threats.map((threat, threatIndex) => (
                          <div key={threatIndex} className="space-y-2">
                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-500/30 text-blue-400">
                                  {threat.mitreId}
                                </Badge>
                                <span className="text-neutral-300">{threat.name}</span>
                              </div>
                              <span className="text-neutral-500 text-[10px]">{threat.impact}</span>
                            </div>
                            <div className="ml-6 space-y-1">
                              <p className="text-[9px] text-green-400 font-medium">Prevented and Investigated:</p>
                              <div className="flex flex-wrap gap-1">
                                {threat.maliciousFiles.map((file, fileIndex) => (
                                  <Badge 
                                    key={fileIndex} 
                                    variant="outline" 
                                    className="text-[8px] px-1 py-0 border-green-500/30 text-green-400 bg-green-500/10"
                                  >
                                    {file} ✓
                                  </Badge>
                                ))}
                              </div>
                              <p className="text-[8px] text-green-300 mt-1">True positive alerts - prevented and investigated</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="p-3 space-y-2 border-t border-neutral-700">
                        <p className="text-xs text-neutral-400 font-medium">Real-World Incidents (Documented Losses):</p>
                        {item.realWorldIncidents.map((incident, incidentIndex) => (
                          <div key={incidentIndex} className="text-xs space-y-1 p-2 bg-neutral-800/30 rounded">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-red-500/30 text-red-400">
                                  {incident.year}
                                </Badge>
                                <span className="text-neutral-300 font-medium">{incident.company}</span>
                              </div>
                              <span className="text-red-400 font-bold text-[10px]">{incident.loss}</span>
                            </div>
                            <p className="text-neutral-500 text-[10px] leading-tight">{incident.description}</p>
                            <p className="text-neutral-600 text-[9px]">Source: {incident.source}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </CardContent>
        </Card>

        <Card className="bg-neutral-900/80 border-neutral-700 hover:border-neutral-600 transition-all duration-300">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Quarterly Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {quarterlyData.map((quarter, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-white">{quarter.quarter}</p>
                  <p className="text-xs text-neutral-400">{quarter.threats.toLocaleString()} threats prevented</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-green-400">${quarter.savings}M</p>
                  <p className="text-xs text-blue-400">{quarter.roi}% ROI</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Real-World Incident Cost Aggregation */}
      <Card className="bg-gradient-to-br from-red-900/20 to-orange-900/20 border-red-700/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Real-World Incident Cost Aggregation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Total Potential Losses */}
            <div className="space-y-4">
              <div className="text-center p-4 bg-red-900/30 rounded-lg border border-red-700/50">
                <p className="text-xs text-red-300 tracking-wider mb-2">TOTAL POTENTIAL LOSSES</p>
                <p className="text-3xl font-bold text-red-400 font-mono">$6.7B+</p>
                <p className="text-xs text-red-300">From 15 documented incidents</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-neutral-800/50 rounded">
                  <span className="text-sm text-neutral-300">Ransomware Incidents</span>
                  <span className="text-red-400 font-bold">$119.4M</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-neutral-800/50 rounded">
                  <span className="text-sm text-neutral-300">Data Breach Incidents</span>
                  <span className="text-red-400 font-bold">$1.1B</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-neutral-800/50 rounded">
                  <span className="text-sm text-neutral-300">DDoS/Business Continuity</span>
                  <span className="text-red-400 font-bold">$115M</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-neutral-800/50 rounded">
                  <span className="text-sm text-neutral-300">Compliance Violations</span>
                  <span className="text-red-400 font-bold">$1.0B</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-neutral-800/50 rounded">
                  <span className="text-sm text-neutral-300">Reputation Damage</span>
                  <span className="text-red-400 font-bold">$5.2B</span>
                </div>
              </div>
            </div>

            {/* Our Prevention Success */}
            <div className="space-y-4">
              <div className="text-center p-4 bg-green-900/30 rounded-lg border border-green-700/50">
                <p className="text-xs text-green-300 tracking-wider mb-2">OUR PREVENTION SUCCESS</p>
                <p className="text-3xl font-bold text-green-400 font-mono">$24.5M</p>
                <p className="text-xs text-green-300">Actual cost savings achieved</p>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center p-2 bg-neutral-800/50 rounded">
                  <span className="text-sm text-neutral-300">Prevention Rate</span>
                  <span className="text-green-400 font-bold">99.6%</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-neutral-800/50 rounded">
                  <span className="text-sm text-neutral-300">ROI vs Real Incidents</span>
                  <span className="text-green-400 font-bold">273:1</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-neutral-800/50 rounded">
                  <span className="text-sm text-neutral-300">Investment Protection</span>
                  <span className="text-green-400 font-bold">$6.7B</span>
                </div>
                <div className="flex justify-between items-center p-2 bg-neutral-800/50 rounded">
                  <span className="text-sm text-neutral-300">Threats Blocked</span>
                  <span className="text-green-400 font-bold">72,337</span>
                </div>
              </div>
            </div>

            {/* Financial Impact Analysis */}
            <div className="space-y-4">
              <div className="text-center p-4 bg-blue-900/30 rounded-lg border border-blue-700/50">
                <p className="text-xs text-blue-300 tracking-wider mb-2">FINANCIAL IMPACT</p>
                <p className="text-3xl font-bold text-blue-400 font-mono">340%</p>
                <p className="text-xs text-blue-300">ROI achieved</p>
              </div>
              <div className="p-3 bg-neutral-800/30 rounded">
                <p className="text-xs text-neutral-400 mb-2">Key Insights:</p>
                <ul className="text-xs text-neutral-300 space-y-1">
                  <li>• Every $1 invested saved $3.40</li>
                  <li>• Prevented potential losses of $6.7B+</li>
                  <li>• 99.6% threat prevention rate</li>
                  <li>• 273:1 ROI vs real incident costs</li>
                </ul>
              </div>
              <div className="p-3 bg-yellow-900/20 rounded border border-yellow-700/30">
                <p className="text-xs text-yellow-300 font-medium mb-1">Executive Summary:</p>
                <p className="text-xs text-yellow-200">
                  "Our $7.2M security investment has prevented potential losses exceeding $6.7B, 
                  representing the best ROI in our technology portfolio."
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* MITRE ATT&CK Reference */}
      <Card className="bg-neutral-900/80 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-400" />
            MITRE ATT&CK Framework Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <p className="text-sm text-neutral-300">
                The MITRE ATT&CK framework provides a comprehensive knowledge base of adversary tactics and techniques. 
                Our cost savings analysis maps prevented threats to specific MITRE techniques to demonstrate the 
                strategic value of our security investments.
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-500/30 text-blue-400">T1486</Badge>
                  <span className="text-xs text-neutral-400">Data Encrypted for Impact</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-500/30 text-blue-400">T1020</Badge>
                  <span className="text-xs text-neutral-400">Automated Exfiltration</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] px-1 py-0 border-blue-500/30 text-blue-400">T1498</Badge>
                  <span className="text-xs text-neutral-400">Network Denial of Service</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <p className="text-sm text-neutral-300">
                Each prevented threat represents potential cost savings based on industry averages for incident response, 
                data recovery, regulatory fines, and business disruption.
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-neutral-800/50 rounded">
                  <p className="text-green-400 font-medium">Ransomware</p>
                  <p className="text-neutral-400">$4.5M avg cost</p>
                </div>
                <div className="p-2 bg-neutral-800/50 rounded">
                  <p className="text-blue-400 font-medium">Data Breach</p>
                  <p className="text-neutral-400">$3.9M avg cost</p>
                </div>
                <div className="p-2 bg-neutral-800/50 rounded">
                  <p className="text-purple-400 font-medium">DDoS Attack</p>
                  <p className="text-neutral-400">$2.5M avg cost</p>
                </div>
                <div className="p-2 bg-neutral-800/50 rounded">
                  <p className="text-orange-400 font-medium">Compliance Fine</p>
                  <p className="text-neutral-400">$1.2M avg cost</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Executive Summary */}
      <Card className="bg-gradient-to-br from-green-900/20 to-blue-900/20 border-green-700/30">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Building className="w-5 h-5 text-green-400" />
            Executive Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
              <p className="text-2xl font-bold text-green-400">${totalSavings}M</p>
              <p className="text-sm text-neutral-300">Total Cost Savings</p>
              <p className="text-xs text-green-400 mt-1">+340% vs last year</p>
            </div>
            <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
              <p className="text-2xl font-bold text-blue-400">{roi.toFixed(0)}%</p>
              <p className="text-sm text-neutral-300">Return on Investment</p>
              <p className="text-xs text-blue-400 mt-1">Industry average: 150%</p>
            </div>
            <div className="text-center p-4 bg-neutral-800/50 rounded-lg">
              <p className="text-2xl font-bold text-purple-400">72,337</p>
              <p className="text-sm text-neutral-300">Threats Prevented</p>
              <p className="text-xs text-purple-400 mt-1">99.8% success rate</p>
            </div>
          </div>
          <div className="p-4 bg-neutral-800/30 rounded-lg">
            <p className="text-sm text-neutral-300 leading-relaxed">
              <strong className="text-green-400">Key Achievement:</strong> Our security investments have delivered exceptional returns, 
              saving the company ${totalSavings}M this fiscal year while preventing 72,337 potential threats. 
              The {roi.toFixed(0)}% ROI significantly outperforms industry benchmarks, demonstrating the strategic value 
              of our cybersecurity program. Every dollar invested in security has returned ${(roi/100).toFixed(1)} in savings.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 