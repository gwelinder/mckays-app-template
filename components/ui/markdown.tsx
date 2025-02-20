"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { cn } from "@/lib/utils"

interface MarkdownProps extends React.HTMLAttributes<HTMLDivElement> {
  children: string
}

export function Markdown({ children, className, ...props }: MarkdownProps) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        // Override default elements with proper styling
        p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
        ul: ({ children }) => (
          <ul className="mb-4 list-disc pl-4 last:mb-0">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-4 list-decimal pl-4 last:mb-0">{children}</ol>
        ),
        li: ({ children }) => <li className="mb-1 last:mb-0">{children}</li>,
        h1: ({ children }) => (
          <h1 className="mb-4 text-2xl font-bold last:mb-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-3 text-xl font-bold last:mb-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-3 text-lg font-bold last:mb-0">{children}</h3>
        ),
        h4: ({ children }) => (
          <h4 className="mb-2 text-base font-bold last:mb-0">{children}</h4>
        ),
        blockquote: ({ children }) => (
          <blockquote className="mb-4 border-l-4 border-gray-200 pl-4 last:mb-0 dark:border-gray-700">
            {children}
          </blockquote>
        ),
        code: ({ children }) => (
          <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-sm dark:bg-gray-800">
            {children}
          </code>
        ),
        pre: ({ children }) => (
          <pre className="mb-4 overflow-x-auto rounded bg-gray-100 p-4 font-mono text-sm last:mb-0 dark:bg-gray-800">
            {children}
          </pre>
        )
      }}
      className={cn(
        "text-foreground [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        className
      )}
      {...props}
    >
      {children}
    </ReactMarkdown>
  )
}
