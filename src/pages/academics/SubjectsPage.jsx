import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers } from 'lucide-react'
import SubjectHeader from '../../components/subjects/SubjectHeader'
import SubjectListingToolbar from '../../components/subjects/SubjectListingToolbar'
import SubjectTable from '../../components/subjects/SubjectTable'
import SubjectModal from '../../components/subjects/SubjectModal'
import ViewFacultySubjectModal from '../../components/subjects/ViewFacultySubjectModal'
import SubjectEmptyState from '../../components/subjects/SubjectEmptyState'
import SubjectBulkConfirmDialog from '../../components/subjects/SubjectBulkConfirmDialog'
import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'
import CurrentAffairsBulkActionsBar from '../../components/current-affairs/CurrentAffairsBulkActionsBar'
import { useAcademicsSubjects } from '../../hooks/useAcademicsSubjects'
import { buildSubjectFromForm } from '../../components/subjects/subjectFormUtils'
import { matchesFacultySubjectSearch } from '../../utils/facultySubjectHelpers'
import { normalizeCategories } from '../../utils/subjectCategoryHelpers'
import { toast, TOAST_DURATION } from '../../utils/toast'
import { MASTER_BULK_TOAST } from '../../utils/masterBulkActions'
import { facultySubjectLabels } from '../../data/facultySubjectLabels'

function nextRowStatus(status) {
  return status === 'Active' ? 'In Active' : 'Active'
}

export default function SubjectsPage() {
  const navigate = useNavigate()
  const { subjects, upsertSubject, deleteSubject } = useAcademicsSubjects()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [activeSubject, setActiveSubject] = useState(null)
  const [formSubmitting, setFormSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [statusChangingId, setStatusChangingId] = useState(null)
  const [viewItem, setViewItem] = useState(null)
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
    subjects.length === 0 &&
    !search.trim() &&
    statusFilter === 'all' &&
    !hasClientFilters
  const showNoResults = filteredSubjects.length === 0 && !showEmpty

  const openCreate = () => {
    setActiveSubject(null)
    setModalMode('add')
    setModalOpen(true)
  }

  const openContentManagement = (row) => {
    navigate(`/academics/subjects/${encodeURIComponent(row.id)}/content`)
  }

  const handleView = (row) => {
    setViewItem(row)
  }

  const openEdit = (row) => {
    setActiveSubject(row)
    setModalMode('edit')
    setModalOpen(true)
  }

  const handleSubjectModalSubmit = async (form) => {
    setFormSubmitting(true)
    try {
      const row = buildSubjectFromForm(form, modalMode === 'edit' ? activeSubject : null, subjects)
      upsertSubject(row)
      toast.success(modalMode === 'edit' ? facultySubjectLabels.updated : facultySubjectLabels.created)
      setModalOpen(false)
      setActiveSubject(null)
    } catch (error) {
      toast.error(error?.message || 'Failed to save subject')
      throw error
    } finally {
      setFormSubmitting(false)
    }
  }

  const handleStatusChange = (row, nextStatus) => {
    upsertSubject({ ...row, status: nextStatus })
    setStatusChangingId(row.id)
    toast.success(
      nextStatus === 'Active'
        ? `${facultySubjectLabels.singular} activated`
        : `${facultySubjectLabels.singular} deactivated`,
    )
    setStatusChangingId(null)
  }

  const handleToggleItemStatus = (row) => {
    handleStatusChange(row, nextRowStatus(row.status))
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
        targets.forEach((row) => upsertSubject({ ...row, status: 'In Active' }))
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.disabled, { duration: TOAST_DURATION.short })
      } else if (bulkConfirm.type === 'enable') {
        targets.forEach((row) => upsertSubject({ ...row, status: 'Active' }))
        setSelectedIds([])
        toast.success(MASTER_BULK_TOAST.enabled, { duration: TOAST_DURATION.short })
      }
      setBulkConfirm(null)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleteLoading) return
    const targetId = String(deleteTarget.id)
    setDeleteLoading(true)
    try {
      deleteSubject(targetId)
      setSelectedIds((prev) => prev.filter((id) => id !== targetId))
      toast.success(facultySubjectLabels.deleted)
      setDeleteTarget(null)
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

        {showEmpty ? (
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
              loading={bulkActionLoading}
              statusChangingId={statusChangingId}
            />
          </>
        )}
      </section>

      <ViewFacultySubjectModal
        open={Boolean(viewItem)}
        onClose={() => setViewItem(null)}
        item={viewItem}
      />

      <SubjectModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setActiveSubject(null)
        }}
        mode={modalMode}
        context="subject"
        subject={activeSubject}
        subjects={subjects}
        onSubmit={handleSubjectModalSubmit}
        detailLoading={formSubmitting}
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
          if (!deleteLoading) setDeleteTarget(null)
        }}
        loading={deleteLoading}
      />
    </div>
  )
}
