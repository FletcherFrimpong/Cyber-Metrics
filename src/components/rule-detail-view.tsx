"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Bot, Download, RefreshCw } from "lucide-react"

interface RuleDetailViewProps {
  ruleId: string | null
  onBack: () => void
}

export function RuleDetailView({ ruleId, onBack }: RuleDetailViewProps) {
  if (!ruleId) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No rule selected</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Rules
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Rule Details</h2>
          <p className="text-muted-foreground">Detailed analysis and tuning recommendations for {ruleId}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Rule Metadata */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Rule Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Rule ID</label>
                  <p className="font-mono">{ruleId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Name</label>
                  <p>Suspicious PowerShell Execution</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Platform</label>
                  <Badge variant="outline">Splunk</Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Score</label>
                  <p className="text-green-500 font-medium">85</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Created</label>
                  <p>2024-01-15 14:30:22</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Last Updated</label>
                  <p>2024-01-20 09:15:45</p>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground">Logic Preview</label>
                <div className="mt-2 p-3 bg-muted rounded-md font-mono text-sm">
                  {`index=windows EventCode=4688 CommandLine="*powershell*" 
| where match(CommandLine, "(?i)(invoke-expression|iex|downloadstring)")
| stats count by Computer, User, CommandLine
| where count > 5`}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* GPT Tuning Suggestions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                GPT Tuning Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Reduce False Positives</h4>
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  Consider adding exclusions for legitimate PowerShell modules like Exchange Management Shell and Azure
                  PowerShell.
                </p>
              </div>

              <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <h4 className="font-medium text-yellow-900 dark:text-yellow-100 mb-2">Improve Detection Logic</h4>
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  Add parent process validation to catch more sophisticated attacks while reducing noise from legitimate
                  automation.
                </p>
              </div>

              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <h4 className="font-medium text-green-900 dark:text-green-100 mb-2">Optimize Performance</h4>
                <p className="text-sm text-green-800 dark:text-green-200">
                  Use indexed fields for faster query execution and consider time-based filtering for recent events
                  only.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-transparent" variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Export Rule
              </Button>
              <Button className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-run GPT Tuning
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
