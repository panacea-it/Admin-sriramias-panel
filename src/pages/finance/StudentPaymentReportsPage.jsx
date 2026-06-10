import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileSpreadsheet, Eye, Pencil, SearchX, RotateCcw } from 'lucide-react'
import FinancePageShell from '../../components/finance/FinancePageShell'
import FinanceStatusBadge from '../../components/finance/FinanceStatusBadge'
import FinanceRefundBadge from '../../components/finance/FinanceRefundBadge'
import FinanceAccessStatusBadge from '../../components/finance/FinanceAccessStatusBadge'
import FinanceActionMenu from '../../components/finance/FinanceActionMenu'
import FinanceConfirmDialog from '../../components/finance/FinanceConfirmDialog'
import FinanceSearchInput from '../../components/finance/FinanceSearchInput'
import FinanceExportMenu from '../../components/finance/FinanceExportMenu'
import FinancePaymentModeManager from '../../components/finance/FinancePaymentModeManager'
import FinanceGatewayFilter from '../../components/finance/FinanceGatewayFilter'
import FinanceMobileFilters, {
  FilterChip,
  FilterField,
  FilterInput,
  FILTER_FIELD_CLASS,
} from '../../components/finance/FinanceMobileFilters'
import PaymentViewDrawer from '../../components/finance/PaymentViewDrawer'
import PaymentEditModal from '../../components/finance/PaymentEditModal'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import FinanceTableSkeleton from '../../components/finance/FinanceTableSkeleton'
import {
  fetchPaymentReports,
  fetchPaymentModeSettings,
  updatePaymentStatus,
} from '../../api/financeAPI'
import { FINANCE_COURSES } from '../../data/financeMockData'
import {
  filterPaymentReports,
  formatINR,
  DEFAULT_PAYMENT_REPORT_FILTERS,
} from '../../utils/financeFilters'
import { buildPaymentModeFilterOptions } from '../../utils/finance/paymentModeUtils'
import { useFinanceOperations } from '../../contexts/FinanceOperationsContext'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'
import {
  FINANCE_BATCHES,
  FINANCE_PAYMENT_STATUSES,
  FINANCE_REFUND_STATUSES,
  FINANCE_ACCESS_STATUSES,
} from '../../constants/financeConstants'
import { toast } from '../../utils/toast'
import { cn } from '../../utils/cn'

const TABLE_COLUMNS = [
  { key: 'studentName', label: 'Student' },
  { key: 'centerName', label: 'Center' },
  { key: 'courseName', label: 'Course' },
  { key: 'batchName', label: 'Batch' },
  { key: 'paymentStatus', label: 'Status' },
  { key: 'refundStatus', label: 'Refund' },
  { key: 'accessStatus', label: 'Access' },
  { key: 'amountPaid', label: 'Paid' },
  { key: 'pendingAmount', label: 'Pending' },
  { key: 'paymentMode', label: 'Mode' },
  { key: 'paymentGateway', label: 'Gateway' },
  { key: 'paymentDate', label: 'Date' },
  { key: 'editReason', label: 'Reason' },
  { key: 'editComment', label: 'Comments' },
]

const COLUMN_ALIGN = {
  studentName: 'left',
  centerName: 'left',
  courseName: 'left',
  batchName: 'left',
  paymentStatus: 'center',
  refundStatus: 'center',
  accessStatus: 'center',
  amountPaid: 'right',
  pendingAmount: 'right',
  paymentMode: 'left',
  paymentGateway: 'left',
  paymentDate: 'center',
  editReason: 'left',
  editComment: 'left',
  actions: 'center',
}

const CELL_BASE = 'px-4 py-3 align-middle text-sm'
const TEXT_CELL = 'max-w-[180px] truncate'
const STATUS_CELL = 'whitespace-nowrap'

const STATUS_FILTER_OPTIONS = ['Paid', 'Partial', 'Pending', 'Failed', 'Refunded', 'EMI Running']

/** Latest admin edit note — reason and comment are stored together in adminLogs.comment */
function parseLatestAdminNote(row) {
  const logs = Array.isArray(row?.adminLogs) ? row.adminLogs : []
  if (!logs.length) return { reason: '', comment: '' }

  const latest = logs[logs.length - 1]
  const raw = (latest.comment || '').trim()
  if (!raw) return { reason: '', comment: '' }

  const colonIdx = raw.indexOf(': ')
  if (colonIdx > 0) {
    return {
      reason: raw.slice(0, colonIdx).trim(),
      comment: raw.slice(colonIdx + 2).trim(),
    }
  }

  return { reason: latest.action || '', comment: raw }
}

function NoteCell({ value, variant = 'text' }) {
  if (!value?.trim()) {
    return <span className="text-[#9ca0a8]">—</span>
  }

  if (variant === 'reason') {
    return (
      <span
        className="inline-flex max-w-[160px] truncate rounded-full bg-[#eef6fc] px-2.5 py-1 text-xs font-semibold text-[#246392]"
        title={value}
      >
        {value}
      </span>
    )
  }

  return (
    <span className="block max-w-[200px] truncate text-[#444]" title={value}>
      {value}
    </span>
  )
}

function countActiveFilters(filters, search) {
  let count = 0
  Object.entries(filters).forEach(([key, val]) => {
    if (key === 'studentId' && val?.trim()) count++
    else if (val && val !== 'all' && val !== '') count++
  })
  if (search.trim()) count++
  return count
}

function FilterSelectRow({ value, onChange, options, ariaLabel, className }) {
  return (
    <select
      value={value}
      onChange={onChange}
      aria-label={ariaLabel}
      className={cn(FILTER_FIELD_CLASS, className)}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}

export default function StudentPaymentReportsPage() {
  const { canEdit, canExport } = useFinancePermissions()
  const { refreshToken } = useFinanceOperations()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modeSettings, setModeSettings] = useState([])
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [filters, setFilters] = useState({ ...DEFAULT_PAYMENT_REPORT_FILTERS })
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [viewRow, setViewRow] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [confirmSave, setConfirmSave] = useState(false)
  const [editForm, setEditForm] = useState({ newStatus: 'Paid', amountAdjustment: '', reason: 'Manual Approval', comment: '' })
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, modes] = await Promise.all([fetchPaymentReports(), fetchPaymentModeSettings()])
      setRows(Array.isArray(data) ? data : [])
      setModeSettings(Array.isArray(modes) ? modes : [])
    } catch {
      toast.error('Failed to load payment reports')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load, refreshToken])

  const combinedFilters = useMemo(
    () => ({
      ...filters,
      search: debouncedSearch,
    }),
    [filters, debouncedSearch],
  )

  const filtered = useMemo(
    () => filterPaymentReports(rows ?? [], combinedFilters),
    [rows, combinedFilters],
  )

  const paymentModeOptions = useMemo(
    () => buildPaymentModeFilterOptions(modeSettings),
    [modeSettings],
  )

  const centerOptions = useMemo(() => {
    const names = [...new Set((rows ?? []).map((r) => r?.centerName).filter(Boolean))]
    return names.sort()
  }, [rows])

  const activeFilterCount = countActiveFilters(filters, search)

  const filterChips = useMemo(() => {
    const chips = []
    if (search.trim()) chips.push({ key: 'search', label: `Search: ${search.trim()}`, clear: () => setSearch('') })
    const filterLabels = {
      paymentStatus: 'Status',
      paymentType: 'Type',
      paymentMode: 'Mode',
      paymentGateway: 'Gateway',
      refundStatus: 'Refund',
      accessStatus: 'Access',
      courseId: 'Course',
      batchId: 'Batch',
      centerName: 'Center',
      verificationStatus: 'Verification',
    }
    Object.entries(filters).forEach(([key, val]) => {
      if (!val || val === 'all' || val === '') return
      if (['dateFrom', 'dateTo', 'studentId', 'mobile', 'email', 'enrollmentNumber', 'receiptNumber', 'transactionId'].includes(key)) {
        if (key === 'dateFrom' || key === 'dateTo') {
          chips.push({ key, label: `${key === 'dateFrom' ? 'From' : 'To'}: ${val}`, clear: () => setFilters((f) => ({ ...f, [key]: '' })) })
        } else if (val?.trim?.()) {
          chips.push({ key, label: `${key}: ${val}`, clear: () => setFilters((f) => ({ ...f, [key]: '' })) })
        }
        return
      }
      let display = val
      if (key === 'courseId') display = FINANCE_COURSES.find((c) => c.id === val)?.name || val
      if (key === 'batchId') display = FINANCE_BATCHES.find((b) => b.id === val)?.name || val
      chips.push({
        key,
        label: `${filterLabels[key] || key}: ${display}`,
        clear: () => setFilters((f) => ({ ...f, [key]: 'all' })),
      })
    })
    return chips
  }, [search, filters])

  const resetAllFilters = () => {
    setSearch('')
    setFilters({ ...DEFAULT_PAYMENT_REPORT_FILTERS })
  }

  const handleSaveEdit = async () => {
    if (!editRow) return
    setSaving(true)
    try {
      await updatePaymentStatus(editRow.id, {
        newStatus: editForm.newStatus,
        amountAdjustment: editForm.amountAdjustment,
        comment: `${editForm.reason}: ${editForm.comment}`,
        adminName: 'Admin',
      })
      toast.success('Payment updated')
      setEditRow(null)
      setConfirmSave(false)
      load()
    } catch {
      toast.error('Update failed')
    } finally {
      setSaving(false)
    }
  }

  const renderFilterFields = (layout = 'desktop') => {
    const isMobile = layout === 'mobile'
    const Wrapper = isMobile ? FilterField : 'div'
    const wrapProps = (label) => (isMobile ? { label } : {})

    return (
      <>
        <Wrapper {...wrapProps('Payment status')}>
          {!isMobile && <span className="sr-only">Payment status</span>}
          <FilterSelectRow
            value={filters.paymentStatus}
            onChange={(e) => setFilters((f) => ({ ...f, paymentStatus: e.target.value }))}
            ariaLabel="Payment status"
            options={[{ value: 'all', label: 'All statuses' }, ...STATUS_FILTER_OPTIONS.map((s) => ({ value: s, label: s }))]}
          />
        </Wrapper>
        <Wrapper {...wrapProps('Payment type')}>
          <FilterSelectRow
            value={filters.paymentType}
            onChange={(e) => setFilters((f) => ({ ...f, paymentType: e.target.value }))}
            ariaLabel="Payment type"
            options={[{ value: 'all', label: 'All types' }, { value: 'Full', label: 'Full' }, { value: 'EMI', label: 'EMI' }]}
          />
        </Wrapper>
        <Wrapper {...wrapProps('Payment mode')}>
          <FilterSelectRow
            value={filters.paymentMode}
            onChange={(e) => setFilters((f) => ({ ...f, paymentMode: e.target.value }))}
            ariaLabel="Payment mode"
            options={paymentModeOptions}
          />
        </Wrapper>
        <Wrapper {...wrapProps('Payment gateway')}>
          <FinanceGatewayFilter
            value={filters.paymentGateway}
            onChange={(e) => setFilters((f) => ({ ...f, paymentGateway: e.target.value }))}
          />
        </Wrapper>
        <Wrapper {...wrapProps('Refund status')}>
          <FilterSelectRow
            value={filters.refundStatus}
            onChange={(e) => setFilters((f) => ({ ...f, refundStatus: e.target.value }))}
            ariaLabel="Refund status"
            options={[{ value: 'all', label: 'All refunds' }, ...FINANCE_REFUND_STATUSES.map((s) => ({ value: s, label: s }))]}
          />
        </Wrapper>
        <Wrapper {...wrapProps('Access status')}>
          <FilterSelectRow
            value={filters.accessStatus}
            onChange={(e) => setFilters((f) => ({ ...f, accessStatus: e.target.value }))}
            ariaLabel="Access status"
            options={[{ value: 'all', label: 'All access' }, ...FINANCE_ACCESS_STATUSES.map((s) => ({ value: s, label: s }))]}
          />
        </Wrapper>
        <Wrapper {...wrapProps('Course')}>
          <FilterSelectRow
            value={filters.courseId}
            onChange={(e) => setFilters((f) => ({ ...f, courseId: e.target.value }))}
            ariaLabel="Course"
            options={[{ value: 'all', label: 'All courses' }, ...FINANCE_COURSES.map((c) => ({ value: c.id, label: c.name }))]}
          />
        </Wrapper>
        <Wrapper {...wrapProps('Batch')}>
          <FilterSelectRow
            value={filters.batchId}
            onChange={(e) => setFilters((f) => ({ ...f, batchId: e.target.value }))}
            ariaLabel="Batch"
            options={[{ value: 'all', label: 'All batches' }, ...FINANCE_BATCHES.map((b) => ({ value: b.id, label: b.name }))]}
          />
        </Wrapper>
        <Wrapper {...wrapProps('Verification')}>
          <FilterSelectRow
            value={filters.verificationStatus}
            onChange={(e) => setFilters((f) => ({ ...f, verificationStatus: e.target.value }))}
            ariaLabel="Verification status"
            options={[
              { value: 'all', label: 'All verification' },
              ...FINANCE_PAYMENT_STATUSES.filter((s) => ['Verified', 'Verification Pending', 'Rejected'].includes(s)).map((s) => ({
                value: s,
                label: s,
              })),
            ]}
          />
        </Wrapper>
        <Wrapper {...wrapProps('Center')}>
          <FilterSelectRow
            value={filters.centerName}
            onChange={(e) => setFilters((f) => ({ ...f, centerName: e.target.value }))}
            ariaLabel="Center"
            options={[{ value: 'all', label: 'All centers' }, ...centerOptions.map((n) => ({ value: n, label: n }))]}
          />
        </Wrapper>
        <Wrapper {...wrapProps('From date')}>
          <FilterInput type="date" value={filters.dateFrom} onChange={(e) => setFilters((f) => ({ ...f, dateFrom: e.target.value }))} ariaLabel="From date" />
        </Wrapper>
        <Wrapper {...wrapProps('To date')}>
          <FilterInput type="date" value={filters.dateTo} onChange={(e) => setFilters((f) => ({ ...f, dateTo: e.target.value }))} ariaLabel="To date" />
        </Wrapper>
        <Wrapper {...wrapProps('Student ID')}>
          <FilterInput value={filters.studentId} onChange={(e) => setFilters((f) => ({ ...f, studentId: e.target.value }))} placeholder="Student ID" />
        </Wrapper>
      </>
    )
  }

  const columns = useMemo(() => {
    const defs = TABLE_COLUMNS.map((c) => {
      const base = {
        ...c,
        align: COLUMN_ALIGN[c.key] || 'left',
        headerClassName: cn(CELL_BASE, 'font-semibold', c.key === 'studentName' && 'pl-5 sm:pl-6'),
        cellClassName: cn(
          CELL_BASE,
          c.key === 'studentName' && 'pl-5 sm:pl-6',
          ['centerName', 'courseName', 'batchName', 'paymentMode', 'paymentGateway', 'editComment'].includes(c.key) && TEXT_CELL,
          c.key === 'editReason' && 'max-w-[160px]',
          ['paymentStatus', 'refundStatus', 'accessStatus'].includes(c.key) && STATUS_CELL,
          ['amountPaid', 'pendingAmount'].includes(c.key) && 'tabular-nums font-medium text-[#111111] whitespace-nowrap',
          c.key === 'paymentDate' && 'whitespace-nowrap tabular-nums',
        ),
      }

      if (c.key === 'paymentStatus') {
        return { ...base, render: (r) => <FinanceStatusBadge status={r.paymentStatus} className="rounded-full px-3 py-1 text-xs" /> }
      }
      if (c.key === 'refundStatus') {
        return { ...base, render: (r) => <FinanceRefundBadge status={r.refundStatus} className="rounded-full px-3 py-1 text-xs" /> }
      }
      if (c.key === 'accessStatus') {
        return { ...base, render: (r) => <FinanceAccessStatusBadge status={r.accessStatus} className="rounded-full px-3 py-1 text-xs" /> }
      }
      if (['amountPaid', 'pendingAmount'].includes(c.key)) {
        return { ...base, render: (r) => formatINR(r[c.key]) }
      }
      if (c.key === 'paymentDate') {
        return {
          ...base,
          render: (r) => (
            <span className="inline-block whitespace-nowrap text-sm text-[#111111]">
              {r.paymentDate ? formatCategoryDateTime(r.paymentDate) : '—'}
            </span>
          ),
        }
      }
      if (c.key === 'studentName') {
        return { ...base, render: (r) => <span className="block truncate font-semibold text-[#111111]" title={r.studentName}>{r.studentName}</span> }
      }
      if (['centerName', 'courseName', 'batchName', 'paymentMode', 'paymentGateway'].includes(c.key)) {
        return { ...base, render: (r) => <span className="block truncate" title={r[c.key]}>{r[c.key] || '—'}</span> }
      }
      if (c.key === 'editReason') {
        return {
          ...base,
          render: (r) => <NoteCell value={parseLatestAdminNote(r).reason} variant="reason" />,
        }
      }
      if (c.key === 'editComment') {
        return {
          ...base,
          render: (r) => <NoteCell value={parseLatestAdminNote(r).comment} />,
        }
      }
      return base
    })

    defs.push({
      key: 'actions',
      label: 'Actions',
      align: 'center',
      headerClassName: cn(CELL_BASE, 'min-w-[88px] pr-5 sm:pr-6'),
      cellClassName: cn(CELL_BASE, 'whitespace-nowrap pr-5 sm:pr-6'),
      render: (row) => (
        <FinanceActionMenu
          className="mx-auto"
          actions={[
            { label: 'View', icon: Eye, onClick: () => setViewRow(row) },
            {
              label: 'Edit',
              icon: Pencil,
              onClick: () => {
                const note = parseLatestAdminNote(row)
                setEditRow(row)
                setEditForm({
                  newStatus: row.paymentStatus,
                  amountAdjustment: String(row.amountPaid),
                  reason: note.reason || 'Manual Approval',
                  comment: note.comment || '',
                })
              },
              show: canEdit,
            },
          ]}
        />
      ),
    })
    return defs
  }, [canEdit])

  return (
    <FinancePageShell
      icon={FileSpreadsheet}
      title="Student Payment Reports"
      breadcrumbs={[{ label: 'Student Payment Reports' }]}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <FinancePaymentModeManager
            settings={modeSettings}
            onUpdated={setModeSettings}
            canManage={canExport || canEdit}
            readOnly={!canEdit}
          />
          <FinanceExportMenu
            rows={filtered}
            filenameBase="student-payment-reports"
            title="Student Payment Reports"
            canExport={canExport}
            variant="banner"
          />
        </div>
      }
    >
      <div className="sticky top-0 z-10 space-y-3">
        <div className="rounded-xl bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          <div className="flex flex-wrap items-center gap-3">
            <FinanceSearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, course, txn, receipt…"
              className="min-w-0 flex-1"
            />
            <FinanceMobileFilters
              open={mobileFiltersOpen}
              onOpen={() => setMobileFiltersOpen(true)}
              onClose={() => setMobileFiltersOpen(false)}
              onReset={resetAllFilters}
              activeCount={activeFilterCount}
            >
              {renderFilterFields('mobile')}
            </FinanceMobileFilters>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-[#55ace7]/40 px-3 text-sm font-semibold text-[#246392] hover:bg-[#eef6fc]"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            )}
          </div>

          <div className="mt-3 hidden gap-3 lg:grid lg:grid-cols-4 xl:grid-cols-5">
            {renderFilterFields('desktop')}
          </div>
        </div>

        {filterChips.length > 0 && (
          <div className="flex flex-wrap gap-2 px-1">
            {filterChips.map((chip) => (
              <FilterChip key={chip.key} label={chip.label} onRemove={chip.clear} />
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#686868]">
          {loading ? 'Loading…' : `${filtered.length} records`}
        </p>
      </div>

      {loading ? (
        <FinanceTableSkeleton rows={8} columns={8} />
      ) : (
        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          itemLabel="payments"
          resetDeps={[debouncedSearch, filters]}
          zebraStriping
          stickyHeader
          stickyLastColumn
          animateRows
          emptyState={
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
                <SearchX className="h-7 w-7 text-slate-400" />
              </div>
              <p className="text-base font-semibold text-slate-800">No finance reports available</p>
              <p className="max-w-sm text-sm text-slate-500">
                {rows.length === 0
                  ? 'There are no payment reports to show yet.'
                  : 'No payments match your current filters. Try clearing search or adjusting filters.'}
              </p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-2 rounded-lg bg-[#246392] px-4 py-2 text-sm font-semibold text-white"
                >
                  Clear all filters
                </button>
              )}
            </div>
          }
          className="overflow-hidden rounded-xl border border-slate-100"
          tableClassName="max-h-[min(70vh,720px)] overflow-auto"
        />
      )}

      <PaymentViewDrawer
        open={!!viewRow}
        payment={viewRow}
        onClose={() => setViewRow(null)}
      />
      <PaymentEditModal
        open={!!editRow}
        payment={editRow}
        form={editForm}
        onChange={setEditForm}
        onClose={() => setEditRow(null)}
        onSave={() => setConfirmSave(true)}
        saving={saving}
      />
      <FinanceConfirmDialog
        open={confirmSave}
        title="Update payment status?"
        message={
          editRow
            ? `Confirm status change to "${editForm.newStatus}" for ${editRow.studentName}. This will be recorded in the audit trail.`
            : ''
        }
        confirmLabel="Save changes"
        loading={saving}
        onConfirm={handleSaveEdit}
        onCancel={() => setConfirmSave(false)}
      />
    </FinancePageShell>
  )
}
