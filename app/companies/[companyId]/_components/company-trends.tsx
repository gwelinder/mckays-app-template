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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  PlayCircle,
  Sparkles
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Markdown } from "@/components/ui/markdown"
import { createTrendAnalysisAction } from "@/actions/analyze/trend-analysis"
import { getTrendAnalysesAction } from "@/actions/db/trend-analyses-actions"
import { SelectTrendAnalysis } from "@/db/schema"

interface CompanyTrendsProps {
  companyId: string
  companyData: string
}

export default function CompanyTrends({
  companyId,
  companyData
}: CompanyTrendsProps) {
  const { toast } = useToast()
  const [prompt, setPrompt] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<SelectTrendAnalysis[]>([])

  useEffect(() => {
    const loadTrendAnalyses = async () => {
      const result = await getTrendAnalysesAction(companyId)
      if (result.isSuccess) {
        setResults(result.data)
      } else {
        toast({
          title: "Error",
          description: "Failed to load trend analyses.",
          variant: "destructive"
        })
      }
    }

    loadTrendAnalyses()
  }, [companyId, toast])

  const handleAnalyze = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Empty Prompt",
        description: "Please enter a prompt to analyze trends.",
        variant: "destructive"
      })
      return
    }

    setIsLoading(true)

    try {
      const result = await createTrendAnalysisAction({
        prompt,
        companyId,
        companyData
      })

      if (!result.isSuccess) {
        throw new Error(result.message)
      }

      setResults(prev => [result.data, ...prev])

      toast({
        title: "Analysis Complete",
        description: "Trend analysis has been completed successfully."
      })
    } catch (error) {
      console.error("Error analyzing trends:", error)
      toast({
        title: "Error",
        description: "Failed to analyze trends. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
      setPrompt("")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Trends Analysis</CardTitle>
        <CardDescription>
          Analyze market trends and insights related to the company
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 space-y-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Enter your trend analysis prompt (e.g., 'What are the emerging trends in the company's industry?')"
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
            <Button
              onClick={handleAnalyze}
              disabled={isLoading || !prompt.trim()}
              className="w-full"
            >
              {isLoading ? (
                <Clock className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              {isLoading ? "Analyzing..." : "Analyze Trends"}
            </Button>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Recent Analyses</h3>
            {results.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                No trend analyses yet. Start by entering a prompt above.
              </p>
            ) : (
              results.map(result => (
                <TrendCard key={result.id} analysis={result} />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface TrendCardProps {
  analysis: SelectTrendAnalysis
}

function TrendCard({ analysis }: TrendCardProps) {
  const [expanded, setExpanded] = useState(false)

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
            <div className="space-y-1">
              <CardTitle className="text-lg">Trend Analysis</CardTitle>
              <p className="text-muted-foreground text-sm">{analysis.prompt}</p>
            </div>
          </div>
          <span className="text-muted-foreground text-sm">
            {new Date(analysis.createdAt).toLocaleDateString()}
          </span>
        </div>
      </CardHeader>
      {expanded && analysis.status === "completed" && analysis.response && (
        <CardContent>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <Markdown>{analysis.response}</Markdown>
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
