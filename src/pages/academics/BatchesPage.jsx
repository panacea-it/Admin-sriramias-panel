import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { useDebouncedValue } from '../../hooks/useDebouncedValue'

import { useLocation, useNavigate } from 'react-router-dom'

import { BookMarked, PlusCircle } from 'lucide-react'

import PageBanner from '../../components/figma/PageBanner'

import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'

import AddCourseModal from '../../components/courses/AddCourseModal'

import BatchManagementTable from '../../components/batch-management/BatchManagementTable'

import BatchBulkConfirmDialog from '../../components/batch-management/BatchBulkConfirmDialog'

import CurrentAffairsBulkActionsBar from '../../components/current-affairs/CurrentAffairsBulkActionsBar'

import ViewBatchModal from '../../components/courses/ViewBatchModal'

import { useBatchManagementContext } from '../../contexts/BatchManagementContext'

import { useEditModal } from '../../hooks/useEditModal'

import { useTableRowSelection } from '../../hooks/useTableRowSelection'

import { useBatchesData } from '../../hooks/useBatchesData'

import { useBatchAudit } from '../../hooks/useBatchAudit'

import { mapBatchRowToTableFormat, resolveBatchMongoId } from '../../utils/batchHelpers'

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



const DISABLED_STATUSES = new Set(['Deactivated'])



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



export default function BatchesPage() {

  const location = useLocation()

  const navigate = useNavigate()

  const restored = location.state?.listState



  const [search, setSearch] = useState(restored?.search ?? '')

  const [statusFilter, setStatusFilter] = useState(restored?.statusFilter ?? 'all')

  const [tablePage, setTablePage] = useState(restored?.page ?? 1)

  const [tablePageSize, setTablePageSize] = useState(restored?.pageSize ?? 10)



  const debouncedSearch = useDebouncedValue(search, 300)



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

  const [bulkConfirm, setBulkConfirm] = useState(null)

  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const [deleteTarget, setDeleteTarget] = useState(null)

  const [deleteLoading, setDeleteLoading] = useState(false)



  const { selectedIds, selection, clearSelection } = useTableRowSelection((row) => String(row.id))



  useEffect(() => {

    if (location.state?.listState) {

      navigate(location.pathname, { replace: true, state: {} })

    }

  }, [navigate, location.pathname, location.state?.listState])



  const lastErrorRef = useRef(null)

  useEffect(() => {

    if (listError && listError !== lastErrorRef.current) {

      lastErrorRef.current = listError

      toast.error(listError)

    }

    if (!listError) lastErrorRef.current = null

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



  const batchesById = useMemo(

    () => new Map(tableBatches.map((row) => [String(row.id), row])),

    [tableBatches],

  )



  const disableableCount = useMemo(

    () =>

      selectedIds.filter((id) => batchesById.get(String(id))?.status === 'Active').length,

    [selectedIds, batchesById],

  )



  const enableableCount = useMemo(

    () =>

      selectedIds.filter((id) => batchesById.get(String(id))?.status === 'Deactivated').length,

    [selectedIds, batchesById],

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



  const hasActiveFilters = Boolean(search.trim() || statusFilter !== 'all')



  const updateBatchStatus = useCallback(

    async (batch, nextStatus, { silent = false } = {}) => {

      const row = batch.apiRow ?? apiBatches.find((b) => b.id === batch.id)

      if (!row) return

      const mongoId = resolveBatchMongoId(row, apiBatches) || row.id

      await patchBatchStatus(mongoId, nextStatus)

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

      const editId = resolveBatchMongoId(id, apiBatches) || id

      await updateBatch(editId, form)

    } else if (isDuplicate && duplicateFromId) {

      const sourceId = resolveBatchMongoId(duplicateFromId, apiBatches) || duplicateFromId

      const created = await duplicateBatch(sourceId, form)

      const source = apiBatches.find(

        (b) => String(b.id) === String(duplicateFromId) || String(b.id) === String(sourceId),

      )

      const createdMongoId = resolveBatchMongoId(created, apiBatches) || created?.id

      logBatchActivity(createdMongoId, {

        type: BATCH_AUDIT_TYPES.DUPLICATED,

        message: source

          ? `Duplicated from ${source.batchName || source.name}`

          : 'Batch duplicated',

      })

      logBatchActivity(sourceId, {

        type: BATCH_AUDIT_TYPES.DUPLICATED,

        message: `Cloned as "${form.batchName}"`,

      })

    } else {

      const created = await createBatch(form)

      const createdMongoId = resolveBatchMongoId(created, apiBatches) || created?.id

      logBatchActivity(createdMongoId, {

        type: BATCH_AUDIT_TYPES.CREATED,

        message: `Batch "${form.batchName}" created`,

      })

    }



    try {

      await loadBatches({ silent: true })

    } catch (loadErr) {

      if (import.meta.env.DEV) {

        console.error('[batches] list refresh failed after save', loadErr)

      }

    }

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



  const handleStatusToggle = useCallback(

    async (batch) => {

      const isDisabled = DISABLED_STATUSES.has(batch.status)

      const nextStatus = isDisabled ? 'Active' : 'Deactivated'

      await handleStatusChange(batch, nextStatus)

    },

    [handleStatusChange],

  )



  const handleDuplicateBatch = useCallback(

    (tableBatch) => {

      const row = tableBatch.apiRow ?? apiBatches.find((b) => b.id === tableBatch.id)

      if (row) modal.openDuplicate(row)

    },

    [apiBatches, modal],

  )



  const handleDeleteRequest = useCallback((tableBatch) => {

    setDeleteTarget(tableBatch)

  }, [])



  const confirmDeleteBatch = useCallback(async () => {

    if (!deleteTarget) return

    const row = deleteTarget.apiRow ?? apiBatches.find((b) => b.id === deleteTarget.id)

    if (!row) return



    const mongoId = resolveBatchMongoId(row, apiBatches) || row.id

    setDeleteLoading(true)

    try {

      await deleteBatch(mongoId)

      logBatchActivity(row.id, {

        type: BATCH_AUDIT_TYPES.DELETED,

        message: `Batch "${deleteTarget.batchName || deleteTarget.batchLabel}" deleted`,

      })

      toast.success('Batch deleted successfully')

      setDeleteTarget(null)

      if (selectedIds.includes(String(row.id))) {

        clearSelection()

      }

      await loadBatches()

    } catch (err) {

      toast.error(getApiErrorMessage(err, 'Failed to delete batch'))

    } finally {

      setDeleteLoading(false)

    }

  }, [apiBatches, clearSelection, deleteTarget, loadBatches, logBatchActivity, selectedIds])



  const getBulkTargets = useCallback(

    (type) => {

      if (type === 'enable') {

        return selectedIds

          .map((id) => batchesById.get(String(id)))

          .filter((row) => row && row.status === 'Deactivated')

      }

      if (type === 'disable') {

        return selectedIds

          .map((id) => batchesById.get(String(id)))

          .filter((row) => row && row.status === 'Active')

      }

      return selectedIds.map((id) => batchesById.get(String(id))).filter(Boolean)

    },

    [batchesById, selectedIds],

  )



  const confirmBulkAction = useCallback(async () => {

    if (!bulkConfirm || !selectedIds.length) return

    const targets = getBulkTargets(bulkConfirm.type)

    if (!targets.length) {

      setBulkConfirm(null)

      return

    }



    setBulkActionLoading(true)

    try {

      if (bulkConfirm.type === 'delete') {

        for (const batch of targets) {

          const row = batch.apiRow ?? apiBatches.find((b) => b.id === batch.id)

          const mongoId = resolveBatchMongoId(row, apiBatches) || row?.id || batch.id

          await deleteBatch(mongoId)

          logBatchActivity(batch.id, {

            type: BATCH_AUDIT_TYPES.DELETED,

            message: `Batch "${batch.batchName || batch.batchLabel}" deleted`,

          })

        }

        toast.success(

          targets.length === 1 ? 'Batch deleted successfully' : `${targets.length} batches deleted`,

        )

      } else if (bulkConfirm.type === 'disable') {

        for (const batch of targets) {

          await updateBatchStatus(batch, 'Deactivated', { silent: true })

        }

        toast.success(

          targets.length === 1

            ? 'Batch disabled successfully'

            : `${targets.length} batches disabled`,

        )

      } else if (bulkConfirm.type === 'enable') {

        for (const batch of targets) {

          await updateBatchStatus(batch, 'Active', { silent: true })

        }

        toast.success(

          targets.length === 1 ? 'Batch enabled successfully' : `${targets.length} batches enabled`,

        )

      }

      clearSelection()

      setBulkConfirm(null)

      await loadBatches()

    } catch (err) {

      toast.error(getApiErrorMessage(err, 'Bulk action failed'))

      await loadBatches()

    } finally {

      setBulkActionLoading(false)

    }

  }, [

    apiBatches,

    bulkConfirm,

    clearSelection,

    getBulkTargets,

    loadBatches,

    logBatchActivity,

    selectedIds.length,

    updateBatchStatus,

  ])



  const [viewLoading, setViewLoading] = useState(false)



  const handleQuickView = useCallback(async (tableBatch) => {

    const row = tableBatch.apiRow ?? tableBatch

    const batchId = row?.id ?? tableBatch.id

    if (!batchId) return

    setViewItem(row)

    setViewLoading(true)

    try {

      const quickView = await fetchBatchQuickView(batchId, { rows: apiBatches })

      if (quickView) setViewItem({ ...quickView, id: quickView.id || row?.id || batchId })

    } catch (err) {

      if (!row?.batchName && !row?.name) {

        toast.error(getApiErrorMessage(err, 'Failed to load batch quick view'))

      }

    } finally {

      setViewLoading(false)

    }

  }, [apiBatches])



  const emptyMessage = hasActiveFilters

    ? 'No batches match your filters.'

    : 'No batches found.'



  const showEmptyCta =

    !loading && tableBatches.length === 0 && !hasActiveFilters



  return (

    <div className="figma-admin-section min-h-full bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">

      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">

        <PageBanner

          icon={BookMarked}

          iconClassName="text-[#dc2626]"

          title="Batch Manager"

          className="shrink-0 from-[#55ace7] via-[#8b98bb] to-[#b8887a]"

        >

          <div className="flex flex-wrap items-center justify-end gap-2">

            <BannerButton onClick={modal.openCreate}>Add Batch</BannerButton>

          </div>

        </PageBanner>



        <div className="shrink-0">

          <CourseFilterToolbar

            search={search}

            onSearchChange={(e) => {

              setSearch(e.target.value)

              setTablePage(1)

              clearSelection()

            }}

            searchPlaceholder="Search by batch ID, name, course, or mentor..."

            status={statusFilter}

            onStatusChange={(e) => {

              setStatusFilter(e.target.value)

              setTablePage(1)

              clearSelection()

            }}

            statusOptions={batchStatusFilterOptions()}

          />

        </div>



        <CurrentAffairsBulkActionsBar

          count={selectedIds.length}

          enableCount={enableableCount}

          disableCount={disableableCount}

          onClearSelection={clearSelection}

          onEnable={() => setBulkConfirm({ type: 'enable' })}

          onDisable={() => setBulkConfirm({ type: 'disable' })}

          onDelete={() => setBulkConfirm({ type: 'deactivate' })}

        />



        {showEmptyCta ? (

          <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-6 py-14 text-center shadow-sm">

            <p className="text-base font-semibold text-[#111111]">No batches found</p>

            <p className="mt-2 text-sm text-[#686868]">Create your first batch to get started.</p>

            <button

              type="button"

              onClick={modal.openCreate}

              className="mt-5 inline-flex h-10 items-center rounded-xl bg-[#246392] px-5 text-sm font-semibold text-white"

            >

              Add Batch

            </button>

          </div>

        ) : (

          <BatchManagementTable

            batches={tableBatches}

            listState={listState}

            page={tablePage}

            pageSize={tablePageSize}

            totalItems={meta.total || tableBatches.length}

            onPageChange={setTablePage}

            onPageSizeChange={(size) => {

              setTablePageSize(size)

              setTablePage(1)

              clearSelection()

            }}

            onEditBatch={handleEditBatch}

            onQuickViewBatch={handleQuickView}

            onDeleteBatch={handleDeleteRequest}

            resetDeps={[debouncedSearch, statusFilter]}

            onStatusToggle={handleStatusToggle}

            statusUpdatingIds={statusUpdatingIds}

            onDuplicate={handleDuplicateBatch}

            loading={loading || bulkActionLoading}

            emptyMessage={emptyMessage}

            selectedIds={selectedIds}

            onToggleSelect={selection.onToggle}

            onToggleSelectPage={selection.onTogglePage}

          />

        )}

      </section>



      <AddCourseModal

        open={modal.isOpen}

        onClose={modal.close}

        item={modal.selectedItem}

        duplicateSource={modal.duplicateSource}

        existingBatches={apiBatches}

        onSubmit={handleSaveBatch}

      />



      <ViewBatchModal

        open={Boolean(viewItem)}

        onClose={() => setViewItem(null)}

        item={viewItem}

        loading={viewLoading}

      />



      



      <BatchBulkConfirmDialog

        open={Boolean(bulkConfirm)}

        type={bulkConfirm?.type}

        loading={bulkActionLoading}

        onConfirm={confirmBulkAction}

        onCancel={() => {

          if (!bulkActionLoading) setBulkConfirm(null)

        }}

      />

    </div>

  )

}

