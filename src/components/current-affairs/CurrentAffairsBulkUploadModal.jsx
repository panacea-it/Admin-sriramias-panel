import { useRef, useState } from 'react'
import { Download, FileSpreadsheet, Loader2, Upload, X } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import { UploadFieldHint } from '../common/UploadFieldHint'
import { CURRENT_AFFAIRS_BULK_ACCEPT } from '../../constants/currentAffairsForm'
import { bulkRowToCurrentAffairsQuestion } from '../../utils/currentAffairsQuestions'
import { validateCurrentAffairsBulkFile } from '../../utils/currentAffairsValidation'
import { parseQuestionBulkFile } from '../../utils/batchQuestionBulkUpload'
import { getApiErrorMessage } from '../../utils/apiError'
import {
  bulkUploadDailyPracticeQuestions,
  downloadDailyPracticeBulkTemplate,
  getDailyPracticeQuestions,
} from '../../services/currentAffairsService'

export default function CurrentAffairsBulkUploadModal({
  open,
  onClose,
  onImport,
  currentAffairId = null,
}) {
  const inputRef = useRef(null)
  const [fileName, setFileName] = useState('')
  const [uploadFile, setUploadFile] = useState(null)
  const [preview, setPreview] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [templateLoading, setTemplateLoading] = useState(false)

  const reset = () => {
    setFileName('')
    setUploadFile(null)
    setPreview([])
    setError('')
    setLoading(false)
    setTemplateLoading(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  const handleDownloadTemplate = async () => {
    setTemplateLoading(true)
    try {
      await downloadDailyPracticeBulkTemplate()
      toast.success('Template downloaded')
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('[Daily Practice] Template download failed:', err)
      }
      toast.error(getApiErrorMessage(err, 'Failed to download template'))
    } finally {
      setTemplateLoading(false)
    }
  }

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const check = validateCurrentAffairsBulkFile(file)
    if (!check.valid) {
      setError(check.message)
      setPreview([])
      setFileName('')
      setUploadFile(null)
      return
    }

    setError('')
    setFileName(file.name)
    setUploadFile(file)
    setLoading(true)

    try {
      if (currentAffairId) {
        setPreview([])
        return
      }

      const result = await parseQuestionBulkFile(file)
      const mapped = (result.questions || [])
        .map((q, i) =>
          bulkRowToCurrentAffairsQuestion(
            {
              questionNo: q.questionNo,
              question: q.question,
              option1: q.options?.[0],
              option2: q.options?.[1],
              option3: q.options?.[2],
              option4: q.options?.[3],
              answer: q.answer,
              explanation: q.explanation,
            },
            i,
          ),
        )
        .filter(Boolean)

      if (!mapped.length) {
        setError('No valid questions found in file')
        setPreview([])
        return
      }

      setPreview(mapped)
    } catch (err) {
      setError(err.message || 'Failed to parse file')
      setPreview([])
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (currentAffairId) {
      if (!uploadFile) {
        toast.error('Select a file to upload')
        return
      }

      setLoading(true)
      try {
        await bulkUploadDailyPracticeQuestions(currentAffairId, uploadFile, { replace: false })
        const questions = await getDailyPracticeQuestions(currentAffairId)
        onImport?.(questions)
        toast.success(`Uploaded ${questions.length} question(s)`)
        handleClose()
      } catch (err) {
        if (import.meta.env.DEV) {
          console.error('[Daily Practice] Bulk upload failed:', err)
        }
        toast.error(getApiErrorMessage(err, 'Failed to upload questions'))
      } finally {
        setLoading(false)
      }
      return
    }

    if (!preview.length) {
      toast.error('Upload and preview questions first')
      return
    }
    onImport?.(preview)
    toast.success(`Imported ${preview.length} question(s)`)
    handleClose()
  }

  return (
    <Modal open={open} onClose={handleClose} size="lg" title="Bulk Upload Questions">
      <div className="overflow-hidden rounded-2xl bg-[#f7f7f7] shadow-[0_24px_60px_rgba(15,23,42,0.2)]">
        <ModalPanelHeader title="Bulk Upload Questions" onBack={handleClose} icon={FileSpreadsheet} />

        <div className="space-y-5 px-4 py-5 sm:px-6 sm:py-6">
          <button
            type="button"
            onClick={handleDownloadTemplate}
            disabled={templateLoading}
            className="inline-flex items-center gap-2 rounded-lg border border-[#55ace7]/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#f0f9ff] disabled:opacity-60"
          >
            {templateLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Download Sample Template
          </button>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[#55ace7]/45 bg-white px-6 py-10 text-center transition hover:border-[#55ace7] hover:bg-[#fafcff]">
            <Upload className="h-8 w-8 text-[#55ace7]" />
            <span className="text-sm font-semibold text-[#246392]">
              {fileName || 'Upload Excel (.xlsx) or CSV'}
            </span>
            <UploadFieldHint profile="EXCEL_BULK" className="text-xs text-gray-500" />
            <input
              ref={inputRef}
              type="file"
              accept={CURRENT_AFFAIRS_BULK_ACCEPT}
              className="sr-only"
              onChange={handleFile}
            />
          </label>

          {currentAffairId ? (
            <p className="text-xs font-medium text-[#246392]">
              Questions will be uploaded to the server and merged with existing questions.
            </p>
          ) : null}

          {loading ? (
            <p className="flex items-center justify-center gap-2 text-sm text-[#246392]">
              <Loader2 className="h-4 w-4 animate-spin" />
              {currentAffairId ? 'Uploading…' : 'Validating file…'}
            </p>
          ) : null}

          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}

          {!currentAffairId && preview.length > 0 ? (
            <div className="overflow-hidden rounded-xl border border-[#eef2fc] bg-white shadow-sm">
              <div className="border-b border-[#eef2fc] bg-[#fafcff] px-4 py-2.5 text-sm font-bold text-[#111]">
                Preview ({preview.length} questions)
              </div>
              <div className="max-h-56 overflow-y-auto px-4 py-3">
                <ul className="space-y-2 text-sm text-gray-700">
                  {preview.slice(0, 8).map((q) => (
                    <li key={q.id} className="line-clamp-2 border-b border-slate-100 pb-2 last:border-0">
                      <span className="font-semibold text-[#246392]">Q{q.questionNo}.</span>{' '}
                      {q.question}
                    </li>
                  ))}
                  {preview.length > 8 ? (
                    <li className="text-xs text-gray-500">+ {preview.length - 8} more…</li>
                  ) : null}
                </ul>
              </div>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200/80 pt-5">
            <button
              type="button"
              onClick={handleClose}
              className="inline-flex items-center gap-2 rounded-full bg-slate-200/80 px-6 py-2.5 text-sm font-bold text-slate-700"
            >
              <X className="h-4 w-4" />
              Cancel
            </button>
            <button
              type="button"
              disabled={loading || (!currentAffairId && !preview.length) || (currentAffairId && !uploadFile)}
              onClick={handleImport}
              className="rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-8 py-2.5 text-sm font-bold text-white shadow disabled:opacity-50"
            >
              Import
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
