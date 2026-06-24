import { useMemo, useState } from 'react'
import { GraduationCap, PlusCircle, X } from 'lucide-react'
import WebsiteFilterToolbar from './WebsiteFilterToolbar'
import WebsiteFormShell from './WebsiteFormShell'
import WebsiteFormModal from './WebsiteFormModal'
import RankManagementTable from './RankManagementTable'
import RankManagementImageCell from './RankManagementImageCell'
import RankerRowActions from './RankerRowActions'
import { createActionsColumn } from '../../utils/tableColumnHelpers'
import RankTop10Badge from './RankTop10Badge'
import {
  getNextDisplayOrder,
  isActiveTop10Ranker,
  sortRankersForDisplay,
  TOP10_INACTIVE_MESSAGE,
} from './rankManagementDisplay'
import {
  WebsiteField,
  WebsiteImageInput,
  WebsiteStatusBadge,
  WebsiteStatusSelect,
  websiteInputClass,
} from './websiteUi'
import { INITIAL_RANKERS } from '../../data/websiteData'
import {
  MAX_TOP10_RANKERS,
  RANK_PROGRAM_OPTIONS,
  enrichRankerSeedRows,
  getCoursesForProgram,
} from '../../constants/rankManagementConstants'
import { isSameCalendarDay, startOfDay } from '../../utils/dailyCollectionUtils'
import { validateRankerForm } from '../../utils/rankFormValidation'
import { toast } from '@/utils/toast'
import { cn } from '../../utils/cn'

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime())
}

function resolveRankerCreatedAt(row, index = 0) {
  if (row.createdAt) {
    const fromField = new Date(row.createdAt)
    if (isValidDate(fromField)) return fromField.toISOString()
  }

  if (row.date) {
    const dateOnly = new Date(row.date)
    if (isValidDate(dateOnly)) return dateOnly.toISOString()
  }

  return new Date(Date.now() - index * 86400000).toISOString()
}

function normalizeRanker(row, index = 0) {
  const createdAt = resolveRankerCreatedAt(row, index)
  const created = new Date(createdAt)
  const isActive = row.status !== 'Deactivated'
  const isTop10 = isActive ? Boolean(row.isTop10) : false

  return {
    ...row,
    studentId: row.studentId || `STU-${row.id}`,
    isTop10,
    displayOrder: isTop10 ? row.displayOrder ?? null : null,
    createdAt,
    time: row.time || created.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
    date:
      row.date ||
      created.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
  }
}

function normalizeRankers(rows) {
  return (rows || []).map((row, i) => normalizeRanker(row, i))
}

function getRankYearOptions() {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let year = currentYear + 2; year >= currentYear - 10; year -= 1) {
    years.push(year)
  }
  return years
}

const emptyRankForm = () => ({
  program: RANK_PROGRAM_OPTIONS[0]?.value || '',
  course: getCoursesForProgram(RANK_PROGRAM_OPTIONS[0]?.value)[0]?.value || '',
  year: String(new Date().getFullYear()),
  studentId: '',
  studentName: '',
  rank: '',
  image: '',
  status: 'Active',
  isTop10: false,
  displayOrder: '',
})

function formFromRow(row) {
  return {
    program: row.program || '',
    course: row.course || '',
    year: row.year ? String(row.year) : String(new Date().getFullYear()),
    studentId: row.studentId || '',
    studentName: row.name || '',
    rank: row.rank || '',
    image: row.imageUrl || '',
    status: row.status || 'Active',
    isTop10: Boolean(row.isTop10) && row.status === 'Active',
    displayOrder: row.displayOrder ?? '',
  }
}

function matchesSelectedDate(row, selectedDate) {
  if (!selectedDate) return true
  const created = row.createdAt ? new Date(row.createdAt) : null
  if (!created || Number.isNaN(created.getTime())) return false
  return isSameCalendarDay(created, selectedDate)
}

function nextRankerId() {
  return String(56565 + Date.now())
}

function formatCreatedOn(row) {
  const d = row.createdAt ? new Date(row.createdAt) : null
  if (d && isValidDate(d)) {
    return d.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }
  return row.date || '—'
}

function RankBadge({ rank }) {
  return (
    <span
      className="inline-flex min-w-[72px] items-center justify-center rounded-full bg-[#eef6fc] px-2.5 py-1 text-xs font-bold text-[#246392] ring-1 ring-[#55ace7]/25"
    >
      {rank}
    </span>
  )
}

const inputErrorClass = 'ring-2 ring-[#EF4444]/60 bg-red-50/40'

function FieldError({ message }) {
  if (!message) return null
  return <p className="mt-1.5 text-xs font-medium text-[#EF4444]">{message}</p>
}

export default function RankManagementTab() {
  const [rankers, setRankers] = useState(() =>
    normalizeRankers(enrichRankerSeedRows(INITIAL_RANKERS)),
  )
  const [rankFormOpen, setRankFormOpen] = useState(false)
  const [viewTarget, setViewTarget] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [rankForm, setRankForm] = useState(emptyRankForm)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  const clearFieldError = (field) => {
    if (!formErrors[field]) return
    setFormErrors((prev) => {
      const next = { ...prev }
      delete next[field]
      return next
    })
  }

  const clearFormErrors = () => setFormErrors({})

  const top10Count = useMemo(
    () => rankers.filter((row) => isActiveTop10Ranker(row)).length,
    [rankers],
  )
  const top10LimitReached = top10Count >= MAX_TOP10_RANKERS

  const editingRow = useMemo(
    () => (editingId ? rankers.find((row) => row.id === editingId) : null),
    [editingId, rankers],
  )

  const courseOptions = useMemo(
    () => getCoursesForProgram(rankForm.program),
    [rankForm.program],
  )

  const filteredRankers = useMemo(() => {
    const q = search.trim().toLowerCase()
    const filtered = rankers.filter((row) => {
      const matchSearch =
        !q ||
        row.id.includes(q) ||
        (row.studentId || '').toLowerCase().includes(q) ||
        (row.name || '').toLowerCase().includes(q) ||
        (row.program || '').toLowerCase().includes(q) ||
        (row.course || '').toLowerCase().includes(q) ||
        (row.rank || '').toLowerCase().includes(q)
      const matchDate = matchesSelectedDate(row, selectedDate)
      const matchStatus = statusFilter === 'all' || row.status === statusFilter
      return matchSearch && matchDate && matchStatus
    })
    return sortRankersForDisplay(filtered)
  }, [rankers, search, selectedDate, statusFilter])

  const openAddRank = () => {
    setEditingId(null)
    setRankForm(emptyRankForm())
    clearFormErrors()
    setRankFormOpen(true)
  }

  const openEditRank = (row) => {
    setEditingId(row.id)
    setRankForm(formFromRow(row))
    clearFormErrors()
    setRankFormOpen(true)
  }

  const closeRankForm = () => {
    setRankFormOpen(false)
    setEditingId(null)
    clearFormErrors()
  }

  const toggleTop10 = (rowId) => {
    const row = rankers.find((r) => r.id === rowId)
    if (!row) return

    if (row.status !== 'Active') {
      toast.error(TOP10_INACTIVE_MESSAGE)
      return
    }

    if (!row.isTop10 && top10Count >= MAX_TOP10_RANKERS) {
      toast.error('Maximum 10 Top Rankers allowed.')
      return
    }

    setRankers((prev) =>
      prev.map((r) => {
        if (r.id !== rowId) return r
        if (r.isTop10) {
          return { ...r, isTop10: false, displayOrder: null }
        }
        const nextOrder = getNextDisplayOrder(prev)
        return { ...r, isTop10: true, displayOrder: nextOrder }
      }),
    )
    toast.success(row.isTop10 ? 'Top 10 tag removed' : 'Marked as Top 10 Ranker')
  }

  const changeStatus = (row, newStatus) => {
    if (row.status === newStatus) return
    setRankers((prev) =>
      prev.map((r) =>
        r.id === row.id
          ? {
              ...r,
              status: newStatus,
              ...(newStatus === 'Deactivated'
                ? { isTop10: false, displayOrder: null }
                : {}),
            }
          : r,
      ),
    )
    toast.success(`Status updated to ${newStatus}`)
  }

  const confirmDeleteRanker = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      setRankers((prev) => prev.filter((r) => r.id !== deleteTarget.id))
      toast.success('Ranker deleted')
      setDeleteTarget(null)
    } catch {
      toast.error('Failed to delete ranker. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const saveRank = () => {
    const existing = rankers.find((r) => r.id === editingId)
    const wantsTop10 = rankForm.status === 'Active' && rankForm.isTop10
    const wasTop10 = Boolean(existing?.isTop10) && existing?.status === 'Active'

    if (wantsTop10 && !wasTop10 && top10Count >= MAX_TOP10_RANKERS) {
      toast.error('Maximum 10 Top Rankers allowed.')
      return
    }

    const errors = validateRankerForm(rankForm, {
      editingId,
      rankers,
    })
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error('Please fix the highlighted fields')
      return
    }

    const displayOrder = wantsTop10
      ? existing?.isTop10 && existing?.displayOrder
        ? existing.displayOrder
        : getNextDisplayOrder(rankers.filter((row) => String(row.id) !== String(editingId)))
      : null

    if (wantsTop10 && displayOrder == null) {
      toast.error('Maximum 10 Top Rankers allowed.')
      return
    }

    const payload = {
      id: existing?.id || nextRankerId(),
      studentId: rankForm.studentId.trim(),
      name: rankForm.studentName.trim(),
      program: rankForm.program,
      course: rankForm.course,
      year: rankForm.year,
      rank: rankForm.rank.trim(),
      imageUrl: rankForm.image || null,
      time: existing?.time || new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' }),
      date:
        existing?.date ||
        new Date().toLocaleDateString(undefined, {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
      status: rankForm.status,
      isTop10: wantsTop10,
      displayOrder,
      createdAt: existing?.createdAt || new Date().toISOString(),
    }

    if (editingId) {
      setRankers((prev) =>
        prev.map((r) => (r.id === editingId ? normalizeRanker({ ...r, ...payload }) : r)),
      )
      toast.success('Ranker updated successfully')
    } else {
      setRankers((prev) => [normalizeRanker(payload), ...prev])
      toast.success('Ranker added successfully')
    }
    closeRankForm()
  }

  const columns = useMemo(
    () => [
      {
        key: 'studentId',
        label: 'Student ID',
        headerClassName: 'min-w-[120px] pl-4 sm:pl-6',
        cellClassName:
          'min-w-[120px] pl-4 align-middle font-mono text-xs font-semibold text-[#246392] sm:pl-6',
      },
      {
        key: 'name',
        label: 'Student Name',
        headerClassName: 'min-w-[170px]',
        cellClassName: 'min-w-[170px] align-middle',
        render: (row) => (
          <div className="flex min-w-0 items-center gap-2">
            <span className="truncate font-semibold text-[#111]">{row.name}</span>
            {isActiveTop10Ranker(row) && <RankTop10Badge size="sm" />}
          </div>
        ),
      },
      {
        key: 'program',
        label: 'Program',
        headerClassName: 'min-w-[130px]',
        cellClassName: 'min-w-[130px] align-middle text-[13px] font-medium text-[#111]',
        render: (row) => <span className="block truncate">{row.program}</span>,
      },
      {
        key: 'course',
        label: 'Course',
        headerClassName: 'min-w-[150px]',
        cellClassName: 'min-w-[150px] align-middle text-[13px] text-[#686868]',
        render: (row) => <span className="block truncate">{row.course}</span>,
      },
      {
        key: 'image',
        label: 'Image',
        headerClassName: 'min-w-[72px]',
        cellClassName: 'min-w-[72px] align-middle',
        render: (row) => <RankManagementImageCell name={row.name} imageUrl={row.imageUrl} />,
      },
      {
        key: 'rank',
        label: 'Rank',
        headerClassName: 'min-w-[100px]',
        cellClassName: 'min-w-[100px] align-middle',
        render: (row) => <RankBadge rank={row.rank} />,
      },
      {
        key: 'displayOrder',
        label: 'Display Order',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] align-middle whitespace-nowrap text-center',
        align: 'center',
        render: (row) =>
          isActiveTop10Ranker(row) ? (
            <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900 ring-1 ring-amber-200/80">
              {row.displayOrder ?? '—'}
            </span>
          ) : (
            <span className="text-sm text-[#9ca0a8]">—</span>
          ),
      },
      {
        key: 'status',
        label: 'Status',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] align-middle whitespace-nowrap',
        render: (row) => <WebsiteStatusBadge status={row.status} />,
      },
      {
        key: 'created',
        label: 'Created On',
        headerClassName: 'min-w-[120px] whitespace-nowrap',
        cellClassName: 'min-w-[120px] align-middle whitespace-nowrap pr-4',
        render: (row) => (
          <span className="whitespace-nowrap text-[13px] font-medium text-[#686868]">
            {formatCreatedOn(row)}
          </span>
        ),
      },
      createActionsColumn({
        buttonCount: 4,
        align: 'right',
        render: (row) => (
          <RankerRowActions
            rowName={row.name}
            status={row.status}
            isTop10={row.isTop10}
            top10Disabled={top10LimitReached}
            onView={() => setViewTarget(row)}
            onEdit={() => openEditRank(row)}
            onStatusChange={(newStatus) => changeStatus(row, newStatus)}
            onToggleTop10={() => toggleTop10(row.id)}
          />
        ),
      }),
    ],
    [top10LimitReached, rankers],
  )

  return (
    <div className="space-y-6">
      <div
        className={cn(
          'flex min-h-[64px] flex-wrap items-center justify-between gap-4 rounded-xl px-5 py-4',
          'bg-gradient-to-r from-[#55ace7] via-[#8b98bb] to-[#df8284]',
          'shadow-[0_5px_16px_rgba(15,23,42,0.1)]',
        )}
      >
        <div className="flex items-center gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
            <GraduationCap className="h-6 w-6 text-[#246392]" strokeWidth={2.2} />
          </span>
          <h1 className="text-xl font-bold leading-none text-white">Rankers</h1>
        </div>
        <button
          type="button"
          onClick={openAddRank}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#1a3a5c] px-4 text-sm font-semibold text-white shadow-[0_4px_10px_rgba(0,0,0,0.15)] transition hover:bg-[#152f4a] active:scale-[0.98] sm:text-base"
        >
          <PlusCircle className="h-4 w-4 shrink-0" strokeWidth={2.2} />
          Add Ranker
        </button>
      </div>

      <WebsiteFilterToolbar
        search={search}
        onSearchChange={(e) => setSearch(e.target.value)}
        searchPlaceholder="Search ranker"
        useDatePicker
        selectedDate={selectedDate}
        onDateChange={(date) => setSelectedDate(date ? startOfDay(date) : null)}
        statusFilter={statusFilter}
        onStatusFilterChange={(e) => setStatusFilter(e.target.value)}
        showStatusFilter
      />

      <RankManagementTable
        columns={columns}
        data={filteredRankers}
        resetDeps={[search, selectedDate, statusFilter, top10Count]}
      />

      <WebsiteFormModal open={rankFormOpen} onClose={closeRankForm}>
        <WebsiteFormShell
          icon={GraduationCap}
          iconClassName="text-[#246392]"
          title={editingId ? 'Edit Ranker' : 'Add Ranker'}
          sectionTitle="Ranker Details"
          closeVariant="icon"
          onGoBack={closeRankForm}
          onReset={() => {
            clearFormErrors()
            setRankForm(
              editingId
                ? formFromRow(rankers.find((r) => r.id === editingId) || {})
                : emptyRankForm(),
            )
          }}
          onSave={saveRank}
        >
          <div className="grid gap-6 sm:grid-cols-2">
            <WebsiteField label="Program" required>
              <select
                value={rankForm.program}
                onChange={(e) => {
                  const program = e.target.value
                  const firstCourse = getCoursesForProgram(program)[0]?.value || ''
                  setRankForm((f) => ({ ...f, program, course: firstCourse }))
                  clearFieldError('program')
                  clearFieldError('course')
                }}
                aria-invalid={Boolean(formErrors.program)}
                className={cn(
                  websiteInputClass,
                  'cursor-pointer',
                  formErrors.program && inputErrorClass,
                )}
                required
              >
                <option value="">Select program</option>
                {RANK_PROGRAM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <FieldError message={formErrors.program} />
            </WebsiteField>

            <WebsiteField label="Course" required>
              <select
                value={rankForm.course}
                onChange={(e) => {
                  setRankForm((f) => ({ ...f, course: e.target.value }))
                  clearFieldError('course')
                }}
                aria-invalid={Boolean(formErrors.course)}
                className={cn(
                  websiteInputClass,
                  'cursor-pointer',
                  formErrors.course && inputErrorClass,
                )}
                required
              >
                <option value="">Select course</option>
                {courseOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <FieldError message={formErrors.course} />
            </WebsiteField>

            <WebsiteField label="Year" required>
              <select
                value={rankForm.year}
                onChange={(e) => {
                  setRankForm((f) => ({ ...f, year: e.target.value }))
                  clearFieldError('year')
                }}
                aria-invalid={Boolean(formErrors.year)}
                className={cn(
                  websiteInputClass,
                  'cursor-pointer',
                  formErrors.year && inputErrorClass,
                )}
                required
              >
                <option value="">Select year</option>
                {getRankYearOptions().map((year) => (
                  <option key={year} value={String(year)}>
                    {year}
                  </option>
                ))}
              </select>
              <FieldError message={formErrors.year} />
            </WebsiteField>

            <WebsiteField label="Student ID" required>
              <input
                type="text"
                value={rankForm.studentId}
                onChange={(e) => {
                  setRankForm((f) => ({ ...f, studentId: e.target.value }))
                  clearFieldError('studentId')
                }}
                aria-invalid={Boolean(formErrors.studentId)}
                className={cn(websiteInputClass, formErrors.studentId && inputErrorClass)}
                placeholder="e.g. STU-10001"
              />
              <FieldError message={formErrors.studentId} />
            </WebsiteField>

            <WebsiteField label="Student Name" required>
              <input
                type="text"
                value={rankForm.studentName}
                onChange={(e) => {
                  setRankForm((f) => ({ ...f, studentName: e.target.value }))
                  clearFieldError('studentName')
                }}
                aria-invalid={Boolean(formErrors.studentName)}
                className={cn(websiteInputClass, formErrors.studentName && inputErrorClass)}
              />
              <FieldError message={formErrors.studentName} />
            </WebsiteField>

            <WebsiteField label="Rank" required>
              <input
                type="text"
                value={rankForm.rank}
                onChange={(e) => {
                  setRankForm((f) => ({ ...f, rank: e.target.value }))
                  clearFieldError('rank')
                }}
                aria-invalid={Boolean(formErrors.rank)}
                className={cn(websiteInputClass, formErrors.rank && inputErrorClass)}
                placeholder="e.g. AIR 4"
              />
              <FieldError message={formErrors.rank} />
            </WebsiteField>

            <div className="grid gap-6 sm:grid-cols-2">
              <WebsiteField label="Status" required>
                <WebsiteStatusSelect
                  id="ranker-status"
                  value={rankForm.status}
                  onChange={(e) => {
                    const status = e.target.value
                    setRankForm((f) => ({
                      ...f,
                      status,
                      ...(status === 'Deactivated' ? { displayOrder: '', isTop10: false } : {}),
                    }))
                    clearFieldError('status')
                    clearFieldError('displayOrder')
                    clearFieldError('isTop10')
                  }}
                  required
                  className={formErrors.status ? inputErrorClass : undefined}
                />
                <FieldError message={formErrors.status} />
              </WebsiteField>

              <WebsiteField label="Mark as Top 10" required>
                <select
                  value={rankForm.isTop10 ? 'Yes' : 'No'}
                  onChange={(e) => {
                    const isTop10 = e.target.value === 'Yes'
                    if (isTop10 && rankForm.status !== 'Active') {
                      toast.error(TOP10_INACTIVE_MESSAGE)
                      return
                    }
                    if (isTop10 && !editingRow?.isTop10 && top10LimitReached) {
                      toast.error('Maximum 10 Top Rankers allowed.')
                      return
                    }
                    setRankForm((f) => ({
                      ...f,
                      isTop10,
                      ...(isTop10 ? {} : { displayOrder: '' }),
                    }))
                    clearFieldError('isTop10')
                    clearFieldError('displayOrder')
                  }}
                  disabled={rankForm.status !== 'Active'}
                  aria-invalid={Boolean(formErrors.isTop10)}
                  className={cn(
                    websiteInputClass,
                    'cursor-pointer',
                    rankForm.status !== 'Active' && 'cursor-not-allowed opacity-70',
                    formErrors.isTop10 && inputErrorClass,
                  )}
                  required
                >
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
                <FieldError message={formErrors.isTop10} />
              </WebsiteField>
            </div>

            <WebsiteField label="Image Upload" required className="sm:col-span-2">
              <WebsiteImageInput
                id="ranker-image"
                value={rankForm.image}
                invalid={Boolean(formErrors.image)}
                onChange={(val) => {
                  setRankForm((f) => ({ ...f, image: val }))
                  clearFieldError('image')
                }}
              />
              <FieldError message={formErrors.image} />
            </WebsiteField>
          </div>
        </WebsiteFormShell>
      </WebsiteFormModal>

      <WebsiteFormModal open={Boolean(viewTarget)} onClose={() => setViewTarget(null)}>
        {viewTarget && (
          <article className="overflow-hidden rounded-2xl border border-slate-200/60 bg-white shadow-[0_20px_50px_rgba(15,23,42,0.18)]">
            <header className="flex min-h-[56px] items-center justify-between gap-4 bg-gradient-to-r from-[#55ace7] via-[#4a9fd8] to-[#1a4d73] px-5 py-3.5 sm:px-6">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
                  <GraduationCap className="h-5 w-5 text-[#246392]" strokeWidth={2.4} />
                </span>
                <h2 className="text-lg font-bold leading-none text-white sm:text-xl">
                  View Ranker
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewTarget(null)}
                aria-label="Close dialog"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
              >
                <X className="h-5 w-5" strokeWidth={2.25} />
              </button>
            </header>

            <div className="space-y-6 px-5 py-6 sm:px-8">
              <div className="flex flex-wrap items-start gap-4">
                <RankManagementImageCell
                  name={viewTarget.name}
                  imageUrl={viewTarget.imageUrl}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-[#111]">{viewTarget.name}</p>
                  <p className="text-sm text-[#686868]">{viewTarget.studentId}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <WebsiteStatusBadge status={viewTarget.status} />
                    {isActiveTop10Ranker(viewTarget) && <RankTop10Badge />}
                  </div>
                </div>
              </div>

              <dl className="grid gap-4 sm:grid-cols-2">
                {[
                  ['Program', viewTarget.program],
                  ['Course', viewTarget.course],
                  ['Rank', viewTarget.rank],
                  ...(isActiveTop10Ranker(viewTarget)
                    ? [['Display Order', viewTarget.displayOrder ?? '—']]
                    : []),
                  ['Created On', formatCreatedOn(viewTarget)],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-lg bg-[#f4f8fc] px-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-[#9ca0a8]">
                      {label}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-[#111]">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </article>
        )}
      </WebsiteFormModal>

      
    </div>
  )
}
