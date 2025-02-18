"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { createAssistant, createThread } from "@/app/actions/assistants"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from "@/components/ui/card"
import { ClipboardList, FileText, BarChart } from "lucide-react"
import { Document } from "@/schema"

const predefinedPrompts = [
  {
    title: "General Board Material Review",
    icon: FileText,
    description:
      "Assist in reviewing board materials for inconsistencies and missing information.",
    instructions: `You are an AI assistant helping board members review extensive board materials. Your tasks include:

- Identifying inconsistencies in the material.
- Noting variations from previous board meetings.
- Highlighting missing information based on best practice requirements for board materials, such as financial information, seasonal comparisons, risks, and opportunities.
- Pointing out illogical or unfounded conclusions.
- Providing suggestions for improvements.

When providing your responses, please reference the relevant page numbers and sections from the documents.`
  },
  {
    title: "Data Inconsistencies Analysis",
    icon: ClipboardList,
    description: "Find data inconsistencies in uploaded documents.",
    instructions: `You are an AI assistant tasked with finding data inconsistencies in uploaded documents, both within each document and between documents. Generate a detailed report that describes all inconsistencies in data in each of the documents and when comparing the documents. The report should include references to page numbers and sections.`
  },
  {
    title: "Cash Flow Analysis",
    icon: BarChart,
    description:
      "Analyze cash flow to check if operations can cover all costs.",
    instructions: `You are an AI assistant tasked with analyzing cash flow in the uploaded documents. Your tasks include:

- Checking whether cash flow from operations can cover all costs.
- Providing details on investments and financing activities.
- Providing details on costs to service debt.
- Providing details on debt to vendors.
- Determining if cash flow from operations generates enough cash to pay for the investment and financing activities, costs to service debt, and debt to vendors.
- Checking the last uploaded annual report for any auditor comments on cash flow and making individual comments to raise awareness.
- If the uploaded documents do not provide the data to break down the cash flow into the necessary subsections to generate the report, describe what is missing.

When generating your report, include references to page numbers and sections.`
  }
]

interface PredefinedActionsProps {
  vectorStoreId: string | null
  selectedDocuments: Document[]
}

export default function PredefinedActions({
  vectorStoreId,
  selectedDocuments
}: PredefinedActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  async function handleActionClick(instructions: string) {
    if (!vectorStoreId) {
      toast({
        variant: "destructive",
        title: "No vector store found",
        description:
          "Please ensure you have uploaded documents for this company."
      })
      return
    }

    if (selectedDocuments.length === 0) {
      toast({
        variant: "destructive",
        title: "No documents selected",
        description: "Please select at least one document to analyze."
      })
      return
    }

    setIsLoading(true)

    try {
      const assistant = await createAssistant(vectorStoreId, instructions)
      const thread = await createThread({
        documents: selectedDocuments,
        message: instructions
      })

      // Here you might want to pass the selectedDocuments to the thread or assistant
      // Depending on your backend implementation

      router.push(`/assistant/${assistant.id}/thread/${thread.id}`)
    } catch (error) {
      console.error("Error creating assistant:", error)
      setIsLoading(false)
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create assistant. Please try again."
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {predefinedPrompts.map((prompt, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
          >
            <Card className="transition-shadow hover:shadow-lg">
              <CardHeader className="flex items-center space-x-3">
                <div className="rounded-full bg-blue-500 p-2 text-white">
                  <prompt.icon size={24} />
                </div>
                <div>
                  <CardTitle className="text-lg">{prompt.title}</CardTitle>
                  <CardDescription className="text-sm text-gray-500">
                    {prompt.description}
                  </CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => handleActionClick(prompt.instructions)}
                  disabled={isLoading}
                >
                  {isLoading ? "Creating assistant..." : "Start Action"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </>
  )
}
