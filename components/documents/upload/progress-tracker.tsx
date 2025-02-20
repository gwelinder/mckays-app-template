"use client"

import { Progress } from "@/components/ui/progress"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface ProgressStep {
  id: string
  name: string
  status: "pending" | "processing" | "completed" | "error"
  progress: number
  error?: string
}

interface ProgressTrackerProps {
  steps: ProgressStep[]
  currentStep?: string
  className?: string
}

export function ProgressTracker({
  steps,
  currentStep,
  className
}: ProgressTrackerProps) {
  const getStatusIcon = (status: ProgressStep["status"]) => {
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

  const getStatusColor = (status: ProgressStep["status"]) => {
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
      <CardHeader>
        <CardTitle className="text-lg">Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {steps.map(step => (
          <div key={step.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusIcon(step.status)}
                <span className="text-sm font-medium">{step.name}</span>
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
