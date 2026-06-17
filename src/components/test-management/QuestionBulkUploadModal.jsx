import { useMemo, useState } from 'react'
import { UploadCloud, FileDown, FileSpreadsheet, AlertTriangle, CheckCircle2, XCircle, Trash2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import { CourseFormField } from '../courses/CourseFormField'
import { cn } from '../../utils/cn'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import {
  downloadQuestionTemplate,
  importBulkQuestions,
  validateBulkQuestions,
} from '../../api/questionBankAPI'
import {
  downloadErrorReportXlsx,
  isSupportedBulkFile,
} from '../../utils/questionBankBulkUpload'

export default function QuestionBulkUploadModal({ open, onClose, onUploaded }) {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [duplicateMode, setDuplicateMode] = useState('skip') // skip | upload_anyway

  const [validating, setValidating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [validation, setValidation] = useState(null) // { results, summary }
  const [uploadSummary, setUploadSummary] = useState(null) // { summary, failedRows }

  const handleClose = () => {
    setFile(null)
    setValidation(null)
    setUploadSummary(null)
    onClose?.()
  }

  const resetAll = () => {
    setFile(null)
    setValidation(null)
    setUploadSummary(null)
    setDuplicateMode('skip')
  }

  const acceptFile = (nextFile) => {
    if (!nextFile) return
    if (nextFile.size > 5 * 1024 * 1024) {
      toast.error('Max upload size is 5 MB')
      return
    }
    if (!isSupportedBulkFile(nextFile)) {
      toast.error('Upload only .xlsx or .csv files')
      return
    }
    setFile(nextFile)
    setValidation(null)
    setUploadSummary(null)
  }

  const validateFile = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }
    setValidating(true)
    try {
      const data = await validateBulkQuestions(file)
      const results = [
        ...(data.errors || []).map((e) => ({
          rowNumber: e.row,
          validationStatus: 'Invalid',
          errorMessage: [e.field, e.message].filter(Boolean).join(': '),
          shouldUpload: false,
        })),
        ...(data.duplicates || []).map((d) => ({
          rowNumber: d.row ?? d.sourceRow,
          validationStatus: 'Duplicate',
          errorMessage: d.message || d.questionText || 'Duplicate question',
          shouldUpload: false,
        })),
      ]
      setValidation({
        canImport: Boolean(data.canImport),
        summary: {
          totalRows: data.totalRows ?? 0,
          validRows: data.validRows ?? 0,
          duplicateRows: data.duplicateRows ?? 0,
          invalidRows: data.invalidRows ?? 0,
        },
        results,
      })
      toast.success('Validation complete')
    } catch (err) {
      toast.error(err?.message || 'Failed to validate file')
    } finally {
      setValidating(false)
    }
  }

  const uploadValidRows = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }
    if (!validation) {
      toast.error('Please validate the file first')
      return
    }

    setUploading(true)
    try {
      if (validation.canImport === false) {
        toast.error('Fix the invalid rows before importing')
        setUploading(false)
        return
      }
      const data = await importBulkQuestions(file, duplicateMode)
      const failedRows = (data.errors || []).map((e) => ({
        rowNumber: e.row,
        validationStatus: 'Failed',
        errorMessage: e.message,
      }))
      setUploadSummary({
        summary: {
          totalRows: validation.summary.totalRows,
          successfullyUploaded: data.insertedCount ?? 0,
          failedRows: data.failedCount ?? 0,
          duplicateRows: data.duplicateCount ?? 0,
          validationErrors: 0,
          skippedDuplicates: data.skippedCount ?? 0,
        },
        failedRows,
      })
      toast.success(`Uploaded ${data.insertedCount ?? 0} questions`)
      onUploaded?.()
    } catch (err) {
      toast.error(err?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const templateCards = [
    { key: 'MCQ', title: 'MCQ Template', subtitle: 'Options A–D + answer' },
    { key: 'Numerical', title: 'Numerical Template', subtitle: 'Numeric answer' },
    { key: 'Match the Following', title: 'Match the Following Template', subtitle: 'Left/Right + mapping' },
    { key: 'Assertion Reason', title: 'Assertion Reason Template', subtitle: 'Assertion + reason' },
    { key: 'Descriptive', title: 'Descriptive Template', subtitle: 'Long answer questions' },
  ]

  const previewRows = useMemo(() => {
    if (!validation?.results?.length) return []
    return validation.results.map((r) => ({
      id: String(r.rowNumber),
      rowNumber: r.rowNumber,
      validationStatus: r.validationStatus,
      errorMessage: r.errorMessage,
    }))
  }, [validation])

  const previewColumns = useMemo(
    () => [
      { key: 'rowNumber', label: 'Row', headerClassName: 'pl-6 sm:pl-8', cellClassName: 'pl-6 sm:pl-8' },
      {
        key: 'validationStatus',
        label: 'Validation Status',
        render: (r) => {
          const s = r.validationStatus
          const cls =
            s === 'Valid'
              ? 'bg-emerald-50 text-emerald-700'
              : s === 'Duplicate'
                ? 'bg-amber-50 text-amber-800'
                : 'bg-red-50 text-red-700'
          const Icon = s === 'Valid' ? CheckCircle2 : s === 'Duplicate' ? AlertTriangle : XCircle
          return (
            <span
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-1 text-xs font-extrabold uppercase tracking-wide',
                cls,
              )}
            >
              <Icon className="h-4 w-4" />
              {s}
            </span>
          )
        },
      },
      {
        key: 'errorMessage',
        label: 'Error Message',
        render: (r) => <span className="text-sm text-slate-700">{r.errorMessage || '—'}</span>,
      },
    ],
    [],
  )

  return (
    <Modal open={open} onClose={handleClose} size="lg" title="Bulk Upload Questions" showCloseButton={false}>
      <div className="flex max-h-[min(88vh,760px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <ModalPanelHeader title="Bulk Upload Questions" onClose={handleClose} icon={UploadCloud} closeVariant="icon" plainCloseIcon />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          <div className="space-y-5">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1a3a5c]">Download Sample Templates</h3>
                  <p className="mt-1 text-sm font-medium text-slate-600">Download the correct Excel format for each question type.</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {templateCards.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    onClick={async () => {
                      try {
                        await downloadQuestionTemplate(t.key)
                        toast.success(`${t.title} downloaded`)
                      } catch (err) {
                        toast.error(err?.message || 'Failed to download template')
                      }
                    }}
                    className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[#55ace7] hover:bg-[#f8fbff]"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#1a3a5c]">{t.title}</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">{t.subtitle}</p>
                    </div>
                    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef6fc] text-[#246392] transition group-hover:bg-white">
                      <FileDown className="h-5 w-5" />
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1a3a5c]">Upload Instructions</h3>
              <ul className="mt-3 space-y-2 text-sm font-medium text-slate-700">
                <li>- Upload only <span className="font-extrabold">.xlsx</span> or <span className="font-extrabold">.csv</span> files</li>
                <li>- Do not change column names</li>
                <li>- One row = one question</li>
                <li>- Supported question types: MCQ, Numerical, Match the Following, Assertion Reason, Descriptive</li>
                <li>- Maximum upload size: 5 MB</li>
                <li>- Empty mandatory fields will fail validation</li>
                <li>- Duplicate questions may be skipped</li>
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <CourseFormField label="Upload file" required>
                <div
                  className={cn(
                    'rounded-2xl border border-dashed p-4 transition',
                    dragOver ? 'border-[#55ace7] bg-[#f8fbff]' : 'border-slate-200 bg-white',
                  )}
                  onDragEnter={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDragOver(true)
                  }}
                  onDragOver={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDragOver(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDragOver(false)
                  }}
                  onDrop={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setDragOver(false)
                    const f = e.dataTransfer.files?.[0]
                    acceptFile(f)
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#eef6fc] text-[#246392]">
                        <UploadCloud className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-extrabold text-[#1a3a5c]">Drag & drop your file here, or browse</p>
                        <p className="mt-0.5 text-xs font-semibold text-slate-500">Accepted: .xlsx, .csv · Max: 5 MB</p>
                      </div>
                    </div>
                    <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-xl bg-[#1a3a5c] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152f4a]">
                      Browse
                      <input type="file" accept=".xlsx,.csv" className="sr-only" onChange={(e) => acceptFile(e.target.files?.[0])} />
                    </label>
                  </div>

                  {file ? (
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileSpreadsheet className="h-5 w-5 text-[#246392]" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-extrabold text-[#1a3a5c]">{file.name}</p>
                          <p className="mt-0.5 text-xs font-semibold text-slate-500">
                            {(file.size / 1024).toFixed(1)} KB · {file.name.toLowerCase().endsWith('.xlsx') ? 'XLSX' : 'CSV'}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={resetAll}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>
              </CourseFormField>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f8fbff] px-4 py-3">
                <div className="text-sm font-semibold text-slate-700">Duplicate handling:</div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDuplicateMode('skip')}
                    className={cn(
                      'inline-flex h-9 items-center rounded-xl px-3 text-sm font-semibold transition',
                      duplicateMode === 'skip'
                        ? 'bg-[#1a3a5c] text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    Skip duplicates
                  </button>
                  <button
                    type="button"
                    onClick={() => setDuplicateMode('upload_anyway')}
                    className={cn(
                      'inline-flex h-9 items-center rounded-xl px-3 text-sm font-semibold transition',
                      duplicateMode === 'upload_anyway'
                        ? 'bg-[#1a3a5c] text-white'
                        : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
                    )}
                  >
                    Upload anyway
                  </button>
                </div>
              </div>
            </div>

            {validation ? (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1a3a5c]">Preview Parsed Data</h3>
                    <p className="mt-1 text-sm font-medium text-slate-600">
                      Total: {validation.summary.totalRows} · Valid: {validation.summary.validRows} · Duplicates: {validation.summary.duplicateRows} · Invalid: {validation.summary.invalidRows}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <PaginatedFigmaTable
                    rows={previewRows}
                    columns={previewColumns}
                    isLoading={false}
                    emptyText="Upload a file to preview"
                    stickyHeader
                    pageSize={10}
                    resetDeps={[file?.name, duplicateMode]}
                  />
                </div>
              </div>
            ) : null}

            {uploadSummary ? (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1a3a5c]">Upload Summary</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {[
                    ['Total Rows', uploadSummary.summary.totalRows],
                    ['Successfully Uploaded', uploadSummary.summary.successfullyUploaded],
                    ['Failed Rows', uploadSummary.summary.failedRows],
                    ['Duplicate Rows', uploadSummary.summary.duplicateRows],
                    ['Validation Errors', uploadSummary.summary.validationErrors],
                    ['Skipped Duplicates', uploadSummary.summary.skippedDuplicates],
                  ].map(([k, v]) => (
                    <div key={k} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{k}</p>
                      <p className="mt-1 text-2xl font-extrabold text-[#1a3a5c]">{v}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await downloadErrorReportXlsx(uploadSummary.failedRows)
                        toast.success('Error report downloaded')
                      } catch (err) {
                        toast.error(err?.message || 'Failed to download error report')
                      }
                    }}
                    className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <FileDown className="h-4 w-4" />
                    Download Error Report (.xlsx)
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-7">
          <div className="flex flex-wrap items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                resetAll()
                toast.message('Reset')
              }}
              className="inline-flex h-11 items-center justify-center rounded-2xl bg-[#58ace7] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#3f9fe3]"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={validateFile}
              disabled={!file || validating || uploading}
              className={cn(
                'inline-flex h-11 items-center justify-center rounded-2xl bg-[#0d2b46] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#092338]',
                (!file || validating || uploading) && 'cursor-not-allowed opacity-60 hover:bg-[#0d2b46]',
              )}
            >
              {validating ? 'Validating...' : 'Validate File'}
            </button>
            <button
              type="button"
              onClick={uploadValidRows}
              disabled={!validation || uploading || validating || validation?.canImport === false}
              className={cn(
                'inline-flex h-11 items-center justify-center rounded-2xl bg-[#1a3a5c] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#152f4a]',
                (!validation || uploading || validating || validation?.canImport === false) &&
                  'cursor-not-allowed opacity-60 hover:bg-[#1a3a5c]',
              )}
            >
              {uploading ? 'Uploading...' : 'Upload Questions'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

