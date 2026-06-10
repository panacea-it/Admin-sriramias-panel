import { useCallback, useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useLocation, useNavigate } from 'react-router-dom'
import { BookMarked, PlusCircle } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import AddCourseModal from '../../components/courses/AddCourseModal'
import BatchManagementTable from '../../components/batch-management/BatchManagementTable'
import ViewBatchModal from '../../components/courses/ViewBatchModal'
import BatchConfirmDialog from '../../components/batch-management/BatchConfirmDialog'
import { useBatchManagementContext } from '../../contexts/BatchManagementContext'
import { useEditModal } from '../../hooks/useEditModal'
import { useBatchesData } from '../../hooks/useBatchesData'
import { useBatchAudit } from '../../hooks/useBatchAudit'
import { mapBatchRowToTableFormat } from '../../utils/batchHelpers'
import { batchStatusFilterOptions } from '../../utils/batchOperations'
import { BATCH_AUDIT_TYPES } from '../../utils/batchAuditStorage'
import {
  createBatch,
  deleteBatch,
  duplicateBatch,
  fetchBatchQuickView,
  updateBatch,
  updateBatchStatus as patchBatchStatus,
} from '../../api/batchesAPI'
import { getApiErrorMessage } from '../../utils/apiError'
import { toast } from '../../utils/toast'

function BannerButton({ children, onClick, icon: Icon = PlusCircle, variant = 'primary' }) {
  const isPrimary = variant === 'primary'
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        isPrimary
          ? 'inline-flex h-10 min-h-[38px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] active:scale-[0.98]'
          : 'inline-flex h-10 min-h-[38px] items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/15 px-5 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-white/25 hover:scale-[1.02] active:scale-[0.98]'
      }
    >
      <Icon className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      {children}
    </button>
  )
}

function resolveBatchDeleteId(batch) {
  return batch?.apiRow?.id ?? batch?.id
}

export default function BatchesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const restored = location.state?.listState

  const [search, setSearch] = useState(restored?.search ?? '')
  const [statusFilter, setStatusFilter] = useState(restored?.statusFilter ?? 'all')
  const [tablePage, setTablePage] = useState(restored?.page ?? 1)
  const [tablePageSize, setTablePageSize] = useState(restored?.pageSize ?? 10)

  const debouncedSearch = useDebouncedValue(search, 500)

  const {
    sourceRows,
    loading,
    error: listError,
    loadBatches,
    apiBatches,
    meta,
  } = useBatchesData({
    page: tablePage,
    limit: tablePageSize,
    search: debouncedSearch,
    status: statusFilter,
  })
  const { getStudentCount } = useBatchManagementContext()
  const { logBatchActivity } = useBatchAudit()

  const modal = useEditModal()
  const [viewItem, setViewItem] = useState(null)
  const [optimisticStatus, setOptimisticStatus] = useState({})
  const [statusUpdatingIds, setStatusUpdatingIds] = useState(() => new Set())
  const [actionLoading, setActionLoading] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(null)

  useEffect(() => {
    if (location.state?.listState) {
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [navigate, location.pathname, location.state?.listState])

  useEffect(() => {
    if (listError) {
      toast.error(listError)
    }
  }, [listError])

  const displayRows = useMemo(
    () =>
      sourceRows.map((row) => {
        const override = optimisticStatus[String(row.id)]
        return override != null ? { ...row, status: override } : row
      }),
    [sourceRows, optimisticStatus],
  )

  const resolveStudentTotal = useCallback(
    (row) => row.totalStudents ?? row.studentCount ?? getStudentCount(row),
    [getStudentCount],
  )

  const tableBatches = useMemo(
    () =>
      displayRows.map((row) =>
        mapBatchRowToTableFormat(row, [], resolveStudentTotal(row)),
      ),
    [displayRows, resolveStudentTotal],
  )

  const listState = useMemo(
    () => ({
      search,
      statusFilter,
      page: tablePage,
      pageSize: tablePageSize,
    }),
    [search, statusFilter, tablePage, tablePageSize],
  )

  const updateBatchStatus = useCallback(
    async (batch, nextStatus, { silent = false } = {}) => {
      const row = batch.apiRow ?? apiBatches.find((b) => b.id === batch.id)
      if (!row) return
      await patchBatchStatus(row.id, nextStatus)
      logBatchActivity(row.id, {
        type: BATCH_AUDIT_TYPES.STATUS_CHANGED,
        message: `Status changed from ${batch.status} to ${nextStatus}`,
      })
      await loadBatches()
      if (!silent) toast.success(`Batch status updated to ${nextStatus}`)
    },
    [apiBatches, loadBatches, logBatchActivity],
  )

  const handleSaveBatch = async (form, { isEdit, id, isDuplicate, duplicateFromId }) => {
    if (!form.academicCourseId?.trim() && !form.courseId?.trim()) {
      toast.error('Please select a course')
      return
    }

    if (isEdit && id != null) {
      await updateBatch(id, form)
    } else if (isDuplicate && duplicateFromId) {
      const created = await duplicateBatch(duplicateFromId, form)
      const source = apiBatches.find((b) => b.id === duplicateFromId)
      logBatchActivity(created?.id, {
        type: BATCH_AUDIT_TYPES.DUPLICATED,
        message: source
          ? `Duplicated from ${source.batchName || source.name}`
          : 'Batch duplicated',
      })
      logBatchActivity(duplicateFromId, {
        type: BATCH_AUDIT_TYPES.DUPLICATED,
        message: `Cloned as "${form.batchName}"`,
      })
    } else {
      const created = await createBatch(form)
      logBatchActivity(created?.id, {
        type: BATCH_AUDIT_TYPES.CREATED,
        message: `Batch "${form.batchName}" created`,
      })
    }
    await loadBatches()
  }

  const handleEditBatch = useCallback(
    (tableBatch) => {
      const row = tableBatch.apiRow ?? apiBatches.find((b) => b.id === tableBatch.id)
      if (row) modal.openEdit(row)
    },
    [apiBatches, modal],
  )

  const handleStatusChange = useCallback(
    async (batch, nextStatus) => {
      if (nextStatus === batch.status) return
      const id = String(batch.id)
      const previous = batch.status
      setOptimisticStatus((prev) => ({ ...prev, [id]: nextStatus }))
      setStatusUpdatingIds((prev) => new Set(prev).add(id))
      try {
        await updateBatchStatus(batch, nextStatus)
        setOptimisticStatus((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
      } catch (err) {
        setOptimisticStatus((prev) => ({ ...prev, [id]: previous }))
        toast.error(err?.message || 'Failed to update batch status')
      } finally {
        setStatusUpdatingIds((prev) => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }
    },
    [updateBatchStatus],
  )

  const handleDuplicateBatch = useCallback(
    (tableBatch) => {
      const row = tableBatch.apiRow ?? apiBatches.find((b) => b.id === tableBatch.id)
      if (row) modal.openDuplicate(row)
    },
    [apiBatches, modal],
  )

  const [viewLoading, setViewLoading] = useState(false)

  const handleQuickView = useCallback(async (tableBatch) => {
    const row = tableBatch.apiRow ?? tableBatch
    const batchId = row?.id ?? tableBatch.id
    if (!batchId) return
    setViewItem(row)
    setViewLoading(true)
    try {
      const quickView = await fetchBatchQuickView(batchId)
      if (quickView) setViewItem({ ...quickView, id: quickView.id || row?.id || batchId })
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load batch quick view'))
    } finally {
      setViewLoading(false)
    }
  }, [])

  const handleDelete = async () => {
    if (!deleteConfirm || actionLoading) return

    const id = resolveBatchDeleteId(deleteConfirm)
    if (!id) {
      toast.error('Missing batch id')
      return
    }

    setActionLoading(true)
    try {
      await deleteBatch(id)
      logBatchActivity(id, {
        type: BATCH_AUDIT_TYPES.DELETED,
        message: 'Batch deleted',
      })

      const remainingTotal = Math.max(0, (meta.total || tableBatches.length) - 1)
      const maxPage = Math.max(1, Math.ceil(remainingTotal / tablePageSize) || 1)
      if (tablePage > maxPage) setTablePage(maxPage)

      await loadBatches({ silent: true })
      toast.success('Batch Deleted Successfully')
      setDeleteConfirm(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete batch'))
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={BookMarked}
          iconClassName="text-[#dc2626]"
          title="Batch Manager"
          className="sticky top-0 z-20 from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
        >
          <div className="flex flex-wrap items-center justify-end gap-2">
            <BannerButton onClick={modal.openCreate}>Add Batch</BannerButton>
          </div>
        </PageBanner>

        <CourseFilterToolbar
          search={search}
          onSearchChange={(e) => {
            setSearch(e.target.value)
            setTablePage(1)
          }}
          searchPlaceholder="Search batches..."
          status={statusFilter}
          onStatusChange={(e) => {
            setStatusFilter(e.target.value)
            setTablePage(1)
          }}
          statusOptions={batchStatusFilterOptions()}
        />

        {loading ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-[0_8px_28px_rgba(15,23,42,0.08)]">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-[#55ace7] border-t-transparent" />
            <p className="mt-4 text-sm text-[#686868]">Loading batches...</p>
          </div>
        ) : tableBatches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <p className="text-base font-semibold text-[#111111]">No batches found</p>
            <p className="mt-2 text-sm text-[#686868]">
              {search || statusFilter !== 'all'
                ? 'Try adjusting search or status filters.'
                : 'Create your first batch to get started.'}
            </p>
            <button
              type="button"
              onClick={() => {
                if (search || statusFilter !== 'all') {
                  setSearch('')
                  setStatusFilter('all')
                  setTablePage(1)
                } else {
                  modal.openCreate()
                }
              }}
              className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#246392] px-5 text-sm font-semibold text-white"
            >
              {search || statusFilter !== 'all' ? 'Clear filters' : 'Add Batch'}
            </button>
          </div>
        ) : (
          <BatchManagementTable
            batches={tableBatches}
            listState={listState}
            page={tablePage}
            pageSize={tablePageSize}
            totalItems={meta.total || tableBatches.length}
            serverPaginated
            onPageChange={setTablePage}
            onPageSizeChange={(size) => {
              setTablePageSize(size)
              setTablePage(1)
            }}
            onEditBatch={handleEditBatch}
            onQuickViewBatch={handleQuickView}
            resetDeps={[debouncedSearch, statusFilter]}
            onStatusChange={handleStatusChange}
            statusUpdatingIds={statusUpdatingIds}
            onDuplicate={handleDuplicateBatch}
            onDelete={(batch) => {
              if (actionLoading) return
              setDeleteConfirm(batch)
            }}
          />
        )}
      </section>

      <AddCourseModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        duplicateSource={modal.duplicateSource}
        onSubmit={handleSaveBatch}
      />

      <ViewBatchModal
        open={Boolean(viewItem)}
        onClose={() => setViewItem(null)}
        item={viewItem}
        loading={viewLoading}
      />

      <BatchConfirmDialog
        open={Boolean(deleteConfirm)}
        title="Delete batch?"
        message={
          deleteConfirm
            ? `Permanently delete "${deleteConfirm.displayName}"? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        variant="danger"
        loading={actionLoading}
        loadingLabel="Deleting…"
        onClose={() => {
          if (!actionLoading) setDeleteConfirm(null)
        }}
        onConfirm={handleDelete}
      />

    </div>
  )
}
