"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ProcessingStep {
  id: string
  name: string
  description: string
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  error?: string
}

interface ProcessingStatus {
  documentId: string
  status: "pending" | "processing" | "completed" | "error"
  currentStep?: string
  steps: ProcessingStep[]
  error?: string
}

interface ProcessingStatusProps {
  documentId: string
  onStatusChange?: (status: ProcessingStatus) => void
  className?: string
}

export function ProcessingStatus({
  documentId,
  onStatusChange,
  className
}: ProcessingStatusProps) {
  const [status, setStatus] = useState<ProcessingStatus>({
    documentId,
    status: "pending",
    steps: [
      {
        id: "validation",
        name: "Validation",
        description: "Validating document format and content",
        status: "pending",
        progress: 0
      },
      {
        id: "extraction",
        name: "Text Extraction",
        description: "Extracting text content from document",
        status: "pending",
        progress: 0
      },
      {
        id: "processing",
        name: "Processing",
        description: "Processing document content",
        status: "pending",
        progress: 0
      },
      {
        id: "metadata",
        name: "Metadata",
        description: "Generating document metadata",
        status: "pending",
        progress: 0
      }
    ]
  })

  useEffect(() => {
    let eventSource: EventSource | undefined

    const setupEventSource = () => {
      eventSource = new EventSource(
        `/api/documents/process/status?documentId=${documentId}`
      )

      eventSource.onmessage = event => {
        const data = JSON.parse(event.data) as {
          type: string
          step?: string
          progress?: number
          error?: string
          status?: string
        }

        setStatus(prev => {
          const newStatus = { ...prev }

          if (data.type === "step_update" && data.step) {
            const stepIndex = prev.steps.findIndex(s => s.id === data.step)
            if (stepIndex !== -1) {
              newStatus.steps = [...prev.steps]
              newStatus.steps[stepIndex] = {
                ...newStatus.steps[stepIndex],
                status: "processing",
                progress: data.progress || 0
              }

              // Mark previous steps as completed
              for (let i = 0; i < stepIndex; i++) {
                newStatus.steps[i] = {
                  ...newStatus.steps[i],
                  status: "completed",
                  progress: 100
                }
              }
            }
          } else if (data.type === "status_update" && data.status) {
            newStatus.status = data.status as ProcessingStatus["status"]
            if (data.status === "completed") {
              newStatus.steps = newStatus.steps.map(step => ({
                ...step,
                status: "completed",
                progress: 100
              }))
            } else if (data.status === "error") {
              newStatus.error = data.error
            }
          }

          onStatusChange?.(newStatus)
          return newStatus
        })
      }

      eventSource.onerror = error => {
        console.error("EventSource error:", error)
        eventSource?.close()
        setStatus(prev => ({
          ...prev,
          status: "error",
          error: "Lost connection to processing status"
        }))
      }
    }

    setupEventSource()

    return () => {
      eventSource?.close()
    }
  }, [documentId, onStatusChange])

  const getStatusIcon = (status: ProcessingStep["status"]) => {
    switch (status) {
      case "processing":
        return <Loader2 className="size-4 animate-spin" />
      case "completed":
        return <CheckCircle2 className="size-4 text-green-500" />
      case "error":
        return <XCircle className="text-destructive size-4" />
      default:
        return null
    }
  }

  const getStatusColor = (status: ProcessingStep["status"]) => {
    switch (status) {
      case "processing":
        return "bg-blue-500"
      case "completed":
        return "bg-green-500"
      case "error":
        return "bg-destructive"
      default:
        return "bg-muted"
    }
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Processing Status</CardTitle>
        <Badge
          variant="secondary"
          className={cn("text-white", getStatusColor(status.status))}
        >
          {status.status.charAt(0).toUpperCase() + status.status.slice(1)}
        </Badge>
      </CardHeader>

      <CardContent className="space-y-4">
        {status.error && (
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{status.error}</AlertDescription>
          </Alert>
        )}

        {status.steps.map(step => (
          <div key={step.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(step.status)}
                <div>
                  <p className="text-sm font-medium">{step.name}</p>
                  <p className="text-muted-foreground text-xs">
                    {step.description}
                  </p>
                </div>
              </div>
              <Badge
                variant="secondary"
                className={cn(
                  "text-white",
                  step.status !== "pending" && getStatusColor(step.status)
                )}
              >
                {step.status.charAt(0).toUpperCase() + step.status.slice(1)}
              </Badge>
            </div>

            <Progress
              value={step.progress}
              className={cn(
                "h-1",
                step.status === "error" && "bg-destructive/25"
              )}
            />

            {step.error && (
              <p className="text-destructive mt-1 text-xs">{step.error}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
