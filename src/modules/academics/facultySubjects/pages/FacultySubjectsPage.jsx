import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers, PlusCircle, RefreshCw } from 'lucide-react'
import PageBanner from '../../../../components/figma/PageBanner'
import SubjectListingToolbar from '../../../../components/subjects/SubjectListingToolbar'
import SubjectTable from '../../../../components/subjects/SubjectTable'
import SubjectModal from '../../../../components/subjects/SubjectModal'
import ViewFacultySubjectModal from '../../../../components/subjects/ViewFacultySubjectModal'
import SubjectEmptyState from '../../../../components/subjects/SubjectEmptyState'
import SubjectBulkConfirmDialog from '../../../../components/subjects/SubjectBulkConfirmDialog'
import ConfirmDeleteDialog from '../../../../components/subjects/ConfirmDeleteDialog'
import CurrentAffairsBulkActionsBar from '../../../../components/current-affairs/CurrentAffairsBulkActionsBar'
import ErrorState from '../../../../components/feedback/ErrorState'
import PermissionGate from '../../../../components/common/PermissionGate'
import { usePermissions } from '../../../../hooks/usePermissions'
import { useAuth } from '../../../../contexts/AuthContext'
import { toast, TOAST_DURATION } from '../../../../utils/toast'
import { getApiErrorMessage } from '../../../../utils/apiError'
import { parseApiError } from '../../../../utils/errorHandler'
import { mapUiStatusToApi } from '../../../../utils/programHelpers'
import {
  buildFacultySubjectApiPayload,
} from '../../../../utils/facultySubjectHelpers'
import { facultySubjectLabels } from '../../../../data/facultySubjectLabels'
import { MASTER_BULK_TOAST } from '../../../../utils/masterBulkActions'
import { FACULTY_SUBJECT_CATEGORIES, FACULTY_SUBJECT_ROUTES } from '../constants/facultySubject.constants'
import { useFacultySubjectManagement } from '../hooks/useFacultySubjectManagement'
import { useFacultySubject } from '../hooks/useFacultySubject'
import { useCreateFacultySubject } from '../hooks/useCreateFacultySubject'
import { useUpdateFacultySubject } from '../hooks/useUpdateFacultySubject'
import { useDeleteFacultySubject } from '../hooks/useDeleteFacultySubject'
import { useToggleFacultySubjectStatus } from '../hooks/useToggleFacultySubjectStatus'

function nextRowStatus(status) {
  return status === 'Active' ? 'In Active' : 'Active'
}

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

function RefreshButton({ onClick, disabled, fetching }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#1a3a5c] shadow-sm transition hover:bg-slate-50 disabled:opacity-60"
    >
      <RefreshCw className={`h-4 w-4 ${fetching ? 'animate-spin' : ''}`} />
      {fetching ? 'Refreshing…' : 'Refresh'}
    </button>
  )
}

export default function FacultySubjectsPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const { isSuperAdmin } = usePermissions()
  const canMutate = isSuperAdmin

  const {
    subjects,
    rawSubjects,
    loading,
    isFetching,
    listError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    teacherFilter,
    setTeacherFilter,
    sortBy,
    sortOrder,
    handleSort,
    controlledPagination,
    refreshSubjects,
    hasActiveFilters,
    resetFilters,
    totalItems,
  } = useFacultySubjectManagement()

  const createMutation = useCreateFacultySubject()
  const updateMutation = useUpdateFacultySubject()
  const deleteMutation = useDeleteFacultySubject()
  const toggleStatusMutation = useToggleFacultySubjectStatus()

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [activeSubject, setActiveSubject] = useState(null)
  const [editId, setEditId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [statusChangingId, setStatusChangingId] = useState(null)
  const [viewId, setViewId] = useState(null)

  const { data: viewQuery, isLoading: viewLoading, isError: viewIsError, error: viewFetchError } = useFacultySubject(viewId, {
    enabled: Boolean(viewId),
  })
  const viewItem = useMemo(() => {
    if (!viewId) return null
    if (viewQuery) return viewQuery
    const fromList = rawSubjects.find((row) => String(row.id) === String(viewId))
    return fromList || null
  }, [viewId, viewQuery, rawSubjects])

  const { data: editQuery, isLoading: editDetailLoading } = useFacultySubject(editId, {
    enabled: Boolean(editId) && modalOpen && modalMode === 'edit',
  })
  const editDetail = useMemo(() => {
    if (!editId) return activeSubject
    return editQuery || activeSubject
  }, [editId, editQuery, activeSubject])

  useEffect(() => {
    if (!modalOpen) setEditId(null)
  }, [modalOpen])

  const teacherOptions = useMemo(() => {
    const teachers = [...new Set(rawSubjects.map((s) => s.teacher).filter(Boolean))].sort()
    return [
      { value: 'all', label: 'All Faculty' },
      ...teachers.map((t) => ({ value: t, label: t })),
    ]
  }, [rawSubjects])

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'All Categories' },
      ...FACULTY_SUBJECT_CATEGORIES.map((c) => ({ value: c.value, label: c.label })),
    ],
    [],
  )

  const subjectsById = useMemo(
    () => new Map(rawSubjects.map((row) => [String(row.id), row])),
    [rawSubjects],
  )

  const disableableCount = useMemo(
    () =>
      selectedIds.filter((id) => subjectsById.get(String(id))?.status === 'Active').length,
    [selectedIds, subjectsById],
  )

  const enableableCount = useMemo(
    () =>
      selectedIds.filter((id) => subjectsById.get(String(id))?.status === 'In Active').length,
    [selectedIds, subjectsById],
  )

  const allItemIds = useMemo(
    () => subjects.map((row) => String(row.id)),
    [subjects],
  )

  const showEmpty =
    !loading && !listError && totalItems === 0 && !hasActiveFilters
  const showNoResults =
    !loading && !listError && subjects.length === 0 && !showEmpty

  const formSubmitting = createMutation.isPending || updateMutation.isPending

  const listErrorInfo = useMemo(
    () => (listError ? parseApiError(listError) : null),
    [listError],
  )

  useEffect(() => {
    if (listErrorInfo?.status !== 401) return
    if (!listErrorInfo.message.includes('live Super Admin')) return
    toast.error('Please log in again with live Super Admin credentials to load faculty subjects.')
  }, [listErrorInfo])

  const handleListErrorAction = useCallback(() => {
    if (listErrorInfo?.status === 401) {
      logout()
      navigate('/login', { replace: true })
      return
    }
    refreshSubjects()
  }, [listErrorInfo, logout, navigate, refreshSubjects])

  const listErrorMessage = listErrorInfo
    ? listErrorInfo.status === 401
      ? listErrorInfo.message.includes('live Super Admin')
        ? listErrorInfo.message
        : 'Your session has expired. Please log in again with Super Admin credentials.'
      : listErrorInfo.message
    : 'Failed to load faculty subjects'

  const listErrorActionLabel =
    listErrorInfo?.status === 401 ? 'Log in again' : 'Try again'

  const openCreate = useCallback(() => {
    setActiveSubject(null)
    setEditId(null)
    setModalMode('add')
    setModalOpen(true)
  }, [])

  const openContentManagement = useCallback(
    (row) => {
      navigate(FACULTY_SUBJECT_ROUTES.content(row.id))
    },
    [navigate],
  )

  const handleView = useCallback((row) => {
    setViewId(row.id)
  }, [])

  const openEdit = useCallback((row) => {
    setActiveSubject(row)
    setEditId(row.id)
    setModalMode('edit')
    setModalOpen(true)
  }, [])

  const handleSubjectModalSubmit = useCallback(
    async (form) => {
      const payload = buildFacultySubjectApiPayload({
        ...form,
        teacherId: form.teacher,
        topicIds: form.topics,
      })

      try {
        if (modalMode === 'edit' && editDetail?.id) {
          await updateMutation.mutateAsync({ id: editDetail.id, payload })
          toast.success(facultySubjectLabels.updated)
        } else {
          await createMutation.mutateAsync(payload)
          toast.success(facultySubjectLabels.created)
        }
        setModalOpen(false)
        setActiveSubject(null)
        setEditId(null)
      } catch (error) {
        const message = getApiErrorMessage(
          error,
          modalMode === 'edit' ? 'Failed to update subject' : 'Failed to create subject',
        )
        toast.error(message)
        throw error
      }
    },
    [modalMode, editDetail, createMutation, updateMutation],
  )

  const handleStatusChange = useCallback(
    async (row, nextStatus) => {
      if (!canMutate) {
        toast.error('You do not have permission to update faculty subjects.')
        return
      }

      setStatusChangingId(row.id)
      try {
        await toggleStatusMutation.mutateAsync({
          id: row.id,
          status: mapUiStatusToApi(nextStatus),
        })
        toast.success(
          nextStatus === 'Active'
            ? `${facultySubjectLabels.singular} enabled`
            : `${facultySubjectLabels.singular} disabled`,
        )
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to update status'))
      } finally {
        setStatusChangingId(null)
      }
    },
    [canMutate, toggleStatusMutation],
  )

  const handleToggleItemStatus = useCallback(
    (row) => {
      handleStatusChange(row, nextRowStatus(row.status))
    },
    [handleStatusChange],
  )

  const toggleSelect = useCallback((id) => {
    const sid = String(id)
    setSelectedIds((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid],
    )
  }, [])

  const toggleSelectPage = useCallback((pageIds, select) => {
    const ids = pageIds.map(String)
    setSelectedIds((prev) => {
      if (select) {
        const merged = new Set([...prev, ...ids])
        return [...merged]
      }
      const pageSet = new Set(ids)
      return prev.filter((id) => !pageSet.has(id))
    })
  }, [])

  const handleBulkDeleteRequest = () => {
    if (!selectedIds.length || !canMutate) return
    setBulkConfirm({ type: 'deactivate' })
  }

  const handleBulkDisableRequest = () => {
    if (!disableableCount || !canMutate) return
    setBulkConfirm({ type: 'disable' })
  }

  const handleBulkEnableRequest = () => {
    if (!enableableCount || !canMutate) return
    setBulkConfirm({ type: 'enable' })
  }

  const getBulkTargets = (type) => {
    if (type === 'enable') {
      return selectedIds
        .map((id) => subjectsById.get(String(id)))
        .filter((row) => row && row.status === 'In Active')
    }
    if (type === 'disable' || type === 'deactivate') {
      return selectedIds
        .map((id) => subjectsById.get(String(id)))
        .filter((row) => row && row.status === 'Active')
    }
    return selectedIds.map((id) => subjectsById.get(String(id))).filter(Boolean)
  }

  const confirmBulkAction = async () => {
    if (!bulkConfirm || !selectedIds.length) return
    const targets = getBulkTargets(bulkConfirm.type)
    if (!targets.length) {
      setBulkConfirm(null)
      return
    }

    setBulkActionLoading(true)
    try {
      if (bulkConfirm.type === 'deactivate' || bulkConfirm.type === 'disable') {
        for (const row of targets) {
          await toggleStatusMutation.mutateAsync({
            id: row.id,
            status: mapUiStatusToApi('In Active'),
          })
        }
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.disabled, { duration: TOAST_DURATION.short })
      } else if (bulkConfirm.type === 'enable') {
        for (const row of targets) {
          await toggleStatusMutation.mutateAsync({
            id: row.id,
            status: mapUiStatusToApi('Active'),
          })
        }
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.enabled, { duration: TOAST_DURATION.short })
      }
      setBulkConfirm(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to update selected subjects'))
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleteMutation.isPending) return
    const targetId = String(deleteTarget.id)

    try {
      await deleteMutation.mutateAsync(targetId)
      setSelectedIds((prev) => prev.filter((id) => id !== targetId))
      toast.success(facultySubjectLabels.deleted)
      setDeleteTarget(null)
    } catch (error) {
      const status = error?.response?.status
      const message = getApiErrorMessage(
        error,
        status === 409
          ? 'Cannot delete — linked to batch(es). Remove from batches first.'
          : 'Failed to delete subject',
      )
      toast.error(message)
      if (status === 409) setDeleteTarget(null)
    }
  }

  return (
    <div className="figma-admin-section min-h-full bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={Layers}
          iconClassName="text-[#246392]"
          title="Faculty Subjects"
          className="shrink-0 from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
        >
          <div className="flex flex-wrap items-center justify-end gap-2">
            <RefreshButton
              onClick={() => refreshSubjects()}
              disabled={loading || isFetching}
              fetching={isFetching}
            />
            {canMutate && (
              <BannerButton onClick={openCreate}>{facultySubjectLabels.add}</BannerButton>
            )}
          </div>
        </PageBanner>

        <SubjectListingToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          onClearSearch={() => setSearch('')}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          teacher={teacherFilter}
          onTeacherChange={(e) => setTeacherFilter(e.target.value)}
          teacherOptions={teacherOptions}
          category={categoryFilter}
          onCategoryChange={(e) => setCategoryFilter(e.target.value)}
          categoryOptions={categoryOptions}
          onClearFilters={resetFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {loading ? (
          <SubjectTable
            data={[]}
            loading
            search={search}
            statusFilter={statusFilter}
            categoryFilter={categoryFilter}
            teacherFilter={teacherFilter}
            controlledPagination={controlledPagination}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
          />
        ) : listError ? (
          <ErrorState
            message={listErrorMessage}
            onRetry={handleListErrorAction}
            retryLabel={listErrorActionLabel}
          />
        ) : showEmpty ? (
          <SubjectEmptyState
            enhanced
            title={facultySubjectLabels.emptyTitle}
            description="Create your first subject to get started."
            primaryActionLabel={facultySubjectLabels.add}
            onPrimaryAction={canMutate ? openCreate : undefined}
          />
        ) : showNoResults ? (
          <SubjectEmptyState
            enhanced
            title="No matching subjects"
            description={
              search.trim()
                ? 'No faculty subjects match your search.'
                : 'No faculty subjects match your filters.'
            }
            actionLabel="Clear filters"
            onAction={resetFilters}
          />
        ) : (
          <>
            <PermissionGate roles={['super_admin']}>
              <CurrentAffairsBulkActionsBar
                count={selectedIds.length}
                enableCount={enableableCount}
                disableCount={disableableCount}
                onClearSelection={() => setSelectedIds([])}
                onEnable={handleBulkEnableRequest}
                onDisable={handleBulkDisableRequest}
                onDelete={handleBulkDeleteRequest}
              />
            </PermissionGate>
            <SubjectTable
              data={subjects}
              search={search}
              statusFilter={statusFilter}
              categoryFilter={categoryFilter}
              teacherFilter={teacherFilter}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectPage={toggleSelectPage}
              allItemIds={allItemIds}
              onView={handleView}
              onEdit={canMutate ? openEdit : undefined}
              onManageContent={openContentManagement}
              onDelete={canMutate ? (row) => setDeleteTarget(row) : undefined}
              onStatusToggle={canMutate ? handleToggleItemStatus : undefined}
              loading={isFetching || bulkActionLoading}
              statusChangingId={statusChangingId}
              controlledPagination={controlledPagination}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={handleSort}
              canMutate={canMutate}
            />
          </>
        )}
      </section>

      <ViewFacultySubjectModal
        open={Boolean(viewId)}
        onClose={() => setViewId(null)}
        item={viewItem}
        loading={viewLoading && !viewItem}
        error={viewIsError && !viewItem ? getApiErrorMessage(viewFetchError, 'Failed to load faculty subject') : null}
      />

      <SubjectModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setActiveSubject(null)
          setEditId(null)
        }}
        mode={modalMode}
        context="subject"
        subject={editDetail}
        onSubmit={handleSubjectModalSubmit}
        detailLoading={formSubmitting || editDetailLoading}
        apiIntegrated
      />

      <SubjectBulkConfirmDialog
        open={Boolean(bulkConfirm)}
        type={bulkConfirm?.type}
        loading={bulkActionLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => {
          if (!bulkActionLoading) setBulkConfirm(null)
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${facultySubjectLabels.singular}?`}
        message={`Are you sure you want to delete "${deleteTarget?.subjectName || 'this subject'}"? This action cannot be undone.`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!deleteMutation.isPending) setDeleteTarget(null)
        }}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
