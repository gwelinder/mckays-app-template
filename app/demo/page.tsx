"use client"

import { useState } from "react"

export default function PdfUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [report, setReport] = useState("")
  const [loading, setLoading] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      // Upload PDF using the API route
      const uploadRes = await fetch("/api/upload-pdf", {
        method: "POST",
        body: formData
      })
      const uploadJson = await uploadRes.json()
      if (uploadJson.data?.path) {
        // Call processing endpoint with the predefined prompt
        const prompt =
          "Target: find data inconsistencies in uploaded documents (both between documents and in each document). Generate a detailed report that describes all inconsistencies in data in each of the documents and when comparing the documents. The report should include references to page numbers and sections."
        const processRes = await fetch("/api/process-pdf", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: uploadJson.data.path,
            prompt: prompt
          })
        })
        const processJson = await processRes.json()
        setReport(processJson.report)
      }
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <h1 className="mb-4 text-2xl font-bold">PDF Upload Demo</h1>
      <input type="file" accept="application/pdf" onChange={handleFileChange} />
      <button
        onClick={handleUpload}
        disabled={loading}
        className="mt-4 rounded bg-blue-500 px-4 py-2 text-white"
      >
        {loading ? "Processing..." : "Upload and Process"}
      </button>
      {report && (
        <div className="mt-6">
          <h2 className="mb-2 text-xl font-semibold">Generated Report</h2>
          <pre className="whitespace-pre-wrap rounded border p-4">{report}</pre>
        </div>
      )}
    </div>
  )
}
