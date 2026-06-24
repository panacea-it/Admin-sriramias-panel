import { useCallback, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../components/categories/CategoryPageHeader'
import ProgramsFilterBar from '../../../components/categories/ProgramsFilterBar'
import ProgramsTable from '../../../components/categories/ProgramsTable'
import ProgramsBulkActionsBar from '../../../components/categories/ProgramsBulkActionsBar'
import CategoryStatusBadge from '../../../components/categories/CategoryStatusBadge'
import ExamCategoryTableActions from '../../../components/categories/ExamCategoryTableActions'
import CategoryEmptyState from '../../../components/categories/CategoryEmptyState'
import CategoryTableLoadingShell from '../../../components/categories/CategoryTableLoadingShell'
import ConfirmDeleteDialog from '../../../components/subjects/ConfirmDeleteDialog'
import ProgramFormModal from '../../../components/categories/ProgramFormModal'
import ViewProgramModal from '../../../components/categories/ViewProgramModal'
import ConfirmProgramStatusModal from '../../../components/categories/ConfirmProgramStatusModal'
import MasterBulkConfirmModal from '../../../components/categories/MasterBulkConfirmModal'
import { useCenters } from '../../../contexts/CentersContext'
import { useEditModal } from '../../../hooks/useEditModal'
import { useProgramManagement } from '../../../hooks/useProgramManagement'
import { useCentersDropdownOptions } from '../../../hooks/useCentersDropdownOptions'
import { toast, TOAST_DURATION } from '../../../utils/toast'
import {
  bulkUpdateMasterStatus,
  getMasterBulkErrorMessage,
} from '../../../services/masterBulkStatusService'
import {
  MASTER_BULK_TOAST,
  countDisableableSelected,
  countEnableableSelected,
  filterDisableableIds,
  filterEnableableIds,
} from '../../../utils/masterBulkActions'
import { getApiErrorMessage } from '../../../utils/apiError'
import {
  buildProgramApiPayload,
  formatCentreNamesLabel,
  mapApiProgramToLocal,
  mapUiStatusToApi,
} from '../../../utils/programHelpers'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import ErrorState from '../../../components/feedback/ErrorState'
import {
  CATEGORY_COL,
} from '../../../utils/categoryUiStandards'
import {
  createProgram,
  deleteProgram,
  getProgramById,
  updateProgram,
  updateProgramStatus,
} from '../../../services/programService'

function CreateButton({ onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
    >
      <PlusCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      Add Program
    </button>
  )
}

function ProgramsTableSkeleton() {
  return <CategoryTableLoadingShell />
}

const PROGRAM_STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Status' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Deactivated' },
]

function statusFilterToSelectValue(statusFilter) {
  if (statusFilter === 'Active') return 'ACTIVE'
  if (statusFilter === 'In Active') return 'INACTIVE'
  return 'all'
}

function selectValueToStatusFilter(value) {
  if (value === 'ACTIVE') return 'Active'
  if (value === 'INACTIVE') return 'In Active'
  return 'all'
}

export default function ProgramsPage() {
  const { activeCenters } = useCenters()
  const modal = useEditModal()
  const { options: centerDropdownOptions, loading: centresDropdownLoading } =
    useCentersDropdownOptions()

  const {
    programs,
    totalPrograms,
    loading,
    listError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centreFilter,
    setCentreFilter,
    debouncedSearch,
    controlledPagination,
    refreshPrograms,
    patchProgramLocally,
    removeProgramLocally,
  } = useProgramManagement()

  const [viewProgram, setViewProgram] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [editProgram, setEditProgram] = useState(null)
  const [editLoading, setEditLoading] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const centreRows = useMemo(
    () =>
      centerDropdownOptions.map((opt) => ({
        centerId: opt.value,
        centerName: opt.label,
      })),
    [centerDropdownOptions],
  )

  const centreFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'Centre Wise' },
      ...centerDropdownOptions.map((opt) => ({
        value: opt.value,
        label: opt.label,
      })),
    ],
    [centerDropdownOptions],
  )

  const enrichedPrograms = useMemo(
    () =>
      programs.map((row) => ({
        ...row,
        centreLabel: formatCentreNamesLabel(
          activeCenters,
          row.centerIds,
          row.centreNames,
        ),
      })),
    [programs, activeCenters],
  )

  const programsById = useMemo(
    () => new Map(enrichedPrograms.map((row) => [String(row.id), row])),
    [enrichedPrograms],
  )

  const disableableCount = useMemo(
    () => countDisableableSelected(selectedIds, programsById),
    [selectedIds, programsById],
  )

  const enableableCount = useMemo(
    () => countEnableableSelected(selectedIds, programsById),
    [selectedIds, programsById],
  )

  const closeFormModal = useCallback(() => {
    modal.close()
    setEditProgram(null)
  }, [modal])

  const loadProgramDetail = useCallback(async (programId) => {
    const data = await getProgramById(programId)
    return mapApiProgramToLocal(data)
  }, [])

  const openView = useCallback(
    async (row) => {
      setViewProgram(row)
      setViewLoading(true)
      try {
        const detail = await loadProgramDetail(row.id)
        if (detail) setViewProgram(detail)
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(error)
        }
        toast.error(getApiErrorMessage(error, 'Failed to load program details'))
        setViewProgram(null)
      } finally {
        setViewLoading(false)
      }
    },
    [loadProgramDetail],
  )

  const openEdit = useCallback(
    async (row) => {
      setEditProgram(row)
      modal.openEdit(row)
      setEditLoading(true)
      try {
        const detail = await loadProgramDetail(row.id)
        if (detail) {
          setEditProgram(detail)
          modal.openEdit(detail)
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(error)
        }
        toast.error(getApiErrorMessage(error, 'Failed to load program for editing'))
        closeFormModal()
      } finally {
        setEditLoading(false)
      }
    },
    [closeFormModal, loadProgramDetail, modal],
  )

  const handleSave = async (form, { isEdit, id: editId }) => {
    const payload = buildProgramApiPayload(form)
    setFormSubmitting(true)
    try {
      if (isEdit) {
        await updateProgram(editId, payload)
        toast.success('Program updated')
      } else {
        await createProgram(payload)
        toast.success('Program created')
      }
      closeFormModal()
      await refreshPrograms()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, isEdit ? 'Failed to update program' : 'Failed to create program'))
      throw error
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleDelete = (row) => {
    setDeleteTarget({ ids: [row.id], name: row.name })
  }

  const confirmDelete = async () => {
    if (!deleteTarget?.ids?.length) return
    setDeleteLoading(true)
    const ids = deleteTarget.ids
    try {
      await Promise.all(ids.map((id) => deleteProgram(id)))
      ids.forEach((id) => removeProgramLocally(id))
      setSelectedIds((prev) => prev.filter((id) => !ids.includes(id)))
      setDeleteTarget(null)
      toast.success(ids.length > 1 ? `${ids.length} programs deleted` : 'Program deleted')
      await refreshPrograms()
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(getApiErrorMessage(error, 'Failed to delete program'))
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleToggleRequest = (row) => {
    setStatusTarget(row)
  }

  const confirmStatusChange = async () => {
    if (!statusTarget) return
    const enabling = statusTarget.status !== 'Active'
    const nextUiStatus = enabling ? 'Active' : 'In Active'
    const apiStatus = mapUiStatusToApi(nextUiStatus)
    const programId = statusTarget.id

    setStatusLoading(true)
    patchProgramLocally(programId, { status: nextUiStatus })

    try {
      await updateProgramStatus(programId, apiStatus)
      toast.success(enabling ? 'Program enabled' : 'Program disabled')
      setStatusTarget(null)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      patchProgramLocally(programId, { status: statusTarget.status })
      toast.error(getApiErrorMessage(error, 'Failed to update program status'))
    } finally {
      setStatusLoading(false)
    }
  }

  const handleBulkEnableRequest = () => {
    if (!enableableCount) return
    setBulkConfirm({ type: 'enable' })
  }

  const handleBulkDisableRequest = () => {
    if (!disableableCount) return
    setBulkConfirm({ type: 'disable' })
  }

  const handleBulkDeleteRequest = () => {
    if (!selectedIds.length) return
    setBulkConfirm({ type: 'deactivate' })
  }

  const confirmBulkAction = async () => {
    if (!bulkConfirm) return
    setBulkActionLoading(true)

    try {
      if (bulkConfirm.type === 'enable') {
        const ids = filterEnableableIds(selectedIds, programsById)
        const apiStatus = mapUiStatusToApi('Active')
        await bulkUpdateMasterStatus('programs', ids, apiStatus, {
          updateSingle: updateProgramStatus,
        })
        ids.forEach((id) => patchProgramLocally(id, { status: 'Active' }))
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.enabled, { duration: TOAST_DURATION.short })
      } else if (bulkConfirm.type === 'disable') {
        const ids = filterDisableableIds(selectedIds, programsById)
        const apiStatus = mapUiStatusToApi('In Active')
        await bulkUpdateMasterStatus('programs', ids, apiStatus, {
          updateSingle: updateProgramStatus,
        })
        ids.forEach((id) => patchProgramLocally(id, { status: 'In Active' }))
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.disabled, { duration: TOAST_DURATION.short })
      } else if (bulkConfirm.type === 'delete') {
        const ids = [...selectedIds]
        await Promise.all(ids.map((id) => deleteProgram(id)))
        ids.forEach((id) => removeProgramLocally(id))
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.deleted, { duration: TOAST_DURATION.short })
        await refreshPrograms()
      }
      setBulkConfirm(null)
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error(error)
      }
      toast.error(
        bulkConfirm.type === 'delete'
          ? getApiErrorMessage(error, 'Unable to delete selected records. Please try again.')
          : getMasterBulkErrorMessage(error, bulkConfirm.type),
      )
      if (bulkConfirm.type !== 'delete') {
        await refreshPrograms()
      }
    } finally {
      setBulkActionLoading(false)
    }
  }

  const openCreate = () => {
    setEditProgram(null)
    modal.openCreate()
  }

  const toggleSelect = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }, [])

  const toggleSelectPage = useCallback((pageIds, select) => {
    setSelectedIds((prev) => {
      if (!select) return prev.filter((id) => !pageIds.includes(id))
      const merged = new Set([...prev, ...pageIds])
      return [...merged]
    })
  }, [])

  const filters = useMemo(
    () => ({ search: debouncedSearch, status: statusFilter, centre: centreFilter }),
    [debouncedSearch, statusFilter, centreFilter],
  )

  const columns = [
    {
      key: 'programId',
      label: 'Program ID',
      headerClassName: CATEGORY_COL.idHeader,
      cellClassName: CATEGORY_COL.idCell,
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-[#111]">
          {row.programId || row.id}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Program Name',
      headerClassName: CATEGORY_COL.nameHeader,
      cellClassName: CATEGORY_COL.nameCell,
      render: (row) => (
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#cbeeff] text-xs font-bold text-[#246392]">
            {(row.name || 'PR').slice(0, 2).toUpperCase()}
          </div>
          <span className="truncate font-semibold text-[#111]">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'centre',
      label: 'Centre Name',
      headerClassName: CATEGORY_COL.textHeader,
      cellClassName: CATEGORY_COL.textCell,
      render: (row) => (
        <span
          className="block truncate text-sm font-medium text-[#1a3a5c] capitalize"
          title={row.centreLabel}
        >
          {row.centreLabel || '—'}
        </span>
      ),
    },
    {
      key: 'linkedCourses',
      label: 'Linked Courses',
      headerClassName: CATEGORY_COL.textHeader,
      cellClassName: CATEGORY_COL.textCell,
      render: (row) => (
        <span className="text-sm font-medium text-[#686868]">
          {row.linkedCount ?? 0}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created On',
      headerClassName: CATEGORY_COL.dateHeader,
      cellClassName: CATEGORY_COL.dateCell,
      render: (row) => (
        <span className="text-sm font-medium text-[#686868]">
          {row.createdAt ? formatCategoryDateTime(row.createdAt) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      headerClassName: CATEGORY_COL.statusHeader,
      cellClassName: CATEGORY_COL.statusCell,
      render: (row) => <CategoryStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      headerClassName: CATEGORY_COL.actionsHeader,
      cellClassName: CATEGORY_COL.actionsCell,
      render: (row) => (
        <ExamCategoryTableActions
          row={row}
          onView={() => openView(row)}
          onEdit={() => openEdit(row)}
          onDelete={() => handleDelete(row)}
          onStatusToggle={() => handleToggleRequest(row)}
        />
      ),
    },
  ]

  const hasActiveFilters =
    Boolean(search.trim()) || statusFilter !== 'all' || centreFilter !== 'all'
  const showEmpty = !loading && !listError && totalPrograms === 0 && !hasActiveFilters
  const showNoMatches = !loading && !listError && programs.length === 0 && !showEmpty

  const deleteMessage =
    deleteTarget?.ids?.length > 1
      ? `Delete ${deleteTarget.ids.length} selected programs? This cannot be undone.`
      : `Are you sure you want to delete "${deleteTarget?.name || 'this program'}"? This action cannot be undone.`

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="programs"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="space-y-5 sm:space-y-6"
      >
        <CategoryPageHeader title="Programs">
          <CreateButton onClick={openCreate} />
        </CategoryPageHeader>

        <ProgramsFilterBar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          centre={centreFilter}
          onCentreChange={(e) => setCentreFilter(e.target.value)}
          centreOptions={centreFilterOptions}
          status={statusFilterToSelectValue(statusFilter)}
          onStatusChange={(e) => setStatusFilter(selectValueToStatusFilter(e.target.value))}
          statusOptions={PROGRAM_STATUS_FILTER_OPTIONS}
        />

        <ProgramsBulkActionsBar
          count={selectedIds.length}
          enableCount={enableableCount}
          disableCount={disableableCount}
          onClearSelection={() => setSelectedIds([])}
          onEnable={handleBulkEnableRequest}
          onDisable={handleBulkDisableRequest}
        />

        {loading && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-100/80 bg-white/70 px-4 py-2.5 text-sm text-[#686868]">
            <Loader2 className="h-4 w-4 animate-spin text-[#246392]" />
            Loading programs…
          </div>
        )}

        {listError && !loading ? (
          <ErrorState
            title="Unable to load programs"
            message={listError}
            onRetry={refreshPrograms}
          />
        ) : loading ? (
          <ProgramsTableSkeleton />
        ) : showEmpty ? (
          <CategoryEmptyState
            title="No Programs Found"
            description="Create your first academic program and link courses."
            ctaLabel="Add Program"
            onCta={openCreate}
          />
        ) : showNoMatches ? (
          <CategoryEmptyState
            title="No matching records"
            description="Try adjusting your search or filters."
            ctaLabel="Clear filters"
            onCta={() => {
              setSearch('')
              setStatusFilter('all')
              setCentreFilter('all')
            }}
          />
        ) : (
          <ProgramsTable
            columns={columns}
            data={enrichedPrograms}
            loading={loading || bulkActionLoading}
            controlledPagination={controlledPagination}
            itemLabel="programs"
            resetDeps={[filters]}
            emptyMessage="No programs match your filters."
            selection={{
              selectedIds,
              onToggle: toggleSelect,
              onTogglePage: toggleSelectPage,
            }}
          />
        )}

        <ProgramFormModal
          open={modal.isOpen}
          onClose={closeFormModal}
          program={editProgram || modal.selectedItem}
          onSubmit={handleSave}
          centres={centreRows}
          loadingCentres={centresDropdownLoading}
          detailLoading={editLoading}
          submitting={formSubmitting}
        />

        <ViewProgramModal
          open={Boolean(viewProgram)}
          onClose={() => setViewProgram(null)}
          program={viewProgram}
          loading={viewLoading}
          centresCatalog={centreRows}
        />

        <ConfirmDeleteDialog
          open={Boolean(deleteTarget)}
          title="Delete program?"
          message={deleteMessage}
          loading={deleteLoading}
          onCancel={() => !deleteLoading && setDeleteTarget(null)}
          onConfirm={confirmDelete}
        />

        <ConfirmProgramStatusModal
          open={Boolean(statusTarget)}
          programName={statusTarget?.name || 'this program'}
          enabling={statusTarget?.status !== 'Active'}
          loading={statusLoading}
          onCancel={() => !statusLoading && setStatusTarget(null)}
          onConfirm={confirmStatusChange}
        />

        <MasterBulkConfirmModal
          open={Boolean(bulkConfirm)}
          type={bulkConfirm?.type}
          loading={bulkActionLoading}
          onConfirm={confirmBulkAction}
          onCancel={() => !bulkActionLoading && setBulkConfirm(null)}
        />
      </motion.div>
    </AnimatePresence>
  )
}
