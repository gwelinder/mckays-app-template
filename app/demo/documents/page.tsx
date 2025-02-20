"use client"

import { useState } from "react"
import { UploadForm } from "@/components/documents/upload/upload-form"
import { ProcessingStatus } from "@/components/documents/processing/processing-status"
import { MetadataViewer } from "@/components/documents/processing/metadata-viewer"
import { ErrorHandler } from "@/components/documents/processing/error-handler"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function DocumentsTestPage() {
  const [documentId, setDocumentId] = useState<string>("")
  const [processingErrors, setProcessingErrors] = useState<any[]>([])
  const [documentMetadata, setDocumentMetadata] = useState<any>(null)

  const handleUploadComplete = async (documentIds: string[]) => {
    if (documentIds.length > 0) {
      const newDocumentId = documentIds[0]
      setDocumentId(newDocumentId)
      console.log("Document uploaded:", newDocumentId)

      // Start processing
      try {
        const response = await fetch(
          `/api/documents/process/route?documentId=${newDocumentId}`,
          {
            method: "POST"
          }
        )

        if (!response.ok) {
          throw new Error("Failed to start processing")
        }

        const data = await response.json()
        console.log("Processing started:", data)
      } catch (error) {
        console.error("Failed to start processing:", error)
        handleProcessingError({
          id: `error-${Date.now()}`,
          documentId: newDocumentId,
          step: "processing",
          message: "Failed to start document processing",
          code: "PROC_START_ERR",
          timestamp: new Date().toISOString(),
          details: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }
  }

  const handleProcessingError = (error: any) => {
    setProcessingErrors(prev => [...prev, error])
    console.error("Processing error:", error)
  }

  const handleRetry = async (error: any) => {
    console.log("Retrying processing for error:", error)
    try {
      const response = await fetch(
        `/api/documents/process/route?documentId=${error.documentId}`,
        {
          method: "POST"
        }
      )

      if (!response.ok) {
        throw new Error("Retry failed")
      }

      setProcessingErrors(prev => prev.filter(e => e.id !== error.id))
    } catch (error) {
      console.error("Retry failed:", error)
    }
  }

  const handleStatusChange = async (status: any) => {
    console.log("Processing status:", status)

    if (status.status === "error" && status.error) {
      handleProcessingError({
        id: `error-${Date.now()}`,
        documentId,
        step: status.currentStep || "unknown",
        message: status.error,
        code: "PROC_ERR",
        timestamp: new Date().toISOString()
      })
    }

    if (status.status === "completed") {
      try {
        // Fetch document metadata
        const response = await fetch(
          `/api/documents/metadata?documentId=${documentId}`
        )
        if (response.ok) {
          const metadata = await response.json()
          setDocumentMetadata(metadata)
        }
      } catch (error) {
        console.error("Failed to fetch metadata:", error)
      }
    }
  }

  return (
    <div className="container space-y-8 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Document Processing Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upload" className="space-y-4">
            <TabsList>
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="processing">Processing</TabsTrigger>
              <TabsTrigger value="metadata">Metadata</TabsTrigger>
              <TabsTrigger value="errors">Errors</TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-4">
              <UploadForm
                companyId="demo-company"
                onUploadComplete={handleUploadComplete}
              />
            </TabsContent>

            <TabsContent value="processing" className="space-y-4">
              {documentId && (
                <ProcessingStatus
                  documentId={documentId}
                  onStatusChange={handleStatusChange}
                />
              )}
            </TabsContent>

            <TabsContent value="metadata" className="space-y-4">
              {documentMetadata ? (
                <MetadataViewer metadata={documentMetadata} />
              ) : (
                <p className="text-muted-foreground py-8 text-center">
                  No document metadata available
                </p>
              )}
            </TabsContent>

            <TabsContent value="errors" className="space-y-4">
              <ErrorHandler
                errors={processingErrors}
                onRetry={handleRetry}
                onDismiss={errorId => {
                  console.log("Dismissing error:", errorId)
                  setProcessingErrors(prev =>
                    prev.filter(error => error.id !== errorId)
                  )
                }}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
