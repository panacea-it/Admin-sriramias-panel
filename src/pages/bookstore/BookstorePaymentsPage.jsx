import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { CreditCard } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import BookstoreStatusBadge from '../../components/bookstore/BookstoreStatusBadge'
import PaymentsTable from '../../components/bookstore/PaymentsTable'
import PaymentRowActions from '../../components/bookstore/PaymentRowActions'
import BookstoreModal, { BookstoreModalFooter } from '../../components/bookstore/modal/BookstoreModal'
import Button from '../../components/ui/Button'
import { fetchBookstorePayments } from '../../api/bookstoreAPI'
import { formatINR } from '../../utils/financeFilters'
import { toast } from '../../utils/toast'
import { withPaymentsDisplayFields, updateMockPaymentStatus } from '../../utils/bookstorePaymentDisplay'
import { BOOKSTORE_INPUT_CLASS, BOOKSTORE_LABEL_CLASS } from '../../components/bookstore/modal/bookstoreFormStyles'

function PaymentDetailField({ label, children }) {
  return (
    <div className="min-w-0">
      <dt className={BOOKSTORE_LABEL_CLASS}>{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-[#111]">{children}</dd>
    </div>
  )
}

export default function BookstorePaymentsPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [details, setDetails] = useState(null)
  const [refundTarget, setRefundTarget] = useState(null)
  const [refundAmount, setRefundAmount] = useState('')
  const refundTimersRef = useRef([])

  useEffect(() => {
    setLoading(true)
    fetchBookstorePayments()
      .then((res) => setPayments(res?.items || []))
      .finally(() => setLoading(false))
  }, [])

  useEffect(
    () => () => {
      refundTimersRef.current.forEach((timerId) => window.clearTimeout(timerId))
      refundTimersRef.current = []
    },
    [],
  )

  const applyPaymentStatus = useCallback((paymentId, status) => {
    setPayments((prev) =>
      prev.map((payment) => (payment.id === paymentId ? { ...payment, status } : payment)),
    )
    setDetails((prev) => (prev?.id === paymentId ? { ...prev, status } : prev))
    updateMockPaymentStatus(paymentId, status)
  }, [])

  const handleConfirmRefund = useCallback(() => {
    if (!refundTarget) return

    const paymentId = refundTarget.id
    const amount = Number(refundAmount)

    applyPaymentStatus(paymentId, 'REFUND_INITIATED')
    toast.success(`Refund of ${formatINR(amount)} initiated`)
    setRefundTarget(null)

    const timerId = window.setTimeout(() => {
      setPayments((prev) => {
        const payment = prev.find((p) => p.id === paymentId)
        if (payment?.status !== 'REFUND_INITIATED') return prev
        return prev.map((p) => (p.id === paymentId ? { ...p, status: 'REFUNDED' } : p))
      })
      setDetails((prev) =>
        prev?.id === paymentId && prev?.status === 'REFUND_INITIATED'
          ? { ...prev, status: 'REFUNDED' }
          : prev,
      )
      updateMockPaymentStatus(paymentId, 'REFUNDED')
      refundTimersRef.current = refundTimersRef.current.filter((id) => id !== timerId)
    }, 3000)

    refundTimersRef.current.push(timerId)
  }, [applyPaymentStatus, refundAmount, refundTarget])

  const displayPayments = useMemo(
    () => withPaymentsDisplayFields(payments),
    [payments],
  )

  const renderRowActions = useCallback(
    (row) => (
      <PaymentRowActions
        paymentId={row.id}
        canRefund={row.status === 'Success'}
        onDetails={() => setDetails(row)}
        onRefund={() => {
          setRefundTarget(row)
          setRefundAmount(String(row.amount))
        }}
      />
    ),
    [],
  )

  return (
    <BookstorePageShell icon={CreditCard} title="Payment Management">
      <div className="mb-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[#e5e0f0] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#686868]">Razorpay</p>
          <p className="text-sm text-[#111]">Integration placeholder — configure keys in System → API Integrations</p>
        </div>
        <div className="rounded-xl border border-[#e5e0f0] bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold text-[#686868]">Cashfree</p>
          <p className="text-sm text-[#111]">Webhook & refund flows ready for wiring</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
        <div className="min-w-0 rounded-xl border border-slate-100">
          <PaymentsTable
            payments={displayPayments}
            loading={loading}
            renderActions={renderRowActions}
          />
        </div>
      </div>

      <BookstoreModal
        open={Boolean(details)}
        onClose={() => setDetails(null)}
        title="Payment details"
        subtitle={details?.id}
        size="md"
        footer={
          details && (
            <BookstoreModalFooter>
              <Button variant="ghost" onClick={() => setDetails(null)}>Close</Button>
            </BookstoreModalFooter>
          )
        }
      >
        {details && (
          <dl className="grid gap-5 sm:grid-cols-2">
            <PaymentDetailField label="Transaction ID">
              <span className="font-semibold text-[#246392]">{details.id}</span>
            </PaymentDetailField>
            <PaymentDetailField label="Order ID">{details.orderId}</PaymentDetailField>
            <PaymentDetailField label="Customer Name">{details.customerName}</PaymentDetailField>
            <PaymentDetailField label="Book Name">{details.bookName}</PaymentDetailField>
            <PaymentDetailField label="Payment Gateway">{details.gateway}</PaymentDetailField>
            <PaymentDetailField label="Amount">
              <span className="font-bold tabular-nums">{formatINR(details.amount)}</span>
            </PaymentDetailField>
            <PaymentDetailField label="Payment Status">
              <BookstoreStatusBadge status={details.status} />
            </PaymentDetailField>
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
              onClick={handleConfirmRefund}
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
