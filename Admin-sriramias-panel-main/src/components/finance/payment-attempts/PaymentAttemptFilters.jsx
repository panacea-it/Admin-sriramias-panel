import FinanceSearchInput from '../FinanceSearchInput'
import { PAYMENT_FAILURE_CATEGORIES, FRAUD_RISK_STATUSES, RECOVERY_STATUSES } from '../../../constants/paymentAttemptConstants'

const GATEWAY_OPTIONS = ['all', 'Razorpay', 'Cashfree', 'PayU']

export default function PaymentAttemptFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  modeFilter,
  onModeChange,
  gatewayFilter,
  onGatewayChange,
  failureFilter,
  onFailureChange,
  recoveryFilter,
  onRecoveryChange,
  fraudFilter,
  onFraudChange,
  fraudOnly,
  onFraudOnlyChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  className,
}) {
  const selectClass =
    'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'

  return (
    <div className={className}>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <FinanceSearchInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search student, phone, txn…"
          className="sm:col-span-2"
        />
        <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className={selectClass} aria-label="Status">
          <option value="all">All statuses</option>
          <option value="Success">Success</option>
          <option value="Failed">Failed</option>
        </select>
        <select value={modeFilter} onChange={(e) => onModeChange(e.target.value)} className={selectClass} aria-label="Payment mode">
          <option value="all">All modes</option>
          <option value="UPI">UPI</option>
          <option value="Card">Card</option>
          <option value="Bank Transfer">Bank Transfer</option>
        </select>
        <select value={gatewayFilter} onChange={(e) => onGatewayChange(e.target.value)} className={selectClass} aria-label="Gateway">
          {GATEWAY_OPTIONS.map((g) => (
            <option key={g} value={g}>{g === 'all' ? 'All gateways' : g}</option>
          ))}
        </select>
        <select value={failureFilter} onChange={(e) => onFailureChange(e.target.value)} className={selectClass} aria-label="Failure reason">
          <option value="all">All failure reasons</option>
          {PAYMENT_FAILURE_CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={recoveryFilter} onChange={(e) => onRecoveryChange(e.target.value)} className={selectClass} aria-label="Recovery status">
          <option value="all">All recovery</option>
          {RECOVERY_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={fraudFilter} onChange={(e) => onFraudChange(e.target.value)} className={selectClass} aria-label="Fraud status">
          <option value="all">All device/IP</option>
          {FRAUD_RISK_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} className={selectClass} aria-label="From date" />
        <input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} className={selectClass} aria-label="To date" />
      </div>
      <label className="mt-3 flex items-center gap-2 text-sm text-[#686868]">
        <input
          type="checkbox"
          checked={fraudOnly}
          onChange={(e) => onFraudOnlyChange(e.target.checked)}
          className="rounded border-slate-300 text-[#246392] focus:ring-[#55ace7]"
        />
        Show fraud-flagged only
      </label>
      <p className="mt-2 text-xs text-[#686868]">Scroll horizontally on small screens for full table →</p>
    </div>
  )
}
