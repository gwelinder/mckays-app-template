"use server"

import { encodingForModel } from "js-tiktoken"

/**
 * Configuration for text splitting
 */
export interface TextSplitterConfig {
  chunkSize: number
  chunkOverlap: number
  separators?: string[]
}

/**
 * Default configuration for text splitting
 */
const DEFAULT_CONFIG = {
  chunkSize: 7500, // Default chunk size optimized for text-embedding-3-large
  chunkOverlap: 200, // Default overlap to maintain context between chunks
  separators: ["\n\n", "\n", " ", ""] as const // Default separators in order of preference
} satisfies TextSplitterConfig

/**
 * Recursively splits text into chunks while maintaining semantic boundaries.
 * Uses a hierarchical approach to split text at the most appropriate separator.
 *
 * @param text - The text to split into chunks
 * @param config - Configuration options for splitting
 * @returns An array of text chunks
 */
export function recursiveTextSplitter(
  text: string,
  config: Partial<TextSplitterConfig> = {}
): string[] {
  // Ensure separators is always defined with a default value
  const finalConfig = {
    ...DEFAULT_CONFIG,
    ...config,
    separators: config.separators ?? DEFAULT_CONFIG.separators
  }

  const tokenizer = encodingForModel("text-embedding-3-large")

  /**
   * Internal function to recursively split text using different separators
   */
  function splitText(text: string, currentSeparators: string[]): string[] {
    const finalChunks: string[] = []

    // If no more separators, return the text as a single chunk
    if (currentSeparators.length === 0) {
      return [text]
    }

    // Use the first separator and get remaining ones for recursive calls
    const separator = currentSeparators[0]
    const remainingSeparators = currentSeparators.slice(1)

    // If separator is empty or not found in text, try next separator
    if (separator === "" || !text.includes(separator)) {
      return splitText(text, remainingSeparators)
    }

    const splits = text.split(separator)
    let currentChunk: string[] = []
    let currentChunkLength = 0

    for (const split of splits) {
      const splitLength = tokenizer.encode(split).length

      if (currentChunkLength + splitLength <= finalConfig.chunkSize) {
        // Add to current chunk if within size limit
        currentChunk.push(split)
        currentChunkLength += splitLength
      } else {
        // Process current chunk if it exists
        if (currentChunk.length > 0) {
          finalChunks.push(currentChunk.join(separator))

          // Create overlap with previous chunk
          const overlapChunk = currentChunk.slice(
            -Math.floor(finalConfig.chunkOverlap / separator.length)
          )
          currentChunk = overlapChunk
          currentChunkLength = tokenizer.encode(
            overlapChunk.join(separator)
          ).length
        }

        // Handle splits larger than chunk size
        if (splitLength > finalConfig.chunkSize) {
          // Try splitting with next separator
          const subSplits = splitText(split, remainingSeparators)
          finalChunks.push(...subSplits)
        } else {
          // Start new chunk
          currentChunk = [split]
          currentChunkLength = splitLength
        }
      }
    }

    // Add final chunk if exists
    if (currentChunk.length > 0) {
      finalChunks.push(currentChunk.join(separator))
    }

    return finalChunks
  }

  return splitText(text, finalConfig.separators)
}

/**
 * Utility function to estimate token count for a text string
 *
 * @param text - The text to estimate tokens for
 * @returns Estimated number of tokens
 */
export function estimateTokenCount(text: string): number {
  const tokenizer = encodingForModel("text-embedding-3-large")
  return tokenizer.encode(text).length
}
