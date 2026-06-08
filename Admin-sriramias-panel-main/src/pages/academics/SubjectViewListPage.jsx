import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Layers } from 'lucide-react'
import SubjectHeader from '../../components/subjects/SubjectHeader'
import SubjectFilters from '../../components/subjects/SubjectFilters'
import TopicTable from '../../components/subjects/TopicTable'
import SubjectModal from '../../components/subjects/SubjectModal'
import SubjectEmptyState from '../../components/subjects/SubjectEmptyState'
import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'
import RecurrenceScopeDialog from '../../components/live-classes/RecurrenceScopeDialog'
import ExamCategoryTableSkeleton from '../../components/categories/ExamCategoryTableSkeleton'
import { RECURRENCE_DELETE_SCOPES } from '../../constants/recurrence'
import { useAuth } from '../../contexts/AuthContext'
import { useAcademicsSubjects } from '../../hooks/useAcademicsSubjects'
import { useFacultySubjectDetail } from '../../hooks/useFacultySubjectDetail'
import { buildLiveClassesFromRecurrence } from '../../utils/academicsSubjectsRecurrence'
import { syncSubjectLiveClassesToModule } from '../../utils/subjectModuleSync'
import { formatSubjectViewTitle } from '../../utils/academicsSubjectsStorage'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

export default function SubjectViewListPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    subject: apiSubject,
    loading: detailLoading,
    error: detailError,
  } = useFacultySubjectDetail(id)
  const {
    getSubjectById,
    upsertLiveClass,
    upsertLiveClassesBatch,
    deleteLiveClassWithScope,
  } = useAcademicsSubjects()
  const localSubject = getSubjectById(id)
  const subject = useMemo(() => {
    if (!apiSubject && !localSubject) return null
    return {
      ...(apiSubject || {}),
      ...(localSubject || {}),
      id: String(id),
      subjectName: apiSubject?.subjectName || localSubject?.subjectName || '',
      subjectLabel: apiSubject?.subjectLabel || localSubject?.subjectLabel || '',
      teacher: apiSubject?.teacher || localSubject?.teacher || '',
      topics: apiSubject?.topics?.length ? apiSubject.topics : localSubject?.topics || [],
      categories: apiSubject?.categories?.length
        ? apiSubject.categories
        : localSubject?.categories || [],
      liveClasses: localSubject?.liveClasses || apiSubject?.liveClasses || [],
      recordings: localSubject?.recordings || apiSubject?.recordings || [],
    }
  }, [apiSubject, localSubject, id])

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [activeLiveClass, setActiveLiveClass] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [recurrenceDialog, setRecurrenceDialog] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])

  const liveClasses = subject?.liveClasses || []

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return liveClasses.filter((row) => {
      const matchSearch =
        !q ||
        row.classTitle?.toLowerCase().includes(q) ||
        row.center?.toLowerCase().includes(q) ||
        row.classroom?.toLowerCase().includes(q) ||
        String(row.id).includes(q)
      const matchStatus = statusFilter === 'all' || row.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [liveClasses, search, statusFilter])

  if (detailLoading) {
    return (
      <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
        <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
          <ExamCategoryTableSkeleton />
        </section>
      </div>
    )
  }

  if (detailError || !subject) {
    return (
      <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
        <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
          <SubjectEmptyState
            title="Unable to load subject"
            description={detailError || 'Subject not found.'}
            actionLabel="Back to Faculty Subjects"
            onAction={() => navigate('/academics/subjects')}
          />
        </section>
      </div>
    )
  }

  const openCreate = () => {
    setActiveLiveClass(null)
    setModalMode('add')
    setModalOpen(true)
  }

  const openEdit = (row) => {
    setActiveLiveClass(row)
    setModalMode('edit')
    setModalOpen(true)
  }

  const handleModalSubmit = async (form) => {
    const actorName = user?.name || user?.email || 'Admin'
    const existing = modalMode === 'edit' ? activeLiveClass : null
    const scope = form.recurrenceEditScope || 'series'
    const rows = buildLiveClassesFromRecurrence(form, subject, existing, actorName, { scope })

    let syncedRows = rows
    try {
      syncedRows = await syncSubjectLiveClassesToModule(rows, subject, { actor: actorName })
    } catch {
      toast.error('Saved on subject; sync to Scheduled/Live Classes failed')
    }

    if (existing?.recurrenceSeriesId && form.recurring && scope !== 'this') {
      upsertLiveClassesBatch(subject.id, syncedRows, {
        removeSeriesId: existing.recurrenceSeriesId,
        scope,
        fromDate: existing.date,
      })
      toast.success(
        syncedRows.length > 1
          ? `Recurring schedule updated — ${syncedRows.length} sessions`
          : 'Live class updated',
      )
      return
    }

    if (syncedRows.length > 1) {
      upsertLiveClassesBatch(subject.id, syncedRows)
      toast.success(`${syncedRows.length} live classes scheduled`)
    } else {
      upsertLiveClass(subject.id, syncedRows[0])
      toast.success(modalMode === 'edit' ? 'Live class updated' : 'Live class added')
    }
  }

  const handleDeleteRequest = (row) => {
    if (row.recurrenceSeriesId) {
      setRecurrenceDialog({ row })
      return
    }
    setDeleteTarget(row)
  }

  const handleLiveClassStatusChange = (row, nextStatus) => {
    upsertLiveClass(subject.id, { ...row, status: nextStatus })
    toast.success(nextStatus === 'Active' ? 'Live class activated' : 'Live class deactivated')
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget || deleteLoading || !subject) return
    const targetId = String(deleteTarget.id)
    setDeleteLoading(true)
    try {
      deleteLiveClassWithScope(subject.id, deleteTarget, 'this')
      setSelectedIds((prev) => prev.filter((id) => id !== targetId))
      toast.success('Live class deleted')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err?.message || 'Failed to delete live class')
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleRecurrenceDeleteConfirm = async (scope) => {
    if (!recurrenceDialog?.row) return
    setDeleteLoading(true)
    try {
      deleteLiveClassWithScope(subject.id, recurrenceDialog.row, scope)
      toast.success(
        scope === 'series' ? 'Recurring series deleted' : 'Selected sessions removed',
      )
      setRecurrenceDialog(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <SubjectHeader
          icon={Layers}
          title={formatSubjectViewTitle(subject)}
          onAdd={openCreate}
          addLabel="Add"
          iconClassName="text-[#246392]"
        />

        <SubjectFilters
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          category={categoryFilter}
          onCategoryChange={(e) => setCategoryFilter(e.target.value)}
          showCategoryFilter
        />

        {filtered.length === 0 && liveClasses.length === 0 ? (
          <SubjectEmptyState
            title="No Live Classes"
            description="Add a live class for this subject using the Add button above."
          />
        ) : (
          <div
            className={cn(
              'overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80',
            )}
          >
            <TopicTable
              data={filtered}
              search={search}
              statusFilter={statusFilter}
              categoryFilter={categoryFilter}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onEdit={openEdit}
              onDelete={handleDeleteRequest}
              onStatusChange={handleLiveClassStatusChange}
            />
          </div>
        )}

        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => navigate('/academics/subjects')}
            className="text-sm font-semibold text-[#246392] underline-offset-2 hover:underline"
          >
            ← Back to Faculty Subjects
          </button>
        </div>
      </section>

      <SubjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        context="liveClass"
        subject={subject}
        liveClass={activeLiveClass}
        subjects={subject ? [subject] : []}
        onSubmit={handleModalSubmit}
      />

      <RecurrenceScopeDialog
        open={Boolean(recurrenceDialog)}
        mode="delete"
        title="Delete recurring live class"
        lessonName={recurrenceDialog?.row?.classTitle}
        scopes={RECURRENCE_DELETE_SCOPES}
        loading={deleteLoading}
        onConfirm={handleRecurrenceDeleteConfirm}
        onCancel={() => setRecurrenceDialog(null)}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete live class?"
        message={
          deleteTarget
            ? `Remove "${deleteTarget.classTitle}" from this subject?`
            : ''
        }
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </div>
  )
}
