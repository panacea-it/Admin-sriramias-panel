import { useCallback, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers } from 'lucide-react'
import SubjectHeader from '../../components/subjects/SubjectHeader'
import SubjectFilters from '../../components/subjects/SubjectFilters'
import SubjectTable from '../../components/subjects/SubjectTable'
import SubjectModal from '../../components/subjects/SubjectModal'
import ViewFacultySubjectModal from '../../components/subjects/ViewFacultySubjectModal'
import SubjectEmptyState from '../../components/subjects/SubjectEmptyState'
import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'
import { useFacultySubjectsManagement } from '../../hooks/useFacultySubjectsManagement'
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
  mapApiFacultySubjectToRow,
} from '../../utils/facultySubjectHelpers'
import {
  removeFacultySubjectFromLocalStorage,
  syncSingleFacultySubjectToLocal,
} from '../../utils/facultySubjectSync'
import { mapUiStatusToApi } from '../../utils/programHelpers'
import { getApiErrorMessage } from '../../utils/apiError'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'
import { facultySubjectLabels } from '../../data/facultySubjectLabels'

export default function SubjectsPage() {
  const navigate = useNavigate()
  const {
    subjects,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    controlledPagination,
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
  const [statusChangingId, setStatusChangingId] = useState(null)
  const [viewItem, setViewItem] = useState(null)
  const [viewLoading, setViewLoading] = useState(false)

  const showEmpty =
    !loading && subjects.length === 0 && !search.trim() && statusFilter === 'all'
  const showNoResults =
    !loading && subjects.length === 0 && !showEmpty

  const openCreate = () => {
    setActiveSubject(null)
    setModalMode('add')
    setModalOpen(true)
  }

  const loadSubjectDetail = useCallback(async (row) => {
    const data = await getFacultySubjectById(row.id)
    return mapApiFacultySubjectToFormRow(data)
  }, [])

  const openContentManagement = async (row) => {
    try {
      const detail = await loadSubjectDetail(row)
      if (detail) syncSingleFacultySubjectToLocal(detail)
      navigate(`/academics/subjects/${encodeURIComponent(row.id)}/content`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load subject details'))
    }
  }

  const handleView = async (row) => {
    setViewItem(row)
    setViewLoading(true)
    try {
      const data = await getFacultySubjectById(row.id)
      const detail = mapApiFacultySubjectToRow(data)
      if (detail) {
        syncSingleFacultySubjectToLocal(data)
        setViewItem(detail)
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load subject details'))
      setViewItem(null)
    } finally {
      setViewLoading(false)
    }
  }

  const handleViewList = async (row) => {
    try {
      const detail = await loadSubjectDetail(row)
      if (detail) syncSingleFacultySubjectToLocal(detail)
      navigate(`/academics/subjects/${row.id}`)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to load subject details'))
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
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
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

        <SubjectFilters
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
        />

        {showEmpty ? (
          <SubjectEmptyState
            description={`Create your first subject using the ${facultySubjectLabels.add} button above.`}
          />
        ) : showNoResults ? (
          <SubjectEmptyState
            description="No subjects match your search or filter. Try adjusting your criteria."
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        ) : (
          <div
            className={cn(
              'overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80',
            )}
          >
            <SubjectTable
              data={subjects}
              search={search}
              statusFilter={statusFilter}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onAddRow={openContentManagement}
              onView={handleView}
              onViewList={handleViewList}
              onEdit={openEdit}
              onDelete={(row) => setDeleteTarget(row)}
              onStatusChange={handleStatusChange}
              loading={loading}
              controlledPagination={controlledPagination}
              statusChangingId={statusChangingId}
            />
          </div>
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
