import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LayoutGrid, Loader2, PlusCircle } from 'lucide-react'
import CategoryPageHeader from '../../../components/categories/CategoryPageHeader'
import ProgramsFilterBar from '../../../components/categories/ProgramsFilterBar'
import ProgramsTable from '../../../components/categories/ProgramsTable'
import CategoryStatusBadge from '../../../components/categories/CategoryStatusBadge'
import CategoryTableActions from '../../../components/categories/CategoryTableActions'
import CategoryEmptyState from '../../../components/categories/CategoryEmptyState'
import ProgramFormModal from '../../../components/categories/ProgramFormModal'
import ViewProgramModal from '../../../components/categories/ViewProgramModal'
import ConfirmDeleteDialog from '../../../components/subjects/ConfirmDeleteDialog'
import ConfirmProgramStatusModal from '../../../components/categories/ConfirmProgramStatusModal'
import { useCenters } from '../../../contexts/CentersContext'
import { useEditModal } from '../../../hooks/useEditModal'
import { useProgramManagement } from '../../../hooks/useProgramManagement'
import { useCentersDropdownOptions } from '../../../hooks/useCentersDropdownOptions'
import { toast } from '../../../utils/toast'
import { getApiErrorMessage } from '../../../utils/apiError'
import {
  buildProgramApiPayload,
  formatCentreNamesLabel,
  mapApiProgramToLocal,
  mapUiStatusToApi,
} from '../../../utils/programHelpers'
import { formatCategoryDateTime } from '../../../utils/formatDateTime'
import {
  createProgram,
  deleteProgram,
  getProgramById,
  updateProgram,
  updateProgramStatus,
} from '../../../services/programService'

const PROGRAMS_PATH = '/academics/categories/programs'

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
  return (
    <div className="space-y-3 rounded-2xl bg-[#f0f2f5]/60 p-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-16 animate-pulse rounded-xl bg-white/90" />
      ))}
    </div>
  )
}

export default function ProgramsPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { activeCenters } = useCenters()
  const modal = useEditModal()
  const { options: centerDropdownOptions, loading: centresDropdownLoading } =
    useCentersDropdownOptions()

  const {
    programs,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    centreFilter,
    setCentreFilter,
    debouncedSearch,
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

  const centreRows = useMemo(
    () =>
      centerDropdownOptions.map((opt) => ({
        centerId: opt.value,
        centerName: opt.label,
      })),
    [centerDropdownOptions],
  )

  const centreFilterOptions = useMemo(
    () => [{ value: 'all', label: 'Centre Wise' }, ...centerDropdownOptions],
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

  const resetToProgramsList = useCallback(() => {
    modal.close()
    setViewProgram(null)
    setEditProgram(null)
    if (location.pathname !== PROGRAMS_PATH) {
      navigate(PROGRAMS_PATH, { replace: true })
    }
  }, [location.pathname, modal, navigate])

  const closeFormModal = useCallback(() => {
    resetToProgramsList()
  }, [resetToProgramsList])

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
      } finally {
        setViewLoading(false)
      }
    },
    [loadProgramDetail],
  )

  const openEdit = useCallback(
    async (row) => {
      navigate(`${PROGRAMS_PATH}/edit/${row.id}`)
      modal.openEdit(row)
      setEditProgram(row)
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
        modal.close()
        setEditProgram(null)
      } finally {
        setEditLoading(false)
      }
    },
    [loadProgramDetail, modal, navigate],
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
    setDeleteTarget(row)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    const programId = deleteTarget.id
    try {
      await deleteProgram(programId)
      removeProgramLocally(programId)
      setDeleteTarget(null)
      toast.success('Program deleted')
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

  const openCreate = () => {
    setEditProgram(null)
    modal.openCreate()
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setCentreFilter('all')
  }

  const filters = useMemo(
    () => ({ search: debouncedSearch, status: statusFilter, centre: centreFilter }),
    [debouncedSearch, statusFilter, centreFilter],
  )

  const columns = [
    {
      key: 'programId',
      label: 'Program ID',
      headerClassName: 'min-w-[7rem]',
      cellClassName: 'whitespace-nowrap',
      render: (row) => (
        <span className="font-mono text-sm font-semibold text-[#111]">
          {row.programId || row.id}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Program Name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#cbeeff] text-xs font-bold text-[#246392]">
            {(row.name || 'PR').slice(0, 2).toUpperCase()}
          </div>
          <span className="font-semibold text-[#111]">{row.name}</span>
        </div>
      ),
    },
    {
      key: 'centre',
      label: 'Centre Name',
      cellClassName: 'max-w-[220px]',
      render: (row) => (
        <span className="text-sm font-medium capitalize text-[#444]" title={row.centreLabel}>
          {row.centreLabel}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created On',
      render: (row) => (
        <span className="whitespace-nowrap text-sm text-[#444]">
          {row.createdAt ? formatCategoryDateTime(row.createdAt) : '—'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      align: 'center',
      headerClassName: 'min-w-[6rem]',
      render: (row) => <CategoryStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      align: 'right',
      headerClassName: 'min-w-[11rem] pr-5 sm:pr-6',
      cellClassName: 'pr-5 sm:pr-6',
      render: (row) => (
        <CategoryTableActions
          variant="icons"
          status={row.status}
          onView={() => openView(row)}
          onEdit={() => openEdit(row)}
          onDelete={() => handleDelete(row)}
          onToggleStatus={() => handleToggleRequest(row)}
        />
      ),
    },
  ]

  const hasActiveFilters =
    Boolean(search.trim()) || statusFilter !== 'all' || centreFilter !== 'all'
  const showEmpty = !loading && programs.length === 0 && !hasActiveFilters
  const showNoMatches = !loading && programs.length === 0 && hasActiveFilters

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
        <CategoryPageHeader icon={LayoutGrid} hideTitle>
          <CreateButton onClick={openCreate} />
        </CategoryPageHeader>

        <ProgramsFilterBar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          centre={centreFilter}
          onCentreChange={(e) => setCentreFilter(e.target.value)}
          centreOptions={centreFilterOptions}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
        />

        {loading && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-100/80 bg-white/70 px-4 py-2.5 text-sm text-[#686868]">
            <Loader2 className="h-4 w-4 animate-spin text-[#246392]" />
            Loading programs…
          </div>
        )}

        {loading ? (
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
            title="No matching programs"
            description="Try adjusting search or centre filter."
            ctaLabel="Clear filters"
            onCta={clearFilters}
          />
        ) : (
          <ProgramsTable
            columns={columns}
            data={enrichedPrograms}
            loading={loading}
            resetDeps={[filters]}
            emptyMessage="No programs match your filters."
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
          onClose={() => {
            setViewProgram(null)
            resetToProgramsList()
          }}
          program={viewProgram}
          loading={viewLoading}
          centresCatalog={centreRows}
        />

        <ConfirmDeleteDialog
          open={Boolean(deleteTarget)}
          title="Delete program?"
          message={
            deleteTarget
              ? `Are you sure you want to delete "${deleteTarget.name}"? This action cannot be undone.`
              : 'Are you sure you want to delete this program?'
          }
          confirmLabel={deleteLoading ? 'Deleting…' : 'Confirm Delete'}
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
      </motion.div>
    </AnimatePresence>
  )
}
