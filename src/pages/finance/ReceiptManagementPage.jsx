import { useCallback, useEffect, useMemo, useState } from 'react'

import { useSearchParams } from 'react-router-dom'

import { Receipt, Send } from 'lucide-react'

import FinancePageShell from '../../components/finance/FinancePageShell'

import FinanceSearchInput from '../../components/finance/FinanceSearchInput'

import FinanceExportToolbar from '../../components/finance/FinanceExportToolbar'

import FinanceTableSkeleton from '../../components/finance/FinanceTableSkeleton'

import FinanceEmptyState from '../../components/finance/FinanceEmptyState'

import ReceiptCenterTable from '../../components/finance/receipt-center/ReceiptCenterTable'

import ReceiptMobileCards from '../../components/finance/receipt-center/ReceiptMobileCards'

import SendReceiptDialog from '../../components/finance/receipt-center/SendReceiptDialog'

import ReceiptPreviewModal from '../../components/finance/receipt-center/ReceiptPreviewModal'

import EditReceiptDialog from '../../components/finance/receipt-center/EditReceiptDialog'

import BulkResendDialog from '../../components/finance/receipt-center/BulkResendDialog'

import {

  fetchCompletedReceipts,

  sendReceiptCommunication,

  fetchPaymentReportById,

  fetchGstSettings,

  bulkResendReceipts,

  updateCompletedReceipt,

} from '../../api/financeAPI'

import {

  filterReceiptCenterRows,

  sortReceiptRows,

  printReceiptDocument,

  downloadReceiptHtml,

} from '../../utils/receiptCompletion'

import { RECEIPT_LIFECYCLE_STATUSES } from '../../constants/receiptConstants'

import { useDebouncedValue } from '../../hooks/useDebouncedValue'

import { useFinancePermissions } from '../../hooks/useFinancePermissions'

import { FINANCE_COURSES } from '../../data/financeMockData'

import { toast } from '../../utils/toast'



const RECEIPT_EXPORT_COLUMNS = [

  { key: 'receiptNumber', label: 'Receipt #' },

  { key: 'invoiceNumber', label: 'Invoice #' },

  { key: 'studentName', label: 'Student' },

  { key: 'branchCode', label: 'Branch' },

  { key: 'courseName', label: 'Course' },

  { key: 'paymentMode', label: 'Payment Mode' },

  { key: 'gstAmount', label: 'GST Amount' },

  { key: 'totalAmount', label: 'Total Amount' },

  { key: 'receiptLifecycleStatus', label: 'Receipt Status' },

  { key: 'receiptGeneratedAt', label: 'Generated On' },

]



const PAYMENT_TYPE_OPTIONS = [

  { value: 'all', label: 'All types' },

  { value: 'Full Payment', label: 'Full Payment' },

  { value: 'Partial Payment', label: 'Partial Payment' },

  { value: 'EMI Completed', label: 'EMI Completed' },

]



const FILTER_CLASS =

  'mt-1 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/20'



const PAGE_SIZE = 20



export default function ReceiptManagementPage() {

  const { canReceipts, canExport } = useFinancePermissions()

  const [searchParams, setSearchParams] = useSearchParams()

  const [rows, setRows] = useState([])

  const [gstSettings, setGstSettings] = useState(null)

  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState(searchParams.get('q') || '')

  const debouncedSearch = useDebouncedValue(search, 300)

  const [courseId, setCourseId] = useState('all')

  const [paymentType, setPaymentType] = useState('all')

  const [centerName, setCenterName] = useState('all')

  const [branchCode, setBranchCode] = useState('all')

  const [receiptStatus, setReceiptStatus] = useState('all')

  const [dateFrom, setDateFrom] = useState('')

  const [dateTo, setDateTo] = useState('')

  const [sendRow, setSendRow] = useState(null)

  const [sending, setSending] = useState(false)

  const [previewPayment, setPreviewPayment] = useState(null)

  const [previewLoading, setPreviewLoading] = useState(false)

  const [selectedIds, setSelectedIds] = useState([])

  const [bulkOpen, setBulkOpen] = useState(false)

  const [bulkLoading, setBulkLoading] = useState(false)

  const [bulkResult, setBulkResult] = useState(null)

  const [editRow, setEditRow] = useState(null)

  const [editSaving, setEditSaving] = useState(false)

  const [sortKey, setSortKey] = useState('receiptGeneratedAt')

  const [sortDir, setSortDir] = useState('desc')

  const [page, setPage] = useState(1)



  const load = useCallback(async () => {

    setLoading(true)

    try {

      const [receipts, gst] = await Promise.all([fetchCompletedReceipts(), fetchGstSettings()])

      setGstSettings(gst)

      setRows(receipts)

    } catch {

      toast.error('Failed to load completed receipts')

    } finally {

      setLoading(false)

    }

  }, [])



  useEffect(() => {

    load()

  }, [load])



  useEffect(() => {

    const previewId = searchParams.get('preview')

    if (!previewId) return

    setPreviewLoading(true)

    fetchPaymentReportById(previewId)

      .then((payment) => {

        if (payment) setPreviewPayment(payment)

        else toast.error('Receipt not found')

      })

      .catch(() => toast.error('Failed to load receipt preview'))

      .finally(() => setPreviewLoading(false))

  }, [searchParams])



  const closePreview = () => {

    setPreviewPayment(null)

    if (searchParams.get('preview')) {

      searchParams.delete('preview')

      setSearchParams(searchParams, { replace: true })

    }

  }



  const centerOptions = useMemo(() => {

    const names = [...new Set(rows.map((r) => r.centerName).filter(Boolean))]

    return names.sort()

  }, [rows])



  const branchOptions = useMemo(() => {

    const codes = [...new Set(rows.map((r) => r.branchCode).filter(Boolean))]

    return codes.sort()

  }, [rows])



  const filtered = useMemo(() => {

    const list = filterReceiptCenterRows(rows, {

      search: debouncedSearch,

      courseId,

      paymentType,

      centerName,

      branchCode,

      receiptStatus,

      dateFrom,

      dateTo,

    })

    return sortReceiptRows(list, sortKey, sortDir)

  }, [rows, debouncedSearch, courseId, paymentType, centerName, branchCode, receiptStatus, dateFrom, dateTo, sortKey, sortDir])



  useEffect(() => {

    setPage(1)

  }, [debouncedSearch, courseId, paymentType, centerName, branchCode, receiptStatus, dateFrom, dateTo])



  const handleSort = (key) => {

    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))

    else {

      setSortKey(key)

      setSortDir('desc')

    }

  }



  const toggleSelect = (id) => {

    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))

  }



  const paginatedIds = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map((r) => r.id)



  const toggleSelectAll = () => {

    const allOnPage = paginatedIds.every((id) => selectedIds.includes(id))

    if (allOnPage) {

      setSelectedIds((prev) => prev.filter((id) => !paginatedIds.includes(id)))

    } else {

      setSelectedIds((prev) => [...new Set([...prev, ...paginatedIds])])

    }

  }



  const handleSend = async (payload) => {

    if (!sendRow) return

    setSending(true)

    try {

      const updated = await sendReceiptCommunication(sendRow.id, payload)

      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))

      toast.success(`Receipt sent via ${payload.channel}`)

      setSendRow(null)

    } catch {

      toast.error('Failed to send receipt')

    } finally {

      setSending(false)

    }

  }



  const openPreview = (row) => {

    setPreviewPayment(row)

    searchParams.set('preview', row.id)

    setSearchParams(searchParams, { replace: true })

  }



  const handleDownload = (row) => {

    downloadReceiptHtml(row, gstSettings || {})

    setRows((prev) =>

      prev.map((r) =>

        r.id === row.id ? { ...r, receiptLifecycleStatus: 'Downloaded', receiptDownloadedAt: new Date().toISOString() } : r,

      ),

    )

    toast.success('Receipt downloaded')

  }



  const handleBulkSend = async ({ channel }) => {

    setBulkLoading(true)

    try {

      const result = await bulkResendReceipts(selectedIds, { channel })

      setBulkResult(result)

      await load()

      toast.success(`Bulk resend: ${result.succeeded} succeeded, ${result.failed} failed`)

      setSelectedIds([])

    } catch {

      toast.error('Bulk resend failed')

    } finally {

      setBulkLoading(false)

    }

  }



  const closeBulk = () => {

    setBulkOpen(false)

    setBulkResult(null)

  }



  const handleEditSave = async (payload) => {

    if (!editRow) return

    setEditSaving(true)

    try {

      const updated = await updateCompletedReceipt(editRow.id, payload)

      setRows((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))

      if (previewPayment?.id === updated.id) setPreviewPayment(updated)

      toast.success('Receipt updated successfully')

      setEditRow(null)

    } catch {

      toast.error('Failed to update receipt')

    } finally {

      setEditSaving(false)

    }

  }



  return (

    <FinancePageShell

      icon={Receipt}

      title="Receipt Management"

      breadcrumbs={[{ label: 'Receipt Management' }]}

      actions={

        <div className="flex flex-wrap items-center gap-2">

          <span className="rounded-full bg-white/25 px-3 py-1 text-sm font-bold text-white ring-1 ring-white/40">

            {filtered.length} receipt{filtered.length !== 1 ? 's' : ''}

          </span>

          <FinanceExportToolbar

            rows={filtered}

            filenameBase="completed-receipts"

            columnDefs={RECEIPT_EXPORT_COLUMNS}

            canExport={canExport}

            variant="banner"

          />

        </div>

      }

    >

      <p className="-mt-2 text-sm text-[#686868]">

        Manage completed payment receipts — auto-generated after successful payments with GST breakup, branch invoice numbering, and multi-channel delivery.

      </p>



      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">

          <label className="block sm:col-span-2 xl:col-span-2">

            <span className="text-xs font-semibold text-[#686868]">Search</span>

            <FinanceSearchInput

              value={search}

              onChange={(e) => setSearch(e.target.value)}

              placeholder="Receipt #, invoice #, student…"

              className="mt-1"

              inputClassName="h-10"

            />

          </label>

          <label className="block">

            <span className="text-xs font-semibold text-[#686868]">Course</span>

            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={FILTER_CLASS} aria-label="Course">

              <option value="all">All courses</option>

              {FINANCE_COURSES.map((c) => (

                <option key={c.id} value={c.id}>{c.name}</option>

              ))}

            </select>

          </label>

          <label className="block">

            <span className="text-xs font-semibold text-[#686868]">Payment type</span>

            <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={FILTER_CLASS} aria-label="Payment type">

              {PAYMENT_TYPE_OPTIONS.map((o) => (

                <option key={o.value} value={o.value}>{o.label}</option>

              ))}

            </select>

          </label>

          <label className="block">

            <span className="text-xs font-semibold text-[#686868]">Branch</span>

            <select value={branchCode} onChange={(e) => setBranchCode(e.target.value)} className={FILTER_CLASS} aria-label="Branch">

              <option value="all">All branches</option>

              {branchOptions.map((code) => (

                <option key={code} value={code}>{code}</option>

              ))}

            </select>

          </label>

          <label className="block">

            <span className="text-xs font-semibold text-[#686868]">Status</span>

            <select value={receiptStatus} onChange={(e) => setReceiptStatus(e.target.value)} className={FILTER_CLASS} aria-label="Receipt status">

              <option value="all">All statuses</option>

              {RECEIPT_LIFECYCLE_STATUSES.map((s) => (

                <option key={s} value={s}>{s}</option>

              ))}

            </select>

          </label>

          <label className="block">

            <span className="text-xs font-semibold text-[#686868]">Center</span>

            <select value={centerName} onChange={(e) => setCenterName(e.target.value)} className={FILTER_CLASS} aria-label="Center">

              <option value="all">All centers</option>

              {centerOptions.map((name) => (

                <option key={name} value={name}>{name}</option>

              ))}

            </select>

          </label>

          <label className="block">

            <span className="text-xs font-semibold text-[#686868]">From</span>

            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={FILTER_CLASS} aria-label="From date" />

          </label>

          <label className="block">

            <span className="text-xs font-semibold text-[#686868]">To</span>

            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className={FILTER_CLASS} aria-label="To date" />

          </label>

        </div>

      </div>



      {selectedIds.length > 0 && canReceipts && (

        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-[#55ace7]/30 bg-[#eef6fc] px-4 py-2">

          <span className="text-sm font-medium text-[#246392]">{selectedIds.length} selected</span>

          <button

            type="button"

            onClick={() => { setBulkResult(null); setBulkOpen(true) }}

            className="inline-flex items-center gap-1.5 rounded-lg bg-[#246392] px-3 py-1.5 text-xs font-semibold text-white"

          >

            <Send className="h-3.5 w-3.5" />

            Bulk resend

          </button>

          <button

            type="button"

            onClick={() => setSelectedIds([])}

            className="text-xs font-semibold text-[#686868] underline"

          >

            Clear selection

          </button>

        </div>

      )}



      {loading ? (

        <FinanceTableSkeleton rows={6} columns={8} />

      ) : filtered.length === 0 ? (

        <FinanceEmptyState

          title="No completed receipts"

          description="Receipts appear here when students fully pay or complete EMI."

        />

      ) : (

        <>

          <ReceiptCenterTable

            rows={filtered}

            canSend={canReceipts}

            selectedIds={selectedIds}

            onToggleSelect={toggleSelect}

            onToggleSelectAll={toggleSelectAll}

            onSendReceipt={setSendRow}

            onPreview={openPreview}

            onDownload={handleDownload}

            onEditReceipt={setEditRow}

            canEdit={canReceipts}

            sortKey={sortKey}

            sortDir={sortDir}

            onSort={handleSort}

            page={page}

            pageSize={PAGE_SIZE}

            onPageChange={setPage}

          />

          <ReceiptMobileCards

            rows={filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)}

            selectedIds={selectedIds}

            onToggleSelect={toggleSelect}

            onPreview={(row, action) => (action === 'download' ? handleDownload(row) : openPreview(row))}

            onSendReceipt={setSendRow}

            onEditReceipt={setEditRow}

            canSend={canReceipts}

            canEdit={canReceipts}

          />

        </>

      )}



      <SendReceiptDialog

        open={!!sendRow}

        row={sendRow}

        gstSettings={gstSettings}

        onClose={() => setSendRow(null)}

        onSend={handleSend}

        sending={sending}

      />



      <ReceiptPreviewModal

        open={Boolean(previewPayment) || previewLoading}

        onClose={closePreview}

        payment={previewPayment}

        loading={previewLoading}

        gstSettings={gstSettings}

        onPrint={() => previewPayment && printReceiptDocument(previewPayment, gstSettings || {})}

        onDownload={() => previewPayment && handleDownload(previewPayment)}

        onResend={() => {

          if (previewPayment) {

            closePreview()

            setSendRow(previewPayment)

          }

        }}

        onWhatsApp={() => {

          if (previewPayment) setSendRow(previewPayment)

        }}

      />



      <BulkResendDialog

        open={bulkOpen}

        onClose={closeBulk}

        count={selectedIds.length}

        onConfirm={handleBulkSend}

        loading={bulkLoading}

        result={bulkResult}

      />



      <EditReceiptDialog

        open={!!editRow}

        row={editRow}

        onClose={() => setEditRow(null)}

        onSave={handleEditSave}

        saving={editSaving}

      />

    </FinancePageShell>

  )

}


