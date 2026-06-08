import Button from '../ui/Button'
import BookstoreDrawer from './modal/BookstoreDrawer'
import { BookstoreModalFooter } from './modal/BookstoreModal'
import BookstoreStatusBadge from './BookstoreStatusBadge'
import { formatINR } from '../../utils/financeFilters'
import { BOOKSTORE_INPUT_CLASS, BOOKSTORE_LABEL_CLASS } from './modal/bookstoreFormStyles'

export default function OrderDetailDrawer({
  order,
  onClose,
  onStatusChange,
  onOpenShipment,
  onOpenStatusDialog,
}) {
  return (
    <BookstoreDrawer
      open={Boolean(order)}
      onClose={onClose}
      title={order ? `Order ${order.id}` : 'Order'}
      subtitle={order?.customerName}
      footer={
        order && (
          <BookstoreModalFooter>
            <Button type="button" variant="secondary" onClick={onOpenStatusDialog}>
              Update status
            </Button>
            <Button type="button" onClick={onOpenShipment}>
              Assign shipment
            </Button>
          </BookstoreModalFooter>
        )
      }
    >
      {order && (
        <div className="space-y-5">
          <div>
            <p className={BOOKSTORE_LABEL_CLASS}>Customer</p>
            <p className="font-medium text-[#111]">{order.customerName}</p>
            <p className="text-sm text-[#686868]">{order.email}</p>
          </div>
          <div className="flex flex-wrap gap-4">
            <div>
              <p className={BOOKSTORE_LABEL_CLASS}>Order status</p>
              <BookstoreStatusBadge status={order.status} />
            </div>
            <div>
              <p className={BOOKSTORE_LABEL_CLASS}>Payment</p>
              <BookstoreStatusBadge status={order.paymentStatus} />
            </div>
          </div>
          <div>
            <p className={BOOKSTORE_LABEL_CLASS}>Items</p>
            <ul className="mt-2 space-y-2">
              {order.items?.map((item) => (
                <li key={item.productId} className="rounded-lg border border-[#eef0f4] bg-[#fafbfc] px-3 py-2.5 text-sm">
                  <span className="font-medium">{item.name}</span>
                  <span className="text-[#686868]"> × {item.qty}</span>
                  <span className="float-right font-semibold">{formatINR(item.price * item.qty)}</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="text-lg font-bold text-[#111]">Total: {formatINR(order.total)}</p>
          {order.shipmentId && (
            <p className="text-sm text-[#686868]">
              Shipment ID: <span className="font-mono font-medium text-[#111]">{order.shipmentId}</span>
            </p>
          )}
          <label className="block">
            <span className={BOOKSTORE_LABEL_CLASS}>Quick status change</span>
            <select
              className={BOOKSTORE_INPUT_CLASS}
              value={order.status}
              onChange={(e) => onStatusChange?.(order.id, e.target.value)}
            >
              {['Pending', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </label>
        </div>
      )}
    </BookstoreDrawer>
  )
}
