import { useCallback, useMemo, useState } from 'react'
import { PlusCircle, ScanLine } from 'lucide-react'
import TestManagementPageShell from '../../../components/test-management/TestManagementPageShell'
import CategoryFilterBar from '../../../components/categories/CategoryFilterBar'
import CategoryEmptyState from '../../../components/categories/CategoryEmptyState'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import OmrTableSkeleton from '../../../components/test-management/omr/OmrTableSkeleton'
import OmrErrorState from '../../../components/test-management/omr/OmrErrorState'
import OmrStatusBadge from '../../../components/test-management/omr/OmrStatusBadge'
import OmrTableActions from '../../../components/test-management/omr/OmrTableActions'
import { OmrYesNoBadge } from '../../../components/test-management/omr/OmrSortableHeader'
import ConfirmOmrDeleteModal from '../../../components/test-management/omr/ConfirmOmrDeleteModal'
import OmrExamFormModal from '../../../components/test-management/omr/OmrExamFormModal'
import OmrUploadResultModal from '../../../components/test-management/omr/OmrUploadResultModal'
import { useOmrManagement } from '../../../hooks/useOmrManagement'
import { useOmrPermissions } from '../../../hooks/useOmrPermissions'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '../../../utils/toast'
import { deleteOmrExam, downloadOmrResultSheet } from '../../../services/omrService'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
]

function formatExamDate(value) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function OmrManagementPage() {
  const {
    canCreate,
    canEdit,
    canDelete,
    canUploadResult,
    canDownloadResult,
  } = useOmrPermissions()

  const {
    exams,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortKey,
    sortDirection,
    refreshExams,
    retryLoad,
    removeExamLocally,
    patchExamLocally,
  } = useOmrManagement()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editExamId, setEditExamId] = useState(null)
  const [uploadTarget, setUploadTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [downloadingExamId, setDownloadingExamId] = useState(null)

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await deleteOmrExam(deleteTarget.id)
      removeExamLocally(deleteTarget.id)
      toast.success('OMR exam deleted')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete OMR exam'))
    } finally {
      setDeleteLoading(false)
    }
  }, [deleteTarget, removeExamLocally])

  const handleDownload = useCallback(async (row) => {
    setDownloadingExamId(row.id)
    try {
      await downloadOmrResultSheet(row.id)
      toast.success('Download started')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to download result sheet'))
    } finally {
      setDownloadingExamId(null)
    }
  }, [])

  const handleExamSaved = useCallback(
    (savedExam) => {
      if (editExamId) {
        patchExamLocally(savedExam.id, savedExam)
      } else {
        refreshExams()
      }
    },
    [editExamId, patchExamLocally, refreshExams],
  )

  const columns = useMemo(
    () => [
      {
        key: 'examName',
        label: 'Exam Name',
        render: (row) => <span className="font-semibold text-[#111]">{row.examName}</span>,
      },
      {
        key: 'examDate',
        label: 'Exam Date',
        render: (row) => (
          <span className="whitespace-nowrap text-sm">{formatExamDate(row.examDate)}</span>
        ),
      },
      {
        key: 'status',
        label: 'Status',
        render: (row) => <OmrStatusBadge status={row.status} />,
      },
      {
        key: 'resultSheetUploaded',
        label: 'Result Sheet',
        render: (row) => <OmrYesNoBadge value={row.resultSheetUploaded} />,
      },
      {
        key: 'uploadDate',
        label: 'Upload Date',
        render: (row) => (
          <span className="whitespace-nowrap text-sm">
            {row.resultSheet?.uploadedAt
              ? formatCategoryDateTime(row.resultSheet.uploadedAt)
              : '—'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created Date',
        render: (row) => (
          <span className="whitespace-nowrap text-sm">
            {formatCategoryDateTime(row.createdAt)}
          </span>
        ),
      },
      {
        key: 'actions',
        label: 'Actions',
        align: 'right',
        headerClassName: 'min-w-[12rem] text-right',
        cellClassName: 'min-w-[12rem] text-right',
        render: (row) => (
          <OmrTableActions
            hasResultSheet={row.resultSheetUploaded}
            canEdit={canEdit}
            canDelete={canDelete}
            canUploadResult={canUploadResult}
            canDownloadResult={canDownloadResult}
            downloading={downloadingExamId === row.id}
            onEdit={() => setEditExamId(row.id)}
            onDelete={() => setDeleteTarget(row)}
            onUpload={() => setUploadTarget(row)}
            onDownload={() => handleDownload(row)}
          />
        ),
      },
    ],
    [
      canEdit,
      canDelete,
      canUploadResult,
      canDownloadResult,
      downloadingExamId,
      handleDownload,
    ],
  )

  const showEmpty =
    !loading && !error && exams.length === 0 && !search && statusFilter === 'all'
  const showNoResults = !loading && !error && exams.length === 0 && !showEmpty

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
  }

  return (
    <TestManagementPageShell
      icon={ScanLine}
      title="OMR"
      actions={
        canCreate ? (
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02]"
          >
            <PlusCircle className="h-4 w-4" />
            Create OMR Exam
          </button>
        ) : null
      }
    >
      <div className="space-y-5 sm:space-y-6">
        <CategoryFilterBar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search by exam name"
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          statusOptions={STATUS_FILTER_OPTIONS}
        />

        {loading ? (
          <OmrTableSkeleton />
        ) : error ? (
          <OmrErrorState message={error} onRetry={retryLoad} loading={loading} />
        ) : showEmpty ? (
          <CategoryEmptyState
            title="No OMR exams yet"
            description="Create offline OMR exam records and upload result sheets for storage."
            ctaLabel="Create OMR Exam"
            onCta={() => canCreate && setCreateModalOpen(true)}
            icon={ScanLine}
          />
        ) : showNoResults ? (
          <CategoryEmptyState
            title="No matching records"
            description="Try adjusting your search or status filter."
            ctaLabel="Clear filters"
            onCta={clearFilters}
            icon={ScanLine}
          />
        ) : (
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80">
            <PaginatedFigmaTable
              columns={columns}
              data={exams}
              itemLabel="OMR exams"
              resetDeps={[search, statusFilter, sortKey, sortDirection]}
              rowClassName="transition-colors hover:bg-[#f8fbff]"
              tableClassName="[&_thead]:sticky [&_thead]:top-0 [&_thead]:z-10"
              tableMinWidth={960}
              stickyLastColumn
            />
          </div>
        )}
      </div>

      <OmrExamFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={handleExamSaved}
      />

      <OmrExamFormModal
        open={Boolean(editExamId)}
        examId={editExamId}
        onClose={() => setEditExamId(null)}
        onSuccess={handleExamSaved}
      />

      <OmrUploadResultModal
        open={Boolean(uploadTarget)}
        examId={uploadTarget?.id}
        examName={uploadTarget?.examName}
        onClose={() => setUploadTarget(null)}
        onSuccess={(updatedExam) => {
          patchExamLocally(updatedExam.id, updatedExam)
        }}
      />

      <ConfirmOmrDeleteModal
        open={Boolean(deleteTarget)}
        examName={deleteTarget?.examName}
        loading={deleteLoading}
        onCancel={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />
    </TestManagementPageShell>
  )
}
