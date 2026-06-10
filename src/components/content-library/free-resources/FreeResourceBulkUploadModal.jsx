import { useRef, useState } from 'react'
import { Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react'
import { toast } from '@/utils/toast'
import {
  fetchMockTestBulkTemplate,
  uploadMockTestQuestions,
} from '../../../api/freeResourcesAPI'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import { UploadFieldHint } from '../../common/UploadFieldHint'
import { BULK_QUESTION_ACCEPT } from '../../../utils/freeResourceFormConstants'
import { parseFreeResourceBulkFile } from '../../../utils/freeResourceFormUtils'
import {
  getMockTestApiErrorMessage,
  triggerMockTestBulkTemplateDownload,
  validateMockTestBulkFile,
} from '../../../utils/freeResourceApiHelpers'

const SAMPLE_CSV = `Question No,Question,Option 1,Option 2,Option 3,Option 4,Correct Answer,Explanation,Marks
1,Sample question?,A,B,C,D,1,Optional explanation,1
`

function downloadLocalTemplate() {
  const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'free-resource-questions-template.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function FreeResourceBulkUploadModal({
  open,
  onClose,
  onImport,
  mockTestId = null,
  onUploadComplete,
}) {
  const inputRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [downloadingTemplate, setDownloadingTemplate] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [replaceExisting, setReplaceExisting] = useState(false)
  const [result, setResult] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)

  const apiMode = Boolean(mockTestId)

  const reset = () => {
    setFileName('')
    setResult(null)
    setLoading(false)
    setUploadProgress(0)
    setReplaceExisting(false)
    setSelectedFile(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleDownloadTemplate = async () => {
    setDownloadingTemplate(true)
    try {
      const response = await fetchMockTestBulkTemplate()
      triggerMockTestBulkTemplateDownload(response)
      toast.success('Template downloaded successfully.')
    } catch (error) {
      if (apiMode) {
        toast.error(getMockTestApiErrorMessage(error, 'Failed to download template.'))
      } else {
        downloadLocalTemplate()
      }
    } finally {
      setDownloadingTemplate(false)
    }
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const check = validateMockTestBulkFile(file)
    if (!check.valid) {
      toast.error(check.message)
      return
    }

    setFileName(file.name)
    setSelectedFile(file)

    if (apiMode) {
      setResult(null)
      return
    }

    setLoading(true)
    try {
      const parsed = await parseFreeResourceBulkFile(file)
      setResult(parsed)
    } catch (err) {
      toast.error(err.message || 'Failed to parse file')
      setResult(null)
    } finally {
      setLoading(false)
    }
  }

  const handleApiUpload = async () => {
    if (!selectedFile || !mockTestId) {
      toast.error('Select a CSV or XLSX file to upload.')
      return
    }

    setLoading(true)
    setUploadProgress(0)
    try {
      await uploadMockTestQuestions(mockTestId, selectedFile, {
        replace: replaceExisting,
        onUploadProgress: (event) => {
          if (!event.total) return
          setUploadProgress(Math.round((event.loaded / event.total) * 100))
        },
      })
      toast.success('Questions uploaded successfully.')
      await onUploadComplete?.()
      handleClose()
    } catch (error) {
      toast.error(getMockTestApiErrorMessage(error, 'Failed to upload questions.'))
    } finally {
      setLoading(false)
      setUploadProgress(0)
    }
  }

  const handleImport = () => {
    if (!result?.success?.length) {
      toast.error('No valid questions to import')
      return
    }
    onImport?.(result.success)
    toast.success(`Imported ${result.success.length} question(s)`)
    handleClose()
  }

  return (
    <Modal open={open} onClose={handleClose} size="lg" title="Bulk Upload Questions" showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-[#f7f7f7] shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
        <ModalPanelHeader title="Bulk Upload Questions" onClose={handleClose} icon={FileSpreadsheet} closeVariant="icon" />

        <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={downloadingTemplate}
            className="inline-flex items-center gap-2 rounded-lg border border-[#55ace7]/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#f0f9ff] disabled:opacity-60"
          >
            {downloadingTemplate ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Sample Template
          </button>

          {apiMode ? (
            <label className="flex items-center gap-2 text-sm text-[#246392]">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="h-4 w-4 rounded border-[#55ace7]/40 text-[#246392]"
              />
              Replace all existing questions
            </label>
          ) : null}

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#55ace7]/45 bg-white px-6 py-10 text-center transition hover:border-[#55ace7] hover:bg-[#fafcff]">
            <Upload className="h-8 w-8 text-[#55ace7]" />
            <span className="text-sm font-semibold text-[#246392]">
              {fileName || 'Upload CSV or XLSX'}
            </span>
            <UploadFieldHint profile="EXCEL_BULK" className="text-xs text-gray-500" />
            <input
              ref={inputRef}
              type="file"
              accept={apiMode ? '.csv,.xlsx,.xls' : BULK_QUESTION_ACCEPT}
              className="sr-only"
              onChange={handleFile}
            />
          </label>

          {loading ? (
            <div className="space-y-2">
              <p className="flex items-center justify-center gap-2 text-sm text-[#246392]">
                <Loader2 className="h-4 w-4 animate-spin" />
                {apiMode ? `Uploading… ${uploadProgress}%` : 'Parsing file…'}
              </p>
              {apiMode && uploadProgress > 0 ? (
                <div className="h-2 overflow-hidden rounded-full bg-[#eef2fc]">
                  <div
                    className="h-full rounded-full bg-[#55ace7] transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}

          {!apiMode && result ? (
            <div className="space-y-3 rounded-xl border border-[#eef2fc] bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-[#111]">
                Success: {result.success?.length || 0} · Failed: {result.failed?.length || 0}
              </p>
              {result.failed?.length > 0 ? (
                <div className="max-h-40 overflow-auto rounded-lg border border-red-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-red-50 font-semibold text-red-800">
                      <tr>
                        <th className="px-3 py-2">Row</th>
                        <th className="px-3 py-2">Error</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.failed.map((row) => (
                        <tr key={row.row} className="border-t border-red-50">
                          <td className="px-3 py-2">{row.row}</td>
                          <td className="px-3 py-2 text-red-700">{row.message}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200/80 pt-5">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="rounded-full bg-slate-200/80 px-6 py-2.5 text-sm font-bold text-slate-700 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={
                loading ||
                (apiMode ? !selectedFile : !result?.success?.length)
              }
              onClick={apiMode ? handleApiUpload : handleImport}
              className="rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-8 py-2.5 text-sm font-bold text-white shadow disabled:opacity-50"
            >
              {apiMode ? 'Upload' : 'Import'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
