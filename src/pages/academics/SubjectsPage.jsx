import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers } from 'lucide-react'
import SubjectHeader from '../../components/subjects/SubjectHeader'
import SubjectFilters from '../../components/subjects/SubjectFilters'
import SubjectTable from '../../components/subjects/SubjectTable'
import SubjectModal from '../../components/subjects/SubjectModal'
import SubjectEmptyState from '../../components/subjects/SubjectEmptyState'
import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'
import { buildSubjectFromForm } from '../../components/subjects/subjectFormUtils'
import { useAcademicsSubjects } from '../../hooks/useAcademicsSubjects'
import { useBatchesData } from '../../hooks/useBatchesData'
import { buildActiveBatchOptions, formatBatchSelectLabel } from '../../utils/batchSelectHelpers'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'
import { facultySubjectLabels } from '../../data/facultySubjectLabels'

export default function SubjectsPage() {
  const navigate = useNavigate()
  const {
    subjects,
    upsertSubject,
    deleteSubject,
  } = useAcademicsSubjects()
  const { sourceRows: batchRows } = useBatchesData()
  const batchOptions = useMemo(() => buildActiveBatchOptions(batchRows), [batchRows])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add')
  const [activeSubject, setActiveSubject] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return subjects.filter((row) => {
      const topics = row.topics ?? (row.topic ? [row.topic] : [])
      const matchSearch =
        !q ||
        row.subjectName?.toLowerCase().includes(q) ||
        topics.some((t) => t.toLowerCase().includes(q)) ||
        row.teacher?.toLowerCase().includes(q) ||
        String(row.id).includes(q)
      const matchStatus = statusFilter === 'all' || row.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [subjects, search, statusFilter])

  const openCreate = () => {
    setActiveSubject(null)
    setModalMode('add')
    setModalOpen(true)
  }

  const openContentManagement = (row) => {
    navigate(`/academics/subjects/${encodeURIComponent(row.id)}/content`)
  }

  const openEdit = (row) => {
    setActiveSubject(row)
    setModalMode('edit')
    setModalOpen(true)
  }

  const handleSubjectModalSubmit = async (form) => {
    const existing = modalMode === 'edit' ? activeSubject : null
    const subjectRow = buildSubjectFromForm(form, existing, subjects)
    const batchOpt = form.batchId
      ? {
          batchId: form.batchId,
          batch:
            formatBatchSelectLabel(
              batchOptions.find((b) => String(b.id) === String(form.batchId)),
            ) || form.batchId,
        }
      : {}
    upsertSubject({ ...subjectRow, ...batchOpt })
    toast.success(modalMode === 'edit' ? facultySubjectLabels.updated : facultySubjectLabels.created)
  }

  const handleStatusChange = (row, nextStatus) => {
    upsertSubject({ ...row, status: nextStatus })
    toast.success(
      nextStatus === 'Active'
        ? `${facultySubjectLabels.singular} activated`
        : `${facultySubjectLabels.singular} deactivated`,
    )
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
      deleteSubject(targetId)
      setSelectedIds((prev) => prev.filter((id) => id !== targetId))
      toast.success(facultySubjectLabels.deleted)
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err?.message || 'Failed to delete subject')
    } finally {
      setDeleteLoading(false)
    }
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

        {filtered.length === 0 && subjects.length === 0 ? (
          <SubjectEmptyState
            description={`Create your first subject using the ${facultySubjectLabels.add} button above.`}
          />
        ) : (
          <div
            className={cn(
              'overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)] ring-1 ring-slate-100/80',
            )}
          >
            <SubjectTable
              data={filtered}
              search={search}
              statusFilter={statusFilter}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelect}
              onAddRow={openContentManagement}
              onViewList={(row) => navigate(`/academics/subjects/${row.id}`)}
              onEdit={openEdit}
              onDelete={(row) => setDeleteTarget(row)}
              onStatusChange={handleStatusChange}
            />
          </div>
        )}
      </section>

      <SubjectModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        mode={modalMode}
        context="subject"
        subject={activeSubject}
        subjects={subjects}
        onSubmit={handleSubjectModalSubmit}
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
