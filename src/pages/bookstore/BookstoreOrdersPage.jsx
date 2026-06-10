import { useCallback, useEffect, useMemo, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import BookstoreFilterToolbar from '../../components/bookstore/BookstoreFilterToolbar'
import BookstoreStatusBadge from '../../components/bookstore/BookstoreStatusBadge'
import OrderDetailDrawer from '../../components/bookstore/OrderDetailDrawer'
import BookstoreModal, { BookstoreModalFooter } from '../../components/bookstore/modal/BookstoreModal'
import Button from '../../components/ui/Button'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import { fetchBookstoreOrders, updateBookstoreOrderStatus } from '../../api/bookstoreAPI'
import { formatINR } from '../../utils/financeFilters'
import { toast } from '../../utils/toast'
import { BOOKSTORE_INPUT_CLASS, BOOKSTORE_LABEL_CLASS } from '../../components/bookstore/modal/bookstoreFormStyles'

export default function BookstoreOrdersPage() {
  const [orders, setOrders] = useState([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [shipmentOpen, setShipmentOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState('Pending')
  const [shipmentId, setShipmentId] = useState('')

  const load = useCallback(async () => {
    const res = await fetchBookstoreOrders()
    setOrders(res?.items || [])
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return orders.filter((o) => {
      const matchQ = !q || [o.id, o.customerName].some((v) => String(v).toLowerCase().includes(q))
      const matchStatus = statusFilter === 'all' || o.status === statusFilter
      return matchQ && matchStatus
    })
  }, [orders, search, statusFilter])

  const handleStatus = async (id, status) => {
    await updateBookstoreOrderStatus(id, status)
    toast.success('Order updated')
    load()
    setSelected((prev) => (prev?.id === id ? { ...prev, status } : prev))
  }

  const applyStatusDialog = async () => {
    if (!selected) return
    await handleStatus(selected.id, pendingStatus)
    setStatusDialogOpen(false)
  }

  const applyShipment = () => {
    if (!selected) return
    setSelected({ ...selected, shipmentId: shipmentId || `SHP-${Date.now().toString().slice(-6)}` })
    toast.success('Shipment assigned')
    setShipmentOpen(false)
    setShipmentId('')
  }

  const columns = [
    { key: 'id', label: 'Order ID' },
    { key: 'customerName', label: 'Customer' },
    { key: 'total', label: 'Total', render: (r) => formatINR(r.total) },
    { key: 'status', label: 'Status', render: (r) => <BookstoreStatusBadge status={r.status} /> },
    { key: 'paymentStatus', label: 'Payment', render: (r) => <BookstoreStatusBadge status={r.paymentStatus} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button type="button" onClick={() => setSelected(row)} className="text-sm font-semibold text-[#7c5cbf]">
          View details
        </button>
      ),
    },
  ]

  return (
    <BookstorePageShell icon={ShoppingCart} title="Order Management">
      <BookstoreFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search orders…"
        filters={
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded-lg border border-[#e8e8e8] bg-white px-3 py-2 text-sm">
            <option value="all">All statuses</option>
            {['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        }
      />
      <PaginatedFigmaTable columns={columns} data={filtered} itemLabel="orders" />
      <OrderDetailDrawer
        order={selected}
        onClose={() => setSelected(null)}
        onStatusChange={handleStatus}
        onOpenStatusDialog={() => {
          setPendingStatus(selected?.status || 'Pending')
          setStatusDialogOpen(true)
        }}
        onOpenShipment={() => setShipmentOpen(true)}
      />

      <BookstoreModal
        open={statusDialogOpen}
        onClose={() => setStatusDialogOpen(false)}
        title="Update order status"
        subtitle={selected?.id}
        size="sm"
        footer={
          <BookstoreModalFooter>
            <Button variant="ghost" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
            <Button onClick={applyStatusDialog}>Update status</Button>
          </BookstoreModalFooter>
        }
      >
        <label>
          <span className={BOOKSTORE_LABEL_CLASS}>New status</span>
          <select className={BOOKSTORE_INPUT_CLASS} value={pendingStatus} onChange={(e) => setPendingStatus(e.target.value)}>
            {['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>
      </BookstoreModal>

      <BookstoreModal
        open={shipmentOpen}
        onClose={() => setShipmentOpen(false)}
        title="Assign shipment"
        subtitle="Link carrier tracking to this order"
        size="md"
        footer={
          <BookstoreModalFooter>
            <Button variant="ghost" onClick={() => setShipmentOpen(false)}>Cancel</Button>
            <Button onClick={applyShipment}>Assign</Button>
          </BookstoreModalFooter>
        }
      >
        <label>
          <span className={BOOKSTORE_LABEL_CLASS}>Shipment / tracking ID</span>
          <input className={BOOKSTORE_INPUT_CLASS} placeholder="e.g. SHP-7783" value={shipmentId} onChange={(e) => setShipmentId(e.target.value)} />
        </label>
      </BookstoreModal>
    </BookstorePageShell>
  )
}
