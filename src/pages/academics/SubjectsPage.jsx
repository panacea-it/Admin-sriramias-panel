import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers } from 'lucide-react'
import SubjectHeader from '../../components/subjects/SubjectHeader'
import SubjectListingToolbar from '../../components/subjects/SubjectListingToolbar'
import SubjectTable from '../../components/subjects/SubjectTable'
import SubjectModal from '../../components/subjects/SubjectModal'
import ViewFacultySubjectModal from '../../components/subjects/ViewFacultySubjectModal'
import FacultySubjectViewListModal from '../../components/subjects/FacultySubjectViewListModal'
import SubjectEmptyState from '../../components/subjects/SubjectEmptyState'
import SubjectBulkToolbar from '../../components/subjects/SubjectBulkToolbar'
import SubjectBulkConfirmDialog from '../../components/subjects/SubjectBulkConfirmDialog'
import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'
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
import { toast } from '../../utils/toast'
import { facultySubjectLabels } from '../../data/facultySubjectLabels'

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
    retrySubjects,
    patchSubjectLocally,
    removeSubjectLocally,
  } = useFacultySubjectsManagement()

  const rateLimitRetryCountRef = useRef(0)

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
  const [viewListItem, setViewListItem] = useState(null)
  const [teacherFilter, setTeacherFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const teacherOptions = useMemo(() => {
    const teachers = [...new Set(subjects.map((s) => s.teacher).filter(Boolean))].sort()
    return [
      { value: 'all', label: 'All Teachers' },
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

  useEffect(() => {
    if (subjects.length > 0) {
      rateLimitRetryCountRef.current = 0
    }
  }, [subjects.length])

  useEffect(() => {
    if (!loadError || loading || subjects.length > 0) return undefined
    if (!loadError.toLowerCase().includes('too many requests')) return undefined
    if (rateLimitRetryCountRef.current >= 2) return undefined
    rateLimitRetryCountRef.current += 1
    const timer = window.setTimeout(() => {
      retrySubjects()
    }, 5000)
    return () => window.clearTimeout(timer)
  }, [loadError, loading, subjects.length, retrySubjects])

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
        setViewItem(detail)
        syncSingleFacultySubjectToLocal(detail)
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load subject details'))
    } finally {
      setViewLoading(false)
    }
  }

  const handleViewList = (row) => {
    setViewListItem(row)
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

  const getSelectedSubjects = () => {
    const idSet = new Set(selectedIds.map(String))
    return subjects.filter((s) => idSet.has(String(s.id)))
  }

  const handleBulkDeleteRequest = () => {
    if (!selectedIds.length) return
    setBulkConfirm({ type: 'delete', count: selectedIds.length })
  }

  const handleBulkDisableRequest = () => {
    if (!selectedIds.length) return
    setBulkConfirm({ type: 'disable', count: selectedIds.length })
  }

  const handleBulkEnableRequest = async () => {
    const targets = getSelectedSubjects()
    if (!targets.length) return
    setBulkActionLoading(true)
    try {
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
      toast.success(`${targets.length} ${facultySubjectLabels.plural.toLowerCase()} enabled`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Bulk enable failed'))
    } finally {
      setBulkActionLoading(false)
    }
  }

  const confirmBulkAction = async () => {
    if (!bulkConfirm || !selectedIds.length) return
    const targets = getSelectedSubjects()
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
        toast.success(`${targets.length} ${facultySubjectLabels.plural.toLowerCase()} deleted`)
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
        toast.success(`${targets.length} ${facultySubjectLabels.plural.toLowerCase()} disabled`)
      }
      setBulkConfirm(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Bulk action failed'))
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
          <div className="space-y-4">
            <SubjectBulkToolbar
              selectedCount={selectedIds.length}
              onEnable={handleBulkEnableRequest}
              onDisable={handleBulkDisableRequest}
              onDelete={handleBulkDeleteRequest}
              onClearSelection={() => setSelectedIds([])}
            />
            <SubjectTable
              data={filteredSubjects}
              search={search}
              statusFilter={statusFilter}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onToggleSelectPage={toggleSelectPage}
              onAddRow={openContentManagement}
              onView={handleView}
              onViewList={handleViewList}
              onEdit={openEdit}
              onDelete={(row) => setDeleteTarget(row)}
              onStatusChange={handleStatusChange}
              loading={loading}
              statusChangingId={statusChangingId}
            />
          </div>
        )}
      </section>

      <FacultySubjectViewListModal
        open={Boolean(viewListItem)}
        onClose={() => setViewListItem(null)}
        subjectRow={viewListItem}
      />

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
        count={bulkConfirm?.count || 0}
        loading={bulkActionLoading}
        onConfirm={confirmBulkAction}
        onCancel={() => setBulkConfirm(null)}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title={`Delete ${facultySubjectLabels.singular.toLowerCase()}?`}
        message={
          deleteTarget
            ? `Remove "${deleteTarget.subjectName}" and all linked content? This cannot be undone.`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  )
}
