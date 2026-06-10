import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusCircle, ScanLine } from 'lucide-react'
import TestManagementPageShell from '../../../components/test-management/TestManagementPageShell'
import CategoryFilterBar from '../../../components/categories/CategoryFilterBar'
import CategoryEmptyState from '../../../components/categories/CategoryEmptyState'
import PaginatedFigmaTable from '../../../components/figma/PaginatedFigmaTable'
import OmrTableSkeleton from '../../../components/test-management/omr/OmrTableSkeleton'
import OmrErrorState from '../../../components/test-management/omr/OmrErrorState'
import OmrStatusBadge from '../../../components/test-management/omr/OmrStatusBadge'
import OmrTableActions from '../../../components/test-management/omr/OmrTableActions'
import OmrSortableHeader, { OmrYesNoBadge } from '../../../components/test-management/omr/OmrSortableHeader'
import ConfirmOmrDeleteModal from '../../../components/test-management/omr/ConfirmOmrDeleteModal'
import ConfirmOmrResultDeleteModal from '../../../components/test-management/omr/ConfirmOmrResultDeleteModal'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { useOmrManagement } from '../../../hooks/useOmrManagement'
import { useOmrPermissions } from '../../../hooks/useOmrPermissions'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import { getApiErrorMessage } from '../../../utils/apiError'
import { toast } from '../../../utils/toast'
import {
  deleteOmrExam,
  deleteOmrResultSheet,
  downloadOmrResultSheet,
} from '../../../services/omrService'

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
  const navigate = useNavigate()
  const {
    canCreate,
    canEdit,
    canDelete,
    canUploadResult,
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
    sortKey,
    sortDirection,
    toggleSort,
    refreshExams,
    retryLoad,
    removeExamLocally,
    patchExamLocally,
  } = useOmrManagement()

  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteResultTarget, setDeleteResultTarget] = useState(null)
  const [deleteResultLoading, setDeleteResultLoading] = useState(false)

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

  const confirmDeleteResult = useCallback(async () => {
    if (!deleteResultTarget) return
    setDeleteResultLoading(true)
    try {
      await deleteOmrResultSheet(deleteResultTarget.id)
      patchExamLocally(deleteResultTarget.id, {
        resultSheetUploaded: false,
        resultSheet: null,
      })
      toast.success('Result sheet deleted')
      setDeleteResultTarget(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete result sheet'))
    } finally {
      setDeleteResultLoading(false)
    }
  }, [deleteResultTarget, patchExamLocally])

  const handleDownload = useCallback(async (row) => {
    try {
      await downloadOmrResultSheet(row.id)
      toast.success('Download started')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to download result sheet'))
    }
  }, [])

  const columns = useMemo(
    () => [
      {
        key: 'examName',
        label: (
          <OmrSortableHeader
            label="Exam Name"
            sortKey="examName"
            activeKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          />
        ),
        render: (row) => <span className="font-semibold text-[#111]">{row.examName}</span>,
      },
      {
        key: 'examDate',
        label: (
          <OmrSortableHeader
            label="Exam Date"
            sortKey="examDate"
            activeKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          />
        ),
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
        label: (
          <OmrSortableHeader
            label="Upload Date"
            sortKey="uploadDate"
            activeKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          />
        ),
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
        label: (
          <OmrSortableHeader
            label="Created Date"
            sortKey="createdAt"
            activeKey={sortKey}
            direction={sortDirection}
            onSort={toggleSort}
          />
        ),
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
        headerClassName: 'min-w-[14rem] text-right',
        cellClassName: 'min-w-[14rem] text-right',
        render: (row) => (
          <OmrTableActions
            hasResultSheet={row.resultSheetUploaded}
            canEdit={canEdit}
            canDelete={canDelete}
            canUploadResult={canUploadResult}
            canDownloadResult={canDownloadResult}
            canDeleteResult={canDeleteResult}
            onEdit={() => navigate(TEST_MANAGEMENT_ROUTES.omrEdit(row.id))}
            onDelete={() => setDeleteTarget(row)}
            onUpload={() => navigate(TEST_MANAGEMENT_ROUTES.omrUploadResults(row.id))}
            onDownload={() => handleDownload(row)}
            onDeleteResult={() => setDeleteResultTarget(row)}
          />
        ),
      },
    ],
    [
      sortKey,
      sortDirection,
      toggleSort,
      canEdit,
      canDelete,
      canUploadResult,
      canDownloadResult,
      canDeleteResult,
      navigate,
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
            onClick={() => navigate(TEST_MANAGEMENT_ROUTES.omrCreate)}
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
            onCta={() => canCreate && navigate(TEST_MANAGEMENT_ROUTES.omrCreate)}
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

      <ConfirmOmrDeleteModal
        open={Boolean(deleteTarget)}
        examName={deleteTarget?.examName}
        loading={deleteLoading}
        onCancel={() => !deleteLoading && setDeleteTarget(null)}
        onConfirm={confirmDelete}
      />

      <ConfirmOmrResultDeleteModal
        open={Boolean(deleteResultTarget)}
        examName={deleteResultTarget?.examName}
        fileName={deleteResultTarget?.resultSheet?.fileName}
        loading={deleteResultLoading}
        onCancel={() => !deleteResultLoading && setDeleteResultTarget(null)}
        onConfirm={confirmDeleteResult}
      />
    </TestManagementPageShell>
  )
}
