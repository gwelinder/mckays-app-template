"use client"

import { useChat } from "@ai-sdk/react"
import { useEffect, useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import type { Message } from "ai"

interface Finding {
  type: string
  severity: string
  title: string
  description: string
  location?: string
  context?: string
  suggestedAction?: string
}

interface AnalysisProgress {
  toolName?: string
  status: string
  step?: string
  result?: any
}

interface AnalysisStatusData {
  type: "analysis_status"
  status: string
  analysisId: string
}

interface AnalysisProgressData {
  type: "analysis_progress"
  data: AnalysisProgress
}

type StreamData = AnalysisStatusData | AnalysisProgressData

interface DocumentAnalysisProps {
  documentId: string
  onAnalysisComplete?: () => void
}

export function DocumentAnalysis({
  documentId,
  onAnalysisComplete
}: DocumentAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [progress, setProgress] = useState<AnalysisProgress | null>(null)
  const [findings, setFindings] = useState<Finding[]>([])
  const eventSourceRef = useRef<EventSource | null>(null)

  const { messages, isLoading } = useChat({
    api: "/api/document-analysis",
    id: documentId,
    body: {
      documentId
    },
    initialMessages: [
      {
        role: "user",
        content: `Analyze document ${documentId}`,
        id: `init-${documentId}`
      }
    ],
    onResponse: () => {
      setIsAnalyzing(true)
    },
    onFinish: () => {
      setIsAnalyzing(false)
      onAnalysisComplete?.()
    },
    onError: error => {
      setIsAnalyzing(false)
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const handleConfirm = async (approved: boolean) => {
    setShowConfirmation(false)
    setFindings([])

    try {
      const response = await fetch(
        `/api/document-analysis/${documentId}/review`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ approved })
        }
      )

      if (!response.ok) throw new Error("Failed to submit review")

      toast({
        title: approved ? "Analysis Approved" : "Analysis Rejected",
        description: approved
          ? "The document analysis has been approved and saved."
          : "The document analysis has been rejected.",
        variant: approved ? "default" : "destructive"
      })

      onAnalysisComplete?.()
    } catch (error) {
      console.error("Error handling confirmation:", error)
      toast({
        title: "Error",
        description: "Failed to process confirmation",
        variant: "destructive"
      })
    }
  }

  const renderFindingSeverity = (severity: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-500",
      high: "bg-orange-500",
      medium: "bg-yellow-500",
      low: "bg-blue-500",
      info: "bg-gray-500"
    }

    return (
      <Badge className={`${colors[severity]} text-white`}>
        {severity.toUpperCase()}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Analysis Progress */}
      {isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Analysis in Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Progress
                value={
                  progress?.status === "completed"
                    ? 100
                    : progress?.status === "processing"
                      ? 50
                      : 25
                }
              />
              {progress && (
                <div className="text-sm text-gray-500">
                  {progress.toolName && (
                    <p>Current Tool: {progress.toolName}</p>
                  )}
                  <p>Status: {progress.status}</p>
                  {progress.step && <p>Step: {progress.step}</p>}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Messages */}
      {messages.map((message, index) => (
        <Card key={index} className="w-full">
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              {message.role === "assistant" ? "Analysis Progress" : "Input"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p>{message.content}</p>
          </CardContent>
        </Card>
      ))}

      {/* Findings Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Review Analysis Findings</DialogTitle>
            <DialogDescription>
              Please review the following findings and confirm if they should be
              saved.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4">
            {findings.map((finding, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{finding.title}</CardTitle>
                    {renderFindingSeverity(finding.severity)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="text-gray-700">{finding.description}</p>
                    {finding.location && (
                      <p className="text-sm text-gray-500">
                        Location: {finding.location}
                      </p>
                    )}
                    {finding.suggestedAction && (
                      <div className="mt-2">
                        <strong>Suggested Action:</strong>
                        <p className="text-sm">{finding.suggestedAction}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => handleConfirm(false)}
              disabled={isAnalyzing}
            >
              Reject
            </Button>
            <Button
              onClick={() => handleConfirm(true)}
              disabled={isAnalyzing}
              className="bg-green-600 hover:bg-green-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Processing
                </>
              ) : (
                "Approve"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
