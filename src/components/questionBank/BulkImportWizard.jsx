import { useMemo, useState } from 'react'
import { UploadCloud, FileDown, FileSpreadsheet, AlertTriangle, CheckCircle2, X, XCircle } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import { CourseFormField } from '../courses/CourseFormField'
import { cn } from '../../utils/cn'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import {
  useDownloadTemplate,
  useImportBulkFile,
  useValidateBulkFile,
} from '../../hooks/questionBank'
import { getApiErrorMessage } from '../../utils/apiError'
import { isSupportedBulkFile } from '../../utils/questionBankBulkUpload'

const TEMPLATE_CARDS = [
  { key: 'MCQ', title: 'MCQ Template', subtitle: 'Options A–D + answer' },
  { key: 'Numerical', title: 'Numerical Template', subtitle: 'Numeric answer' },
  { key: 'Match the Following', title: 'Match the Following Template', subtitle: 'Left/Right pairs' },
  { key: 'Assertion Reason', title: 'Assertion Reason Template', subtitle: 'Assertion + reason' },
  { key: 'Descriptive', title: 'Descriptive Template', subtitle: 'Long answer questions' },
]

export default function BulkImportWizard({ open, onClose, onImported }) {
  const [file, setFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)
  const [duplicateMode, setDuplicateMode] = useState('SKIP')
  const [validation, setValidation] = useState(null)
  const [uploadSummary, setUploadSummary] = useState(null)

  const downloadTemplate = useDownloadTemplate()
  const validateBulk = useValidateBulkFile()
  const importBulk = useImportBulkFile()

  const resetAll = () => {
    setFile(null)
    setValidation(null)
    setUploadSummary(null)
    setDuplicateMode('SKIP')
  }

  const handleClose = () => {
    resetAll()
    onClose?.()
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
    try {
      const data = await validateBulk.mutateAsync(file)
      const results = [
        ...(data.errors || []).map((e) => ({
          rowNumber: e.row,
          validationStatus: 'Invalid',
          errorMessage: [e.field, e.message].filter(Boolean).join(': '),
        })),
        ...(data.duplicates || []).map((d) => ({
          rowNumber: d.row ?? d.sourceRow,
          validationStatus: 'Duplicate',
          errorMessage: d.reason || d.questionText || 'Duplicate question',
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
      toast.success(data.canImport ? 'File is valid and ready to import' : 'Validation completed with errors')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to validate file'))
    }
  }

  const uploadValidRows = async () => {
    if (!file || !validation?.canImport) {
      toast.error('Fix validation errors before importing')
      return
    }
    try {
      const data = await importBulk.mutateAsync({ file, duplicateMode })
      setUploadSummary({
        insertedCount: data.insertedCount ?? 0,
        skippedCount: data.skippedCount ?? 0,
        failedCount: data.failedCount ?? 0,
        duplicateCount: data.duplicateCount ?? 0,
      })
      toast.success(`${data.insertedCount ?? 0} question(s) imported successfully`)
      onImported?.()
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Import failed'))
    }
  }

  const previewRows = useMemo(
    () =>
      (validation?.results || []).map((r) => ({
        id: String(r.rowNumber),
        rowNumber: r.rowNumber,
        validationStatus: r.validationStatus,
        errorMessage: r.errorMessage,
      })),
    [validation],
  )

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
            <span className={cn('inline-flex items-center gap-2 rounded-lg px-3 py-1 text-xs font-extrabold uppercase', cls)}>
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
    <Modal open={open} onClose={handleClose} size="lg" title="Bulk Import Questions" showCloseButton={false}>
      <div className="flex max-h-[min(88vh,760px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <ModalPanelHeader title="Bulk Import Questions" onClose={handleClose} icon={UploadCloud} closeVariant="icon" plainCloseIcon />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          <div className="space-y-5">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1a3a5c]">Download Sample Templates</h3>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {TEMPLATE_CARDS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    disabled={downloadTemplate.isPending}
                    onClick={async () => {
                      try {
                        await downloadTemplate.mutateAsync(t.key)
                        toast.success(`${t.title} downloaded`)
                      } catch (err) {
                        toast.error(getApiErrorMessage(err, 'Failed to download template'))
                      }
                    }}
                    className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-[#55ace7] hover:bg-[#f8fbff] disabled:opacity-60"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-extrabold text-[#1a3a5c]">{t.title}</p>
                      <p className="mt-0.5 text-xs font-semibold text-slate-500">{t.subtitle}</p>
                    </div>
                    <FileDown className="h-5 w-5 text-[#246392]" />
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <CourseFormField label="Upload file" required>
                <div
                  className={cn(
                    'rounded-2xl border border-dashed p-4 transition',
                    dragOver ? 'border-[#55ace7] bg-[#f8fbff]' : 'border-slate-200 bg-white',
                  )}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setDragOver(true)
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    acceptFile(e.dataTransfer.files?.[0])
                  }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <UploadCloud className="h-5 w-5 text-[#246392]" />
                      <div>
                        <p className="text-sm font-extrabold text-[#1a3a5c]">Drag & drop or browse</p>
                        <p className="text-xs font-semibold text-slate-500">Accepted: .xlsx, .csv · Max: 5 MB</p>
                      </div>
                    </div>
                    <label className="inline-flex h-10 cursor-pointer items-center rounded-xl bg-[#1a3a5c] px-4 text-sm font-semibold text-white">
                      Browse
                      <input type="file" accept=".xlsx,.csv" className="sr-only" onChange={(e) => acceptFile(e.target.files?.[0])} />
                    </label>
                  </div>
                  {file ? (
                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50/60 px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="h-5 w-5 text-[#246392]" />
                        <p className="text-sm font-extrabold text-[#1a3a5c]">{file.name}</p>
                      </div>
                      <button type="button" onClick={resetAll} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <X className="h-4 w-4" />
                        Remove
                      </button>
                    </div>
                  ) : null}
                </div>
              </CourseFormField>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold text-slate-700">Duplicate handling:</span>
                <button
                  type="button"
                  onClick={() => setDuplicateMode('SKIP')}
                  className={cn(
                    'inline-flex h-9 items-center rounded-xl px-3 text-sm font-semibold',
                    duplicateMode === 'SKIP' ? 'bg-[#1a3a5c] text-white' : 'border border-slate-200 bg-white text-slate-700',
                  )}
                >
                  Skip duplicates
                </button>
                <button
                  type="button"
                  onClick={() => setDuplicateMode('UPLOAD_ANYWAY')}
                  className={cn(
                    'inline-flex h-9 items-center rounded-xl px-3 text-sm font-semibold',
                    duplicateMode === 'UPLOAD_ANYWAY' ? 'bg-[#1a3a5c] text-white' : 'border border-slate-200 bg-white text-slate-700',
                  )}
                >
                  Upload anyway
                </button>
              </div>
            </div>

            {validation ? (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="text-sm font-medium text-slate-700">
                  Total: {validation.summary.totalRows} · Valid: {validation.summary.validRows} · Duplicates:{' '}
                  {validation.summary.duplicateRows} · Invalid: {validation.summary.invalidRows}
                </p>
                <div className="mt-4">
                  <PaginatedFigmaTable
                    data={previewRows}
                    columns={previewColumns}
                    loading={false}
                    emptyMessage="No issues found"
                    initialPageSize={10}
                    resetDeps={[file?.name, duplicateMode, validation?.summary?.totalRows]}
                  />
                </div>
              </div>
            ) : null}

            {uploadSummary ? (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1a3a5c]">Import Summary</h3>
                <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ['Inserted', uploadSummary.insertedCount],
                    ['Skipped', uploadSummary.skippedCount],
                    ['Failed', uploadSummary.failedCount],
                    ['Duplicates', uploadSummary.duplicateCount],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 p-4">
                      <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">{label}</p>
                      <p className="mt-1 text-2xl font-extrabold text-[#1a3a5c]">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="border-t border-slate-200 bg-white px-4 py-4 sm:px-7">
          <div className="flex flex-wrap justify-end gap-3">
            <button type="button" onClick={resetAll} className="inline-flex h-11 items-center rounded-2xl bg-[#58ace7] px-6 text-sm font-semibold text-white">
              Reset
            </button>
            <button
              type="button"
              onClick={validateFile}
              disabled={!file || validateBulk.isPending || importBulk.isPending}
              className="inline-flex h-11 items-center rounded-2xl bg-[#0d2b46] px-6 text-sm font-semibold text-white disabled:opacity-60"
            >
              {validateBulk.isPending ? 'Validating...' : 'Validate File'}
            </button>
            <button
              type="button"
              onClick={uploadValidRows}
              disabled={!validation?.canImport || importBulk.isPending || validateBulk.isPending}
              className="inline-flex h-11 items-center rounded-2xl bg-[#1a3a5c] px-6 text-sm font-semibold text-white disabled:opacity-60"
            >
              {importBulk.isPending ? 'Importing...' : 'Import Questions'}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
