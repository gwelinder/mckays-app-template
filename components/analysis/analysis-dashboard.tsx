"use client"

import { useEffect, useState } from "react"
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
  listAnalysesAction
} from "@/actions/analyze/board-analysis"
import {
  documentTypeEnum,
  type SelectAnalysis,
  type SelectDocument
} from "@/db/schema"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  PlayCircle,
  CheckSquare,
  Square
} from "lucide-react"
import { cn } from "@/lib/utils"
import useSWR from "swr"
import { fetcher } from "@/utils/functions"
import { Markdown } from "@/components/ui/markdown"

interface AnalysisDashboardProps {
  companyId: string
  selectedDocuments: Array<{ id: string; name: string }>
}

export function AnalysisDashboard({ companyId }: AnalysisDashboardProps) {
  const { toast } = useToast()
  const [analyses, setAnalyses] = useState<SelectAnalysis[]>([])
  const [selectedType, setSelectedType] =
    useState<(typeof documentTypeEnum.enumValues)[number]>("governance")
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])

  // Fetch available files
  const {
    data: files,
    mutate: mutateFiles,
    isLoading: isLoadingFiles
  } = useSWR<{ pathname: string; url: string }[]>(
    companyId ? `/api/files/list?companyId=${companyId}` : null,
    fetcher,
    { fallbackData: [] }
  )

  useEffect(() => {
    loadAnalyses()
  }, [companyId])

  const loadAnalyses = async () => {
    const result = await listAnalysesAction(companyId)
    if (result.isSuccess) {
      setAnalyses(result.data)
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive"
      })
    }
  }

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) {
      toast({
        title: "No Files Selected",
        description: "Please select at least one file to analyze.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    const result = await createBoardAnalysisAction({
      documentIds: selectedFiles,
      companyId,
      type: selectedType,
      title: `${selectedType.charAt(0).toUpperCase() + selectedType.slice(1)} Analysis - ${selectedFiles.map(file => files?.find(f => f.url === file)?.pathname || "Document").join(", ")}`
    })

    if (result.isSuccess) {
      toast({
        title: "Analysis Started",
        description: `Analysis has begun.`
      })
    } else {
      toast({
        title: "Error",
        description: result.message,
        variant: "destructive"
      })
    }

    setIsLoading(false)
    loadAnalyses()
  }

  const toggleFileSelection = (fileUrl: string) => {
    setSelectedFiles(prev =>
      prev.includes(fileUrl)
        ? prev.filter(url => url !== fileUrl)
        : [...prev, fileUrl]
    )
  }

  const renderStatusIcon = (status: string) => {
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Board Analysis Dashboard</CardTitle>
        <CardDescription>
          Analyze board documents and view analysis results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <Select
              value={selectedType}
              onValueChange={value =>
                setSelectedType(
                  value as (typeof documentTypeEnum.enumValues)[number]
                )
              }
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select analysis type" />
              </SelectTrigger>
              <SelectContent>
                {documentTypeEnum.enumValues.map(type => (
                  <SelectItem key={type} value={type}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={handleAnalyze}
              disabled={selectedFiles.length === 0 || isLoading}
            >
              {isLoading ? "Analyzing..." : "Start Analysis"}
            </Button>
          </div>

          <Card className="bg-muted p-4">
            <CardTitle className="mb-4 text-base">
              Select Documents to Analyze
            </CardTitle>
            <div className="grid gap-2">
              {isLoadingFiles ? (
                <div className="text-muted-foreground text-sm">
                  Loading files...
                </div>
              ) : files?.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  No files available
                </div>
              ) : (
                files?.map(file => (
                  <div
                    key={file.url}
                    className="hover:bg-accent flex cursor-pointer items-center gap-2 rounded-md p-2"
                    onClick={() => toggleFileSelection(file.url)}
                  >
                    {selectedFiles.includes(file.url) ? (
                      <CheckSquare className="size-4" />
                    ) : (
                      <Square className="size-4" />
                    )}
                    <span className="text-sm">{file.pathname}</span>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Tabs defaultValue="recent">
          <TabsList>
            <TabsTrigger value="recent">Recent Analyses</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          </TabsList>

          <TabsContent value="recent">
            <div className="grid gap-4">
              {analyses.slice(0, 5).map(analysis => (
                <AnalysisCard key={analysis.id} analysis={analysis} />
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid gap-4">
              {analyses
                .filter(a => a.status === "completed")
                .map(analysis => (
                  <AnalysisCard key={analysis.id} analysis={analysis} />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="in-progress">
            <div className="grid gap-4">
              {analyses
                .filter(a => ["pending", "in_progress"].includes(a.status))
                .map(analysis => (
                  <AnalysisCard key={analysis.id} analysis={analysis} />
                ))}
            </div>
          </TabsContent>
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

  const findings = analysis.findings
    ? (JSON.parse(analysis.findings) as Record<string, string[]>)
    : {}
  const recommendations = analysis.recommendations
    ? (JSON.parse(analysis.recommendations) as string[])
    : []

  return (
    <Card
      className={cn("transition-all duration-200", {
        "cursor-pointer hover:shadow-md": analysis.status === "completed"
      })}
      onClick={() => {
        if (analysis.status === "completed") {
          setExpanded(!expanded)
        }
      }}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {renderStatusIcon(analysis.status)}
            <CardTitle className="text-lg">{analysis.title}</CardTitle>
          </div>
          <span className="text-muted-foreground text-sm">
            {new Date(analysis.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardHeader>
      {expanded && analysis.status === "completed" && (
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="mb-2 font-semibold">Summary</h4>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <Markdown>{analysis.summary || ""}</Markdown>
              </div>
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Findings</h4>
              {Object.entries(findings).map(([category, items]) => (
                <div key={category} className="mb-4">
                  <h5 className="text-sm font-medium">{category}</h5>
                  <ul className="mt-2 space-y-2">
                    <Markdown>{items.join("\n")}</Markdown>
                  </ul>
                </div>
              ))}
            </div>

            <div>
              <h4 className="mb-2 font-semibold">Recommendations</h4>
              <ul className="space-y-2">
                {recommendations.map((rec, index) => (
                  <li key={index} className="prose prose-sm dark:prose-invert">
                    <Markdown>{rec}</Markdown>
                  </li>
                ))}
              </ul>
            </div>
          </div>
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
