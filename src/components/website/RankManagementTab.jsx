import { useMemo, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, PlusCircle, X } from 'lucide-react'
import WebsiteFilterToolbar from './WebsiteFilterToolbar'
import WebsiteFormShell from './WebsiteFormShell'
import WebsiteFormModal from './WebsiteFormModal'
import RankManagementTable from './RankManagementTable'
import RankManagementImageCell from './RankManagementImageCell'
import RankerRowActions from './RankerRowActions'
import AdminConfirmModal from '../admin/AdminConfirmModal'
import { createActionsColumn, OVERFLOW_CELL } from '../../utils/tableColumnHelpers'
import RankTop10Badge from './RankTop10Badge'
import {
  isActiveTop10Ranker,
  sortRankersForDisplay,
  TOP10_INACTIVE_MESSAGE,
} from './rankManagementDisplay'
import RankerFormFields, { emptyRankForm } from './RankerFormFields'
import TopperDisplayStatusToggle from './TopperDisplayStatusToggle'
import TopperTop10Toggle from './TopperTop10Toggle'
import {
  WebsiteStatusBadge,
} from './websiteUi'
import { MAX_TOP10_RANKERS, RANK_MANAGEMENT_BASE } from '../../constants/rankManagementConstants'
import { isSameCalendarDay, startOfDay } from '../../utils/dailyCollectionUtils'
import { validateRankerForm } from '../../utils/rankFormValidation'
import { lookupStudentByStudentId } from '../../utils/rankStudentLookup'
import {
  buildTopperFormData,
  mapApiToppersToRankerRows,
  prepareTopperImageForUpload,
  suggestNextHomepageOrder,
  suggestNextToppersPageOrder,
} from '../../utils/topperApiHelpers'
import {
  useCreateTopper,
  useDeleteTopper,
  useToggleTopperDisplay,
  useToggleTopperTop10,
  useToppers,
} from '../../hooks/useToppers'
import { getApiErrorMessage } from '../../utils/apiError'
import { toast } from '@/utils/toast'
import { cn } from '../../utils/cn'

function isValidDate(date) {
  return date instanceof Date && !Number.isNaN(date.getTime())
}

function matchesSelectedDate(row, selectedDate) {
  if (!selectedDate) return true
  const created = row.createdAt ? new Date(row.createdAt) : null
  if (!created || Number.isNaN(created.getTime())) return false
  return isSameCalendarDay(created, selectedDate)
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

export default function RankManagementTab() {
  const navigate = useNavigate()
  const { data: apiToppers = [], isLoading, isError, error, refetch } = useToppers()
  const createTopperMutation = useCreateTopper()
  const deleteTopperMutation = useDeleteTopper()
  const toggleDisplayMutation = useToggleTopperDisplay()
  const toggleTop10Mutation = useToggleTopperTop10()

  const rankers = useMemo(() => mapApiToppersToRankerRows(apiToppers), [apiToppers])

  const [rankFormOpen, setRankFormOpen] = useState(false)
  const [viewTarget, setViewTarget] = useState(null)
  const [search, setSearch] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [rankForm, setRankForm] = useState(emptyRankForm)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [togglingDisplayIds, setTogglingDisplayIds] = useState(() => new Set())
  const pendingDisplayTogglesRef = useRef(new Set())
  const [togglingTop10Ids, setTogglingTop10Ids] = useState(() => new Set())
  const pendingTop10TogglesRef = useRef(new Set())

  const saving = createTopperMutation.isPending
  const deleting = deleteTopperMutation.isPending

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
    setRankForm({
      ...emptyRankForm(),
      toppersPageOrder: suggestNextToppersPageOrder(rankers),
    })
    clearFormErrors()
    setRankFormOpen(true)
  }

  const openEditRank = (row) => {
    navigate(`${RANK_MANAGEMENT_BASE}/edit/${encodeURIComponent(row.id)}`)
  }

  const closeRankForm = () => {
    setRankFormOpen(false)
    clearFormErrors()
  }

  const handleToggleTop10 = useCallback(async (row) => {
    if (pendingTop10TogglesRef.current.has(row.id)) return

    if (row.status !== 'Active') {
      toast.error(TOP10_INACTIVE_MESSAGE)
      return
    }

    if (!row.isTop10Enabled && top10LimitReached) {
      toast.error('Maximum 10 Top Rankers allowed.')
      return
    }

    pendingTop10TogglesRef.current.add(row.id)
    setTogglingTop10Ids(new Set(pendingTop10TogglesRef.current))

    try {
      const response = await toggleTop10Mutation.mutateAsync(row.id)
      toast.success(response?.message || 'Top 10 status updated')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update Top 10 status'))
    } finally {
      pendingTop10TogglesRef.current.delete(row.id)
      setTogglingTop10Ids(new Set(pendingTop10TogglesRef.current))
    }
  }, [toggleTop10Mutation, top10LimitReached])

  const handleToggleDisplay = useCallback(async (row) => {
    if (pendingDisplayTogglesRef.current.has(row.id)) return

    pendingDisplayTogglesRef.current.add(row.id)
    setTogglingDisplayIds(new Set(pendingDisplayTogglesRef.current))

    try {
      const response = await toggleDisplayMutation.mutateAsync(row.id)
      toast.success(response?.message || 'Display status updated')
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update display status'))
    } finally {
      pendingDisplayTogglesRef.current.delete(row.id)
      setTogglingDisplayIds(new Set(pendingDisplayTogglesRef.current))
    }
  }, [toggleDisplayMutation])

  const confirmDeleteRanker = async () => {
    if (!deleteTarget || deleting) return

    try {
      const response = await deleteTopperMutation.mutateAsync(deleteTarget.id)
      toast.success(response?.message || 'Topper deleted successfully')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete topper. Please try again.'))
    }
  }

  const saveRank = async () => {
    const wantsTop10 = rankForm.status === 'Active' && rankForm.isTop10

    if (wantsTop10 && top10Count >= MAX_TOP10_RANKERS) {
      toast.error('Maximum 10 Top Rankers allowed.')
      return
    }

    const errors = validateRankerForm(rankForm, { rankers })
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error('Please fix the highlighted fields')
      return
    }

    const imageFile = await prepareTopperImageForUpload(rankForm.image)
    if (!imageFile) {
      setFormErrors((prev) => ({ ...prev, image: 'Image is required.' }))
      toast.error('Please upload a topper image')
      return
    }

    const studentLookup = await lookupStudentByStudentId(rankForm.studentId)
    if (!studentLookup.ok) {
      setFormErrors((prev) => ({
        ...prev,
        studentId: studentLookup.message,
        studentName: '',
      }))
      toast.error(studentLookup.message)
      return
    }

    const verifiedForm = {
      ...rankForm,
      studentId: studentLookup.studentId,
      studentName: studentLookup.studentName,
    }

    try {
      const formData = buildTopperFormData(verifiedForm, {
        imageFile,
        includeImage: true,
      })

      const response = await createTopperMutation.mutateAsync(formData)
      toast.success(response?.message || 'Topper created successfully')
      closeRankForm()
    } catch (err) {
      const message = getApiErrorMessage(err, 'Failed to save ranker')
      if (/student not found/i.test(message)) {
        toast.error(
          'This Student ID is not registered. Add the student in Users → List Users first.',
        )
        setFormErrors((prev) => ({
          ...prev,
          studentId:
            'This Student ID is not registered. Add the student in Users → List Users first.',
        }))
        return
      }
      toast.error(message)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'studentId',
        label: 'Student ID',
        width: 108,
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap pl-4 sm:pl-6',
        cellClassName: cn(
          OVERFLOW_CELL,
          'pl-4 sm:pl-6 whitespace-nowrap font-mono text-xs font-semibold text-[#246392]',
        ),
      },
      {
        key: 'name',
        label: 'Student Name',
        width: 160,
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: OVERFLOW_CELL,
        render: (row) => (
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="truncate font-semibold text-[#111]" title={row.name}>
              {row.name}
            </span>
            {isActiveTop10Ranker(row) && <RankTop10Badge size="sm" />}
          </div>
        ),
      },
      {
        key: 'program',
        label: 'Program',
        width: 140,
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: cn(OVERFLOW_CELL, 'text-[13px] text-[#686868]'),
        render: (row) => (
          <span className="block truncate" title={row.program || row.course || '—'}>
            {row.program || row.course || '—'}
          </span>
        ),
      },
      {
        key: 'image',
        label: 'Image',
        width: 80,
        align: 'center',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle whitespace-nowrap text-center',
        render: (row) => <RankManagementImageCell name={row.name} imageUrl={row.imageUrl} />,
      },
      {
        key: 'rank',
        label: 'Rank',
        width: 88,
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle whitespace-nowrap',
        render: (row) => <RankBadge rank={row.rank} />,
      },
      {
        key: 'year',
        label: 'Year',
        width: 76,
        align: 'center',
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle whitespace-nowrap text-center text-[13px] text-[#686868]',
        render: (row) => row.year || '—',
      },
      {
        key: 'top10',
        label: 'Top 10',
        width: 96,
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle whitespace-nowrap',
        align: 'center',
        render: (row) => (
          <TopperTop10Toggle
            row={row}
            loading={togglingTop10Ids.has(row.id)}
            disabled={row.status !== 'Active' && !row.isTop10Enabled}
            onChange={() => handleToggleTop10(row)}
          />
        ),
      },
      {
        key: 'displayOrder',
        label: 'Top 10 Order',
        width: 108,
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle whitespace-nowrap',
        align: 'center',
        render: (row) =>
          isActiveTop10Ranker(row) ? (
            <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-900 ring-1 ring-amber-200/80">
              {row.displayOrder ?? '—'}
            </span>
          ) : (
            <span className="text-sm text-[#9ca0a8]">—</span>
          ),
      },
      {
        key: 'status',
        label: 'Display Status',
        width: 128,
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle whitespace-nowrap',
        align: 'center',
        render: (row) => (
          <TopperDisplayStatusToggle
            checked={row.status === 'Active'}
            loading={togglingDisplayIds.has(row.id)}
            topperName={row.name}
            onChange={() => handleToggleDisplay(row)}
          />
        ),
      },
      {
        key: 'showOnHomepage',
        label: 'Homepage',
        width: 104,
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle whitespace-nowrap text-center',
        align: 'center',
        render: (row) => (
          <span
            className={cn(
              'inline-flex min-w-[52px] items-center justify-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide',
              row.showOnHomepage
                ? 'bg-[#eef6fc] text-[#246392] ring-1 ring-[#55ace7]/25'
                : 'bg-[#f3f4f6] text-[#9ca0a8] ring-1 ring-[#e5e7eb]',
            )}
          >
            {row.showOnHomepage ? 'Yes' : 'No'}
          </span>
        ),
      },
      {
        key: 'homepageOrder',
        label: 'Homepage Order',
        width: 124,
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle whitespace-nowrap text-center',
        align: 'center',
        render: (row) =>
          row.showOnHomepage && row.homepageOrder != null ? (
            <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-[#eef6fc] px-2 py-0.5 text-xs font-bold text-[#246392] ring-1 ring-[#55ace7]/20">
              {row.homepageOrder}
            </span>
          ) : (
            <span className="text-sm text-[#9ca0a8]">—</span>
          ),
      },
      {
        key: 'toppersPageOrder',
        label: 'Toppers Page Order',
        width: 136,
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle whitespace-nowrap text-center',
        align: 'center',
        render: (row) =>
          row.status === 'Active' && row.toppersPageOrder != null ? (
            <span className="inline-flex min-w-[2rem] items-center justify-center rounded-full bg-[#eef6fc] px-2 py-0.5 text-xs font-bold text-[#246392] ring-1 ring-[#55ace7]/20">
              {row.toppersPageOrder}
            </span>
          ) : (
            <span className="text-sm text-[#9ca0a8]">—</span>
          ),
      },
      {
        key: 'created',
        label: 'Created On',
        width: 116,
        headerTruncate: false,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'align-middle whitespace-nowrap pr-2',
        render: (row) => (
          <span className="whitespace-nowrap text-[13px] font-medium text-[#686868]">
            {formatCreatedOn(row)}
          </span>
        ),
      },
      createActionsColumn({
        buttonCount: 2,
        align: 'right',
        render: (row) => (
          <RankerRowActions
            rowName={row.name}
            onView={() => setViewTarget(row)}
            onEdit={() => openEditRank(row)}
          />
        ),
      }),
    ],
    [
      top10LimitReached,
      rankers,
      togglingDisplayIds,
      togglingTop10Ids,
      handleToggleDisplay,
      handleToggleTop10,
    ],
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

      {isError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {getApiErrorMessage(error, 'Failed to load rankers.')}
          <button
            type="button"
            onClick={() => refetch()}
            className="ml-3 font-semibold underline"
          >
            Retry
          </button>
        </div>
      )}

      <RankManagementTable
        columns={columns}
        data={filteredRankers}
        loading={isLoading}
        emptyMessage="No Toppers Found"
        itemLabel="toppers"
        resetDeps={[search, selectedDate, statusFilter, top10Count, apiToppers.length]}
      />

      <WebsiteFormModal open={rankFormOpen} onClose={closeRankForm}>
        <WebsiteFormShell
          icon={GraduationCap}
          iconClassName="text-[#246392]"
          title="Add Ranker"
          sectionTitle="Ranker Details"
          closeVariant="icon"
          onGoBack={closeRankForm}
          onReset={() => {
            clearFormErrors()
            setRankForm(emptyRankForm())
          }}
          onSave={saveRank}
          saving={saving}
        >
          <RankerFormFields
            form={rankForm}
            setForm={setRankForm}
            formErrors={formErrors}
            setFormErrors={setFormErrors}
            clearFieldError={clearFieldError}
            top10LimitReached={top10LimitReached}
            requireRegisteredStudent
            rankers={rankers}
          />
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
                  ['Program', viewTarget.program || viewTarget.course],
                  ['Rank', viewTarget.rank],
                  ...(isActiveTop10Ranker(viewTarget)
                    ? [['Top 10 Order', viewTarget.displayOrder ?? '—']]
                    : []),
                  ['Show on Homepage', viewTarget.showOnHomepage ? 'Yes' : 'No'],
                  ...(viewTarget.showOnHomepage
                    ? [['Homepage Order', viewTarget.homepageOrder ?? '—']]
                    : []),
                  ['Toppers Page Order', viewTarget.toppersPageOrder ?? '—'],
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

      <AdminConfirmModal
        open={Boolean(deleteTarget)}
        title="Delete Topper"
        description="Are you sure you want to delete this topper? This action cannot be undone."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        loadingLabel="Deleting…"
        variant="danger"
        loading={deleting}
        onClose={() => {
          if (!deleting) setDeleteTarget(null)
        }}
        onConfirm={confirmDeleteRanker}
      />
    </div>
  )
}
