"use client"

import { useEffect, useState, useCallback } from "react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  createBoardAnalysisAction,
  generateAnalysisPrompt,
  listAnalysesAction,
  updateAnalysisResultsAction
} from "@/actions/analyze/board-analysis"
import {
  documentTypeValues,
  type DocumentType,
  type SelectAnalysis
} from "@/db/schema"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  PlayCircle,
  CheckSquare,
  Square,
  Loader2,
  Upload,
  RefreshCcw,
  StopCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import useSWR from "swr"
import { fetcher } from "@/utils/functions"
import { Markdown } from "@/components/ui/markdown"
import { useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Progress } from "@/components/ui/progress"
import { experimental_useObject as useObject } from "@ai-sdk/react"
import { analysisSchema } from "@/actions/analyze/process-document"

interface CompanyAnalysisProps {
  companyId: string
}

interface AnalysisProgress {
  status: string
  step: string
  progress: number
}

interface AnalysisResult {
  executiveSummary: string
  keyFindings: Array<{
    description: string
    severity: "critical" | "high" | "medium" | "low"
    status: "open"
  }>
  recommendations: string[]
}

export default function CompanyAnalysis({ companyId }: CompanyAnalysisProps) {
  const { toast } = useToast()
  const { user } = useUser()
  const router = useRouter()
  const [analyses, setAnalyses] = useState<SelectAnalysis[]>([])
  const [selectedType, setSelectedType] = useState<DocumentType>("governance")
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("recent")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [currentProgress, setCurrentProgress] =
    useState<AnalysisProgress | null>(null)
  const [currentAnalysisId, setCurrentAnalysisId] = useState<string | null>(
    null
  )

  const {
    object,
    submit,
    isLoading: isAnalyzing,
    error: analysisError,
    stop
  } = useObject<AnalysisResult>({
    api: "/api/analyze",
    schema: analysisSchema,
    headers: {
      "Content-Type": "application/json"
    },
    onError: (error: Error) => {
      console.error("Analysis error:", error)
      setCurrentProgress({
        status: "error",
        step: error.message || "An error occurred",
        progress: 0
      })
      toast({
        title: "Analysis Error",
        description:
          error.message ||
          "An error occurred during analysis. Please try again.",
        variant: "destructive"
      })
      loadAnalyses()
    },
    onFinish: async result => {
      if (!result.object) {
        console.log("No analysis result received")
        return
      }

      console.log("Analysis completed with result:", result.object)

      // Don't update if we don't have a complete object yet
      if (
        !result.object.executiveSummary ||
        !Array.isArray(result.object.keyFindings) ||
        !Array.isArray(result.object.recommendations)
      ) {
        console.log("Waiting for complete analysis result...")
        return
      }

      if (currentAnalysisId) {
        try {
          const updateResult = await updateAnalysisResultsAction(
            currentAnalysisId,
            {
              summary: result.object.executiveSummary,
              findings: result.object.keyFindings.filter(
                (
                  finding
                ): finding is {
                  description: string
                  severity: "critical" | "high" | "medium" | "low"
                  status: "open"
                } => Boolean(finding?.description && finding?.severity)
              ),
              recommendations: result.object.recommendations.filter(
                (rec): rec is string => typeof rec === "string"
              )
            }
          )

          if (updateResult.isSuccess) {
            setCurrentProgress({
              status: "completed",
              step: "Analysis complete",
              progress: 100
            })
            toast({
              title: "Analysis Complete",
              description: "The analysis has been completed successfully."
            })
            loadAnalyses()
          } else {
            throw new Error(updateResult.message)
          }
        } catch (error) {
          console.error("Error updating analysis:", error)
          toast({
            title: "Error",
            description: "Failed to save analysis results",
            variant: "destructive"
          })
        }
      }
    }
  })

  const {
    data: files,
    mutate: mutateFiles,
    isLoading: isLoadingFiles
  } = useSWR<{ pathname: string; url: string }[]>(
    companyId
      ? `http://localhost:3000/api/files/list?companyId=${companyId}`
      : null,
    fetcher,
    {
      fallbackData: [],
      refreshInterval: 30000 // Refresh every 30 seconds
    }
  )

  const loadAnalyses = useCallback(
    async (showToast = false) => {
      try {
        setIsRefreshing(true)
        const result = await listAnalysesAction(companyId)
        if (result.isSuccess) {
          setAnalyses(result.data)
          if (showToast) {
            toast({
              title: "Refreshed",
              description: "Analysis list has been updated."
            })
          }
        } else {
          throw new Error(result.message)
        }
      } catch (error) {
        toast({
          title: "Error",
          description:
            error instanceof Error ? error.message : "Failed to load analyses",
          variant: "destructive"
        })
      } finally {
        setIsRefreshing(false)
      }
    },
    [companyId, toast]
  )

  // Initial load
  useEffect(() => {
    loadAnalyses()
  }, [loadAnalyses])

  // Periodic refresh for in-progress analyses
  useEffect(() => {
    const hasInProgress = analyses.some(
      a => a.status === "pending" || a.status === "in_progress"
    )

    if (hasInProgress) {
      const interval = setInterval(() => {
        loadAnalyses()
      }, 10000) // Refresh every 10 seconds when there are in-progress analyses

      return () => clearInterval(interval)
    }
  }, [analyses, loadAnalyses])

  // Update the progress tracking useEffect
  useEffect(() => {
    if (object) {
      console.log("Received object update:", object)
      let progress = 25 // Start at 25% for initialization

      // Calculate progress based on object completeness
      if (object.executiveSummary?.trim()) {
        progress += 25 // Executive summary adds 25%
      }

      if (Array.isArray(object.keyFindings) && object.keyFindings.length > 0) {
        progress += 25 // Key findings adds 25%
      }

      if (
        Array.isArray(object.recommendations) &&
        object.recommendations.length > 0
      ) {
        progress += 25 // Recommendations adds 25%
      }

      setCurrentProgress({
        status: progress === 100 ? "completed" : "processing",
        step: `Analyzing documents (${progress}%)`,
        progress
      })
    }
  }, [object])

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to analyze.",
        variant: "destructive"
      })
      return
    }

    try {
      // Clear any previous progress and object
      setCurrentProgress(null)
      stop()

      console.log("Starting analysis with files:", selectedFiles)
      const fileNames = selectedFiles
        .map(file => files?.find(f => f.url === file)?.pathname || "Document")
        .join(", ")

      // Create analysis record
      console.log("Creating analysis record...")
      const result = await createBoardAnalysisAction({
        documentIds: selectedFiles,
        companyId,
        type: selectedType,
        title: `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Analysis - ${fileNames}`
      })

      if (!result.isSuccess) {
        throw new Error(result.message)
      }

      const analysis = result.data
      console.log("Analysis record created:", analysis)
      setCurrentAnalysisId(analysis.id)

      // Clear selected files and switch to in-progress tab
      setSelectedFiles([])
      setActiveTab("in-progress")

      // Start analysis
      console.log("Submitting analysis request...")
      const prompt = await generateAnalysisPrompt(selectedType)
      await submit({
        filePaths: selectedFiles,
        prompt,
        analysisId: analysis.id
      })

      console.log("Analysis request submitted successfully")
    } catch (error) {
      console.error("Error in analysis:", error)
      setCurrentProgress({
        status: "error",
        step:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        progress: 0
      })
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "An unexpected error occurred during analysis.",
        variant: "destructive"
      })
    }
  }

  const toggleFileSelection = (fileUrl: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileUrl)
        ? prev.filter(f => f !== fileUrl)
        : [...prev, fileUrl]
    )
  }

  const filteredAnalyses = {
    recent: analyses.slice(0, 5),
    completed: analyses.filter(a => a.status === "completed"),
    "in-progress": analyses.filter(a =>
      ["pending", "in_progress"].includes(a.status)
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Board Analysis Dashboard</CardTitle>
            <CardDescription>
              Analyze board documents and view analysis results
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/companies/${companyId}/files`)}
            >
              <Upload className="mr-2 size-4" />
              Upload Files
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadAnalyses(true)}
              disabled={isRefreshing}
            >
              <RefreshCcw
                className={cn("size-4", {
                  "animate-spin": isRefreshing
                })}
              />
              <span className="sr-only ml-2">Refresh</span>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <Select
              value={selectedType}
              onValueChange={value => setSelectedType(value as DocumentType)}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select analysis type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypeValues.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleAnalyze}
              disabled={selectedFiles.length === 0 || isAnalyzing}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <PlayCircle className="mr-2 size-4" />
                  Start Analysis
                </>
              )}
            </Button>

            {isAnalyzing && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  stop()
                  toast({
                    title: "Analysis Stopped",
                    description: "The analysis has been stopped."
                  })
                }}
              >
                <StopCircle className="mr-2 size-4" />
                Stop Analysis
              </Button>
            )}
          </div>

          {analysisError && (
            <Card className="bg-destructive/10">
              <CardHeader>
                <CardTitle className="text-destructive">
                  Analysis Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-destructive text-sm">
                  An error occurred during analysis. Please try again.
                </p>
              </CardContent>
            </Card>
          )}

          {currentProgress && (
            <Card className="bg-muted">
              <CardHeader className="py-3">
                <CardTitle className="text-sm font-medium">
                  Analysis Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Progress value={currentProgress.progress} />
                  <p className="text-muted-foreground text-sm">
                    {currentProgress.step}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-muted">
            <CardHeader>
              <CardTitle className="text-base">
                Available Documents ({files?.length || 0})
              </CardTitle>
              <CardDescription>
                Select documents to analyze. You can select multiple documents.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingFiles ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="text-muted-foreground size-6 animate-spin" />
                </div>
              ) : files?.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-4 py-8">
                  <FileText className="text-muted-foreground size-8" />
                  <div className="text-center">
                    <p className="text-muted-foreground text-sm">
                      No documents available.
                    </p>
                    <Button
                      variant="link"
                      onClick={() =>
                        router.push(`/companies/${companyId}/files`)
                      }
                      className="h-auto p-0 text-sm"
                    >
                      Upload documents to begin analysis
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid max-h-[300px] gap-2 overflow-y-auto">
                  {files?.map(file => (
                    <div
                      key={file.url}
                      className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md p-2"
                      onClick={() => toggleFileSelection(file.url)}
                    >
                      {selectedFiles.includes(file.url) ? (
                        <CheckSquare className="text-primary size-4" />
                      ) : (
                        <Square className="size-4" />
                      )}
                      <span className="flex-1 truncate text-sm">
                        {file.pathname}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {selectedFiles.length > 0 && (
            <Card className="bg-muted">
              <CardHeader>
                <CardTitle className="text-base">
                  Selected Documents ({selectedFiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {selectedFiles.map(fileUrl => {
                    const file = files?.find(f => f.url === fileUrl)
                    return (
                      <div
                        key={fileUrl}
                        className="bg-background flex items-center justify-between gap-2 rounded-md p-2"
                      >
                        <span className="truncate text-sm">
                          {file?.pathname}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFileSelection(fileUrl)}
                        >
                          Remove
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="recent">
              Recent
              {filteredAnalyses.recent.length > 0 && (
                <span className="bg-primary/10 ml-2 rounded-full px-2 py-0.5 text-xs">
                  {filteredAnalyses.recent.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed
              {filteredAnalyses.completed.length > 0 && (
                <span className="bg-primary/10 ml-2 rounded-full px-2 py-0.5 text-xs">
                  {filteredAnalyses.completed.length}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="in-progress">
              In Progress
              {filteredAnalyses["in-progress"].length > 0 && (
                <span className="bg-primary/10 ml-2 rounded-full px-2 py-0.5 text-xs">
                  {filteredAnalyses["in-progress"].length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {Object.entries(filteredAnalyses).map(([key, items]) => (
            <TabsContent key={key} value={key}>
              <div className="grid gap-4">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
                    <FileText className="text-muted-foreground size-8" />
                    <div>
                      <p className="text-muted-foreground text-sm">
                        No {key.replace("-", " ")} analyses
                      </p>
                      {key === "completed" && (
                        <p className="text-muted-foreground text-xs">
                          Start an analysis to see results here
                        </p>
                      )}
                    </div>
                  </div>
                ) : (
                  items.map(analysis => (
                    <AnalysisCard key={analysis.id} analysis={analysis} />
                  ))
                )}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  )
}

interface AnalysisCardProps {
  analysis: SelectAnalysis
}

function AnalysisCard({ analysis }: AnalysisCardProps) {
  const [expanded, setExpanded] = useState(false)

  const findings =
    typeof analysis.findings === "string"
      ? JSON.parse(analysis.findings)
      : analysis.findings || {}

  const recommendations =
    typeof analysis.recommendations === "string"
      ? JSON.parse(analysis.recommendations)
      : analysis.recommendations || []

  const isPending = analysis.status === "pending"
  const isInProgress = analysis.status === "in_progress"
  const isCompleted = analysis.status === "completed"
  const isError = analysis.status === "failed"

  // Calculate progress percentage
  const progressPercentage = (() => {
    switch (analysis.status) {
      case "pending":
        return 0
      case "in_progress":
        return 50
      case "needs_review":
        return 75
      case "completed":
        return 100
      case "failed":
        return 100
      default:
        return 0
    }
  })()

  return (
    <Card
      className={cn("transition-all duration-200", {
        "cursor-pointer hover:shadow-md": isCompleted,
        "border-yellow-500/20 bg-yellow-500/10": isPending,
        "border-blue-500/20 bg-blue-500/10": isInProgress,
        "border-red-500/20 bg-red-500/10": isError
      })}
      onClick={() => {
        if (isCompleted) {
          setExpanded(!expanded)
        }
      }}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  {renderStatusIcon(analysis.status)}
                </TooltipTrigger>
                <TooltipContent>
                  <p>Status: {analysis.status}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <div className="space-y-1">
              <CardTitle className="text-lg">{analysis.title}</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{analysis.type}</Badge>
                {(isPending || isInProgress) && (
                  <Progress value={progressPercentage} className="h-2 w-24" />
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {(isPending || isInProgress) && (
              <Loader2 className="text-muted-foreground size-4 animate-spin" />
            )}
            <span className="text-muted-foreground text-sm">
              {analysis.createdAt instanceof Date
                ? analysis.createdAt.toLocaleDateString()
                : new Date(analysis.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </CardHeader>
      {expanded && isCompleted && (
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {analysis.summary && (
                <div>
                  <h4 className="mb-2 font-semibold">Summary</h4>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <Markdown>{analysis.summary}</Markdown>
                  </div>
                </div>
              )}

              {Object.keys(findings).length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">Findings</h4>
                  {Object.entries(findings).map(([category, items]) => (
                    <div key={category} className="mb-4">
                      <h5 className="flex items-center gap-2 text-sm font-medium">
                        {category}
                        {Array.isArray(items) && (
                          <Badge variant="outline">{items.length}</Badge>
                        )}
                      </h5>
                      <ul className="mt-2 space-y-2">
                        {Array.isArray(items) ? (
                          <Markdown>{JSON.stringify(items)}</Markdown>
                        ) : (
                          <Markdown>{String(items)}</Markdown>
                        )}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {recommendations.length > 0 && (
                <div>
                  <h4 className="mb-2 font-semibold">Recommendations</h4>
                  <ul className="space-y-2">
                    {recommendations.map((rec: string, index: number) => (
                      <li
                        key={index}
                        className="prose prose-sm dark:prose-invert"
                      >
                        <Markdown>{rec}</Markdown>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      )}
    </Card>
  )
}
function renderStatusIcon(status: string) {
  switch (status) {
    case "pending":
      return <Clock className="text-yellow-500" />
    case "in_progress":
      return <PlayCircle className="text-blue-500" />
    case "completed":
      return <CheckCircle2 className="text-green-500" />
    case "failed":
      return <AlertCircle className="text-red-500" />
    default:
      return <FileText className="text-gray-500" />
  }
}
