"use client"

import { useState, useEffect } from "react"
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Globe, 
  Zap, 
  Target, 
  Activity,
  BarChart3,
  PieChart,
  MapPin,
  Clock,
  Users,
  Lock,
  Eye,
  Database,
  Network,
  Smartphone,
  Server,
  Cloud,
  Mail
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface ThreatData {
  id: string
  name: string
  count: number
  successRate: number
  trend: 'up' | 'down' | 'stable'
  severity: 'critical' | 'high' | 'medium' | 'low'
  icon: any
  color: string
  bgColor: string
}

interface ThreatCategory {
  name: string
  threats: ThreatData[]
  totalThreats: number
  successRate: number
  icon: any
}

export default function ThreatIntelligenceView() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => setIsLoading(false), 1000)
    return () => clearTimeout(timer)
  }, [])

  const threatCategories: ThreatCategory[] = [
    {
      name: "Email Security",
      totalThreats: 1247,
      successRate: 100,
      icon: Mail,
      threats: [
        { id: '1', name: 'Phishing Attempts', count: 847, successRate: 100, trend: 'up', severity: 'high', icon: AlertTriangle, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
        { id: '2', name: 'Malware Attachments', count: 234, successRate: 100, trend: 'down', severity: 'critical', icon: Shield, color: 'text-red-400', bgColor: 'bg-red-500/20' },
        { id: '3', name: 'Spam Messages', count: 166, successRate: 100, trend: 'stable', severity: 'low', icon: CheckCircle, color: 'text-green-400', bgColor: 'bg-green-500/20' }
      ]
    },
    {
      name: "Network Security",
      totalThreats: 45678,
      successRate: 99.6,
      icon: Network,
      threats: [
        { id: '4', name: 'DDoS Attacks', count: 12345, successRate: 99.8, trend: 'up', severity: 'critical', icon: Activity, color: 'text-red-400', bgColor: 'bg-red-500/20' },
        { id: '5', name: 'Port Scanning', count: 23456, successRate: 99.5, trend: 'down', severity: 'medium', icon: Target, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' },
        { id: '6', name: 'Brute Force', count: 9877, successRate: 99.4, trend: 'stable', severity: 'high', icon: Lock, color: 'text-orange-400', bgColor: 'bg-orange-500/20' }
      ]
    },
    {
      name: "Endpoint Protection",
      totalThreats: 456,
      successRate: 98.9,
      icon: Shield,
      threats: [
        { id: '7', name: 'Ransomware', count: 123, successRate: 99.2, trend: 'down', severity: 'critical', icon: AlertTriangle, color: 'text-red-400', bgColor: 'bg-red-500/20' },
        { id: '8', name: 'Trojan Horses', count: 234, successRate: 98.7, trend: 'up', severity: 'high', icon: Target, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
        { id: '9', name: 'Keyloggers', count: 99, successRate: 98.8, trend: 'stable', severity: 'medium', icon: Eye, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' }
      ]
    },
    {
      name: "Web Application",
      totalThreats: 23456,
      successRate: 99.4,
      icon: Globe,
      threats: [
        { id: '10', name: 'SQL Injection', count: 5678, successRate: 99.6, trend: 'down', severity: 'critical', icon: Database, color: 'text-red-400', bgColor: 'bg-red-500/20' },
        { id: '11', name: 'XSS Attacks', count: 8901, successRate: 99.3, trend: 'up', severity: 'high', icon: AlertTriangle, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
        { id: '12', name: 'CSRF Attempts', count: 8877, successRate: 99.2, trend: 'stable', severity: 'medium', icon: Shield, color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' }
      ]
    }
  ]

  const globalStats = {
    totalThreats: 72337,
    threatsBlocked: 72189,
    successRate: 99.8,
    criticalThreats: 23,
    activeAttacks: 5,
    lastIncident: '2 hours ago'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-400" />
      case 'down': return <TrendingUp className="w-4 h-4 text-green-400 rotate-180" />
      default: return <Activity className="w-4 h-4 text-blue-400" />
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-400 bg-red-500/20'
      case 'high': return 'text-orange-400 bg-orange-500/20'
      case 'medium': return 'text-yellow-400 bg-yellow-500/20'
      default: return 'text-green-400 bg-green-500/20'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-neutral-400">Loading Threat Intelligence...</p>
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
            <Shield className="w-8 h-8 text-orange-500" />
            THREAT INTELLIGENCE CENTER
          </h1>
          <p className="text-sm text-neutral-400 mt-2">Real-time threat monitoring and intelligence analysis</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-neutral-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>SYSTEM STATUS: OPERATIONAL</span>
          </div>
          <Badge variant="outline" className="border-orange-500 text-orange-400">
            <Clock className="w-3 h-3 mr-1" />
            Last Update: {new Date().toLocaleString()}
          </Badge>
        </div>
      </div>

      {/* Global Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border-red-700/50 hover:border-red-600/50 transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-red-300 tracking-wider">CRITICAL THREATS</p>
                <p className="text-3xl font-bold text-red-400 font-mono">{globalStats.criticalThreats}</p>
                <p className="text-xs text-red-300">Require immediate attention</p>
              </div>
              <div className="p-3 bg-red-500/20 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border-green-700/50 hover:border-green-600/50 transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-300 tracking-wider">SUCCESS RATE</p>
                <p className="text-3xl font-bold text-green-400 font-mono">{globalStats.successRate}%</p>
                <p className="text-xs text-green-300">Threats successfully blocked</p>
              </div>
              <div className="p-3 bg-green-500/20 rounded-full">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border-blue-700/50 hover:border-blue-600/50 transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-300 tracking-wider">TOTAL THREATS</p>
                <p className="text-3xl font-bold text-blue-400 font-mono">{globalStats.totalThreats.toLocaleString()}</p>
                <p className="text-xs text-blue-300">Detected this quarter</p>
              </div>
              <div className="p-3 bg-blue-500/20 rounded-full">
                <Target className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border-purple-700/50 hover:border-purple-600/50 transition-all duration-300 hover:scale-105">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-300 tracking-wider">ACTIVE ATTACKS</p>
                <p className="text-3xl font-bold text-purple-400 font-mono">{globalStats.activeAttacks}</p>
                <p className="text-xs text-purple-300">Currently being monitored</p>
              </div>
              <div className="p-3 bg-purple-500/20 rounded-full">
                <Activity className="w-8 h-8 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Threat Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {threatCategories.map((category, index) => (
          <Card key={category.name} className="bg-neutral-900/80 border-neutral-700 hover:border-neutral-600 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/10">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <category.icon className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white text-lg">{category.name}</CardTitle>
                    <p className="text-xs text-neutral-400">{category.totalThreats.toLocaleString()} threats detected</p>
                  </div>
                </div>
                <Badge className={`${category.successRate >= 99 ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {category.successRate}% Success
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {category.threats.map((threat) => (
                <div key={threat.id} className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg hover:bg-neutral-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${threat.bgColor}`}>
                      <threat.icon className={`w-4 h-4 ${threat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{threat.name}</p>
                      <p className="text-xs text-neutral-400">{threat.count.toLocaleString()} attempts</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(threat.severity)}>
                      {threat.severity.toUpperCase()}
                    </Badge>
                    {getTrendIcon(threat.trend)}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Real-time Activity Feed */}
      <Card className="bg-neutral-900/80 border-neutral-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-orange-400" />
            Real-time Threat Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { time: '2 min ago', threat: 'SQL Injection attempt blocked', source: '192.168.1.100', severity: 'critical' },
              { time: '5 min ago', threat: 'Phishing email quarantined', source: 'external@malicious.com', severity: 'high' },
              { time: '8 min ago', threat: 'DDoS attack mitigated', source: '45.67.89.123', severity: 'critical' },
              { time: '12 min ago', threat: 'Ransomware signature detected', source: 'endpoint-001', severity: 'high' },
              { time: '15 min ago', threat: 'Unauthorized access attempt', source: '10.0.0.50', severity: 'medium' }
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-neutral-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.severity === 'critical' ? 'bg-red-400' : 
                    activity.severity === 'high' ? 'bg-orange-400' : 'bg-yellow-400'
                  }`}></div>
                  <div>
                    <p className="text-sm text-white">{activity.threat}</p>
                    <p className="text-xs text-neutral-400">Source: {activity.source}</p>
                  </div>
                </div>
                <span className="text-xs text-neutral-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 