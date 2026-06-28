import { useCallback, useState } from 'react'
import { Plus, RefreshCw, ScanLine } from 'lucide-react'
import TestManagementPageShell from '../../../components/test-management/TestManagementPageShell'
import ConfigFilterToolbar, { FilterSelect } from '../../../components/test-configuration/ConfigFilterToolbar'
import OmrManagementTable from '../../../components/test-management/omr/OmrManagementTable'
import OmrErrorState from '../../../components/test-management/omr/OmrErrorState'
import OmrTableActions from '../../../components/test-management/omr/OmrTableActions'
import OmrExamFormModal from '../../../components/test-management/omr/OmrExamFormModal'
import OmrExamViewModal from '../../../components/test-management/omr/OmrExamViewModal'
import OmrUploadResultModal from '../../../components/test-management/omr/OmrUploadResultModal'
import ConfirmOmrDeleteModal from '../../../components/test-management/omr/ConfirmOmrDeleteModal'
import ConfirmOmrResultDeleteModal from '../../../components/test-management/omr/ConfirmOmrResultDeleteModal'
import { useOmrExamManagement } from '../../../hooks/useOmrExamManagement'
import { useOmrPermissions } from '../../../hooks/useOmrPermissions'
import {
  useDeleteOmrExam,
  useDeleteResultSheet,
  useOmrExamDetail,
} from '../../../hooks/useOmrExams'
import { downloadOmrResultSheet } from '../../../services/omrExamService'
import {
  OMR_SORT_OPTIONS,
} from '../../../utils/omrApiHelpers'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '../../../utils/toast'

export default function OmrManagementPage() {
  const {
    canView,
    canCreate,
    canEdit,
    canDelete,
    canUploadResult,
    canReplaceResult,
    canDownloadResult,
    canDeleteResult,
  } = useOmrPermissions()

  const {
    exams,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    sortPreset,
    setSortPreset,
    controlledPagination,
    refreshExams,
    retryLoad,
    isFetching,
  } = useOmrExamManagement()

  const deleteExamMutation = useDeleteOmrExam()
  const deleteSheetMutation = useDeleteResultSheet()

  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editExamId, setEditExamId] = useState(null)
  const [viewExamId, setViewExamId] = useState(null)
  const [uploadTarget, setUploadTarget] = useState(null)
  const [uploadReplaceMode, setUploadReplaceMode] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteSheetTarget, setDeleteSheetTarget] = useState(null)
  const [downloadingExamId, setDownloadingExamId] = useState(null)

  const { data: viewDetail, isLoading: viewLoading } = useOmrExamDetail(viewExamId, {
    enabled: Boolean(viewExamId),
  })

  const handleDownload = useCallback(async (row) => {
    setDownloadingExamId(row.id)
    try {
      await downloadOmrResultSheet(row.id, { fileName: row.resultSheet?.fileName })
      toast.success('Download started')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to download result sheet'))
    } finally {
      setDownloadingExamId(null)
    }
  }, [])

  const openUpload = useCallback((row, replaceMode = false) => {
    setUploadTarget(row)
    setUploadReplaceMode(replaceMode)
  }, [])

  const confirmDeleteExam = useCallback(async () => {
    if (!deleteTarget) return
    try {
      const response = await deleteExamMutation.mutateAsync(deleteTarget.id)
      toast.success(response?.message || 'OMR exam deleted successfully')
      setDeleteTarget(null)
      if (viewExamId === deleteTarget.id) setViewExamId(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete OMR exam'))
    }
  }, [deleteTarget, deleteExamMutation, viewExamId])

  const confirmDeleteSheet = useCallback(async () => {
    if (!deleteSheetTarget) return
    try {
      const response = await deleteSheetMutation.mutateAsync(deleteSheetTarget.id)
      toast.success(response?.message || 'Result sheet deleted successfully')
      setDeleteSheetTarget(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete result sheet'))
    }
  }, [deleteSheetTarget, deleteSheetMutation])

  const renderRowActions = useCallback(
    (row) => (
      <OmrTableActions
        hasResultSheet={row.resultSheetUploaded}
        canView={canView}
        canEdit={canEdit}
        canDelete={canDelete}
        canUploadResult={canUploadResult}
        canDownloadResult={canDownloadResult}
        downloading={downloadingExamId === row.id}
        onView={() => setViewExamId(row.id)}
        onEdit={() => setEditExamId(row.id)}
        onDelete={() => setDeleteTarget(row)}
        onUpload={() => openUpload(row, false)}
        onDownload={() => handleDownload(row)}
      />
    ),
    [
      canView,
      canEdit,
      canDelete,
      canUploadResult,
      canDownloadResult,
      downloadingExamId,
      handleDownload,
      openUpload,
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
      title="OMR Exams"
      actions={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <button
            type="button"
            onClick={() => refreshExams()}
            disabled={isFetching}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef2fc] disabled:opacity-60 sm:w-auto"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          {canCreate ? (
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-pink-500 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl sm:w-auto sm:py-2.5"
            >
              <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
              Create OMR Exam
            </button>
          ) : null}
        </div>
      }
    >
      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
        <ConfigFilterToolbar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by exam name"
          status={statusFilter}
          onStatusChange={setStatusFilter}
          disabled={loading && exams.length === 0}
          extraFilters={
            <FilterSelect
              label="Sort"
              value={sortPreset}
              onChange={setSortPreset}
              includeAll={false}
              options={OMR_SORT_OPTIONS.map((o) => o.value)}
              optionLabels={Object.fromEntries(OMR_SORT_OPTIONS.map((o) => [o.value, o.label]))}
            />
          }
        />

        {error ? (
          <div className="mt-5">
            <OmrErrorState message={getApiErrorMessage(error, 'Failed to load OMR exams')} onRetry={retryLoad} loading={loading} />
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            <OmrManagementTable
              exams={exams}
              loading={loading}
              resetDeps={[search, statusFilter, sortPreset]}
              emptyMessage={emptyMessage}
              emptyState={emptyState}
              renderActions={renderRowActions}
              controlledPagination={controlledPagination}
              onRowClick={(row) => setViewExamId(row.id)}
            />
          </div>
        )}
      </div>

      <OmrExamFormModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => refreshExams()}
      />

      <OmrExamFormModal
        open={Boolean(editExamId)}
        examId={editExamId}
        onClose={() => setEditExamId(null)}
        onSuccess={() => refreshExams()}
      />

      <OmrExamViewModal
        open={Boolean(viewExamId)}
        exam={viewDetail}
        loading={viewLoading}
        onClose={() => setViewExamId(null)}
        canEdit={canEdit}
        canDelete={canDelete}
        canUploadResult={canUploadResult}
        canReplaceResult={canReplaceResult}
        canDeleteResult={canDeleteResult}
        onEdit={() => {
          setEditExamId(viewExamId)
          setViewExamId(null)
        }}
        onDelete={() => {
          if (viewDetail) setDeleteTarget(viewDetail)
        }}
        onUpload={() => {
          if (viewDetail) openUpload(viewDetail, false)
        }}
        onReplace={() => {
          if (viewDetail) openUpload(viewDetail, true)
        }}
        onDeleteSheet={() => {
          if (viewDetail) setDeleteSheetTarget(viewDetail)
        }}
      />

      <OmrUploadResultModal
        open={Boolean(uploadTarget)}
        examId={uploadTarget?.id}
        examName={uploadTarget?.examName}
        replaceMode={uploadReplaceMode}
        onClose={() => {
          setUploadTarget(null)
          setUploadReplaceMode(false)
        }}
        onSuccess={() => refreshExams()}
      />

      <ConfirmOmrDeleteModal
        open={Boolean(deleteTarget)}
        exam={deleteTarget}
        loading={deleteExamMutation.isPending}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteExam}
      />

      <ConfirmOmrResultDeleteModal
        open={Boolean(deleteSheetTarget)}
        examName={deleteSheetTarget?.examName}
        loading={deleteSheetMutation.isPending}
        onClose={() => setDeleteSheetTarget(null)}
        onConfirm={confirmDeleteSheet}
      />
    </TestManagementPageShell>
  )
}
