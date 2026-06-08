import { useEffect, useState } from 'react'
import { CreditCard } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import BookstoreStatusBadge from '../../components/bookstore/BookstoreStatusBadge'
import BookstoreModal, { BookstoreModalFooter } from '../../components/bookstore/modal/BookstoreModal'
import Button from '../../components/ui/Button'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import { fetchBookstorePayments } from '../../api/bookstoreAPI'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { toast } from '../../utils/toast'
import { BOOKSTORE_INPUT_CLASS, BOOKSTORE_LABEL_CLASS } from '../../components/bookstore/modal/bookstoreFormStyles'

export default function BookstorePaymentsPage() {
  const [payments, setPayments] = useState([])
  const [details, setDetails] = useState(null)
  const [refundTarget, setRefundTarget] = useState(null)
  const [refundAmount, setRefundAmount] = useState('')

  useEffect(() => {
    fetchBookstorePayments().then((res) => setPayments(res?.items || []))
  }, [])

  const columns = [
    { key: 'id', label: 'Txn ID' },
    { key: 'orderId', label: 'Order' },
    { key: 'gateway', label: 'Gateway' },
    { key: 'amount', label: 'Amount', render: (r) => formatINR(r.amount) },
    { key: 'status', label: 'Status', render: (r) => <BookstoreStatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2 text-sm font-semibold">
          <button type="button" className="text-[#7c5cbf]" onClick={() => setDetails(row)}>Details</button>
          {row.status === 'Success' && (
            <button type="button" className="text-red-600" onClick={() => { setRefundTarget(row); setRefundAmount(String(row.amount)) }}>Refund</button>
          )}
        </div>
      ),
    },
  ]

  return (
    <BookstorePageShell icon={CreditCard} title="Payment Management">
      <div className="mb-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#e5e0f0] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#686868]">Razorpay</p>
          <p className="text-sm text-[#111]">Integration placeholder — configure keys in System → API Integrations</p>
        </div>
        <div className="rounded-xl border border-[#e5e0f0] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#686868]">Cashfree</p>
          <p className="text-sm text-[#111]">Webhook & refund flows ready for wiring</p>
        </div>
      </div>
      <PaginatedFigmaTable columns={columns} data={payments} itemLabel="transactions" />

      <BookstoreModal open={Boolean(details)} onClose={() => setDetails(null)} title="Payment details" subtitle={details?.id} size="md">
        {details && (
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div><dt className={BOOKSTORE_LABEL_CLASS}>Order</dt><dd>{details.orderId}</dd></div>
            <div><dt className={BOOKSTORE_LABEL_CLASS}>Gateway</dt><dd>{details.gateway}</dd></div>
            <div><dt className={BOOKSTORE_LABEL_CLASS}>Amount</dt><dd className="font-bold">{formatINR(details.amount)}</dd></div>
            <div><dt className={BOOKSTORE_LABEL_CLASS}>Status</dt><dd><BookstoreStatusBadge status={details.status} /></dd></div>
            <div className="sm:col-span-2"><dt className={BOOKSTORE_LABEL_CLASS}>Reference</dt><dd className="font-mono text-xs">{details.txnId}</dd></div>
            <div className="sm:col-span-2"><dt className={BOOKSTORE_LABEL_CLASS}>Date</dt><dd>{formatCategoryDateTime(details.createdAt)}</dd></div>
          </dl>
        )}
      </BookstoreModal>

      <BookstoreModal
        open={Boolean(refundTarget)}
        onClose={() => setRefundTarget(null)}
        title="Process refund"
        subtitle={refundTarget?.orderId}
        size="md"
        footer={
          <BookstoreModalFooter>
            <Button variant="ghost" onClick={() => setRefundTarget(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => {
                toast.success(`Refund of ${formatINR(Number(refundAmount))} initiated`)
                setRefundTarget(null)
              }}
            >
              Confirm refund
            </Button>
          </BookstoreModalFooter>
        }
      >
        <label>
          <span className={BOOKSTORE_LABEL_CLASS}>Refund amount (₹)</span>
          <input type="number" className={BOOKSTORE_INPUT_CLASS} value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
        </label>
      </BookstoreModal>
    </BookstorePageShell>
  )
}
