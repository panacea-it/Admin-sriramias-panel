import { Eye, Pencil, ScanLine, Trash2 } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import OmrStatusBadge from './OmrStatusBadge'
import OmrTableSkeleton from './OmrTableSkeleton'
import ResultSheetViewer from './ResultSheetViewer'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { inferOmrFileType } from '../../../utils/omrApiHelpers'

function formatExamDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function DetailField({ label, children }) {
  return (
    <div>
      <dt className="text-xs font-semibold uppercase tracking-wide text-[#6b7280]">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-[#111]">{children}</dd>
    </div>
  )
}

export default function OmrExamViewModal({
  open,
  onClose,
  exam,
  loading = false,
  canEdit = false,
  canDelete = false,
  canUploadResult = false,
  canReplaceResult = false,
  canDeleteResult = false,
  onEdit,
  onDelete,
  onUpload,
  onReplace,
  onDeleteSheet,
}) {
  if (!open) return null

  const hasSheet = Boolean(exam?.resultSheetUploaded)
  const sheet = exam?.resultSheet

  return (
    <Modal open={open} onClose={onClose} size="lg" title="OMR Exam Details" showCloseButton={false}>
      <div className="flex max-h-[min(92vh,820px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <ModalPanelHeader
          title="OMR Exam Details"
          subtitle={exam?.examName}
          onClose={onClose}
          closeVariant="icon"
          plainCloseIcon
          icon={ScanLine}
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-7 sm:py-7">
          {loading || !exam ? (
            <OmrTableSkeleton />
          ) : (
            <div className="space-y-5">
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <dl className="grid gap-4 sm:grid-cols-2">
                  <DetailField label="Exam Name">{exam.examName || '—'}</DetailField>
                  <DetailField label="Status">
                    <OmrStatusBadge status={exam.status} />
                  </DetailField>
                  <DetailField label="Exam Date">{formatExamDate(exam.examDate)}</DetailField>
                  <DetailField label="Result Sheet">{hasSheet ? 'Uploaded' : 'Not uploaded'}</DetailField>
                  <DetailField label="Upload Date">
                    {exam.uploadDate || sheet?.uploadedAt
                      ? formatCategoryDateTime(exam.uploadDate || sheet?.uploadedAt)
                      : '—'}
                  </DetailField>
                  <DetailField label="Created">
                    {exam.createdDate || exam.createdAt
                      ? formatCategoryDateTime(exam.createdDate || exam.createdAt)
                      : '—'}
                  </DetailField>
                </dl>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                  {canEdit && (
                    <button
                      type="button"
                      onClick={onEdit}
                      className="inline-flex items-center gap-2 rounded-lg bg-[#246392] px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:brightness-110"
                    >
                      <Pencil className="h-4 w-4" />
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={onDelete}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                      Delete exam
                    </button>
                  )}
                </div>
              </div>

              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-[#1a3a5c]">Result Sheet</h3>
                    <p className="mt-0.5 text-xs text-slate-500">PDF, XLSX, or CSV — max 10 MB</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!hasSheet && canUploadResult && (
                      <button
                        type="button"
                        onClick={onUpload}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef2fc]"
                      >
                        <Eye className="h-4 w-4" />
                        Upload sheet
                      </button>
                    )}
                    {hasSheet && canReplaceResult && (
                      <button
                        type="button"
                        onClick={onReplace}
                        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef2fc]"
                      >
                        Replace sheet
                      </button>
                    )}
                    {hasSheet && canDeleteResult && (
                      <button
                        type="button"
                        onClick={onDeleteSheet}
                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-50"
                      >
                        Delete sheet
                      </button>
                    )}
                  </div>
                </div>

                {hasSheet ? (
                  <div className="space-y-4">
                    <dl className="grid gap-3 sm:grid-cols-2">
                      <DetailField label="File">{sheet?.fileName || '—'}</DetailField>
                      <DetailField label="Type">
                        {(sheet?.fileType || inferOmrFileType(sheet?.fileName)).toUpperCase()}
                      </DetailField>
                      <DetailField label="Uploaded By">{sheet?.uploadedBy || '—'}</DetailField>
                      <DetailField label="Uploaded">
                        {sheet?.uploadedAt ? formatCategoryDateTime(sheet.uploadedAt) : '—'}
                      </DetailField>
                    </dl>
                    <ResultSheetViewer
                      examId={exam.id}
                      fileName={sheet?.fileName}
                      fileType={sheet?.fileType}
                    />
                  </div>
                ) : (
                  <p className="rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    No result sheet uploaded yet.
                    {canUploadResult ? ' Use Upload sheet to add one.' : ''}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
