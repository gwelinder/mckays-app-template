"use client"

import { Message } from "ai"
import { cn } from "@/lib/utils"
import { Separator } from "@/components/ui/separator"
import { ChatMessage } from "@/components/assistant/chat-message"
import { ChatPrompt } from "@/components/assistant/chat-prompt"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useScrollToBottom } from "@/components/use-scroll-to-bottom"
import { Document } from "@/schema" // Assuming Document is imported from the same lib/types

interface ChatProps {
  messages: Message[]
  handleSubmit: (input: string, attachments: Document[]) => void
  isLoading: boolean
  className?: string
  selectedDocuments: Document[]
}

export function Chat({
  messages,
  handleSubmit,
  isLoading,
  className,
  selectedDocuments
}: ChatProps) {
  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>()

  const handlePromptSubmit = (input: string) => {
    handleSubmit(input, selectedDocuments)
  }

  return (
    <div className="flex size-full flex-col">
      <ScrollArea>
        <div
          ref={messagesContainerRef}
          className={cn(className, "min-h-[calc(100vh-200px)]")}
        >
          {messages.length > 0 && (
            <div className="relative mx-auto max-w-3xl px-8">
              {messages.map((message: Message, index: number) => (
                <div
                  key={`msg-${index}-${message.content.length}`}
                  className={cn(index === 0 ? "pt-8" : "")}
                >
                  <ChatMessage message={message} />

                  {index < messages.length - 1 && (
                    <Separator className="my-4 md:my-8" />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div
          ref={messagesEndRef}
          className="min-h-[24px] min-w-[24px] shrink-0"
        />
      </ScrollArea>

      <div className="inset-x-0 bottom-2 w-full">
        <div className="mx-auto max-w-3xl sm:px-4">
          <ChatPrompt isLoading={isLoading} onSubmit={handlePromptSubmit} />
          {selectedDocuments.length > 0 && (
            <div className="mt-2 text-sm text-gray-500">
              Selected documents:{" "}
              {selectedDocuments.map(doc => doc.fileName).join(", ")}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
