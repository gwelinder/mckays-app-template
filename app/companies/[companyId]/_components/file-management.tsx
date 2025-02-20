"use client"

import { useEffect, useRef, useState } from "react"
import useSWR from "swr"
import { fetcher } from "@/utils/functions"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  AlertCircle,
  FileIcon,
  Loader2,
  MoreVertical,
  Plus,
  Trash2,
  Upload
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  documentTypeEnum,
  documentTypeValues,
  type DocumentType
} from "@/db/schema"

interface FileData {
  pathname: string
  url: string
  category?: DocumentType
  uploadedAt?: string
  size?: number
}

export default function FileManagement({ companyId }: { companyId: string }) {
  const { toast } = useToast()
  const [activeTab, setActiveTab] = useState("all")
  const [selectedCategory, setSelectedCategory] = useState<
    DocumentType | "all"
  >("all")
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  )
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    data: files,
    mutate,
    isLoading
  } = useSWR<FileData[]>(
    companyId ? `/api/files/list?companyId=${companyId}` : null,
    fetcher,
    {
      fallbackData: [],
      refreshInterval: 5000 // Refresh every 5 seconds
    }
  )

  const handleFileUpload = async (file: File) => {
    if (!file || !companyId) return

    try {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

      const xhr = new XMLHttpRequest()
      xhr.open(
        "POST",
        `/api/files/upload?filename=${encodeURIComponent(file.name)}&companyId=${companyId}`,
        true
      )

      xhr.upload.onprogress = event => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
        }
      }

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText)
          if (xhr.status === 200 && response.success) {
            toast({
              title: "Success",
              description: "File uploaded successfully"
            })
            mutate()
          } else {
            toast({
              title: "Error",
              description: response.error || "Failed to upload file",
              variant: "destructive"
            })
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to process server response",
            variant: "destructive"
          })
        }
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[file.name]
          return newProgress
        })
      }

      xhr.onerror = () => {
        toast({
          title: "Error",
          description: "Network error occurred",
          variant: "destructive"
        })
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[file.name]
          return newProgress
        })
      }

      xhr.send(file)
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      })
      setUploadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[file.name]
        return newProgress
      })
    }
  }

  const handleDelete = async (fileUrl: string) => {
    try {
      await fetch(
        `/api/files/delete?fileurl=${fileUrl}&companyId=${companyId}`,
        {
          method: "DELETE"
        }
      )
      toast({
        title: "Success",
        description: "File deleted successfully"
      })
      mutate()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive"
      })
    }
  }

  const filteredFiles = files?.filter(file => {
    if (activeTab === "uploading") {
      return file.pathname in uploadProgress
    }
    if (selectedCategory !== "all") {
      return file.category === selectedCategory
    }
    return true
  })

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>File Management</CardTitle>
            <CardDescription>
              Upload and manage your company documents
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedCategory}
              onValueChange={(value: DocumentType | "all") =>
                setSelectedCategory(value)
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {documentTypeValues.map((category: DocumentType) => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 size-4" />
              Upload
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept="application/pdf"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file) handleFileUpload(file)
              }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="all" className="relative">
              All Files
              <Badge variant="secondary" className="bg-primary/10 ml-2">
                {files?.length || 0}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="uploading" className="relative">
              Uploading
              {Object.keys(uploadProgress).length > 0 && (
                <Badge variant="secondary" className="bg-primary/10 ml-2">
                  {Object.keys(uploadProgress).length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-4">
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <Loader2 className="size-6 animate-spin" />
              </div>
            ) : filteredFiles?.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed">
                <FileIcon className="text-muted-foreground size-8" />
                <p className="text-muted-foreground text-sm">
                  No files found. Upload some files to get started!
                </p>
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Uploaded</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFiles?.map(file => (
                      <TableRow key={file.url}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            <FileIcon className="size-4" />
                            <span className="max-w-[300px] truncate">
                              {file.pathname}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {file.category ? (
                            <Badge variant="secondary">{file.category}</Badge>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {file.uploadedAt
                            ? new Date(file.uploadedAt).toLocaleDateString()
                            : "-"}
                        </TableCell>
                        <TableCell>
                          {file.size
                            ? `${Math.round(file.size / 1024)} KB`
                            : "-"}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="size-8 p-0">
                                <MoreVertical className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={() => handleDelete(file.url)}
                              >
                                <Trash2 className="mr-2 size-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="uploading" className="mt-4">
            {Object.entries(uploadProgress).length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed">
                <Upload className="text-muted-foreground size-8" />
                <p className="text-muted-foreground text-sm">
                  No files are currently uploading
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(uploadProgress).map(([filename, progress]) => (
                  <div
                    key={filename}
                    className="flex items-center gap-4 rounded-lg border p-4"
                  >
                    <FileIcon className="size-8" />
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">{filename}</p>
                        <span className="text-muted-foreground text-sm">
                          {progress}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
