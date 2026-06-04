import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BookMarked, GitMerge, PlusCircle } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import AddCourseModal from '../../components/courses/AddCourseModal'
import BatchManagementTable from '../../components/batch-management/BatchManagementTable'
import BatchBulkActionsBar from '../../components/batch-management/BatchBulkActionsBar'
import ViewBatchModal from '../../components/courses/ViewBatchModal'
import MergeBatchesModal from '../../components/batch-management/MergeBatchesModal'
import MergeTwoBatchesModal from '../../components/batch-management/MergeTwoBatchesModal'
import BulkChangeStatusModal from '../../components/batch-management/BulkChangeStatusModal'
import BatchConfirmDialog from '../../components/batch-management/BatchConfirmDialog'
import { useBatchManagementContext } from '../../contexts/BatchManagementContext'
import { useEditModal } from '../../hooks/useEditModal'
import { useBatchesData } from '../../hooks/useBatchesData'
import { useBatchAudit } from '../../hooks/useBatchAudit'
import { mapCourseToApiPayload } from '../../utils/coursesApiMappers'
import { batchRowToForm } from '../../utils/batchFormMappers'
import {
  mapBatchRowToTableFormat,
  nextBatchId,
} from '../../utils/batchHelpers'
import { batchStatusFilterOptions } from '../../utils/batchOperations'
import { BATCH_AUDIT_TYPES } from '../../utils/batchAuditStorage'
import { createCourse, updateCourse, deleteCourse } from '../../api/coursesAPI'
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

function rowMatchesSearch(row, q) {
  if (!q) return true
  const courseName = row.linkedCourseName || row.program || 'Course'
  const batchLabel = row.batchName || row.name || 'Batch'
  const displayName = `${courseName} - ${batchLabel}`
  const trainerName = row.formData?.trainerName || row.trainerName || ''
  return (
    String(row.batchId || '').toLowerCase().includes(q) ||
    displayName.toLowerCase().includes(q) ||
    courseName.toLowerCase().includes(q) ||
    batchLabel.toLowerCase().includes(q) ||
    trainerName.toLowerCase().includes(q)
  )
}

export default function BatchesPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const restored = location.state?.listState

  const { sourceRows, loading, loadBatches, apiBatches, existingCourseIds } = useBatchesData()
  const { getStudentCount, resolveStudentKey, copyStudentsToBatch } = useBatchManagementContext()
  const { logBatchActivity } = useBatchAudit()

  const [search, setSearch] = useState(restored?.search ?? '')
  const [statusFilter, setStatusFilter] = useState(restored?.statusFilter ?? 'all')
  const [tablePage, setTablePage] = useState(restored?.page ?? 1)
  const [tablePageSize, setTablePageSize] = useState(restored?.pageSize ?? 10)
  const [selectedIds, setSelectedIds] = useState([])

  const modal = useEditModal()
  const [viewItem, setViewItem] = useState(null)
  const [optimisticStatus, setOptimisticStatus] = useState({})
  const [statusUpdatingIds, setStatusUpdatingIds] = useState(() => new Set())
  const [mergeOpen, setMergeOpen] = useState(false)
  const [mergeTwoOpen, setMergeTwoOpen] = useState(false)
  const [mergePreselected, setMergePreselected] = useState([])
  const [actionLoading, setActionLoading] = useState(false)

  const [archiveConfirm, setArchiveConfirm] = useState(null)
  const [deleteConfirm, setDeleteConfirm] = useState(null)
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)

  useEffect(() => {
    if (location.state?.listState) {
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [navigate, location.pathname, location.state?.listState])

  const filteredRows = useMemo(() => {
    const q = search.toLowerCase().trim()
    return sourceRows
      .map((row) => {
        const override = optimisticStatus[String(row.id)]
        return override != null ? { ...row, status: override } : row
      })
      .filter((row) => {
        const matchSearch = rowMatchesSearch(row, q)
        const matchStatus = statusFilter === 'all' || row.status === statusFilter
        return matchSearch && matchStatus
      })
  }, [sourceRows, search, statusFilter, optimisticStatus])

  const tableBatches = useMemo(
    () =>
      filteredRows.map((row) =>
        mapBatchRowToTableFormat(row, [], getStudentCount(row)),
      ),
    [filteredRows, getStudentCount],
  )

  const allTableBatches = useMemo(
    () =>
      sourceRows.map((row) =>
        mapBatchRowToTableFormat(row, [], getStudentCount(row)),
      ),
    [sourceRows, getStudentCount],
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
      const form = batchRowToForm(row)
      const payload = mapCourseToApiPayload({ ...form, status: nextStatus }, row)
      await updateCourse(row.id, payload)
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
    const existing = isEdit ? apiBatches.find((b) => b.id === id) : null
    const batchId =
      isEdit && existing?.batchId
        ? existing.batchId
        : form.batchId?.trim() || nextBatchId(apiBatches)
    const courseId = form.courseId || existing?.courseId
    if (!courseId) {
      toast.error('Please select a course')
      return
    }
    const payload = mapCourseToApiPayload(
      {
        ...form,
        batchId,
        courseId,
        academicCourseId: form.academicCourseId,
        courseName: form.courseName,
        status: form.status || 'Active',
      },
      existing,
    )

    if (isEdit && id != null) {
      await updateCourse(id, payload)
    } else {
      const created = await createCourse(payload)
      const newId = created?.id
      if (isDuplicate && duplicateFromId) {
        const source = apiBatches.find((b) => b.id === duplicateFromId)
        logBatchActivity(newId, {
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
        logBatchActivity(newId, {
          type: BATCH_AUDIT_TYPES.CREATED,
          message: `Batch "${form.batchName}" created`,
        })
      }
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

  const handleQuickView = useCallback((tableBatch) => {
    const row = tableBatch.apiRow ?? tableBatch
    setViewItem(row)
  }, [])

  const handleArchive = async (batch) => {
    setActionLoading(true)
    try {
      await updateBatchStatus(batch, 'Archived', { silent: true })
      logBatchActivity(batch.id, {
        type: BATCH_AUDIT_TYPES.ARCHIVED,
        message: 'Batch archived',
      })
      toast.success('Batch archived')
      setArchiveConfirm(null)
    } catch {
      toast.error('Failed to archive batch')
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const toDelete = deleteConfirm.bulk
      ? tableBatches.filter((b) => selectedIds.includes(String(b.id)))
      : [deleteConfirm]
    setActionLoading(true)
    try {
      for (const batch of toDelete) {
        await deleteCourse(batch.id)
        logBatchActivity(batch.id, {
          type: BATCH_AUDIT_TYPES.DELETED,
          message: 'Batch deleted',
        })
      }
      toast.success(
        toDelete.length > 1
          ? `${toDelete.length} batches deleted`
          : 'Batch deleted',
      )
      setSelectedIds([])
      setDeleteConfirm(null)
      await loadBatches()
    } catch {
      toast.error('Failed to delete batch')
    } finally {
      setActionLoading(false)
    }
  }

  const handleMergeSubmit = async ({ sourceIds, targetId, mergeFlags, conflictMode }) => {
    const targetRow = apiBatches.find((b) => String(b.id) === String(targetId))
    const targetTable = allTableBatches.find((b) => String(b.id) === String(targetId))
    if (!targetRow || !targetTable) return

    setActionLoading(true)
    try {
      const targetKey = resolveStudentKey(targetRow)
      for (const sid of sourceIds) {
        const sourceRow = apiBatches.find((b) => String(b.id) === String(sid))
        if (!sourceRow) continue
        if (mergeFlags.students) {
          const sourceKey = resolveStudentKey(sourceRow)
          copyStudentsToBatch(sourceKey, targetKey, { conflictMode })
        }
        const form = batchRowToForm(sourceRow)
        await updateCourse(sourceRow.id, {
          ...mapCourseToApiPayload({ ...form, status: 'Archived' }, sourceRow),
          mergedInto: targetId,
          mergedIntoName: targetTable.displayName,
          formData: {
            ...form,
            mergedInto: targetId,
            mergedIntoName: targetTable.displayName,
          },
        })
        logBatchActivity(sourceRow.id, {
          type: BATCH_AUDIT_TYPES.MERGED,
          message: `Merged into ${targetTable.displayName}`,
        })
      }
      logBatchActivity(targetId, {
        type: BATCH_AUDIT_TYPES.MERGED,
        message: `Received merge from ${sourceIds.length} batch(es)`,
      })
      toast.success('Batches merged successfully — they now operate as a single batch')
      setMergeOpen(false)
      setMergeTwoOpen(false)
      setSelectedIds([])
      await loadBatches()
    } catch {
      toast.error('Failed to merge batches')
    } finally {
      setActionLoading(false)
    }
  }

  const handleMergeTwoBatches = async ({ targetId, sourceId }) => {
    await handleMergeSubmit({
      sourceIds: [sourceId],
      targetId,
      mergeFlags: {
        students: true,
        attendance: true,
        fees: true,
        tests: true,
        assignments: true,
        notes: true,
      },
      conflictMode: 'skip',
    })
    setMergeTwoOpen(false)
  }

  const handleBulkStatus = async (bulkStatusValue) => {
    const batches = tableBatches.filter((b) => selectedIds.includes(String(b.id)))
    setActionLoading(true)
    try {
      for (const batch of batches) {
        await updateBatchStatus(batch, bulkStatusValue, { silent: true })
      }
      toast.success(`Status updated for ${batches.length} batch(es)`)
      setBulkStatusOpen(false)
      setSelectedIds([])
    } catch {
      toast.error('Bulk status update failed')
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkArchive = async () => {
    const batches = tableBatches.filter((b) => selectedIds.includes(String(b.id)))
    setActionLoading(true)
    try {
      for (const batch of batches) {
        await updateBatchStatus(batch, 'Archived', { silent: true })
        logBatchActivity(batch.id, {
          type: BATCH_AUDIT_TYPES.ARCHIVED,
          message: 'Batch archived (bulk)',
        })
      }
      toast.success(`${batches.length} batch(es) archived`)
      setArchiveConfirm(null)
      setSelectedIds([])
      await loadBatches()
    } catch {
      toast.error('Bulk archive failed')
    } finally {
      setActionLoading(false)
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const toggleSelectAll = (pageIds, selectAll) => {
    setSelectedIds((prev) => {
      if (!selectAll) return prev.filter((id) => !pageIds.includes(id))
      const merged = new Set([...prev, ...pageIds])
      return Array.from(merged)
    })
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
            <BannerButton
              variant="secondary"
              icon={GitMerge}
              onClick={() => setMergeTwoOpen(true)}
            >
              Merge Batches
            </BannerButton>
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

        <BatchBulkActionsBar
          selectedCount={selectedIds.length}
          onClearSelection={() => setSelectedIds([])}
          onChangeStatus={() => setBulkStatusOpen(true)}
          onArchive={() => setArchiveConfirm({ bulk: true, count: selectedIds.length })}
          onDelete={() => setDeleteConfirm({ bulk: true, count: selectedIds.length })}
          onMerge={() => {
            setMergePreselected([...selectedIds])
            setMergeOpen(true)
          }}
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
            onPageChange={setTablePage}
            onPageSizeChange={(size) => {
              setTablePageSize(size)
              setTablePage(1)
            }}
            onEditBatch={handleEditBatch}
            onQuickViewBatch={handleQuickView}
            resetDeps={[search, statusFilter]}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelect}
            onToggleSelectAll={toggleSelectAll}
            onStatusChange={handleStatusChange}
            statusUpdatingIds={statusUpdatingIds}
            onDuplicate={handleDuplicateBatch}
            onDelete={(b) => setDeleteConfirm(b)}
            onMerge={(b) => {
              setMergePreselected([String(b.id)])
              setMergeOpen(true)
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
        existingCourseIds={existingCourseIds}
      />

      <ViewBatchModal
        open={Boolean(viewItem)}
        onClose={() => setViewItem(null)}
        item={viewItem}
      />

      <MergeTwoBatchesModal
        open={mergeTwoOpen}
        onClose={() => setMergeTwoOpen(false)}
        batches={allTableBatches}
        onSubmit={handleMergeTwoBatches}
        saving={actionLoading}
      />

      <MergeBatchesModal
        open={mergeOpen}
        onClose={() => setMergeOpen(false)}
        allBatches={allTableBatches}
        preselectedSourceIds={mergePreselected}
        onSubmit={handleMergeSubmit}
        saving={actionLoading}
      />

      <BatchConfirmDialog
        open={Boolean(archiveConfirm)}
        title={archiveConfirm?.bulk ? 'Archive selected batches?' : 'Archive batch?'}
        message={
          archiveConfirm?.bulk
            ? `Archive ${archiveConfirm.count} selected batch(es)? They remain viewable under Archived status.`
            : archiveConfirm
              ? `Archive "${archiveConfirm.displayName}"? You can still view it when filtered by Archived status.`
              : ''
        }
        confirmLabel="Archive"
        variant="warning"
        loading={actionLoading}
        loadingLabel="Archiving…"
        onClose={() => setArchiveConfirm(null)}
        onConfirm={() =>
          archiveConfirm?.bulk
            ? handleBulkArchive()
            : archiveConfirm && handleArchive(archiveConfirm)
        }
      />

      <BulkChangeStatusModal
        open={bulkStatusOpen}
        onClose={() => setBulkStatusOpen(false)}
        count={selectedIds.length}
        onSubmit={handleBulkStatus}
        saving={actionLoading}
      />

      <BatchConfirmDialog
        open={Boolean(deleteConfirm)}
        title={deleteConfirm?.bulk ? 'Delete selected batches?' : 'Delete batch?'}
        message={
          deleteConfirm?.bulk
            ? `Permanently delete ${deleteConfirm.count} selected batch(es)? This cannot be undone.`
            : deleteConfirm
              ? `Permanently delete "${deleteConfirm.displayName}"? This cannot be undone.`
              : ''
        }
        confirmLabel="Delete"
        variant="danger"
        loading={actionLoading}
        loadingLabel="Deleting…"
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
      />

    </div>
  )
}
