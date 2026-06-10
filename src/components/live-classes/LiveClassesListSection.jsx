import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import { BannerButton } from '../academics/AcademicsUi'
import { liveClassesTw } from '../../constants/liveClassesTheme'
import { useLiveClasses } from '../../contexts/LiveClassesContext'
import { useEditModal } from '../../hooks/useEditModal'
import { useLiveClassesList } from '../../hooks/useLiveClassesList'
import { duplicateLessonRow } from '../../utils/liveClassesMappers'
import { toast } from '../../utils/toast'
import { fetchSubjectCategories } from '../../api/subjectCategoriesAPI'
import { LIVE_CLASSES_BASE } from '../../constants/liveClassesNav'
import LiveClassesFilterBar from './LiveClassesFilterBar'
import LiveClassStatusBadge from './LiveClassStatusBadge'
import LiveClassesTableActions from './LiveClassesTableActions'
import {
  tableActionsCellClass,
  tableActionsHeaderClass,
} from '../common/TableActionMenu'
import ScheduleClassModal from './ScheduleClassModal'
import RecurrenceScopeDialog from './RecurrenceScopeDialog'
import { RECURRENCE_DELETE_SCOPES, RECURRENCE_EDIT_SCOPES } from '../../constants/recurrence'
import { LIVE_CLASS_MODULES } from '../../constants/liveClassesModuleConfig'

function TableSkeleton() {
  return (
    <div className="animate-pulse space-y-3 rounded-md bg-white p-6 shadow-[0_11px_25px_rgba(15,23,42,0.06)]">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 rounded-lg bg-[#eef2fc]" />
      ))}
    </div>
  )
}

export default function LiveClassesListSection({
  module = 'schedule',
  fixedLessonType,
  emptyMessage = 'No lessons found.',
  showLessonTypeFilter = true,
}) {
  const moduleConfig = LIVE_CLASS_MODULES[module] ?? LIVE_CLASS_MODULES.schedule
  const navigate = useNavigate()
  const { lessons, loading, saveLesson, removeLesson, toggleDisabled } = useLiveClasses()
  const modal = useEditModal()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [editTarget, setEditTarget] = useState(null)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [search, setSearch] = useState('')
  const [lessonType, setLessonType] = useState(fixedLessonType || 'all')
  const [status, setStatus] = useState('all')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [sort, setSort] = useState('date-desc')
  const [selected, setSelected] = useState(new Set())
  const [subjectOptions, setSubjectOptions] = useState([{ value: 'all', label: 'All subjects' }])

  useEffect(() => {
    fetchSubjectCategories().then((rows) => {
      setSubjectOptions([
        { value: 'all', label: 'All subjects' },
        ...rows.map((s) => ({ value: s.id, label: s.label })),
      ])
    })
  }, [])

  const effectiveType = fixedLessonType || lessonType

  const filtered = useLiveClassesList(lessons, {
    search,
    lessonType: effectiveType,
    status,
    subjectFilter,
    sort,
  })

  useEffect(() => {
    const visibleIds = new Set(filtered.map((r) => r.id))
    setSelected((prev) => {
      const next = new Set([...prev].filter((id) => visibleIds.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [filtered])

  const selectedCount = selected.size

  const clearRowSelection = () => setSelected(new Set())

  const requestEdit = (row) => {
    if (row.recurrenceSeriesId) {
      setEditTarget(row)
      return
    }
    modal.openEdit(row)
  }

  const confirmRecurringEdit = (scope) => {
    if (!editTarget) return
    modal.openEdit({ ...editTarget, recurrenceEditScope: scope })
    setEditTarget(null)
  }

  const toggleSelect = (id) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map((r) => r.id)))
  }

  const handleSave = async (form, meta) => {
    await saveLesson(form, meta)
  }

  const lessonCheckboxClass =
    'h-4 w-4 shrink-0 rounded border-slate-300 text-[#246392] accent-[#246392] focus:ring-[#55ace7]/40'

  const requestDelete = (row) => {
    if (row.recurrenceSeriesId) {
      setDeleteTarget(row)
      return
    }
    if (window.confirm(`Delete "${row.lessonName}"?`)) {
      removeLesson(row.id).then(() => toast.success('Lesson deleted'))
    }
  }

  const confirmRecurringDelete = async (scope) => {
    if (!deleteTarget) return
    setDeleteLoading(true)
    try {
      await removeLesson(deleteTarget.id, { scope })
      toast.success('Recurring schedule updated')
      setDeleteTarget(null)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleDuplicate = async (row) => {
    const form = duplicateLessonRow(row)
    await saveLesson(form, { isEdit: false })
    toast.success('Lesson duplicated')
  }

  const bulkDisable = () => {
    selected.forEach((id) => toggleDisabled(id))
    setSelected(new Set())
    toast.success('Selected lessons updated')
  }

  const bulkDelete = async () => {
    for (const id of selected) await removeLesson(id)
    setSelected(new Set())
    toast.success('Selected lessons deleted')
  }

  const columns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          checked={filtered.length > 0 && selected.size === filtered.length}
          onChange={toggleSelectAll}
          aria-label="Select all"
          className={lessonCheckboxClass}
        />
      ),
      headerClassName: 'w-12 pl-6',
      cellClassName: 'pl-6',
      render: (row) => (
        <input
          type="checkbox"
          checked={selected.has(row.id)}
          onChange={() => toggleSelect(row.id)}
          onClick={(e) => e.stopPropagation()}
          aria-label={`Select ${row.lessonName}`}
          className={lessonCheckboxClass}
        />
      ),
    },
    {
      key: 'lessonName',
      label: 'Lesson name',
      headerClassName: 'pl-2',
      cellClassName: 'pl-2',
      render: (row) => (
        <button
          type="button"
          onClick={() => navigate(`${LIVE_CLASSES_BASE}/${row.id}`)}
          className="text-left"
        >
          <span className="truncate font-medium">{row.lessonName}</span>
          {row.recurring && (
            <span className="mt-1 inline-flex rounded-md bg-[#eef6fc] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#246392]">
              Recurring
              {row.occurrenceCount ? ` · ${row.occurrenceCount} sessions` : ''}
            </span>
          )}
        </button>
      ),
    },
    { key: 'subjectName', label: 'Subject' },
    {
      key: 'courseCount',
      label: 'Course count',
      render: (row) => (
        <span className={liveClassesTw.courseCountBadge}>
          {row.courseCount} {row.courseCount === 1 ? 'course' : 'courses'}
        </span>
      ),
    },
    { key: 'teacher', label: 'Teacher' },
    { key: 'lessonType', label: 'Type' },
    { key: 'scheduledDisplay', label: 'Scheduled' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <LiveClassStatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: tableActionsHeaderClass,
      cellClassName: tableActionsCellClass,
      render: (row) => (
        <div className="flex justify-center sm:justify-end">
          <LiveClassesTableActions
            row={row}
            onView={() => navigate(`${LIVE_CLASSES_BASE}/${row.id}`)}
            onEdit={() => requestEdit(row)}
            onDelete={() => requestDelete(row)}
            onDisable={() => toggleDisabled(row.id)}
            onDuplicate={() => handleDuplicate(row)}
          />
        </div>
      ),
    },
  ]

  return (
    <>
      <div className="flex justify-end">
        <BannerButton onClick={modal.openCreate}>{moduleConfig.addButtonLabel}</BannerButton>
      </div>

      <LiveClassesFilterBar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        lessonType={showLessonTypeFilter ? lessonType : undefined}
        onLessonTypeChange={
          showLessonTypeFilter ? (e) => setLessonType(e.target.value) : undefined
        }
        status={status}
        onStatusChange={(e) => setStatus(e.target.value)}
        subjectFilter={subjectFilter}
        onSubjectFilterChange={(e) => setSubjectFilter(e.target.value)}
        subjectOptions={subjectOptions}
        sort={sort}
        onSortChange={(e) => setSort(e.target.value)}
        selectedCount={selectedCount}
        onBulkDisable={bulkDisable}
        onBulkDelete={bulkDelete}
      />

      {loading ? (
        <TableSkeleton />
      ) : (
        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          emptyMessage={emptyMessage}
          itemLabel={moduleConfig.tableItemLabel}
          resetDeps={[search, effectiveType, status, subjectFilter, sort]}
          rowClassName={liveClassesTw.rowHover}
        />
      )}

      <ScheduleClassModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        onSubmit={handleSave}
        lessons={lessons}
        defaultLessonType={moduleConfig.defaultLessonType}
        lockLessonType={moduleConfig.lockLessonType}
        labels={{
          modalTitle: moduleConfig.modalTitle,
          createHeader: moduleConfig.createHeader,
          editHeader: moduleConfig.editHeader,
          createLabel: moduleConfig.createSubmitLabel,
          updateLabel: moduleConfig.updateSubmitLabel,
          createSuccess: moduleConfig.createSuccess,
          updateSuccess: moduleConfig.updateSuccess,
        }}
        onAfterReset={clearRowSelection}
      />

      <RecurrenceScopeDialog
        open={Boolean(editTarget)}
        mode="edit"
        title="Edit recurring class"
        lessonName={editTarget?.lessonName ?? ''}
        scopes={RECURRENCE_EDIT_SCOPES}
        onCancel={() => setEditTarget(null)}
        onConfirm={confirmRecurringEdit}
      />

      <RecurrenceScopeDialog
        open={Boolean(deleteTarget)}
        mode="delete"
        title="Delete recurring class"
        lessonName={deleteTarget?.lessonName ?? ''}
        scopes={RECURRENCE_DELETE_SCOPES}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmRecurringDelete}
        loading={deleteLoading}
      />
    </>
  )
}
