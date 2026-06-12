import FinanceSearchInput from '../FinanceSearchInput'
import { COMMUNICATION_TYPES, COMMUNICATION_CHANNELS, COMMUNICATION_STATUSES } from '../../../constants/paymentCommunicationConstants'

export default function CommunicationFilters({
  search,
  onSearchChange,
  centerFilter = 'all',
  onCenterChange = () => {},
  centerOptions = [],
  courseFilter = 'all',
  onCourseChange = () => {},
  courseOptions = [],
  batchFilter = 'all',
  onBatchChange = () => {},
  batchOptions = [],
  channelFilter,
  onChannelChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
  followUpFilter,
  onFollowUpChange,
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
          placeholder="Search student, ID, reference…"
          className="sm:col-span-2"
        />
        {centerOptions.length > 0 && (
          <select value={centerFilter} onChange={(e) => onCenterChange(e.target.value)} className={selectClass} aria-label="Center">
            <option value="all">All centres</option>
            {centerOptions.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        )}
        <select value={courseFilter} onChange={(e) => onCourseChange(e.target.value)} className={selectClass} aria-label="Course">
          <option value="all">All courses</option>
          {courseOptions.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
        <select value={batchFilter} onChange={(e) => onBatchChange(e.target.value)} className={selectClass} aria-label="Batch">
          <option value="all">All batches</option>
          {batchOptions.map((b) => (
            <option key={b.value} value={b.value}>{b.label}</option>
          ))}
        </select>
        <select value={typeFilter} onChange={(e) => onTypeChange(e.target.value)} className={selectClass} aria-label="Communication type">
          <option value="all">All types</option>
          {COMMUNICATION_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <select value={channelFilter} onChange={(e) => onChannelChange(e.target.value)} className={selectClass} aria-label="Channel">
          <option value="all">All channels</option>
          {COMMUNICATION_CHANNELS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => onStatusChange(e.target.value)} className={selectClass} aria-label="Status">
          <option value="all">All statuses</option>
          {COMMUNICATION_STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={followUpFilter} onChange={(e) => onFollowUpChange(e.target.value)} className={selectClass} aria-label="Follow-up">
          <option value="all">All follow-ups</option>
          <option value="pending">Pending follow-up</option>
          <option value="tagged">Counselor tagged</option>
        </select>
        <input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} className={selectClass} aria-label="From date" />
        <input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} className={selectClass} aria-label="To date" />
      </div>
    </div>
  )
}
