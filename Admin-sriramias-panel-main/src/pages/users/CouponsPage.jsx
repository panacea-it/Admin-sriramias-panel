import { useMemo, useState } from 'react'
import { Edit3, Layers, Star, Trash2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import CouponFilterToolbar from '../../components/coupons/CouponFilterToolbar'
import AddCouponModal from '../../components/coupons/AddCouponModal'
import { BannerButton, StatusBadge } from '../../components/academics/AcademicsUi'
import { INITIAL_COUPONS } from '../../data/couponsData'

function formatDateInput(iso) {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  if (!y) return iso
  return `${d}/${m}/${y}`
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState(INITIAL_COUPONS)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return coupons.filter((row) => {
      const matchSearch =
        !q ||
        row.name.toLowerCase().includes(q) ||
        row.type.toLowerCase().includes(q)
      const matchType = typeFilter === 'all' || row.type === typeFilter
      const matchStatus = statusFilter === 'all' || row.status === statusFilter
      return matchSearch && matchType && matchStatus
    })
  }, [coupons, search, typeFilter, statusFilter])

  const handleAdd = (form) => {
    setCoupons((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: form.couponName,
        type: form.type,
        redemptions: 0,
        expiresOn: formatDateInput(form.validTill),
        status: 'Active',
        topPerforming: false,
      },
    ])
  }

  const handleDelete = (id) => {
    setCoupons((prev) => prev.filter((c) => c.id !== id))
    toast.success('Coupon deleted')
  }

  const columns = [
    {
      key: 'name',
      label: 'Coupon Name',
      headerClassName: 'pl-6 sm:pl-10',
      cellClassName: 'pl-6 sm:pl-10',
      render: (row) => (
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="h-6 w-6 shrink-0 rounded bg-[#cbeeff]" />
          <span className="flex items-center gap-1.5 truncate font-medium">
            {row.topPerforming && (
              <Star className="h-4 w-4 shrink-0 fill-[#69df66] text-[#69df66]" strokeWidth={0} />
            )}
            {row.name}
          </span>
        </div>
      ),
    },
    { key: 'type', label: 'Type' },
    {
      key: 'redemptions',
      label: 'Redemptions',
      render: (row) => <span>{row.redemptions.toLocaleString()}</span>,
    },
    { key: 'expiresOn', label: 'Expires On' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'actions',
      label: 'Action',
      render: (row) => (
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-medium text-[#686868] hover:text-[#246392]"
          >
            <Edit3 className="h-4 w-4" strokeWidth={2.35} />
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.id)}
            className="inline-flex items-center gap-2 text-sm font-medium text-[#c96565] hover:text-[#b94b4b]"
          >
            <Trash2 className="h-4 w-4" strokeWidth={2.1} />
            Delete
          </button>
        </div>
      ),
    },
  ]

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={Layers}
          iconClassName="text-[#dc2626]"
          title="Coupons"
          className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
        >
          <BannerButton onClick={() => setAddOpen(true)}>Add Coupon</BannerButton>
        </PageBanner>

        <CouponFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          type={typeFilter}
          onTypeChange={(e) => setTypeFilter(e.target.value)}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
        />

        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          emptyMessage="No coupons match your filters."
          itemLabel="coupons"
          resetDeps={[search, typeFilter, statusFilter]}
          rowClassName="hover:bg-slate-50/90"
        />
      </section>

      <AddCouponModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdd} />
    </div>
  )
}
