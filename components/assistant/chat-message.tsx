import { FC, memo } from "react"
import { Message } from "ai"
import { cn } from "@/lib/utils"
import { IconOpenAI, IconUser } from "@/components/ui/icons"
import { MemoizedReactMarkdown } from "@/components/assistant/markdown"

export interface ChatMessageProps {
  message: Message
}

export const ChatMessage: FC<ChatMessageProps> = memo(
  ({ message: { role, content } }) => {
    const getRoleStylesAndIcon = () => {
      if (role === "user") {
        return {
          iconClassName: "bg-background ",
          Icon: IconUser
        }
      }
      return {
        iconClassName: "bg-primary text-primary-foreground",
        Icon: IconOpenAI
      }
    }

    const { iconClassName, Icon } = getRoleStylesAndIcon()

    return (
      <div className="relative mb-4 flex items-start">
        <div
          className={cn(
            "flex size-8 shrink-0 select-none items-center justify-center rounded-2xl border",
            iconClassName
          )}
        >
          <Icon />
        </div>
        <div className="ml-4 flex-1 space-y-2 overflow-hidden px-1">
          <MemoizedReactMarkdown
            className="prose dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none break-words"
            components={{
              p({ children }) {
                return <p className="mb-2 last:mb-0">{children}</p>
              },
              h1({ children }) {
                return <h1 className="mb-4 text-2xl font-bold">{children}</h1>
              },
              h2({ children }) {
                return <h2 className="mb-3 text-xl font-bold">{children}</h2>
              },
              h3({ children }) {
                return <h3 className="mb-2 text-lg font-bold">{children}</h3>
              },
              h4({ children }) {
                return <h4 className="mb-2 text-base font-bold">{children}</h4>
              },
              h5({ children }) {
                return <h5 className="mb-2 text-sm font-bold">{children}</h5>
              },
              h6({ children }) {
                return <h6 className="mb-2 text-xs font-bold">{children}</h6>
              },
              ol({ children }) {
                return <ol className="mb-4 list-decimal pl-6">{children}</ol>
              },
              ul({ children }) {
                return <ul className="mb-4 list-disc pl-6">{children}</ul>
              },
              li({ children }) {
                return <li className="mb-1 last:mb-0">{children}</li>
              },
              a({ children, href }) {
                return (
                  <a href={href} className="text-blue-500 hover:underline">
                    {children}
                  </a>
                )
              },
              code({ className, children }) {
                return (
                  <code className="rounded bg-gray-200 px-1 py-0.5 text-sm dark:bg-gray-800">
                    {children}
                  </code>
                )
              },
              blockquote({ children }) {
                return (
                  <blockquote className="border-l-4 border-gray-300 pl-4 italic dark:border-gray-700">
                    {children}
                  </blockquote>
                )
              },
              table({ children }) {
                return (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-gray-300 dark:border-gray-700">
                      {children}
                    </table>
                  </div>
                )
              },
              th({ children }) {
                return (
                  <th className="border border-gray-300 bg-gray-100 p-2 font-bold dark:border-gray-700 dark:bg-gray-800">
                    {children}
                  </th>
                )
              },
              td({ children }) {
                return (
                  <td className="border border-gray-300 p-2 dark:border-gray-700">
                    {children}
                  </td>
                )
              }
            }}
          >
            {content}
          </MemoizedReactMarkdown>
          {/* Render citations here if available */}
          {/* Example:
          {message.citations && (
            <div className="mt-2 text-sm text-gray-500">
              <strong>References:</strong>
              <ul>
                {message.citations.map((citation, index) => (
                  <li key={index}>{citation}</li>
                ))}
              </ul>
            </div>
          )}
          */}
        </div>
      </div>
    )
  }
)

ChatMessage.displayName = "ChatMessage"
