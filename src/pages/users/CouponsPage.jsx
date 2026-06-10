<<<<<<< HEAD
import { useCallback, useMemo, useState } from 'react'
import { Layers, Star } from 'lucide-react'
=======
import { useMemo, useState } from 'react'
import { Edit3, Layers, Star, Trash2 } from 'lucide-react'
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import CouponFilterToolbar from '../../components/coupons/CouponFilterToolbar'
import AddCouponModal from '../../components/coupons/AddCouponModal'
<<<<<<< HEAD
import CouponTableActions from '../../components/coupons/CouponTableActions'
import CouponsBulkActionsBar from '../../components/coupons/CouponsBulkActionsBar'
import ConfirmCouponDeleteModal from '../../components/coupons/ConfirmCouponDeleteModal'
import ConfirmCouponStatusModal from '../../components/coupons/ConfirmCouponStatusModal'
import ViewCouponModal from '../../components/coupons/ViewCouponModal'
import { BannerButton, StatusBadge } from '../../components/academics/AcademicsUi'
import { useTableRowSelection } from '../../hooks/useTableRowSelection'
import {
  createCoupon,
  deleteCoupon,
  loadCoupons,
  updateCoupon,
  updateCouponStatus,
} from '../../utils/couponsStorage'

export default function CouponsPage() {
  const [coupons, setCoupons] = useState(() => loadCoupons())
=======
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
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [addOpen, setAddOpen] = useState(false)
<<<<<<< HEAD
  const [editingCoupon, setEditingCoupon] = useState(null)
  const [viewingCoupon, setViewingCoupon] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [bulkDisableIds, setBulkDisableIds] = useState(null)
  const [bulkDeleteIds, setBulkDeleteIds] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [actionCouponId, setActionCouponId] = useState(null)

  const { selectedIds, selection, clearSelection } = useTableRowSelection((row) => row.id)

  const refresh = useCallback(() => {
    setCoupons(loadCoupons())
  }, [])
=======
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa

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

<<<<<<< HEAD
  const selectedActiveCount = useMemo(
    () => coupons.filter((c) => selectedIds.includes(c.id) && c.status === 'Active').length,
    [coupons, selectedIds],
  )

  const handleAddOrUpdate = (form, editing) => {
    if (editing) {
      const result = updateCoupon(editing.id, form)
      if (!result.ok) {
        toast.error(result.reason || 'Failed to update coupon')
        return
      }
    } else {
      const result = createCoupon(form)
      if (!result.ok) {
        toast.error(result.reason || 'Failed to create coupon')
        return
      }
    }
    refresh()
    setEditingCoupon(null)
  }

  const confirmStatusChange = async () => {
    if (bulkDisableIds?.length) {
      setStatusLoading(true)
      let successCount = 0
      for (const id of bulkDisableIds) {
        const coupon = coupons.find((c) => c.id === id && c.status === 'Active')
        if (!coupon) continue
        const result = updateCouponStatus(id, false)
        if (result.ok) successCount += 1
      }
      if (successCount > 0) {
        toast.success(
          successCount === 1 ? 'Coupon disabled' : `${successCount} coupons disabled`,
        )
        refresh()
      }
      setBulkDisableIds(null)
      clearSelection()
      setStatusLoading(false)
      return
    }

    if (!statusTarget || statusLoading) return
    const enabling = statusTarget.status !== 'Active'

    setStatusLoading(true)
    setActionCouponId(statusTarget.id)

    try {
      const result = updateCouponStatus(statusTarget.id, enabling)
      if (!result.ok) {
        toast.error(result.reason || 'Failed to update coupon status')
        return
      }
      toast.success(enabling ? 'Coupon enabled successfully' : 'Coupon disabled successfully')
      setStatusTarget(null)
      refresh()
    } catch {
      toast.error('Failed to update coupon status')
    } finally {
      setStatusLoading(false)
      setActionCouponId(null)
    }
  }

  const confirmDelete = async () => {
    if (bulkDeleteIds?.length) {
      setDeleteLoading(true)
      let successCount = 0
      for (const id of bulkDeleteIds) {
        const result = deleteCoupon(id)
        if (result.ok) successCount += 1
      }
      if (successCount > 0) {
        toast.success(
          successCount === 1 ? 'Coupon deleted' : `${successCount} coupons deleted`,
        )
        refresh()
      }
      setBulkDeleteIds(null)
      clearSelection()
      setDeleteLoading(false)
      return
    }

    if (!deleteTarget || deleteLoading) return

    setDeleteLoading(true)
    setActionCouponId(deleteTarget.id)

    try {
      const result = deleteCoupon(deleteTarget.id)
      if (!result.ok) {
        toast.error(result.reason || 'Failed to delete coupon')
        return
      }
      toast.success('Coupon deleted successfully')
      setDeleteTarget(null)
      refresh()
    } catch {
      toast.error('Failed to delete coupon')
    } finally {
      setDeleteLoading(false)
      setActionCouponId(null)
    }
=======
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
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
  }

  const columns = [
    {
      key: 'name',
      label: 'Coupon Name',
      headerClassName: 'pl-6 sm:pl-10',
      cellClassName: 'pl-6 sm:pl-10',
      render: (row) => (
<<<<<<< HEAD
        <span className="flex items-center gap-1.5 truncate font-medium">
          {row.topPerforming && (
            <Star className="h-4 w-4 shrink-0 fill-[#69df66] text-[#69df66]" strokeWidth={0} />
          )}
          {row.name}
        </span>
=======
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="h-6 w-6 shrink-0 rounded bg-[#cbeeff]" />
          <span className="flex items-center gap-1.5 truncate font-medium">
            {row.topPerforming && (
              <Star className="h-4 w-4 shrink-0 fill-[#69df66] text-[#69df66]" strokeWidth={0} />
            )}
            {row.name}
          </span>
        </div>
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
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
<<<<<<< HEAD
        <CouponTableActions
          row={row}
          disabled={actionCouponId === row.id && (statusLoading || deleteLoading)}
          onView={() => setViewingCoupon(row)}
          onEdit={() => {
            setEditingCoupon(row)
            setAddOpen(true)
          }}
          onStatusToggle={() => setStatusTarget(row)}
          onDelete={() => setDeleteTarget(row)}
        />
=======
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
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
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
<<<<<<< HEAD
          <BannerButton
            onClick={() => {
              setEditingCoupon(null)
              setAddOpen(true)
            }}
          >
            Add Coupon
          </BannerButton>
=======
          <BannerButton onClick={() => setAddOpen(true)}>Add Coupon</BannerButton>
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
        </PageBanner>

        <CouponFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          type={typeFilter}
          onTypeChange={(e) => setTypeFilter(e.target.value)}
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
        />

<<<<<<< HEAD
        {selectedIds.length > 0 && (
          <CouponsBulkActionsBar
            count={selectedIds.length}
            disableCount={selectedActiveCount}
            onDisable={() => setBulkDisableIds([...selectedIds])}
            onDelete={() => setBulkDeleteIds([...selectedIds])}
          />
        )}

=======
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          emptyMessage="No coupons match your filters."
          itemLabel="coupons"
          resetDeps={[search, typeFilter, statusFilter]}
<<<<<<< HEAD
          selection={selection}
=======
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
          rowClassName="hover:bg-slate-50/90"
        />
      </section>

<<<<<<< HEAD
      <AddCouponModal
        open={addOpen}
        onClose={() => {
          setAddOpen(false)
          setEditingCoupon(null)
        }}
        onSubmit={handleAddOrUpdate}
        editingCoupon={editingCoupon}
      />

      <ViewCouponModal
        open={Boolean(viewingCoupon)}
        onClose={() => setViewingCoupon(null)}
        coupon={viewingCoupon}
      />

      <ConfirmCouponStatusModal
        open={Boolean(statusTarget) || Boolean(bulkDisableIds?.length)}
        enabling={bulkDisableIds?.length ? false : statusTarget?.status !== 'Active'}
        bulkCount={bulkDisableIds?.length || 0}
        loading={statusLoading}
        onCancel={() => {
          if (!statusLoading) {
            setStatusTarget(null)
            setBulkDisableIds(null)
          }
        }}
        onConfirm={confirmStatusChange}
      />

      <ConfirmCouponDeleteModal
        open={Boolean(deleteTarget) || Boolean(bulkDeleteIds?.length)}
        couponName={deleteTarget?.name}
        bulkCount={bulkDeleteIds?.length || 0}
        loading={deleteLoading}
        onCancel={() => {
          if (!deleteLoading) {
            setDeleteTarget(null)
            setBulkDeleteIds(null)
          }
        }}
        onConfirm={confirmDelete}
      />
=======
      <AddCouponModal open={addOpen} onClose={() => setAddOpen(false)} onSubmit={handleAdd} />
>>>>>>> 4185d49110002a815987530cf3361644412d6bfa
    </div>
  )
}
