import { useMemo, useState } from 'react'
import { GraduationCap } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import { BannerButton } from '../../components/academics/AcademicsUi'
import WebsiteTabNav from '../../components/website/WebsiteTabNav'
import WebsiteFilterToolbar from '../../components/website/WebsiteFilterToolbar'
import WebsiteFormShell from '../../components/website/WebsiteFormShell'
import WebsiteFormModal from '../../components/website/WebsiteFormModal'
import YoutubeManagementTab from '../../components/website/YoutubeManagementTab'
import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'
import {
  DateTimeCell,
  RankerImageCell,
  TableRowActions,
  WebsiteField,
  WebsiteImageInput,
  WebsiteStatusBadge,
  WebsiteStatusSelect,
  websiteInputClass,
} from '../../components/website/websiteUi'
import {
  INITIAL_APP_REVIEWS,
  INITIAL_RANKERS,
} from '../../data/websiteData'
import { toast } from '@/utils/toast'

const TAB_META = {
  rank: {
    bannerTitle: 'Rankers',
    bannerIcon: GraduationCap,
    bannerIconClass: 'text-[#246392]',
    addLabel: 'Add Ranker',
    searchPlaceholder: 'Search Ranker',
    formTitle: 'Add Rank',
    formSection: 'Ranker Details',
    emptyMessage: 'No rankers found.',
    itemLabel: 'rankers',
  },
  review: {
    bannerTitle: 'App Review',
    bannerIcon: GraduationCap,
    bannerIconClass: 'text-[#246392]',
    addLabel: null,
    searchPlaceholder: 'Search By Name',
    emptyMessage: 'No app reviews found.',
    itemLabel: 'reviews',
  },
}

const emptyRankForm = () => ({
  id: String(56565 + Math.floor(Math.random() * 1000)),
  rankerName: '',
  image: '',
  rank: '',
  status: 'Active',
})

export default function WebsitePage() {
  const [activeTab, setActiveTab] = useState('youtube')
  const [rankFormOpen, setRankFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [rankers, setRankers] = useState(INITIAL_RANKERS)
  const [appReviews] = useState(INITIAL_APP_REVIEWS)

  const [search, setSearch] = useState('')
  const [dateFilter, setDateFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [rankForm, setRankForm] = useState(emptyRankForm)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const meta = TAB_META[activeTab]

  const resetFilters = () => {
    setSearch('')
    setDateFilter('all')
    setStatusFilter('all')
  }

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    setRankFormOpen(false)
    setEditingId(null)
    resetFilters()
  }

  const filteredRankers = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rankers.filter((row) => {
      const matchSearch =
        !q ||
        row.id.includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.rank.toLowerCase().includes(q)
      const matchDate = dateFilter === 'all' || row.dateBucket === dateFilter
      const matchStatus = statusFilter === 'all' || row.status === statusFilter
      return matchSearch && matchDate && matchStatus
    })
  }, [rankers, search, dateFilter, statusFilter])

  const filteredReviews = useMemo(() => {
    const q = search.trim().toLowerCase()
    return appReviews.filter((row) => {
      const matchSearch =
        !q ||
        row.id.includes(q) ||
        row.name.toLowerCase().includes(q) ||
        row.mobile.includes(q) ||
        row.review.toLowerCase().includes(q)
      const matchDate = dateFilter === 'all' || row.dateBucket === dateFilter
      return matchSearch && matchDate
    })
  }, [appReviews, search, dateFilter])

  const openAddRank = () => {
    setEditingId(null)
    setRankForm(emptyRankForm())
    setRankFormOpen(true)
  }

  const openEditRank = (row) => {
    setEditingId(row.id)
    setRankForm({
      id: row.id,
      rankerName: row.name,
      image: row.imageUrl || '',
      rank: row.rank,
      status: row.status || 'Active',
    })
    setRankFormOpen(true)
  }

  const closeRankForm = () => {
    setRankFormOpen(false)
    setEditingId(null)
  }

  const requestDeleteRanker = (row) => setDeleteTarget(row)

  const cancelDeleteRanker = () => {
    if (!deleting) setDeleteTarget(null)
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
    if (!rankForm.rankerName.trim() || !rankForm.rank.trim()) {
      toast.error('Please fill required fields')
      return
    }
    if (!rankForm.status) {
      toast.error('Please select a status')
      return
    }
    const payload = {
      id: rankForm.id,
      name: rankForm.rankerName.trim(),
      rank: rankForm.rank.trim(),
      imageUrl: rankForm.image || null,
      time: '10 AM',
      date: '14 May 2026',
      dateBucket: 'Today',
      status: rankForm.status,
    }
    if (editingId) {
      setRankers((prev) =>
        prev.map((r) => (r.id === editingId ? { ...r, ...payload } : r)),
      )
      toast.success('Ranker updated successfully')
    } else {
      setRankers((prev) => [payload, ...prev])
      toast.success('Ranker added successfully')
    }
    closeRankForm()
  }

  const rankColumns = [
    {
      key: 'id',
      label: 'ID',
      headerClassName: 'pl-6 sm:pl-8',
      cellClassName: 'pl-6 sm:pl-8 font-medium',
    },
    { key: 'name', label: 'Name', cellClassName: 'font-medium min-w-[120px]' },
    {
      key: 'image',
      label: 'Image',
      render: (row) => <RankerImageCell name={row.name} imageUrl={row.imageUrl} />,
    },
    { key: 'rank', label: 'Rank', cellClassName: 'font-semibold text-[#246392]' },
    {
      key: 'status',
      label: 'Status',
      cellClassName: 'whitespace-nowrap',
      render: (row) => <WebsiteStatusBadge status={row.status} />,
    },
    {
      key: 'created',
      label: 'Created On',
      render: (row) => <DateTimeCell time={row.time} date={row.date} />,
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <TableRowActions
          compact
          onEdit={() => openEditRank(row)}
          onDelete={() => requestDeleteRanker(row)}
        />
      ),
    },
  ]

  const reviewColumns = [
    {
      key: 'id',
      label: 'ID',
      headerClassName: 'pl-6 sm:pl-8',
      cellClassName: 'pl-6 sm:pl-8 font-medium',
    },
    { key: 'name', label: 'Name', cellClassName: 'font-medium' },
    { key: 'mobile', label: 'Mobile', cellClassName: 'whitespace-nowrap' },
    { key: 'rating', label: 'Rating', cellClassName: 'font-semibold' },
    { key: 'review', label: 'Review' },
    {
      key: 'date',
      label: 'Date',
      render: (row) => <DateTimeCell time={row.time} date={row.date} />,
    },
    {
      key: 'action',
      label: 'Action',
      render: () => <span className="text-[#9ca0a8]">—</span>,
    },
  ]

  const tableConfig = {
    rank: { data: filteredRankers, columns: rankColumns },
    review: { data: filteredReviews, columns: reviewColumns },
  }

  const otherTab = activeTab !== 'youtube' ? tableConfig[activeTab] : null

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-6 sm:space-y-7">
        <WebsiteTabNav active={activeTab} onChange={handleTabChange} />

        {activeTab === 'youtube' && <YoutubeManagementTab />}

        {otherTab && (
          <>
            <PageBanner
              icon={meta.bannerIcon}
              iconClassName={meta.bannerIconClass}
              title={meta.bannerTitle}
              className="min-h-[64px] rounded-xl from-[#55ace7] via-[#8b98bb] to-[#df8284] shadow-[0_5px_16px_rgba(15,23,42,0.1)]"
            >
              {meta.addLabel && (
                <BannerButton onClick={openAddRank}>{meta.addLabel}</BannerButton>
              )}
            </PageBanner>

            <WebsiteFilterToolbar
              search={search}
              onSearchChange={(e) => setSearch(e.target.value)}
              searchPlaceholder={meta.searchPlaceholder}
              dateRange={dateFilter}
              onDateRangeChange={(e) => setDateFilter(e.target.value)}
              statusFilter={statusFilter}
              onStatusFilterChange={(e) => setStatusFilter(e.target.value)}
              showStatusFilter={activeTab === 'rank'}
            />

            <PaginatedFigmaTable
              columns={otherTab.columns}
              data={otherTab.data}
              emptyMessage={meta.emptyMessage}
              itemLabel={meta.itemLabel}
              initialPageSize={6}
              resetDeps={[activeTab, search, dateFilter, statusFilter]}
              density="compact"
              className="rounded-xl shadow-[0_11px_25px_rgba(15,23,42,0.07)]"
            />
          </>
        )}
      </section>

      <WebsiteFormModal open={rankFormOpen} onClose={closeRankForm}>
        <WebsiteFormShell
          icon={GraduationCap}
          iconClassName="text-[#246392]"
          title={TAB_META.rank.formTitle}
          sectionTitle={TAB_META.rank.formSection}
          onGoBack={closeRankForm}
          onReset={() => setRankForm(emptyRankForm())}
          onSave={saveRank}
        >
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <WebsiteField label="ID">
              <input
                type="text"
                value={rankForm.id}
                onChange={(e) => setRankForm((f) => ({ ...f, id: e.target.value }))}
                className={websiteInputClass}
              />
            </WebsiteField>
            <WebsiteField label="Ranker Name" required>
              <input
                type="text"
                value={rankForm.rankerName}
                onChange={(e) => setRankForm((f) => ({ ...f, rankerName: e.target.value }))}
                className={websiteInputClass}
              />
            </WebsiteField>
            <WebsiteField label="Image" required>
              <WebsiteImageInput
                id="ranker-image"
                value={rankForm.image}
                onChange={(val) => setRankForm((f) => ({ ...f, image: val }))}
              />
            </WebsiteField>
            <WebsiteField label="Status" required>
              <WebsiteStatusSelect
                id="ranker-status"
                value={rankForm.status}
                onChange={(e) => setRankForm((f) => ({ ...f, status: e.target.value }))}
                required
              />
            </WebsiteField>
          </div>
          <WebsiteField label="Rank" className="max-w-md" required>
            <input
              type="text"
              value={rankForm.rank}
              onChange={(e) => setRankForm((f) => ({ ...f, rank: e.target.value }))}
              className={websiteInputClass}
              placeholder="e.g. AIR 4"
            />
          </WebsiteField>
        </WebsiteFormShell>
      </WebsiteFormModal>

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete Ranker"
        message="Are you sure you want to delete this ranker?"
        onCancel={cancelDeleteRanker}
        onConfirm={confirmDeleteRanker}
        loading={deleting}
        confirmLabel="Delete"
      />
    </div>
  )
}
