import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PlusCircle, Search } from 'lucide-react'
import CategoryPageHeader from '../../../../components/categories/CategoryPageHeader'
import { CategoryFilterSelect } from '../../../../components/categories/CategoryFilterBar'
import ProgramsBulkActionsBar from '../../../../components/categories/ProgramsBulkActionsBar'
import MasterBulkConfirmModal from '../../../../components/categories/MasterBulkConfirmModal'
import CategoryEmptyState from '../../../../components/categories/CategoryEmptyState'
import { useEditModal } from '../../../../hooks/useEditModal'
import { toast } from '../../../../utils/toast'
import { isRecordStatusActive } from '../../../../constants/recordStatus'
import {
  countDisableableSelected,
  countEnableableSelected,
  filterDisableableIds,
  filterEnableableIds,
  MASTER_BULK_TOAST,
} from '../../../../utils/masterBulkActions'
import {
  CATEGORY_FILTER_BAR_SHELL,
  CATEGORY_SEARCH_INPUT_CLASS,
  categoryFilterGridClass,
} from '../../../../utils/categoryUiStandards'
import AddEditClassModal from './AddEditClassModal'
import ViewClassModal from './ViewClassModal'
import ConfirmClassStatusModal from './ConfirmClassStatusModal'
import ClassTable from './ClassTable'
import { INITIAL_CLASSES_DATA, SUBJECT_OPTIONS } from './classesData'
import { filterClasses, nextClassId, sortClasses } from './classHelpers'

function AddButton({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-[#1a3a5c] to-[#03045e] px-5 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(3,4,94,0.35)] transition hover:scale-[1.02] active:scale-[0.98]"
    >
      <PlusCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} />
      {children}
    </button>
  )
}

export default function ClassesPage() {
  const [classes, setClasses] = useState(INITIAL_CLASSES_DATA)
  const [search, setSearch] = useState('')
  const [subjectFilter, setSubjectFilter] = useState('all')
  const [classFilter, setClassFilter] = useState('all')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('desc')
  const [selectedIds, setSelectedIds] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)
  const [bulkConfirm, setBulkConfirm] = useState(null)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  const { isOpen, openEdit, openCreate, close, selectedItem } = useEditModal()
  const [viewItem, setViewItem] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)

  const subjectFilterOptions = useMemo(
    () => [
      { value: 'all', label: 'All Subjects' },
      ...SUBJECT_OPTIONS.map((subject) => ({ value: subject, label: subject })),
    ],
    [],
  )

  const classFilterOptions = useMemo(() => {
    const names = [...new Set(classes.map((row) => row.name).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b),
    )
    return [
      { value: 'all', label: 'All Classes' },
      ...names.map((name) => ({ value: name, label: name })),
    ]
  }, [classes])

  const filteredClasses = useMemo(() => {
    const filtered = filterClasses(classes, { search, subjectFilter, classFilter })
    return sortClasses(filtered, sortBy, sortOrder)
  }, [classes, search, subjectFilter, classFilter, sortBy, sortOrder])

  const classesById = useMemo(
    () => new Map(classes.map((row) => [String(row.id), row])),
    [classes],
  )

  const enableableCount = useMemo(
    () => countEnableableSelected(selectedIds, classesById),
    [selectedIds, classesById],
  )

  const disableableCount = useMemo(
    () => countDisableableSelected(selectedIds, classesById),
    [selectedIds, classesById],
  )

  const handleSort = useCallback((columnKey) => {
    setSortBy((prev) => {
      if (prev === columnKey) {
        setSortOrder((order) => (order === 'asc' ? 'desc' : 'asc'))
        return prev
      }
      setSortOrder('asc')
      return columnKey
    })
  }, [])

  const handleFormSubmit = useCallback(async (form, { isEdit, id }) => {
    setSubmitting(true)
    try {
      const now = new Date().toISOString()
      const payload = {
        subject: form.subject,
        name: form.name.trim(),
        status: form.status,
        modifiedAt: now,
      }

      if (isEdit && id != null) {
        setClasses((prev) =>
          prev.map((row) => (row.id === id ? { ...row, ...payload } : row)),
        )
        toast.success('Class updated successfully')
      } else {
        setClasses((prev) => [
          ...prev,
          {
            id: nextClassId(prev),
            ...payload,
            createdAt: now,
          },
        ])
        toast.success('Class created successfully')
      }
    } finally {
      setSubmitting(false)
    }
  }, [])

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return
    setStatusLoading(true)
    try {
      const enabling = !isRecordStatusActive(statusTarget.status)
      const nextStatus = enabling ? 'Active' : 'Inactive'
      const now = new Date().toISOString()

      setClasses((prev) =>
        prev.map((row) =>
          row.id === statusTarget.id
            ? { ...row, status: nextStatus, modifiedAt: now }
            : row,
        ),
      )
      toast.success(enabling ? 'Class activated' : 'Class deactivated')
      setStatusTarget(null)
    } finally {
      setStatusLoading(false)
    }
  }, [statusTarget])

  const confirmBulkAction = useCallback(async () => {
    if (!bulkConfirm) return
    setBulkActionLoading(true)

    try {
      const now = new Date().toISOString()
      const isActivate = bulkConfirm.type === 'enable' || bulkConfirm.type === 'activate'

      if (isActivate) {
        const ids = filterEnableableIds(selectedIds, classesById)
        setClasses((prev) =>
          prev.map((row) =>
            ids.includes(row.id) ? { ...row, status: 'Active', modifiedAt: now } : row,
          ),
        )
        toast.success(MASTER_BULK_TOAST.activated)
      } else {
        const ids = filterDisableableIds(selectedIds, classesById)
        setClasses((prev) =>
          prev.map((row) =>
            ids.includes(row.id) ? { ...row, status: 'Inactive', modifiedAt: now } : row,
          ),
        )
        toast.success(MASTER_BULK_TOAST.deactivated)
      }

      setSelectedIds([])
      setBulkConfirm(null)
    } finally {
      setBulkActionLoading(false)
    }
  }, [bulkConfirm, selectedIds, classesById])

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

  const showEmpty =
    classes.length === 0 && !search && classFilter === 'all' && subjectFilter === 'all'
  const showNoResults = !showEmpty && filteredClasses.length === 0

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="classes"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
        className="space-y-5 sm:space-y-6"
      >
        <CategoryPageHeader title="Classes">
          <AddButton onClick={openCreate}>Add Class</AddButton>
        </CategoryPageHeader>

        <div className={CATEGORY_FILTER_BAR_SHELL}>
          <div className={categoryFilterGridClass(2)}>
            <div className="relative min-w-0 w-full sm:col-span-2 lg:col-span-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by Class Name"
                className={CATEGORY_SEARCH_INPUT_CLASS}
              />
            </div>

            <CategoryFilterSelect
              label="Subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              options={subjectFilterOptions}
            />

            <CategoryFilterSelect
              label="Class"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              options={classFilterOptions}
            />
          </div>
        </div>

        <ProgramsBulkActionsBar
          count={selectedIds.length}
          enableCount={enableableCount}
          disableCount={disableableCount}
          onClearSelection={() => setSelectedIds([])}
          onEnable={() => enableableCount > 0 && setBulkConfirm({ type: 'enable' })}
          onDisable={() => disableableCount > 0 && setBulkConfirm({ type: 'disable' })}
        />

        {showEmpty ? (
          <CategoryEmptyState
            title="No Classes Found"
            description="Add your first class and link it to a subject."
            ctaLabel="Add Class"
            onCta={openCreate}
          />
        ) : showNoResults ? (
          <CategoryEmptyState
            title="No matching records"
            description="Try adjusting your search or filters."
          />
        ) : (
          <ClassTable
            classes={filteredClasses}
            loading={bulkActionLoading}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onView={setViewItem}
            onEdit={openEdit}
            onToggleStatus={setStatusTarget}
            resetDeps={[search, subjectFilter, classFilter, sortBy, sortOrder]}
            selection={{
              selectedIds,
              onToggle: toggleSelect,
              onTogglePage: toggleSelectPage,
            }}
          />
        )}

        <AddEditClassModal
          open={isOpen}
          onClose={close}
          item={selectedItem}
          onSubmit={handleFormSubmit}
          submitting={submitting}
        />

        <ViewClassModal
          open={Boolean(viewItem)}
          onClose={() => setViewItem(null)}
          item={viewItem}
        />

        <ConfirmClassStatusModal
          open={Boolean(statusTarget)}
          className={statusTarget?.name}
          enabling={statusTarget ? !isRecordStatusActive(statusTarget.status) : false}
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
