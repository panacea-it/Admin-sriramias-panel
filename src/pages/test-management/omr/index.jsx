import { useCallback, useMemo, useState } from 'react'
import { Plus, ScanLine } from 'lucide-react'
import TestManagementPageShell from '../../../components/test-management/TestManagementPageShell'
import CourseFilterToolbar from '../../../components/courses/CourseFilterToolbar'
import OmrManagementTable from '../../../components/test-management/omr/OmrManagementTable'
import OmrErrorState from '../../../components/test-management/omr/OmrErrorState'
import OmrTableActions from '../../../components/test-management/omr/OmrTableActions'
import ConfirmOmrDeleteModal from '../../../components/test-management/omr/ConfirmOmrDeleteModal'
import OmrExamFormModal from '../../../components/test-management/omr/OmrExamFormModal'
import OmrUploadResultModal from '../../../components/test-management/omr/OmrUploadResultModal'
import { useOmrManagement } from '../../../hooks/useOmrManagement'
import { useOmrPermissions } from '../../../hooks/useOmrPermissions'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '../../../utils/toast'
import { deleteOmrExam, downloadOmrResultSheet } from '../../../services/omrService'

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'Active', label: 'Active' },
  { value: 'Inactive', label: 'Inactive' },
]

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

  const renderRowActions = useCallback(
    (row) => (
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
    [
      canEdit,
      canDelete,
      canUploadResult,
      canDownloadResult,
      downloadingExamId,
      handleDownload,
    ],
  )

  const hasActiveFilters = Boolean(search.trim() || statusFilter !== 'all')

  const emptyMessage = hasActiveFilters
    ? 'No OMR exams match your filters.'
    : 'No OMR exams to display'

  const emptyState = hasActiveFilters ? undefined : (
    <div className="px-4 py-8 text-center sm:px-6">
      <p className="text-sm font-semibold text-slate-700">No OMR exams yet</p>
      <p className="mt-1 text-sm text-slate-500">
        Create offline OMR exam records and upload result sheets for storage.
      </p>
      {canCreate && (
        <button
          type="button"
          onClick={() => setCreateModalOpen(true)}
          className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef2fc]"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
          Create OMR Exam
        </button>
      )}
    </div>
  )

  return (
    <TestManagementPageShell
      icon={ScanLine}
      title="OMR"
      actions={
        canCreate ? (
          <button
            type="button"
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto sm:py-2.5"
          >
            <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            Create OMR Exam
          </button>
        ) : null
      }
    >
      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
        <CourseFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search by exam name"
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          statusOptions={STATUS_FILTER_OPTIONS}
          disabled={loading && exams.length === 0}
        />

        {error ? (
          <div className="mt-5">
            <OmrErrorState message={error} onRetry={retryLoad} loading={loading} />
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            <OmrManagementTable
              exams={exams}
              loading={loading}
              resetDeps={[search, statusFilter]}
              emptyMessage={emptyMessage}
              emptyState={emptyState}
              renderActions={renderRowActions}
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
