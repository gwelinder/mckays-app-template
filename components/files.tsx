"use client"

import useSWR from "swr"
import {
  CheckedSquare,
  InfoIcon,
  LoaderIcon,
  TrashIcon,
  UncheckedSquare,
  UploadIcon
} from "./icons"
import { Dispatch, SetStateAction, useRef, useState } from "react"
import { fetcher } from "@/utils/functions"
import { motion } from "framer-motion"
import { useOnClickOutside, useWindowSize } from "usehooks-ts"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface FileData {
  pathname: string
  url: string
}

export const Files = ({
  selectedFilePathnames,
  setSelectedFilePathnames,
  setIsFilesVisible,
  selectedCompanyId
}: {
  selectedFilePathnames: string[]
  setSelectedFilePathnames: Dispatch<SetStateAction<string[]>>
  setIsFilesVisible: Dispatch<SetStateAction<boolean>>
  selectedCompanyId: string | null
}) => {
  const inputFileRef = useRef<HTMLInputElement>(null)
  const [uploadQueue, setUploadQueue] = useState<string[]>([])
  const [deleteQueue, setDeleteQueue] = useState<string[]>([])
  const {
    data: files,
    mutate,
    isLoading
  } = useSWR<FileData[]>(
    selectedCompanyId ? `api/files/list?companyId=${selectedCompanyId}` : null,
    fetcher,
    { fallbackData: [] }
  )

  const { width } = useWindowSize()
  const isDesktop = width > 768
  const drawerRef = useRef<HTMLDivElement>(null)
  useOnClickOutside([drawerRef as React.RefObject<HTMLElement>], () => {
    setIsFilesVisible(false)
  })

  const handleFileUpload = async (file: File) => {
    if (file && selectedCompanyId) {
      setUploadQueue(currentQueue => [...currentQueue, file.name])

      await fetch(
        `/api/files/upload?filename=${file.name}&companyId=${selectedCompanyId}`,
        {
          method: "POST",
          body: file
        }
      )

      setUploadQueue(currentQueue =>
        currentQueue.filter(filename => filename !== file.name)
      )
      mutate()
    }
  }

  return (
    <motion.div
      className="fixed left-0 top-0 z-40 flex h-dvh w-dvw flex-row items-center justify-center bg-zinc-900/50"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className={cn(
          "fixed z-30 flex flex-col gap-4 bg-white p-4 dark:bg-zinc-800",
          { "w-dvw h-96 bottom-0 right-0": !isDesktop },
          { "w-[600px] h-96 rounded-lg": isDesktop }
        )}
        initial={{
          y: "100%",
          scale: isDesktop ? 0.9 : 1,
          opacity: isDesktop ? 0 : 1
        }}
        animate={{ y: "0%", scale: 1, opacity: 1 }}
        exit={{
          y: "100%",
          scale: isDesktop ? 0.9 : 1,
          opacity: isDesktop ? 0 : 1
        }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        ref={drawerRef}
      >
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-row gap-3 text-sm">
            <div className="text-zinc-900 dark:text-zinc-300">
              Manage Knowledge Base
            </div>
          </div>

          <input
            name="file"
            ref={inputFileRef}
            type="file"
            required
            className="hidden"
            accept="application/pdf"
            multiple={false}
            onChange={event => {
              const file = event.target.files?.[0]
              if (file) {
                handleFileUpload(file)
              }
            }}
          />

          <Button
            onClick={() => inputFileRef.current?.click()}
            disabled={!selectedCompanyId}
          >
            <UploadIcon size={16} />
            Upload a file
          </Button>
        </div>

        <div className="flex h-full flex-col overflow-y-scroll">
          {isLoading ? (
            <div className="flex flex-col">
              {[44, 32, 52].map(item => (
                <div
                  key={item}
                  className="flex flex-row items-center gap-4 border-b p-2 dark:border-zinc-700"
                >
                  <div className="size-4 animate-pulse bg-zinc-200 dark:bg-zinc-600" />
                  <div
                    className={`w-${item} h-4 animate-pulse bg-zinc-200 dark:bg-zinc-600`}
                  />
                  <div className="h-[24px] w-1" />
                </div>
              ))}
            </div>
          ) : null}

          {!isLoading &&
          files?.length === 0 &&
          uploadQueue.length === 0 &&
          deleteQueue.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <div className="flex flex-row items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
                <InfoIcon />
                <div>No files found</div>
              </div>
            </div>
          ) : null}

          {files?.map((file: FileData) => (
            <div
              key={file.pathname}
              className={`flex flex-row items-center gap-4 border-b p-2 dark:border-zinc-700 ${
                selectedFilePathnames.includes(file.pathname)
                  ? "bg-zinc-100 dark:border-zinc-600 dark:bg-zinc-700"
                  : ""
              }`}
            >
              <div
                className={cn(
                  "cursor-pointer",
                  selectedFilePathnames.includes(file.pathname) &&
                    !deleteQueue.includes(file.pathname)
                    ? "text-blue-600 dark:text-zinc-50"
                    : "text-zinc-500"
                )}
                onClick={() => {
                  setSelectedFilePathnames(currentSelections => {
                    if (currentSelections.includes(file.pathname)) {
                      return currentSelections.filter(
                        path => path !== file.pathname
                      )
                    } else {
                      return [...currentSelections, file.pathname]
                    }
                  })
                }}
              >
                {deleteQueue.includes(file.pathname) ? (
                  <div className="animate-spin">
                    <LoaderIcon />
                  </div>
                ) : selectedFilePathnames.includes(file.pathname) ? (
                  <CheckedSquare />
                ) : (
                  <UncheckedSquare />
                )}
              </div>

              <div className="flex w-full flex-row justify-between">
                <div className="text-sm text-zinc-500 dark:text-zinc-400">
                  {file.pathname}
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                className="text-zinc-500 hover:bg-red-100 hover:text-red-500 dark:text-zinc-500 hover:dark:bg-zinc-700"
                onClick={async () => {
                  setDeleteQueue(currentQueue => [
                    ...currentQueue,
                    file.pathname
                  ])

                  await fetch(
                    `/api/files/delete?fileurl=${file.url}&companyId=${selectedCompanyId}`,
                    {
                      method: "DELETE"
                    }
                  )

                  setDeleteQueue(currentQueue =>
                    currentQueue.filter(filename => filename !== file.pathname)
                  )

                  setSelectedFilePathnames(currentSelections =>
                    currentSelections.filter(path => path !== file.pathname)
                  )

                  mutate(
                    files.filter((f: FileData) => f.pathname !== file.pathname)
                  )
                }}
              >
                <TrashIcon />
              </Button>
            </div>
          ))}

          {uploadQueue.map(fileName => (
            <div
              key={fileName}
              className="flex flex-row items-center justify-between gap-4 p-2"
            >
              <div className="text-zinc-500">
                <div className="animate-spin">
                  <LoaderIcon />
                </div>
              </div>

              <div className="flex w-full flex-row justify-between">
                <div className="text-sm text-zinc-400 dark:text-zinc-400">
                  {fileName}
                </div>
              </div>

              <div className="h-[24px] w-2" />
            </div>
          ))}
        </div>

        <div className="flex flex-row justify-end">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            {`${selectedFilePathnames.length}/${files?.length}`} Selected
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
