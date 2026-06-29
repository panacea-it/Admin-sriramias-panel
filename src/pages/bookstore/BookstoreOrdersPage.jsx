import { useCallback, useMemo, useState } from 'react'
import { ShoppingCart } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import OrderDetailDrawer from '../../components/bookstore/OrderDetailDrawer'
import OrdersTable from '../../components/bookstore/OrdersTable'
import OrderRowActions from '../../components/bookstore/OrderRowActions'
import BookstoreModal, { BookstoreModalFooter } from '../../components/bookstore/modal/BookstoreModal'
import CourseFilterToolbar from '../../components/courses/CourseFilterToolbar'
import Button from '../../components/ui/Button'
import {
  useBookstoreOrdersList,
  useUpdateBookstoreOrderShipment,
  useUpdateBookstoreOrderStatus,
} from '../../hooks/bookstore/useBookstoreOrders'
import { toast } from '../../utils/toast'
import { getApiErrorMessage } from '../../utils/apiError'
import { BOOKSTORE_INPUT_CLASS, BOOKSTORE_LABEL_CLASS } from '../../components/bookstore/modal/bookstoreFormStyles'

const ORDER_STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'Pending', label: 'Pending' },
  { value: 'Confirmed', label: 'Confirmed' },
  { value: 'Packed', label: 'Packed' },
  { value: 'Shipped', label: 'Shipped' },
  { value: 'Delivered', label: 'Delivered' },
  { value: 'Cancelled', label: 'Cancelled' },
]

export default function BookstoreOrdersPage() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selected, setSelected] = useState(null)
  const [statusDialogOpen, setStatusDialogOpen] = useState(false)
  const [shipmentOpen, setShipmentOpen] = useState(false)
  const [pendingStatus, setPendingStatus] = useState('Pending')
  const [shipmentId, setShipmentId] = useState('')

  const listParams = useMemo(
    () => ({
      search,
      orderStatus: statusFilter,
      limit: 100,
    }),
    [search, statusFilter],
  )

  const { data, isLoading, refetch } = useBookstoreOrdersList(listParams)
  const updateStatusMutation = useUpdateBookstoreOrderStatus()
  const updateShipmentMutation = useUpdateBookstoreOrderShipment()

  const orders = data?.items || []
  const loading = isLoading

  const filtered = orders

  const handleStatus = async (id, status) => {
    try {
      const updated = await updateStatusMutation.mutateAsync({ orderId: id, status })
      toast.success('Order updated')
      setSelected((prev) =>
        prev?.id === id ? { ...prev, ...(updated || {}), status } : prev,
      )
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to update order status.'))
    }
  }

  const applyStatusDialog = async () => {
    if (!selected) return
    await handleStatus(selected.id, pendingStatus)
    setStatusDialogOpen(false)
  }

  const applyShipment = async () => {
    if (!selected) return

    const resolvedShipmentId = shipmentId.trim() || `SHP-${Date.now().toString().slice(-6)}`

    try {
      const updated = await updateShipmentMutation.mutateAsync({
        orderId: selected.id,
        shipmentId: resolvedShipmentId,
      })
      setSelected((prev) =>
        prev?.id === selected.id
          ? { ...prev, ...(updated || {}), shipmentId: resolvedShipmentId }
          : prev,
      )
      toast.success('Shipment assigned')
      setShipmentOpen(false)
      setShipmentId('')
      refetch()
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to assign shipment.'))
    }
  }

  const renderRowActions = useCallback(
    (row) => (
      <OrderRowActions orderId={row.id} onView={() => setSelected(row)} />
    ),
    [],
  )

  return (
    <BookstorePageShell icon={ShoppingCart} title="Order Management">
      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
        <CourseFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search orders by ID or customer…"
          status={statusFilter}
          onStatusChange={(e) => setStatusFilter(e.target.value)}
          statusOptions={ORDER_STATUS_OPTIONS}
          disabled={loading && orders.length === 0}
        />

        <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
          <OrdersTable
            orders={filtered}
            loading={loading}
            resetDeps={[search, statusFilter]}
            renderActions={renderRowActions}
          />
        </div>
      </div>

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
