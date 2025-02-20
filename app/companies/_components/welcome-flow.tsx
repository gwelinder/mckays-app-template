"use client"

import React, { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import {
  Stepper,
  StepperDescription,
  StepperIndicator,
  StepperItem,
  StepperSeparator,
  StepperTitle,
  StepperTrigger
} from "@/components/ui/stepper"
import { Button } from "@/components/ui/button"
import { AddCompanyDialog } from "@/components/add-company-dialog"
import { useToast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"
import { FileIcon, Loader2, Upload } from "lucide-react"
import Link from "next/link"

interface FileUploadStepProps {
  companyId: string
}

const FileUploadStep: React.FC<FileUploadStepProps> = ({ companyId }) => {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  )
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([])

  const handleFileUpload = async (file: File) => {
    if (!file || !companyId) return

    try {
      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }))

      const xhr = new XMLHttpRequest()
      xhr.open(
        "POST",
        `/api/files/upload?filename=${encodeURIComponent(
          file.name
        )}&companyId=${companyId}`,
        true
      )

      xhr.upload.onprogress = event => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setUploadProgress(prev => ({ ...prev, [file.name]: progress }))
        }
      }

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText)
          if (xhr.status === 200 && response.success) {
            toast({
              title: "Success",
              description: "File uploaded successfully"
            })
            setUploadedFiles(prev => [...prev, file.name])
          } else {
            toast({
              title: "Error",
              description: response.error || "Failed to upload file",
              variant: "destructive"
            })
          }
        } catch (error) {
          toast({
            title: "Error",
            description: "Failed to process server response",
            variant: "destructive"
          })
        }
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[file.name]
          return newProgress
        })
      }

      xhr.onerror = () => {
        toast({
          title: "Error",
          description: "Network error occurred",
          variant: "destructive"
        })
        setUploadProgress(prev => {
          const newProgress = { ...prev }
          delete newProgress[file.name]
          return newProgress
        })
      }

      xhr.send(file)
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive"
      })
      setUploadProgress(prev => {
        const newProgress = { ...prev }
        delete newProgress[file.name]
        return newProgress
      })
    }
  }

  return (
    <div className="mx-auto max-w-lg text-center">
      <p className="mb-4">
        Great! Now that you've added your company, let's upload some board
        documents. These could be meeting minutes, financial reports, or any
        other relevant PDFs.
      </p>

      <div className="mt-6 space-y-4">
        <Button onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 size-4" />
          Upload PDF
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="application/pdf"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFileUpload(file)
          }}
        />

        {/* Show upload progress */}
        {Object.entries(uploadProgress).length > 0 && (
          <div className="mt-4 space-y-4">
            {Object.entries(uploadProgress).map(([filename, progress]) => (
              <div
                key={filename}
                className="flex items-center gap-4 rounded-lg border p-4"
              >
                <FileIcon className="size-8" />
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{filename}</p>
                    <span className="text-muted-foreground text-sm">
                      {progress}%
                    </span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Show uploaded files */}
        {uploadedFiles.length > 0 && (
          <div className="mt-4 space-y-2 text-left">
            <h3 className="font-medium">Uploaded Files:</h3>
            {uploadedFiles.map(filename => (
              <div
                key={filename}
                className="flex items-center gap-2 rounded-lg border p-2"
              >
                <FileIcon className="size-4" />
                <span className="text-sm">{filename}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

const steps = [
  {
    step: 1,
    title: "Welcome to BoardAI!",
    description:
      "Let's get you started by setting up your first company and exploring BoardAI's features.",
    content: () => (
      <div className="mx-auto max-w-lg text-center">
        <p className="mb-4">
          Welcome to BoardAI! We're excited to help you streamline your board
          processes. This quick guide will walk you through the initial setup.
        </p>
        <p>Click 'Next' to add your company.</p>
      </div>
    )
  },
  {
    step: 2,
    title: "Add Your First Company",
    description:
      "Start by adding your company to BoardAI. This will be your workspace to manage board materials and analysis.",
    content: ({ onNext }: { onNext: (companyId: string) => void }) => (
      <div className="mx-auto max-w-lg text-center">
        <p className="mb-4">
          To begin, you need to add your company. This creates a dedicated space
          for your board materials and analyses.
        </p>
        <Button onClick={() => onNext("dummy")}>Add Company</Button>
      </div>
    )
  },
  {
    step: 3,
    title: "Upload Board Documents",
    description:
      "Now, upload your board meeting documents (PDFs). BoardAI will analyze these documents to provide insights.",
    content: ({ companyId }: { companyId: string }) => (
      <FileUploadStep companyId={companyId} />
    )
  },
  {
    step: 4,
    title: "Run Initial Analysis",
    description:
      "Discover the power of AI analysis. Run an analysis on your uploaded documents to uncover key insights and potential risks.",
    content: ({ companyId }: { companyId: string }) => (
      <div className="mx-auto max-w-lg text-center">
        <p className="mb-4">
          Now for the exciting part! BoardAI can analyze your documents to
          provide valuable insights.
        </p>
        <p className="mb-4">
          Navigate to the analysis section to run your first analysis.
        </p>
        <Button asChild>
          <Link href={`/companies/${companyId}/analysis`}>
            Go to Analysis Section
          </Link>
        </Button>
      </div>
    )
  },
  {
    step: 5,
    title: "Explore Dashboard",
    description:
      "Get a quick overview of your company dashboard, where you can access company details, files, analyses, and trends.",
    content: ({ companyId }: { companyId: string }) => (
      <div className="mx-auto max-w-lg text-center">
        <p className="mb-4">
          You're all set! Take some time to explore your company dashboard. You
          can find everything you need here: company overview, files, analyses,
          and trends.
        </p>
        <p className="mb-4">
          Feel free to click around and discover all the features BoardAI has to
          offer.
        </p>
        <Button asChild>
          <Link href={`/companies/${companyId}`}>Go to Company Dashboard</Link>
        </Button>
      </div>
    )
  }
]

const WelcomeFlow: React.FC = () => {
  const [activeStep, setActiveStep] = React.useState(1)
  const router = useRouter()
  const [companyId, setCompanyId] = React.useState<string | null>(null)
  const [addCompanyOpen, setAddCompanyOpen] = React.useState(false)

  const currentStepData = steps[activeStep - 1]
  const isLastStep = activeStep === steps.length

  const handleNextStep = () => {
    if (activeStep < steps.length) {
      setActiveStep(activeStep + 1)
    }
  }

  const handleCompanyCreated = (newCompanyId: string) => {
    setCompanyId(newCompanyId)
    handleNextStep()
  }

  const stepContent = React.useMemo(() => {
    if (activeStep === 2) {
      return (
        <div className="mx-auto max-w-lg text-center">
          <p className="mb-4">
            To begin, you need to add your company. This creates a dedicated
            space for your board materials and analyses.
          </p>
          <Button onClick={() => setAddCompanyOpen(true)}>Add Company</Button>
          <AddCompanyDialog
            open={addCompanyOpen}
            onOpenChange={setAddCompanyOpen}
            onSuccess={handleCompanyCreated}
          />
        </div>
      )
    }
    return currentStepData.content({
      onNext: handleCompanyCreated,
      companyId: companyId || ""
    })
  }, [
    activeStep,
    addCompanyOpen,
    companyId,
    currentStepData,
    handleCompanyCreated
  ])

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-8">
      <Stepper
        defaultValue={1}
        value={activeStep}
        onValueChange={setActiveStep}
      >
        {steps.map(({ step, title, description }) => (
          <StepperItem
            key={step}
            step={step}
            className="max-md:items-start [&:not(:last-child)]:flex-1"
          >
            <StepperTrigger className="max-md:flex-col">
              <StepperIndicator />
              <div className="text-center md:text-left">
                <StepperTitle>{title}</StepperTitle>
                <StepperDescription className="max-sm:hidden">
                  {description}
                </StepperDescription>
              </div>
            </StepperTrigger>
            {step < steps.length && (
              <StepperSeparator className="max-md:mt-3.5 md:mx-4" />
            )}
          </StepperItem>
        ))}
      </Stepper>

      <div className="mt-8">{stepContent}</div>

      <div className="mt-6 flex justify-center">
        {!isLastStep && activeStep !== 2 && (
          <Button onClick={handleNextStep}>Next</Button>
        )}
      </div>
    </div>
  )
}

export default WelcomeFlow
