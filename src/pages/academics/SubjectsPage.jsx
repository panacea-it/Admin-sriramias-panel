import { useCallback, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers } from 'lucide-react'
import SubjectHeader from '../../components/subjects/SubjectHeader'
import SubjectListingToolbar from '../../components/subjects/SubjectListingToolbar'
import SubjectTable from '../../components/subjects/SubjectTable'
import SubjectModal from '../../components/subjects/SubjectModal'
import ViewFacultySubjectModal from '../../components/subjects/ViewFacultySubjectModal'
import SubjectEmptyState from '../../components/subjects/SubjectEmptyState'
import SubjectBulkConfirmDialog from '../../components/subjects/SubjectBulkConfirmDialog'
import CurrentAffairsBulkActionsBar from '../../components/current-affairs/CurrentAffairsBulkActionsBar'
import { useFacultySubjectsManagement } from '../../hooks/useFacultySubjectsManagement'
import { clearFacultySubjectFormOptionsCache } from '../../hooks/useFacultySubjectFormOptions'
import {
  createFacultySubject,
  deleteFacultySubject,
  getFacultySubjectById,
  updateFacultySubject,
  updateFacultySubjectStatus,
} from '../../api/facultySubjectsAPI'
import {
  buildFacultySubjectApiPayload,
  mapApiFacultySubjectToFormRow,
  matchesFacultySubjectSearch,
} from '../../utils/facultySubjectHelpers'
import {
  removeFacultySubjectFromLocalStorage,
  syncSingleFacultySubjectToLocal,
} from '../../utils/facultySubjectSync'
import { mapUiStatusToApi } from '../../utils/programHelpers'
import { normalizeCategories } from '../../utils/subjectCategoryHelpers'
import { getApiErrorMessage } from '../../utils/apiError'
import { toast, TOAST_DURATION } from '../../utils/toast'
import { MASTER_BULK_TOAST } from '../../utils/masterBulkActions'
import { getMasterBulkErrorMessage } from '../../services/masterBulkStatusService'
import { facultySubjectLabels } from '../../data/facultySubjectLabels'

function nextRowStatus(status) {
  return status === 'Active' ? 'In Active' : 'Active'
}

export default function SubjectsPage() {
  const navigate = useNavigate()
  const {
    subjects,
    loading,
    loadError,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    refreshSubjects,
    patchSubjectLocally,
    removeSubjectLocally,
  } = useFacultySubjectsManagement()

  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [activeSubject, setActiveSubject] = useState(null)
  const [editDetailLoading, setEditDetailLoading] = useState(false)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [statusChangingId, setStatusChangingId] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [teacherFilter, setTeacherFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const teacherOptions = useMemo(() => {
    const teachers = [...new Set(subjects.map((s) => s.teacher).filter(Boolean))].sort()
    return [
      { value: 'all', label: 'All Faculty' },
      ...teachers.map((t) => ({ value: t, label: t })),
    ]
  }, [subjects])

  const categoryOptions = useMemo(() => {
    const set = new Set()
    subjects.forEach((s) => {
      normalizeCategories(s.categories ?? s.category).forEach((c) => set.add(c))
    })
    return [
      { value: 'all', label: 'All Categories' },
      ...[...set].sort().map((c) => ({ value: c, label: c })),
    ]
  }, [subjects])

  const filteredSubjects = useMemo(() => {
    return subjects.filter((row) => {
      if (statusFilter !== 'all' && row.status !== statusFilter) return false
      if (teacherFilter !== 'all' && row.teacher !== teacherFilter) return false
      if (categoryFilter !== 'all') {
        const cats = normalizeCategories(row.categories ?? row.category)
        if (!cats.includes(categoryFilter)) return false
      }
      if (!matchesFacultySubjectSearch(row, search)) return false
      return true
    })
  }, [subjects, statusFilter, teacherFilter, categoryFilter, search])

  const subjectsById = useMemo(
    () => new Map(subjects.map((row) => [String(row.id), row])),
    [subjects],
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
    () => filteredSubjects.map((row) => String(row.id)),
    [filteredSubjects],
  )

  const hasClientFilters = teacherFilter !== 'all' || categoryFilter !== 'all'
  const hasActiveFilters =
    hasClientFilters || statusFilter !== 'all' || Boolean(search.trim())

  const showEmpty =
    !loading &&
    !loadError &&
    subjects.length === 0 &&
    !search.trim() &&
    statusFilter === 'all' &&
    !hasClientFilters
  const showNoResults =
    !loading && !loadError && filteredSubjects.length === 0 && !showEmpty
  const showLoadError = !loading && Boolean(loadError) && subjects.length === 0

  const openCreate = () => {
    setActiveSubject(null)
    setModalMode('add')
    setModalOpen(true)
  }

  const loadSubjectDetail = useCallback(async (row) => {
    const data = await getFacultySubjectById(row.id)
    return mapApiFacultySubjectToFormRow(data)
  }, [])

  const openContentManagement = (row) => {
    syncSingleFacultySubjectToLocal(row)
    navigate(`/academics/subjects/${encodeURIComponent(row.id)}/content`)
  }

  const handleView = async (row) => {
    setViewItem(row)
    setViewLoading(true)
    try {
      const detail = await loadSubjectDetail(row)
      if (detail) {
        setViewItem({
          ...detail,
          teacher: row.teacher || detail.teacherMeta?.[0]?.label || detail.teacherName || detail.teacher,
          topics:
            detail.topicMeta?.map((entry) => entry.label).filter(Boolean) ||
            row.topics ||
            detail.topics,
          topicMeta: detail.topicMeta?.length ? detail.topicMeta : row.topics?.map((label) => ({ label })),
        })
        syncSingleFacultySubjectToLocal(detail)
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load subject details'))
    } finally {
      setViewLoading(false)
    }
  }

  const openEdit = async (row) => {
    setActiveSubject(row)
    setModalMode('edit')
    setModalOpen(true)
    setEditDetailLoading(true)
    try {
      const detail = await loadSubjectDetail(row)
      if (detail) {
        setActiveSubject(detail)
        syncSingleFacultySubjectToLocal(detail)
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load subject for edit'))
      setModalOpen(false)
      setActiveSubject(null)
    } finally {
      setEditDetailLoading(false)
    }
  }

  const handleSubjectModalSubmit = async (form) => {
    setFormSubmitting(true)
    try {
      const payload = buildFacultySubjectApiPayload(form)
      if (modalMode === 'edit' && activeSubject?.id) {
        await updateFacultySubject(activeSubject.id, payload)
        toast.success(facultySubjectLabels.updated)
      } else {
        await createFacultySubject(payload)
        toast.success(facultySubjectLabels.created)
      }
      clearFacultySubjectFormOptionsCache()
      await refreshSubjects()
      setModalOpen(false)
      setActiveSubject(null)
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          modalMode === 'edit' ? 'Failed to update subject' : 'Failed to create subject',
        ),
      )
      throw error
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleStatusChange = async (row, nextStatus) => {
    const previousStatus = row.status
    const nextApi = mapUiStatusToApi(nextStatus)

    patchSubjectLocally(row.id, { status: nextStatus })
    setStatusChangingId(row.id)

    try {
      await updateFacultySubjectStatus(row.id, nextApi)
      syncSingleFacultySubjectToLocal({ ...row, status: nextApi })
      toast.success(
        nextStatus === 'Active'
          ? `${facultySubjectLabels.singular} activated`
          : `${facultySubjectLabels.singular} deactivated`,
      )
    } catch (error) {
      patchSubjectLocally(row.id, { status: previousStatus })
      toast.error(getApiErrorMessage(error, 'Failed to update status'))
    } finally {
      setStatusChangingId(null)
    }
  }

  const handleToggleItemStatus = async (row) => {
    await handleStatusChange(row, nextRowStatus(row.status))
  }

  const toggleSelect = (id) => {
    const sid = String(id)
    setSelectedIds((prev) =>
      prev.includes(sid) ? prev.filter((x) => x !== sid) : [...prev, sid],
    )
  }

  const toggleSelectPage = (pageIds, select) => {
    const ids = pageIds.map(String)
    setSelectedIds((prev) => {
      if (select) {
        const merged = new Set([...prev, ...ids])
        return [...merged]
      }
      const pageSet = new Set(ids)
      return prev.filter((id) => !pageSet.has(id))
    })
  }

  const handleBulkDeleteRequest = () => {
    if (!selectedIds.length) return
    setBulkConfirm({ type: 'deactivate' })
  }

  const handleBulkDisableRequest = () => {
    if (!disableableCount) return
    setBulkConfirm({ type: 'disable' })
  }

  const handleBulkEnableRequest = () => {
    if (!enableableCount) return
    setBulkConfirm({ type: 'enable' })
  }

  const getBulkTargets = (type) => {
    if (type === 'enable') {
      return selectedIds
        .map((id) => subjectsById.get(String(id)))
        .filter((row) => row && row.status === 'In Active')
    }
    if (type === 'disable') {
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
      if (bulkConfirm.type === 'delete') {
        for (const row of targets) {
          const targetId = String(row.id)
          await deleteFacultySubject(targetId)
          removeSubjectLocally(targetId)
          removeFacultySubjectFromLocalStorage(targetId)
        }
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.deleted, { duration: TOAST_DURATION.short })
        await refreshSubjects()
      } else if (bulkConfirm.type === 'disable') {
        for (const row of targets) {
          const previousStatus = row.status
          patchSubjectLocally(row.id, { status: 'In Active' })
          try {
            await updateFacultySubjectStatus(row.id, mapUiStatusToApi('In Active'))
            syncSingleFacultySubjectToLocal({ ...row, status: mapUiStatusToApi('In Active') })
          } catch (error) {
            patchSubjectLocally(row.id, { status: previousStatus })
            throw error
          }
        }
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.disabled, { duration: TOAST_DURATION.short })
      } else if (bulkConfirm.type === 'enable') {
        for (const row of targets) {
          const previousStatus = row.status
          patchSubjectLocally(row.id, { status: 'Active' })
          try {
            await updateFacultySubjectStatus(row.id, mapUiStatusToApi('Active'))
            syncSingleFacultySubjectToLocal({ ...row, status: mapUiStatusToApi('Active') })
          } catch (error) {
            patchSubjectLocally(row.id, { status: previousStatus })
            throw error
          }
        }
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.enabled, { duration: TOAST_DURATION.short })
      }
      setBulkConfirm(null)
    } catch (error) {
      toast.error(getMasterBulkErrorMessage(error, bulkConfirm.type))
      await refreshSubjects()
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleteLoading) return
    const targetId = String(deleteTarget.id)
    setDeleteLoading(true)
    try {
      await deleteFacultySubject(targetId)
      removeSubjectLocally(targetId)
      removeFacultySubjectFromLocalStorage(targetId)
      setSelectedIds((prev) => prev.filter((id) => id !== targetId))
      toast.success(facultySubjectLabels.deleted)
      setDeleteTarget(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete subject'))
    } finally {
      setDeleteLoading(false)
    }
  }

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('all')
    setTeacherFilter('all')
    setCategoryFilter('all')
  }

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <SubjectHeader
          icon={Layers}
          title={facultySubjectLabels.plural}
          onAdd={openCreate}
          addLabel={facultySubjectLabels.add}
          iconClassName="text-[#246392]"
        />

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
          onClearFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {showLoadError ? (
          <SubjectEmptyState
            enhanced
            title="Could not load faculty subjects"
            description={loadError}
            actionLabel="Try again"
            onAction={() => refreshSubjects()}
          />
        ) : showEmpty ? (
          <SubjectEmptyState
            enhanced
            title="No Subjects Available"
            description="Create your first subject to get started."
            primaryActionLabel={facultySubjectLabels.add}
            onPrimaryAction={openCreate}
          />
        ) : showNoResults ? (
          <SubjectEmptyState
            enhanced
            title="No matching subjects"
            description="No subjects match your search or filter. Try adjusting your criteria."
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        ) : (
          <>
            <CurrentAffairsBulkActionsBar
              count={selectedIds.length}
              enableCount={enableableCount}
              disableCount={disableableCount}
              onClearSelection={() => setSelectedIds([])}
              onEnable={handleBulkEnableRequest}
              onDisable={handleBulkDisableRequest}
              onDelete={handleBulkDeleteRequest}
            />
            <SubjectTable
              data={filteredSubjects}
              search={search}
              statusFilter={statusFilter}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectPage={toggleSelectPage}
              allItemIds={allItemIds}
              onView={handleView}
              onEdit={openEdit}
              onManageContent={openContentManagement}
              onDelete={(row) => setDeleteTarget(row)}
              onStatusToggle={handleToggleItemStatus}
              loading={loading || bulkActionLoading}
              statusChangingId={statusChangingId}
            />
          </>
        )}
      </section>

      <ViewFacultySubjectModal
        open={Boolean(viewItem) || viewLoading}
        onClose={() => {
          setViewItem(null)
          setViewLoading(false)
        }}
        item={viewItem}
        loading={viewLoading}
      />

      <SubjectModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setActiveSubject(null)
          setEditDetailLoading(false)
        }}
        mode={modalMode}
        context="subject"
        subject={activeSubject}
        subjects={subjects}
        onSubmit={handleSubjectModalSubmit}
        detailLoading={editDetailLoading || formSubmitting}
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

      
    </div>
  )
}
