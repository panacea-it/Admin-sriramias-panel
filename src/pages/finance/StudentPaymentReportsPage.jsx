import { useCallback, useEffect, useMemo, useState } from 'react'
import { Calendar, ChevronDown, FileSpreadsheet, Search, SearchX, RotateCcw } from 'lucide-react'
import FinancePageShell from '../../components/finance/FinancePageShell'
import FinanceStatusBadge from '../../components/finance/FinanceStatusBadge'
import FinanceConfirmDialog from '../../components/finance/FinanceConfirmDialog'
import FinancePaymentModeManager from '../../components/finance/FinancePaymentModeManager'
import PaymentViewDrawer from '../../components/finance/PaymentViewDrawer'
import PaymentEditModal from '../../components/finance/PaymentEditModal'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import FinanceTableSkeleton from '../../components/finance/FinanceTableSkeleton'
import ViewButton from '../../components/common/ViewButton'
import EditButton from '../../components/common/EditButton'
import {
  fetchPaymentReports,
  fetchPaymentModeSettings,
  updatePaymentStatus,
} from '../../api/financeAPI'
import {
  filterPaymentReports,
  formatINR,
  DEFAULT_PAYMENT_REPORT_FILTERS,
} from '../../utils/financeFilters'
import { normalizePaymentModeLabel } from '../../utils/finance/paymentModeUtils'
import { useFinanceOperations } from '../../contexts/FinanceOperationsContext'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'
import {
  ADMIN_DATA_PANEL,
  ADMIN_TABLE_CONTAINER,
  ADMIN_TABLE_PAGINATION_CLASS,
  ADMIN_TABLE_ROW_CLASS,
} from '../../utils/adminUiStandards'
import { createActionsColumn, TABLE_ACTIONS_WRAP_CENTER } from '../../utils/tableColumnHelpers'
import { toast } from '../../utils/toast'

const TABLE_COLUMNS = [
  { key: 'studentId', label: 'Student ID' },
  { key: 'studentName', label: 'Student Name' },
  { key: 'centerName', label: 'Center' },
  { key: 'courseName', label: 'Course' },
  { key: 'batchName', label: 'Batch' },
  { key: 'paymentStatus', label: 'Payment Status' },
  { key: 'amountPaid', label: 'Paid Amount' },
  { key: 'pendingAmount', label: 'Pending Amount' },
  { key: 'paymentMode', label: 'Payment Mode' },
  { key: 'paymentGateway', label: 'Payment Gateway' },
  { key: 'paymentDate', label: 'Payment Date' },
  { key: 'editReason', label: 'Reason' },
  { key: 'editComment', label: 'Comments' },
]

const DISPLAY_PAYMENT_MODES = new Set([
  'UPI',
  'Card',
  'Net Banking',
  'Cash',
  'Offline Cash',
  'EMI',
])

const INITIAL_FILTERS = {
  centerName: 'all',
  paymentDate: '',
}

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

function deriveDisplayPaymentStatus(row) {
  const paid = Math.max(0, Number(row.amountPaid) || 0)
  const pending = Math.max(0, Number(row.pendingAmount) || 0)

  if (row.paymentType === 'EMI' && pending === 0 && paid > 0) {
    return 'EMI Completed'
  }
  if (row.emiStatus === 'EMI Completed' || row.paymentStatus === 'EMI Completed') {
    return 'EMI Completed'
  }
  if (pending === 0 && paid > 0) return 'Paid'
  if (paid > 0 && pending > 0) return 'Partially Paid'
  return 'Pending'
}

function formatPaymentReportDate(iso) {
  if (!iso) return null
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return {
    date: d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }),
    time: d.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
  }
}

function formatDisplayPaymentMode(mode) {
  if (!mode) return '—'
  const label = normalizePaymentModeLabel(mode)
  if (label === '—') return '—'
  return DISPLAY_PAYMENT_MODES.has(label) ? label : '—'
}

function NoteCell({ value, variant = 'text' }) {
  if (!value?.trim()) {
    return <span className="text-[#9ca0a8]">—</span>
  }

  if (variant === 'reason') {
    return (
      <span
        className="block max-w-full truncate rounded-full bg-[#eef6fc] px-2.5 py-1 text-xs font-semibold text-[#246392]"
        title={value}
      >
        {value}
      </span>
    )
  }

  return (
    <span className="block max-w-full truncate text-[#444]" title={value}>
      {value}
    </span>
  )
}

function PaymentDateCell({ iso }) {
  const formatted = formatPaymentReportDate(iso)
  if (!formatted) return <span className="text-[#9ca0a8]">—</span>

  return (
    <div className="flex flex-col whitespace-nowrap">
      <span className="font-medium text-[#111]">{formatted.date}</span>
      <span className="text-xs text-[#686868]">{formatted.time}</span>
    </div>
  )
}

function countActiveFilters(filters, search) {
  let count = 0
  if (search.trim()) count++
  if (filters.centerName && filters.centerName !== 'all') count++
  if (filters.paymentDate) count++
  return count
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef6fc] px-3 py-1 text-xs font-semibold text-[#246392]">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full px-1 text-[#246392]/70 hover:bg-white hover:text-[#246392]"
        aria-label={`Remove ${label} filter`}
      >
        ×
      </button>
    </span>
  )
}

function PaymentReportsFilterToolbar({
  search,
  onSearchChange,
  center,
  onCenterChange,
  centerOptions,
  paymentDate,
  onPaymentDateChange,
  disabled = false,
}) {
  return (
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
      <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180] sm:left-4" />
        <input
          type="search"
          value={search}
          onChange={onSearchChange}
          placeholder="Search student"
          disabled={disabled}
          className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] disabled:opacity-60 sm:pl-11 sm:text-base"
        />
      </div>

      <div className="flex w-full flex-wrap gap-2 sm:w-auto">
        <div className="relative w-full sm:w-auto sm:min-w-[150px]">
          <select
            value={center}
            onChange={onCenterChange}
            aria-label="Center"
            disabled={disabled}
            className="h-10 w-full min-h-[38px] appearance-none rounded-lg border-0 bg-[#55ace7] pl-4 pr-9 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 disabled:opacity-60 sm:text-base"
          >
            <option value="all" className="bg-white text-[#222]">
              All centers
            </option>
            {centerOptions.map((name) => (
              <option key={name} value={name} className="bg-white text-[#222]">
                {name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
        </div>

        <div className="relative w-full sm:w-auto sm:min-w-[160px]">
          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white" />
          <input
            type="date"
            value={paymentDate}
            onChange={onPaymentDateChange}
            aria-label="Payment date"
            disabled={disabled}
            className="h-10 w-full min-h-[38px] appearance-none rounded-lg border-0 bg-[#55ace7] pl-10 pr-3 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 disabled:opacity-60 [color-scheme:dark] sm:text-base"
          />
        </div>
      </div>
    </div>
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
  const [filters, setFilters] = useState({ ...INITIAL_FILTERS })
  const [viewRow, setViewRow] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [confirmSave, setConfirmSave] = useState(false)
  const [editForm, setEditForm] = useState({
    newStatus: 'Paid',
    amountAdjustment: '',
    reason: 'Manual Approval',
    comment: '',
  })
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
      ...DEFAULT_PAYMENT_REPORT_FILTERS,
      search: debouncedSearch,
      centerName: filters.centerName,
      dateFrom: filters.paymentDate,
      dateTo: filters.paymentDate,
    }),
    [filters, debouncedSearch],
  )

  const filtered = useMemo(
    () => filterPaymentReports(rows ?? [], combinedFilters),
    [rows, combinedFilters],
  )

  const centerOptions = useMemo(() => {
    const names = [...new Set((rows ?? []).map((r) => r?.centerName).filter(Boolean))]
    return names.sort()
  }, [rows])

  const activeFilterCount = countActiveFilters(filters, search)

  const filterChips = useMemo(() => {
    const chips = []
    if (search.trim()) {
      chips.push({ key: 'search', label: `Search: ${search.trim()}`, clear: () => setSearch('') })
    }
    if (filters.centerName && filters.centerName !== 'all') {
      chips.push({
        key: 'center',
        label: `Center: ${filters.centerName}`,
        clear: () => setFilters((f) => ({ ...f, centerName: 'all' })),
      })
    }
    if (filters.paymentDate) {
      const formatted = formatPaymentReportDate(filters.paymentDate)
      chips.push({
        key: 'date',
        label: `Date: ${formatted?.date || filters.paymentDate}`,
        clear: () => setFilters((f) => ({ ...f, paymentDate: '' })),
      })
    }
    return chips
  }, [search, filters])

  const resetAllFilters = () => {
    setSearch('')
    setFilters({ ...INITIAL_FILTERS })
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

  const columns = useMemo(() => {
    const defs = TABLE_COLUMNS.map((c) => {
      const base = {
        ...c,
        headerClassName: 'min-w-0 whitespace-nowrap align-middle',
        cellClassName: 'min-w-0 align-middle',
      }

      if (c.key === 'studentId') {
        return {
          ...base,
          headerClassName: 'min-w-[110px] whitespace-nowrap align-middle',
          cellClassName: 'min-w-[110px] align-middle',
          render: (r) => (
            <span className="block truncate font-mono text-[12px] font-medium text-[#686868]" title={r.studentId}>
              {r.studentId || r.enrollmentNumber || '—'}
            </span>
          ),
        }
      }

      if (c.key === 'paymentStatus') {
        return {
          ...base,
          headerClassName: 'min-w-[130px] whitespace-nowrap align-middle',
          cellClassName: 'min-w-[130px] align-middle',
          render: (r) => {
            const status = deriveDisplayPaymentStatus(r)
            return (
              <div className="flex justify-center">
                <FinanceStatusBadge status={status} truncate title={status} />
              </div>
            )
          },
        }
      }

      if (['amountPaid', 'pendingAmount'].includes(c.key)) {
        return {
          ...base,
          align: 'right',
          headerClassName: 'min-w-[120px] whitespace-nowrap align-middle',
          cellClassName: 'min-w-[120px] whitespace-nowrap align-middle tabular-nums',
          render: (r) => {
            const value = Math.max(0, Number(r[c.key]) || 0)
            return <span className="font-bold tabular-nums text-[#1a3a5c]">{formatINR(value)}</span>
          },
        }
      }

      if (c.key === 'paymentDate') {
        return {
          ...base,
          headerClassName: 'min-w-[130px] whitespace-nowrap align-middle',
          cellClassName: 'min-w-[130px] align-middle',
          render: (r) => <PaymentDateCell iso={r.paymentDate} />,
        }
      }

      if (c.key === 'studentName') {
        return {
          ...base,
          headerClassName: 'min-w-[160px]',
          cellClassName: 'min-w-[160px] align-middle',
          render: (r) => (
            <span className="block truncate font-semibold text-slate-900" title={r.studentName}>
              {r.studentName || '—'}
            </span>
          ),
        }
      }

      if (c.key === 'centerName') {
        return {
          ...base,
          headerClassName: 'min-w-[140px]',
          cellClassName: 'min-w-[140px] align-middle',
          render: (r) => (
            <span className="block truncate font-medium text-[#111]" title={r.centerName}>
              {r.centerName || '—'}
            </span>
          ),
        }
      }

      if (['courseName', 'batchName'].includes(c.key)) {
        return {
          ...base,
          headerClassName: 'min-w-[150px]',
          cellClassName: 'min-w-[150px] align-middle',
          render: (r) => (
            <span className="block truncate font-medium text-[#111]" title={r[c.key]}>
              {r[c.key] || '—'}
            </span>
          ),
        }
      }

      if (c.key === 'paymentMode') {
        return {
          ...base,
          headerClassName: 'min-w-[120px] whitespace-nowrap',
          cellClassName: 'min-w-[120px] whitespace-nowrap align-middle',
          render: (r) => (
            <span className="font-medium text-[#111]" title={formatDisplayPaymentMode(r.paymentMode)}>
              {formatDisplayPaymentMode(r.paymentMode)}
            </span>
          ),
        }
      }

      if (c.key === 'paymentGateway') {
        return {
          ...base,
          headerClassName: 'min-w-[130px] whitespace-nowrap',
          cellClassName: 'min-w-[130px] whitespace-nowrap align-middle',
          render: (r) => (
            <span className="block truncate font-medium text-[#111]" title={r.paymentGateway || ''}>
              {r.paymentGateway || '—'}
            </span>
          ),
        }
      }

      if (c.key === 'editReason') {
        return {
          ...base,
          headerClassName: 'min-w-[150px]',
          cellClassName: 'min-w-[150px] align-middle',
          render: (r) => <NoteCell value={parseLatestAdminNote(r).reason} variant="reason" />,
        }
      }

      if (c.key === 'editComment') {
        return {
          ...base,
          headerClassName: 'min-w-[160px]',
          cellClassName: 'min-w-[160px] align-middle',
          render: (r) => <NoteCell value={parseLatestAdminNote(r).comment} />,
        }
      }

      return base
    })

    defs.push(
      createActionsColumn({
        buttonCount: canEdit ? 2 : 1,
        align: 'center',
        render: (row) => (
          <div className={TABLE_ACTIONS_WRAP_CENTER}>
            <ViewButton onClick={() => setViewRow(row)} label={`View ${row.studentName}`} />
            {canEdit ? (
              <EditButton
                onClick={() => {
                  const note = parseLatestAdminNote(row)
                  setEditRow(row)
                  setEditForm({
                    newStatus: deriveDisplayPaymentStatus(row),
                    amountAdjustment: String(row.amountPaid ?? ''),
                    reason: note.reason || 'Manual Approval',
                    comment: note.comment || '',
                  })
                }}
                label={`Edit ${row.studentName}`}
              />
            ) : null}
          </div>
        ),
      }),
    )

    return defs
  }, [canEdit])

  return (
    <FinancePageShell
      icon={FileSpreadsheet}
      title="Student Payment Reports"
      breadcrumbs={[{ label: 'Student Payment Reports' }]}
      actions={
        <FinancePaymentModeManager
          settings={modeSettings}
          onUpdated={setModeSettings}
          canManage={canExport || canEdit}
          readOnly={!canEdit}
        />
      }
    >
      <div className={ADMIN_DATA_PANEL}>
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="min-w-0 flex-1">
              <PaymentReportsFilterToolbar
                search={search}
                onSearchChange={(e) => setSearch(e.target.value)}
                center={filters.centerName}
                onCenterChange={(e) => setFilters((f) => ({ ...f, centerName: e.target.value }))}
                centerOptions={centerOptions}
                paymentDate={filters.paymentDate}
                onPaymentDateChange={(e) => setFilters((f) => ({ ...f, paymentDate: e.target.value }))}
                disabled={loading && rows.length === 0}
              />
            </div>
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

          {filterChips.length > 0 && (
            <div className="flex flex-wrap gap-2 px-1">
              {filterChips.map((chip) => (
                <FilterChip key={chip.key} label={chip.label} onRemove={chip.clear} />
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 sm:mt-5">
          <p className="text-sm font-medium text-[#686868]">
            {loading ? 'Loading…' : `${filtered.length} records`}
          </p>
        </div>

        <div className={ADMIN_TABLE_CONTAINER}>
          {loading ? (
            <FinanceTableSkeleton rows={8} columns={8} />
          ) : (
            <PaginatedFigmaTable
              columns={columns}
              data={filtered}
              itemLabel="payments"
              resetDeps={[debouncedSearch, filters]}
              density="comfortable"
              rowClassName={ADMIN_TABLE_ROW_CLASS}
              tableClassName="rounded-none border-0 shadow-none"
              paginationClassName={ADMIN_TABLE_PAGINATION_CLASS}
              tableMinWidth={1680}
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
            />
          )}
        </div>
      </div>

      <PaymentViewDrawer open={!!viewRow} payment={viewRow} onClose={() => setViewRow(null)} />
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
