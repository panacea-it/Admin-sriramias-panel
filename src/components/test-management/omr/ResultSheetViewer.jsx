import { useEffect, useState } from 'react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { useDownloadResultSheetBlob, useDownloadResultSheetUrl } from '../../../hooks/useOmrExams'
import { getApiErrorMessage } from '../../../utils/apiError'
import { isOmrPdfFile } from '../../../utils/omrApiHelpers'
import { cn } from '../../../utils/cn'

function triggerBrowserDownload(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName || 'result-sheet'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export default function ResultSheetViewer({ examId, fileName, fileType, className }) {
  const downloadBlob = useDownloadResultSheetBlob()
  const downloadUrl = useDownloadResultSheetUrl()
  const [previewUrl, setPreviewUrl] = useState(null)
  const [previewError, setPreviewError] = useState('')

  const isPdf = isOmrPdfFile(fileName, fileType)

  useEffect(() => {
    if (!examId || !isPdf) return undefined

    let ignore = false
    let objectUrl = null

    downloadBlob
      .mutateAsync(examId)
      .then(({ blob }) => {
        if (ignore) return
        objectUrl = URL.createObjectURL(blob)
        setPreviewUrl(objectUrl)
        setPreviewError('')
      })
      .catch((err) => {
        if (!ignore) {
          setPreviewError(getApiErrorMessage(err, 'Failed to load PDF preview'))
        }
      })

    return () => {
      ignore = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load once per exam
  }, [examId, isPdf])

  const handleDownload = async () => {
    try {
      const { blob, fileName: resolvedName } = await downloadBlob.mutateAsync(examId)
      triggerBrowserDownload(blob, fileName || resolvedName)
    } catch (err) {
      setPreviewError(getApiErrorMessage(err, 'Failed to download result sheet'))
    }
  }

  const handleOpenExternal = async () => {
    try {
      const response = await downloadUrl.mutateAsync(examId)
      const url = response?.data?.downloadUrl
      if (url) window.open(url, '_blank', 'noopener,noreferrer')
    } catch (err) {
      setPreviewError(getApiErrorMessage(err, 'Failed to open download link'))
    }
  }

  const downloading = downloadBlob.isPending || downloadUrl.isPending

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef2fc] disabled:opacity-60"
        >
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Download
        </button>
        <button
          type="button"
          onClick={handleOpenExternal}
          disabled={downloading}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
        >
          <ExternalLink className="h-4 w-4" />
          Open link
        </button>
      </div>

      {previewError && (
        <p className="text-sm font-medium text-red-600">{previewError}</p>
      )}

      {isPdf ? (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          {!previewUrl && !previewError ? (
            <div className="flex min-h-[320px] items-center justify-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Loading preview…
            </div>
          ) : previewUrl ? (
            <iframe
              title={`Preview ${fileName || 'result sheet'}`}
              src={previewUrl}
              className="h-[min(480px,60vh)] w-full bg-white"
            />
          ) : null}
        </div>
      ) : (
        <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          Preview is available for PDF files. Use Download for spreadsheet or CSV files.
        </p>
      )}
    </div>
  )
}
