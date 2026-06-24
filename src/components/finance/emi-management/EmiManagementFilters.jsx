import FinanceSearchInput from '../FinanceSearchInput'
import { EMI_LOAN_PROVIDERS } from '../../../constants/emiManagement'
import { FINANCE_MOCK_COUNSELORS } from '../../../constants/financeConstants'
import { cn } from '../../../utils/cn'

export default function EmiManagementFilters({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilter,
  providerFilter,
  onProviderFilter,
  counselorFilter,
  onCounselorFilter,
  overdueMin,
  onOverdueMin,
  suspensionFilter,
  onSuspensionFilter,
  dateFrom,
  dateTo,
  onDateFrom,
  onDateTo,
  className,
}) {
  const selectClass =
    'h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm min-w-[140px]'

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
        <FinanceSearchInput
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search student, course, provider…"
          className="max-w-md flex-1"
        />
        <select value={statusFilter} onChange={(e) => onStatusFilter(e.target.value)} className={selectClass} aria-label="EMI status">
          <option value="all">All statuses</option>
          <option value="EMI Running">EMI Running</option>
          <option value="EMI Completed">EMI Completed</option>
        </select>
        <select value={providerFilter} onChange={(e) => onProviderFilter(e.target.value)} className={selectClass} aria-label="Loan provider">
          <option value="all">All providers</option>
          {EMI_LOAN_PROVIDERS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <select value={counselorFilter} onChange={(e) => onCounselorFilter(e.target.value)} className={selectClass} aria-label="Counselor">
          <option value="all">All counselors</option>
          {FINANCE_MOCK_COUNSELORS.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <select value={suspensionFilter} onChange={(e) => onSuspensionFilter(e.target.value)} className={selectClass} aria-label="Suspension">
          <option value="all">All suspension</option>
          <option value="Active">Active</option>
          <option value="Warning Issued">Warning Issued</option>
          <option value="Suspended">Suspended</option>
          <option value="Reactivated">Reactivated</option>
        </select>
        <select value={overdueMin} onChange={(e) => onOverdueMin(Number(e.target.value))} className={selectClass} aria-label="Overdue days">
          <option value={0}>Any overdue</option>
          <option value={1}>1+ days</option>
          <option value={8}>8+ days (moderate)</option>
          <option value={22}>22+ days (critical)</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <label className="text-xs font-medium text-[#686868]">Next due:</label>
        <input type="date" value={dateFrom} onChange={(e) => onDateFrom(e.target.value)} className={selectClass} aria-label="Due from" />
        <span className="text-[#686868]">to</span>
        <input type="date" value={dateTo} onChange={(e) => onDateTo(e.target.value)} className={selectClass} aria-label="Due to" />
      </div>
    </div>
  )
}
