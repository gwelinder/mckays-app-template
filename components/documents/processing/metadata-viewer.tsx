"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileText, Calendar, Hash, Type, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

export interface DocumentMetadata {
  id: string
  filename: string
  fileType: string
  fileSize: number
  pageCount?: number
  wordCount?: number
  createdAt: string
  modifiedAt?: string
  author?: string
  title?: string
  subject?: string
  keywords?: string[]
  language?: string
  processingTime?: number
  customMetadata?: Record<string, any>
}

interface MetadataViewerProps {
  metadata: DocumentMetadata
  className?: string
}

export function MetadataViewer({ metadata, className }: MetadataViewerProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
  }

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString()
  }

  const basicMetadata = [
    {
      icon: <FileText className="size-4" />,
      label: "Filename",
      value: metadata.filename
    },
    {
      icon: <Type className="size-4" />,
      label: "File Type",
      value: metadata.fileType
    },
    {
      icon: <Hash className="size-4" />,
      label: "Size",
      value: formatFileSize(metadata.fileSize)
    },
    {
      icon: <Calendar className="size-4" />,
      label: "Created",
      value: formatDate(metadata.createdAt)
    },
    ...(metadata.modifiedAt
      ? [
          {
            icon: <Calendar className="size-4" />,
            label: "Modified",
            value: formatDate(metadata.modifiedAt)
          }
        ]
      : []),
    ...(metadata.processingTime
      ? [
          {
            icon: <Clock className="size-4" />,
            label: "Processing Time",
            value: `${metadata.processingTime.toFixed(2)}s`
          }
        ]
      : [])
  ]

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="text-lg">Document Metadata</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Metadata */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {basicMetadata.map((item, index) => (
            <div
              key={index}
              className="text-muted-foreground flex items-center gap-2 text-sm"
            >
              {item.icon}
              <span className="font-medium">{item.label}:</span>
              <span>{item.value}</span>
            </div>
          ))}
        </div>

        {/* Document Statistics */}
        {(metadata.pageCount !== undefined ||
          metadata.wordCount !== undefined) && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Document Statistics</h3>
            <div className="flex gap-2">
              {metadata.pageCount !== undefined && (
                <Badge variant="secondary">
                  {metadata.pageCount}{" "}
                  {metadata.pageCount === 1 ? "page" : "pages"}
                </Badge>
              )}
              {metadata.wordCount !== undefined && (
                <Badge variant="secondary">
                  {metadata.wordCount.toLocaleString()}{" "}
                  {metadata.wordCount === 1 ? "word" : "words"}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Document Properties */}
        {(metadata.author ||
          metadata.title ||
          metadata.subject ||
          metadata.keywords) && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Document Properties</h3>
            <Table>
              <TableBody>
                {metadata.title && (
                  <TableRow>
                    <TableCell className="font-medium">Title</TableCell>
                    <TableCell>{metadata.title}</TableCell>
                  </TableRow>
                )}
                {metadata.author && (
                  <TableRow>
                    <TableCell className="font-medium">Author</TableCell>
                    <TableCell>{metadata.author}</TableCell>
                  </TableRow>
                )}
                {metadata.subject && (
                  <TableRow>
                    <TableCell className="font-medium">Subject</TableCell>
                    <TableCell>{metadata.subject}</TableCell>
                  </TableRow>
                )}
                {metadata.keywords && metadata.keywords.length > 0 && (
                  <TableRow>
                    <TableCell className="font-medium">Keywords</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {metadata.keywords.map((keyword, index) => (
                          <Badge key={index} variant="outline">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {metadata.language && (
                  <TableRow>
                    <TableCell className="font-medium">Language</TableCell>
                    <TableCell>{metadata.language}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Custom Metadata */}
        {metadata.customMetadata &&
          Object.keys(metadata.customMetadata).length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Additional Metadata</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Property</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(metadata.customMetadata).map(
                    ([key, value]) => (
                      <TableRow key={key}>
                        <TableCell className="font-medium">
                          {key.charAt(0).toUpperCase() + key.slice(1)}
                        </TableCell>
                        <TableCell>
                          {typeof value === "object"
                            ? JSON.stringify(value)
                            : String(value)}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          )}
      </CardContent>
    </Card>
  )
}
