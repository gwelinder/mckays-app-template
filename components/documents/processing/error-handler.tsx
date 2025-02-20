"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface ProcessingError {
  id: string
  documentId: string
  step: string
  message: string
  code: string
  timestamp: string
  details?: string
  retryCount?: number
}

interface ErrorHandlerProps {
  errors: ProcessingError[]
  onRetry?: (error: ProcessingError) => Promise<void>
  onDismiss?: (errorId: string) => void
  className?: string
}

export function ErrorHandler({
  errors,
  onRetry,
  onDismiss,
  className
}: ErrorHandlerProps) {
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set())
  const [retrying, setRetrying] = useState<Set<string>>(new Set())

  const toggleError = (errorId: string) => {
    setExpandedErrors(prev => {
      const next = new Set(prev)
      if (next.has(errorId)) {
        next.delete(errorId)
      } else {
        next.add(errorId)
      }
      return next
    })
  }

  const handleRetry = async (error: ProcessingError) => {
    if (!onRetry) return

    setRetrying(prev => new Set(prev).add(error.id))
    try {
      await onRetry(error)
      onDismiss?.(error.id)
    } finally {
      setRetrying(prev => {
        const next = new Set(prev)
        next.delete(error.id)
        return next
      })
    }
  }

  if (errors.length === 0) return null

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            Processing Errors
            <Badge variant="destructive">{errors.length}</Badge>
          </CardTitle>
          {errors.length > 1 && onRetry && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                Promise.all(errors.map(error => handleRetry(error)))
              }
              disabled={retrying.size > 0}
            >
              <RefreshCw
                className={cn(
                  "mr-2 size-4",
                  retrying.size > 0 && "animate-spin"
                )}
              />
              Retry All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {errors.map(error => (
          <Collapsible
            key={error.id}
            open={expandedErrors.has(error.id)}
            onOpenChange={() => toggleError(error.id)}
          >
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <AlertTitle>Error in {error.step}</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {onRetry && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={e => {
                          e.stopPropagation()
                          handleRetry(error)
                        }}
                        disabled={retrying.has(error.id)}
                      >
                        <RefreshCw
                          className={cn(
                            "size-4",
                            retrying.has(error.id) && "animate-spin"
                          )}
                        />
                      </Button>
                    )}
                    {onDismiss && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={e => {
                          e.stopPropagation()
                          onDismiss(error.id)
                        }}
                      >
                        <XCircle className="size-4" />
                      </Button>
                    )}
                    <CollapsibleTrigger asChild>
                      <Button variant="outline" size="icon">
                        {expandedErrors.has(error.id) ? (
                          <ChevronUp className="size-4" />
                        ) : (
                          <ChevronDown className="size-4" />
                        )}
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                </div>
              </div>
            </Alert>
            <CollapsibleContent>
              <div className="mt-2 space-y-2 text-sm">
                <div className="text-muted-foreground grid grid-cols-2 gap-2">
                  <div>
                    <span className="font-medium">Error Code:</span>{" "}
                    <code className="bg-muted rounded px-1 py-0.5 text-xs">
                      {error.code}
                    </code>
                  </div>
                  <div>
                    <span className="font-medium">Time:</span>{" "}
                    {new Date(error.timestamp).toLocaleString()}
                  </div>
                  {error.retryCount !== undefined && (
                    <div>
                      <span className="font-medium">Retry Attempts:</span>{" "}
                      {error.retryCount}
                    </div>
                  )}
                </div>
                {error.details && (
                  <div className="mt-2">
                    <span className="font-medium">Details:</span>
                    <pre className="bg-muted mt-1 whitespace-pre-wrap rounded p-2 text-xs">
                      {error.details}
                    </pre>
                  </div>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        ))}
      </CardContent>
    </Card>
  )
}
