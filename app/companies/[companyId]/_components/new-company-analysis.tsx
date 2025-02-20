"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from "lucide-react"
import { createBoardAnalysisAction } from "@/actions/analyze/board-analysis"
import { DocumentUploader } from "@/components/document-uploader"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { documentTypeEnum, type DocumentType } from "@/db/schema"

interface CompanyAnalysisProps {
  companyId: string
}

interface AnalysisResult {
  summary: string
  findings: Array<{
    description: string
    severity: "critical" | "high" | "medium" | "low"
    status: "open"
  }>
  recommendations: string[]
}

export default function CompanyAnalysis({ companyId }: CompanyAnalysisProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [documentIds, setDocumentIds] = useState<string[]>([])
  const [analysisType, setAnalysisType] = useState<DocumentType>("governance")
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  )
  const [error, setError] = useState<string | null>(null)

  const handleAnalysis = async () => {
    if (documentIds.length === 0) {
      setError("Please upload at least one document")
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const result = await createBoardAnalysisAction({
        documentIds,
        companyId,
        type: analysisType,
        title: `${analysisType} Analysis - ${new Date().toLocaleDateString()}`
      })

      if (!result.isSuccess) {
        throw new Error(result.message)
      }

      if (!result.data.summary) {
        throw new Error("No analysis results received")
      }

      const parsedReport = JSON.parse(result.data.summary) as AnalysisResult
      setAnalysisResult(parsedReport)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed")
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-destructive text-destructive-foreground"
      case "high":
        return "bg-red-500 text-white"
      case "medium":
        return "bg-yellow-500 text-white"
      case "low":
        return "bg-blue-500 text-white"
      default:
        return "bg-secondary text-secondary-foreground"
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Document Analysis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <DocumentUploader
                companyId={companyId}
                onUploadComplete={(urls: string[]) =>
                  setDocumentIds(prev => [...prev, ...urls])
                }
                maxFiles={5}
              />
            </div>
            <div className="w-full md:w-48">
              <Select
                value={analysisType}
                onValueChange={value => setAnalysisType(value as DocumentType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypeEnum.enumValues.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAnalysis}
              disabled={isAnalyzing || documentIds.length === 0}
            >
              {isAnalyzing && <Loader2 className="mr-2 size-4 animate-spin" />}
              Analyze Documents
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {analysisResult && (
            <div className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Executive Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    {analysisResult.summary}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Key Findings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {analysisResult.findings.map((finding, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-2 border-b pb-4 last:border-0 last:pb-0"
                      >
                        <Badge
                          className={`${getSeverityColor(
                            finding.severity
                          )} capitalize`}
                        >
                          {finding.severity}
                        </Badge>
                        <p className="flex-1">{finding.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Recommendations</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="list-disc space-y-2 pl-4">
                    {analysisResult.recommendations.map(
                      (recommendation, index) => (
                        <li key={index}>{recommendation}</li>
                      )
                    )}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
