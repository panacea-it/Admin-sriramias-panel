import { useMemo, useState } from 'react'
import { History, Search, ChevronDown } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import PaymentAttemptLogsTable from '../../components/bookstore/PaymentAttemptLogsTable'
import { useBookstorePaymentAttemptsList } from '../../hooks/bookstore/useBookstorePaymentAttempts'
import { PAYMENT_FAILURE_CATEGORIES } from '../../constants/paymentAttemptConstants'
import { cn } from '../../utils/cn'

const FAILURE_OPTIONS = [
  { value: 'all', label: 'All failure reasons' },
  ...PAYMENT_FAILURE_CATEGORIES.map((c) => ({ value: c, label: c })),
]

export default function BookstorePaymentAttemptLogsPage() {
  const [search, setSearch] = useState('')
  const [failureFilter, setFailureFilter] = useState('all')

  const listParams = useMemo(
    () => ({
      search,
      failureReason: failureFilter,
      limit: 100,
    }),
    [search, failureFilter],
  )

  const { data, isLoading } = useBookstorePaymentAttemptsList(listParams)

  const attempts = data?.items || []
  const loading = isLoading

  return (
    <BookstorePageShell icon={History} title="Payment Attempt Logs">
      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
        <div className="mb-5 flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
          <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180] sm:left-4" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by attempt ID, student, contact, or book…"
              disabled={loading && attempts.length === 0}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-[#222] outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20 disabled:opacity-60 sm:pl-11"
            />
          </div>

          <div className="relative w-full sm:w-auto sm:min-w-[190px]">
            <select
              value={failureFilter}
              onChange={(e) => setFailureFilter(e.target.value)}
              aria-label="Failure reason filter"
              disabled={loading && attempts.length === 0}
              className={cn(
                'h-10 w-full min-h-[38px] appearance-none rounded-lg border-0 bg-[#55ace7] pl-4 pr-9 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 disabled:opacity-60 sm:text-base',
              )}
            >
              {FAILURE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-white text-[#222]">
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
          </div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-xl border border-slate-100">
          <PaymentAttemptLogsTable
            attempts={attempts}
            loading={loading}
            resetDeps={[search, failureFilter, attempts.length]}
            emptyMessage="No payment attempts found"
          />
        </div>
      </div>
    </BookstorePageShell>
  )
}
