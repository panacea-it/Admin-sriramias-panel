import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileSpreadsheet, Eye, Pencil, Receipt, Bell, Columns3, UserCircle, SearchX, RotateCcw } from 'lucide-react'
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
  FilterSelect,
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
  sendPaymentReminder,
  generateReceipt,
  resendReceipt,
} from '../../api/financeAPI'
import { FINANCE_COURSES, FINANCE_BRANCHES } from '../../data/financeMockData'
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

const ALL_COLUMNS = [
  { key: 'studentName', label: 'Student' },
  { key: 'studentId', label: 'Student ID' },
  { key: 'enrollmentNumber', label: 'Enrollment' },
  { key: 'centerName', label: 'Center' },
  { key: 'courseName', label: 'Course' },
  { key: 'batchName', label: 'Batch' },
  { key: 'paymentStatus', label: 'Status' },
  { key: 'refundStatus', label: 'Refund' },
  { key: 'accessStatus', label: 'Access' },
  { key: 'verificationStatus', label: 'Verification' },
  { key: 'emiStatus', label: 'EMI' },
  { key: 'paymentType', label: 'Type' },
  { key: 'totalFees', label: 'Total fees' },
  { key: 'amountPaid', label: 'Paid' },
  { key: 'pendingAmount', label: 'Pending' },
  { key: 'paymentMode', label: 'Mode' },
  { key: 'paymentGateway', label: 'Gateway' },
  { key: 'branch', label: 'Branch' },
  { key: 'receiptNumber', label: 'Receipt' },
  { key: 'paymentDate', label: 'Date' },
]

const DEFAULT_VISIBLE = [
  'studentName',
  'centerName',
  'courseName',
  'batchName',
  'paymentStatus',
  'refundStatus',
  'accessStatus',
  'amountPaid',
  'pendingAmount',
  'paymentMode',
  'paymentGateway',
  'paymentDate',
]

const COLUMN_ALIGN = {
  studentName: 'left',
  studentId: 'left',
  enrollmentNumber: 'left',
  centerName: 'left',
  courseName: 'left',
  batchName: 'left',
  paymentStatus: 'center',
  refundStatus: 'center',
  accessStatus: 'center',
  verificationStatus: 'center',
  emiStatus: 'center',
  paymentType: 'left',
  totalFees: 'right',
  amountPaid: 'right',
  pendingAmount: 'right',
  paymentMode: 'left',
  paymentGateway: 'left',
  branch: 'left',
  receiptNumber: 'left',
  paymentDate: 'center',
  actions: 'center',
}

const STATUS_FILTER_OPTIONS = ['Paid', 'Partial', 'Pending', 'Failed', 'Refunded', 'EMI Running']

function countActiveFilters(filters, search, advancedSearch) {
  let count = 0
  Object.entries(filters).forEach(([key, val]) => {
    if (key === 'studentId' && val?.trim()) count++
    else if (val && val !== 'all' && val !== '') count++
  })
  if (search.trim()) count++
  Object.values(advancedSearch).forEach((v) => {
    if (v?.trim()) count++
  })
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
  const { canEdit, canExport, canReceipts } = useFinancePermissions()
  const { openStudentProfile, refreshToken } = useFinanceOperations()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [modeSettings, setModeSettings] = useState([])
  const [tableDensity, setTableDensity] = useState('compact')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 350)
  const [advancedSearch, setAdvancedSearch] = useState({
    mobile: '',
    email: '',
    enrollmentNumber: '',
    receiptNumber: '',
    transactionId: '',
  })
  const debouncedAdvanced = useDebouncedValue(advancedSearch, 350)
  const [filters, setFilters] = useState({ ...DEFAULT_PAYMENT_REPORT_FILTERS })
  const [visibleCols, setVisibleCols] = useState(DEFAULT_VISIBLE)
  const [colMenuOpen, setColMenuOpen] = useState(false)
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false)
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false)
  const [viewRow, setViewRow] = useState(null)
  const [editRow, setEditRow] = useState(null)
  const [confirmSave, setConfirmSave] = useState(false)
  const [editForm, setEditForm] = useState({ newStatus: 'Paid', amountAdjustment: '', reason: 'Manual Approval', comment: '' })
  const [saving, setSaving] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])

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
      ...debouncedAdvanced,
    }),
    [filters, debouncedSearch, debouncedAdvanced],
  )

  const filtered = useMemo(
    () => filterPaymentReports(rows ?? [], combinedFilters),
    [rows, combinedFilters],
  )

  const paymentModeOptions = useMemo(
    () => buildPaymentModeFilterOptions(modeSettings),
    [modeSettings],
  )

  const branchOptions = useMemo(() => {
    const fromData = [...new Set((rows ?? []).map((r) => r?.branch).filter(Boolean))]
    const fromConfig = FINANCE_BRANCHES.map((b) => b.name)
    return [...new Set([...fromConfig, ...fromData])].sort()
  }, [rows])

  const centerOptions = useMemo(() => {
    const names = [...new Set((rows ?? []).map((r) => r?.centerName).filter(Boolean))]
    return names.sort()
  }, [rows])

  const activeFilterCount = countActiveFilters(filters, search, advancedSearch)

  const filterChips = useMemo(() => {
    const chips = []
    if (search.trim()) chips.push({ key: 'search', label: `Search: ${search.trim()}`, clear: () => setSearch('') })
    Object.entries(advancedSearch).forEach(([key, val]) => {
      if (!val?.trim()) return
      const labels = {
        mobile: 'Mobile',
        email: 'Email',
        enrollmentNumber: 'Enrollment',
        receiptNumber: 'Receipt',
        transactionId: 'Txn ID',
      }
      chips.push({
        key,
        label: `${labels[key]}: ${val.trim()}`,
        clear: () => setAdvancedSearch((s) => ({ ...s, [key]: '' })),
      })
    })
    const filterLabels = {
      paymentStatus: 'Status',
      paymentType: 'Type',
      paymentMode: 'Mode',
      branch: 'Branch',
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
  }, [search, advancedSearch, filters])

  const resetAllFilters = () => {
    setSearch('')
    setAdvancedSearch({ mobile: '', email: '', enrollmentNumber: '', receiptNumber: '', transactionId: '' })
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

  const handleReminder = async (row) => {
    try {
      await sendPaymentReminder({ mobile: row.mobile, email: row.email, channel: 'WhatsApp' })
      toast.success('Reminder queued')
    } catch {
      toast.error('Reminder failed')
    }
  }

  const handleReceipt = async (row) => {
    try {
      await generateReceipt(row.id)
      toast.success('Receipt generated')
      load()
    } catch {
      toast.error('Receipt generation failed')
    }
  }

  const handlePrintReceipt = (row) => {
    window.open(`/finance/receipts?preview=${row.id}`, '_blank')
  }

  const handleResendReceipt = async (row, channel = 'Email') => {
    try {
      await resendReceipt(row.id, channel)
      toast.success(`Receipt sent via ${channel}`)
    } catch {
      toast.error('Failed to send receipt')
    }
  }

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
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
        <Wrapper {...wrapProps('Branch')}>
          <FilterSelectRow
            value={filters.branch}
            onChange={(e) => setFilters((f) => ({ ...f, branch: e.target.value }))}
            ariaLabel="Branch"
            options={[{ value: 'all', label: 'All branches' }, ...branchOptions.map((b) => ({ value: b, label: b }))]}
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
    const defs = ALL_COLUMNS.filter((c) => visibleCols.includes(c.key)).map((c) => {
      const base = {
        ...c,
        align: COLUMN_ALIGN[c.key] || 'left',
        headerClassName: cn(c.key === 'studentName' && 'pl-6 sm:pl-10'),
        cellClassName: cn(
          c.key === 'studentName' && 'pl-6 sm:pl-10',
          ['paymentStatus', 'verificationStatus', 'emiStatus', 'refundStatus', 'accessStatus'].includes(c.key) && 'whitespace-nowrap',
          ['amountPaid', 'pendingAmount', 'totalFees'].includes(c.key) && 'tabular-nums font-medium text-[#111111]',
          c.key === 'paymentDate' && 'whitespace-nowrap tabular-nums',
        ),
      }

      if (c.key === 'paymentStatus' || c.key === 'verificationStatus' || c.key === 'emiStatus') {
        return { ...base, render: (r) => <FinanceStatusBadge status={r[c.key]} className="rounded-full px-3 py-1 text-xs" /> }
      }
      if (c.key === 'refundStatus') {
        return { ...base, render: (r) => <FinanceRefundBadge status={r.refundStatus} className="rounded-full px-3 py-1 text-xs" /> }
      }
      if (c.key === 'accessStatus') {
        return { ...base, render: (r) => <FinanceAccessStatusBadge status={r.accessStatus} className="rounded-full px-3 py-1 text-xs" /> }
      }
      if (['totalFees', 'amountPaid', 'pendingAmount'].includes(c.key)) {
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
        return { ...base, render: (r) => <span className="font-semibold text-[#111111]">{r.studentName}</span> }
      }
      return base
    })

    defs.unshift({
      key: '_select',
      label: '',
      align: 'center',
      headerClassName: 'w-10',
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => toggleSelect(row.id)}
          aria-label={`Select ${row.studentName}`}
          className="h-4 w-4 rounded border-slate-300"
        />
      ),
    })

    defs.push({
      key: 'actions',
      label: 'Actions',
      align: 'center',
      headerClassName: 'min-w-[80px]',
      cellClassName: 'whitespace-nowrap bg-inherit',
      render: (row) => (
        <FinanceActionMenu
          actions={[
            { label: 'View', icon: Eye, onClick: () => setViewRow(row) },
            {
              label: 'Edit',
              icon: Pencil,
              onClick: () => {
                setEditRow(row)
                setEditForm({
                  newStatus: row.paymentStatus,
                  amountAdjustment: String(row.amountPaid),
                  reason: 'Manual Approval',
                  comment: '',
                })
              },
              show: canEdit,
            },
            { label: 'Receipt', icon: Receipt, onClick: () => handleReceipt(row), show: canReceipts },
            { label: 'Notify', icon: Bell, onClick: () => handleReminder(row), variant: 'accent' },
            { label: 'Profile', icon: UserCircle, onClick: () => openStudentProfile(row.studentId, row) },
          ]}
        />
      ),
    })
    return defs
  }, [visibleCols, canEdit, canReceipts, openStudentProfile, selectedIds])

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
          <div className="flex flex-wrap items-start gap-3">
            <FinanceSearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search student, course, txn, receipt…"
              className="min-w-0 flex-1 sm:min-w-[240px]"
            />
            <button
              type="button"
              onClick={() => setShowAdvancedSearch((s) => !s)}
              className="hidden h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-[#246392] hover:bg-slate-50 sm:inline-flex"
            >
              {showAdvancedSearch ? 'Hide' : 'Advanced'} search
            </button>
            <FinanceMobileFilters
              open={mobileFiltersOpen}
              onOpen={() => setMobileFiltersOpen(true)}
              onClose={() => setMobileFiltersOpen(false)}
              onReset={resetAllFilters}
              activeCount={activeFilterCount}
            >
              {renderFilterFields('mobile')}
              <FilterField label="Mobile">
                <FilterInput
                  value={advancedSearch.mobile}
                  onChange={(e) => setAdvancedSearch((s) => ({ ...s, mobile: e.target.value }))}
                  placeholder="Mobile number"
                />
              </FilterField>
              <FilterField label="Email">
                <FilterInput
                  value={advancedSearch.email}
                  onChange={(e) => setAdvancedSearch((s) => ({ ...s, email: e.target.value }))}
                  placeholder="Email"
                />
              </FilterField>
              <FilterField label="Enrollment">
                <FilterInput
                  value={advancedSearch.enrollmentNumber}
                  onChange={(e) => setAdvancedSearch((s) => ({ ...s, enrollmentNumber: e.target.value }))}
                  placeholder="Enrollment number"
                />
              </FilterField>
              <FilterField label="Receipt">
                <FilterInput
                  value={advancedSearch.receiptNumber}
                  onChange={(e) => setAdvancedSearch((s) => ({ ...s, receiptNumber: e.target.value }))}
                  placeholder="Receipt number"
                />
              </FilterField>
              <FilterField label="Transaction ID">
                <FilterInput
                  value={advancedSearch.transactionId}
                  onChange={(e) => setAdvancedSearch((s) => ({ ...s, transactionId: e.target.value }))}
                  placeholder="Transaction ID"
                />
              </FilterField>
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

          {(showAdvancedSearch || Object.values(advancedSearch).some((v) => v?.trim())) && (
            <div className="mt-3 grid gap-3 border-t border-slate-100 pt-3 sm:grid-cols-2 lg:grid-cols-5">
              <FilterInput
                value={advancedSearch.mobile}
                onChange={(e) => setAdvancedSearch((s) => ({ ...s, mobile: e.target.value }))}
                placeholder="Mobile number"
                ariaLabel="Mobile number"
              />
              <FilterInput
                value={advancedSearch.email}
                onChange={(e) => setAdvancedSearch((s) => ({ ...s, email: e.target.value }))}
                placeholder="Email"
                ariaLabel="Email"
              />
              <FilterInput
                value={advancedSearch.enrollmentNumber}
                onChange={(e) => setAdvancedSearch((s) => ({ ...s, enrollmentNumber: e.target.value }))}
                placeholder="Enrollment number"
                ariaLabel="Enrollment number"
              />
              <FilterInput
                value={advancedSearch.receiptNumber}
                onChange={(e) => setAdvancedSearch((s) => ({ ...s, receiptNumber: e.target.value }))}
                placeholder="Receipt number"
                ariaLabel="Receipt number"
              />
              <FilterInput
                value={advancedSearch.transactionId}
                onChange={(e) => setAdvancedSearch((s) => ({ ...s, transactionId: e.target.value }))}
                placeholder="Transaction ID"
                ariaLabel="Transaction ID"
              />
            </div>
          )}

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
          {selectedIds.length > 0 && (
            <span className="ml-2 text-[#246392]">· {selectedIds.length} selected</span>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={() => toast.success(`Bulk reminder queued for ${selectedIds.length} students (UI placeholder)`)}
              className="rounded-lg bg-[#246392] px-3 py-1.5 text-xs font-semibold text-white"
            >
              Bulk reminder
            </button>
          )}
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5" role="group" aria-label="Table density">
            {[
              { id: 'compact', label: 'Compact' },
              { id: 'comfortable', label: 'Comfortable' },
            ].map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTableDensity(id)}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                  tableDensity === id ? 'bg-[#246392] text-white shadow-sm' : 'text-[#686868] hover:bg-slate-50',
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="relative">
            <button
              type="button"
              onClick={() => setColMenuOpen((o) => !o)}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-[#246392] hover:bg-slate-50"
            >
              <Columns3 className="h-4 w-4" /> Columns
            </button>
            {colMenuOpen && (
              <div className="absolute right-0 z-20 mt-1 max-h-72 w-52 overflow-y-auto rounded-lg border border-slate-100 bg-white p-2 shadow-lg">
                {ALL_COLUMNS.map((c) => (
                  <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={visibleCols.includes(c.key)}
                      onChange={() => {
                        setVisibleCols((prev) =>
                          prev.includes(c.key) ? prev.filter((k) => k !== c.key) : [...prev, c.key],
                        )
                      }}
                    />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <FinanceTableSkeleton rows={8} columns={8} />
      ) : (
        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          itemLabel="payments"
          resetDeps={[debouncedSearch, debouncedAdvanced, filters, visibleCols, tableDensity]}
          density={tableDensity}
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
        canReceipts={canReceipts}
        onDownloadReceipt={handleReceipt}
        onPrintReceipt={handlePrintReceipt}
        onResendReceipt={(row) => handleResendReceipt(row, 'Email')}
        onWhatsAppReceipt={(row) => handleResendReceipt(row, 'WhatsApp')}
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
