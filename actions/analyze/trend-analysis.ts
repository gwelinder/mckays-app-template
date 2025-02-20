"use server"

import { perplexity } from "@ai-sdk/perplexity"
import { generateText } from "ai"
import { ActionState } from "@/types"
import { auth } from "@clerk/nextjs/server"
import { SelectTrendAnalysis } from "@/db/schema"
import {
  createTrendAnalysisAction as dbCreateTrendAnalysis,
  updateTrendAnalysisAction
} from "@/actions/db/trend-analyses-actions"

export interface TrendAnalysisInput {
  prompt: string
  companyId: string
  companyData: string
}

export async function createTrendAnalysisAction({
  prompt,
  companyId,
  companyData
}: TrendAnalysisInput): Promise<ActionState<SelectTrendAnalysis>> {
  try {
    const { userId } = await auth()
    if (!userId) {
      return { isSuccess: false, message: "Unauthorized" }
    }

    // Create initial record
    const createResult = await dbCreateTrendAnalysis({
      userId,
      companyId,
      prompt,
      status: "in_progress"
    })

    if (!createResult.isSuccess) {
      throw new Error(createResult.message)
    }

    const enhancedPrompt = `Analyze the following business trend or topic. Provide a detailed analysis including:
- Current state and significance
- Key drivers and market forces
- Future implications and predictions
- Relevant industry examples
- Potential opportunities and risks

Topic to analyze: ${prompt}

Business data: ${companyData}

Please structure your response in clear sections using markdown formatting.`

    const response = await generateText({
      model: perplexity("sonar-pro"),
      messages: [
        {
          role: "system",
          content: `You are a business trend analyst specializing in market research and industry analysis. 
Your responses should be:
- Well-structured and professional
- Based on current market data and trends
- Focused on actionable insights
- Supported by relevant examples
Use markdown formatting for better readability.`
        },
        {
          role: "user",
          content: enhancedPrompt
        }
      ]
    })

    if (!response) {
      await updateTrendAnalysisAction(createResult.data.id, {
        status: "failed"
      })
      throw new Error("Failed to generate trend analysis")
    }

    // Update with the response
    const updateResult = await updateTrendAnalysisAction(createResult.data.id, {
      response: response.text,
      status: "completed"
    })

    if (!updateResult.isSuccess) {
      throw new Error(updateResult.message)
    }

    return {
      isSuccess: true,
      message: "Trend analysis completed successfully",
      data: updateResult.data
    }
  } catch (error) {
    console.error("Error in trend analysis:", error)
    return {
      isSuccess: false,
      message:
        error instanceof Error ? error.message : "Failed to analyze trends"
    }
  }
}
