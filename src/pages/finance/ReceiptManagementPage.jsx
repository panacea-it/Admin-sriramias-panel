import { useCallback, useEffect, useMemo, useState } from 'react'

import { useSearchParams } from 'react-router-dom'

import { Receipt, Send } from 'lucide-react'

import FinancePageShell from '../../components/finance/FinancePageShell'

import FinanceSearchInput from '../../components/finance/FinanceSearchInput'

import FinanceTableSkeleton from '../../components/finance/FinanceTableSkeleton'

import FinanceEmptyState from '../../components/finance/FinanceEmptyState'

import ReceiptCenterTable from '../../components/finance/receipt-center/ReceiptCenterTable'

import ReceiptMobileCards from '../../components/finance/receipt-center/ReceiptMobileCards'

import SendReceiptDialog from '../../components/finance/receipt-center/SendReceiptDialog'

import ReceiptPreviewModal from '../../components/finance/receipt-center/ReceiptPreviewModal'

import EditReceiptDialog from '../../components/finance/receipt-center/EditReceiptDialog'

import BulkResendDialog from '../../components/finance/receipt-center/BulkResendDialog'

import {
  fetchReceiptFilterOptions,
  fetchReceiptList,
  viewReceipt,
  previewReceipt,
  downloadReceipt,
  printReceipt,
  updateReceipt,
  fetchReceiptEmailPreview,
  sendReceiptEmail,
  sendReceiptWhatsapp,
  sendReceiptSms,
  bulkSendReceiptEmails,
  mapUpdatedReceiptToListRow,
} from '../../api/receiptManagementAPI'

import {
  buildPaymentTypeFilterOptions,
  buildReceiptStatusFilterOptions,
  handleReceiptPrintResponse,
  openReceiptDownloadUrl,
} from '../../utils/receiptManagementHelpers'

import { RECEIPT_LIFECYCLE_STATUSES } from '../../constants/receiptConstants'

import { useDebouncedValue } from '../../hooks/useDebouncedValue'

import { useFinancePermissions } from '../../hooks/useFinancePermissions'

import { toast } from '../../utils/toast'



const PAYMENT_TYPE_OPTIONS = [

  { value: 'all', label: 'All types' },

  { value: 'Full Payment', label: 'Full Payment' },

  { value: 'Partial Payment', label: 'Partial Payment' },

  { value: 'EMI Completed', label: 'EMI Completed' },

]



const FILTER_CLASS =

  'h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 transition focus:border-[#55ace7] focus:outline-none focus:ring-2 focus:ring-[#55ace7]/20'

const FILTER_LABEL_CLASS = 'mb-1.5 block text-xs font-semibold text-slate-500'



const PAGE_SIZE = 20



export default function ReceiptManagementPage() {

  const { canReceipts } = useFinancePermissions()

  const [searchParams, setSearchParams] = useSearchParams()

  const [filterOptions, setFilterOptions] = useState(null)

  const [rows, setRows] = useState([])

  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: PAGE_SIZE, totalPages: 1 })

  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState(searchParams.get('q') || '')

  const debouncedSearch = useDebouncedValue(search, 300)

  const [courseId, setCourseId] = useState('all')

  const [paymentType, setPaymentType] = useState('all')

  const [centerId, setCenterId] = useState('all')

  const [branchId, setBranchId] = useState('all')

  const [receiptStatus, setReceiptStatus] = useState('all')

  const [dateFrom, setDateFrom] = useState('')

  const [dateTo, setDateTo] = useState('')

  const [sendRow, setSendRow] = useState(null)

  const [sendPreviewRow, setSendPreviewRow] = useState(null)

  const [sendEmailDefaults, setSendEmailDefaults] = useState(null)

  const [sendChannelsEnabled, setSendChannelsEnabled] = useState({ whatsapp: false, sms: false, email: true })

  const [sendPreviewLoading, setSendPreviewLoading] = useState(false)

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



  const loadFilterOptions = useCallback(async () => {

    try {

      const options = await fetchReceiptFilterOptions()

      setFilterOptions(options)

    } catch {

      toast.error('Failed to load filter options')

    }

  }, [])



  const loadList = useCallback(async () => {

    setLoading(true)

    try {

      const result = await fetchReceiptList({

        search: debouncedSearch,

        courseId,

        branchId,

        centerId,

        paymentType,

        receiptStatus,

        dateFrom,

        dateTo,

        page,

        limit: PAGE_SIZE,

        sortKey,

        sortDir,

      })

      setRows(result.rows)

      setPagination(result.pagination)

    } catch {

      toast.error('Failed to load completed receipts')

    } finally {

      setLoading(false)

    }

  }, [

    debouncedSearch,

    courseId,

    branchId,

    centerId,

    paymentType,

    receiptStatus,

    dateFrom,

    dateTo,

    page,

    sortKey,

    sortDir,

  ])



  useEffect(() => {

    loadFilterOptions()

  }, [loadFilterOptions])



  useEffect(() => {

    loadList()

  }, [loadList])



  useEffect(() => {

    setPage(1)

  }, [debouncedSearch, courseId, paymentType, centerId, branchId, receiptStatus, dateFrom, dateTo, sortKey, sortDir])



  useEffect(() => {

    const previewId = searchParams.get('preview')

    if (!previewId) return

    setPreviewLoading(true)

    viewReceipt(previewId)

      .then((payment) => {

        if (payment) setPreviewPayment(payment)

        else toast.error('Receipt not found')

      })

      .catch(() => toast.error('Failed to load receipt preview'))

      .finally(() => setPreviewLoading(false))

  }, [searchParams])



  useEffect(() => {

    if (!sendRow) {

      setSendPreviewRow(null)

      setSendEmailDefaults(null)

      return

    }

    const receiptId = sendRow.receiptId || sendRow.id

    let cancelled = false

    setSendPreviewLoading(true)

    Promise.all([previewReceipt(receiptId), fetchReceiptEmailPreview(receiptId)])

      .then(([preview, emailPreview]) => {

        if (cancelled) return

        setSendPreviewRow(preview)

        setSendEmailDefaults(emailPreview)

        const comms = sendRow.communications || {}

        setSendChannelsEnabled({
          whatsapp: preview?.communications?.whatsapp?.enabled ?? sendRow.communications?.whatsapp?.enabled ?? false,
          sms: preview?.communications?.sms?.enabled ?? sendRow.communications?.sms?.enabled ?? false,
          email: preview?.communications?.email?.enabled ?? sendRow.communications?.email?.enabled ?? true,
        })

      })

      .catch(() => {

        if (!cancelled) toast.error('Failed to load send preview')

      })

      .finally(() => {

        if (!cancelled) setSendPreviewLoading(false)

      })

    return () => {

      cancelled = true

    }

  }, [sendRow])



  const closePreview = () => {

    setPreviewPayment(null)

    if (searchParams.get('preview')) {

      searchParams.delete('preview')

      setSearchParams(searchParams, { replace: true })

    }

  }



  const courseOptions = useMemo(() => filterOptions?.courses || [], [filterOptions])



  const branchOptions = useMemo(() => filterOptions?.branches || [], [filterOptions])



  const centerOptions = useMemo(() => filterOptions?.centers || [], [filterOptions])



  const statusOptions = useMemo(() => {

    if (filterOptions?.receiptStatuses?.length) {

      return buildReceiptStatusFilterOptions(filterOptions.receiptStatuses)

    }

    return RECEIPT_LIFECYCLE_STATUSES.map((s) => ({ value: s, label: s }))

  }, [filterOptions])



  const paymentTypeOptions = useMemo(() => {

    if (filterOptions?.paymentTypes?.length) {

      const fromApi = buildPaymentTypeFilterOptions(filterOptions.paymentTypes)

      return [{ value: 'all', label: 'All types' }, ...fromApi]

    }

    return PAYMENT_TYPE_OPTIONS

  }, [filterOptions])



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



  const paginatedIds = rows.map((r) => r.id)



  const toggleSelectAll = () => {

    const allOnPage = paginatedIds.every((id) => selectedIds.includes(id))

    if (allOnPage) {

      setSelectedIds((prev) => prev.filter((id) => !paginatedIds.includes(id)))

    } else {

      setSelectedIds((prev) => [...new Set([...prev, ...paginatedIds])])

    }

  }



  const refreshRowInList = useCallback(async () => {

    await loadList()

  }, [loadList])



  const handleSend = async (payload) => {

    if (!sendRow) return

    const receiptId = sendRow.receiptId || sendRow.id

    setSending(true)

    try {

      if (payload.channel === 'Email') {

        await sendReceiptEmail({

          receiptId,

          email: payload.email,

          subject: payload.subject,

          message: payload.message,

        })

        toast.success('Receipt sent via Email')

      } else if (payload.channel === 'WhatsApp') {

        const result = await sendReceiptWhatsapp({

          receiptId,

          mobile: payload.mobile,

          message: payload.message,

        })

        if (result?.enabled === false) {

          toast.error(result.message || 'WhatsApp sending is not available yet')

          return

        }

        toast.success('Receipt sent via WhatsApp')

      } else if (payload.channel === 'SMS') {

        const result = await sendReceiptSms({

          receiptId,

          mobile: payload.mobile,

          message: payload.message,

        })

        if (result?.enabled === false) {

          toast.error(result.message || 'SMS sending is not available yet')

          return

        }

        toast.success('Receipt sent via SMS')

      }

      setSendRow(null)

      await refreshRowInList()

    } catch (error) {

      toast.error(error?.message || 'Failed to send receipt')

    } finally {

      setSending(false)

    }

  }



  const openPreview = async (row) => {

    setEditRow(null)

    const receiptId = row.receiptId || row.id

    setPreviewLoading(true)

    setPreviewPayment(null)

    searchParams.set('preview', receiptId)

    setSearchParams(searchParams, { replace: true })

    try {

      const payment = await viewReceipt(receiptId)

      if (payment) setPreviewPayment(payment)

      else toast.error('Receipt not found')

    } catch {

      toast.error('Failed to load receipt')

    } finally {

      setPreviewLoading(false)

    }

  }



  const handleEditReceipt = (row) => {

    closePreview()

    setEditRow(row)

  }



  const handleDownload = async (row) => {

    const receiptId = row.receiptId || row.id

    try {

      const data = await downloadReceipt(receiptId)

      if (data?.downloadUrl) {

        openReceiptDownloadUrl(data.downloadUrl, data.fileName)

        toast.success('Receipt downloaded')

        await refreshRowInList()

        if (previewPayment?.id === receiptId || previewPayment?.receiptId === receiptId) {

          const updated = await viewReceipt(receiptId)

          if (updated) setPreviewPayment(updated)

        }

      } else {

        toast.error('Download link not available')

      }

    } catch (error) {

      toast.error(error?.message || 'Failed to download receipt')

    }

  }



  const handlePrint = async (row) => {

    const receiptId = row?.receiptId || row?.id || previewPayment?.receiptId || previewPayment?.id

    if (!receiptId) return

    try {

      const data = await printReceipt(receiptId)

      const printed = handleReceiptPrintResponse(data)

      if (!printed) toast.error('Print data not available')

    } catch (error) {

      toast.error(error?.message || 'Failed to print receipt')

    }

  }



  const handleBulkSend = async ({ channel }) => {

    if (channel !== 'Email') {

      toast.error(`${channel} bulk resend is not available yet`)

      return

    }

    setBulkLoading(true)

    try {

      const rowsById = Object.fromEntries(rows.map((r) => [r.id, r]))

      const result = await bulkSendReceiptEmails(selectedIds, rowsById)

      setBulkResult(result)

      await refreshRowInList()

      toast.success(`Bulk resend: ${result.succeeded} succeeded, ${result.failed} failed`)

      setSelectedIds([])

    } catch (error) {

      toast.error(error?.message || 'Bulk resend failed')

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

    const receiptId = editRow.receiptId || editRow.id

    setEditSaving(true)

    try {

      const updated = await updateReceipt(payload, receiptId)

      const listRow = mapUpdatedReceiptToListRow(updated, editRow)

      setRows((prev) => prev.map((r) => (r.id === receiptId ? { ...r, ...listRow } : r)))

      if (previewPayment?.id === receiptId || previewPayment?.receiptId === receiptId) {

        setPreviewPayment(updated)

      }

      toast.success('Receipt updated successfully')

      setEditRow(null)

      await refreshRowInList()

    } catch (error) {

      toast.error(error?.message || 'Failed to update receipt')

    } finally {

      setEditSaving(false)

    }

  }



  const hasRows = pagination.total > 0 || rows.length > 0

  const previewGstSettings = useMemo(() => {
    const institute = previewPayment?.institute
    if (!institute) return null
    return {
      companyName: institute.name,
      companyAddress: institute.address,
      logoUrl: institute.logoUrl,
      taxEnabled: true,
      footerNotes: previewPayment?.branding?.footerNotes,
      termsAndConditions: previewPayment?.branding?.termsAndConditions,
      signatoryName: previewPayment?.branding?.signatoryName,
      signatoryDesignation: previewPayment?.branding?.signatoryDesignation,
      branchGst: [
        {
          gstNumber: institute.gstin,
          address: institute.address,
          logoUrl: institute.logoUrl,
          signatoryName: previewPayment?.branding?.signatoryName,
          signatureUrl: previewPayment?.branding?.signatureImageUrl,
        },
      ],
    }
  }, [previewPayment])

  const sendGstSettings = useMemo(() => {
    const institute = sendPreviewRow?.institute
    if (!institute) return null
    return {
      companyName: institute.name,
      companyAddress: institute.address,
      logoUrl: institute.logoUrl,
      branchGst: [{ gstNumber: institute.gstin, address: institute.address, logoUrl: institute.logoUrl }],
    }
  }, [sendPreviewRow])



  return (

    <FinancePageShell

      icon={Receipt}

      title="Receipt Management"

      breadcrumbs={[{ label: 'Receipt Management' }]}

    >

      <div className="rounded-[12px] border border-slate-200/80 bg-white p-5 shadow-[0_5px_20px_rgba(0,0,0,0.08)] sm:p-6">

        <div className="grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">

          <label className="block sm:col-span-2 lg:col-span-2 xl:col-span-2 2xl:col-span-2">

            <span className={FILTER_LABEL_CLASS}>Search</span>

            <FinanceSearchInput

              value={search}

              onChange={(e) => setSearch(e.target.value)}

              placeholder="Receipt #, invoice #, student…"

              inputClassName="h-10"

            />

          </label>

          <label className="block">

            <span className={FILTER_LABEL_CLASS}>Course</span>

            <select value={courseId} onChange={(e) => setCourseId(e.target.value)} className={FILTER_CLASS} aria-label="Course">

              <option value="all">All courses</option>

              {courseOptions.map((c) => (

                <option key={c._id} value={c._id}>{c.courseName}</option>

              ))}

            </select>

          </label>

          <label className="block">

            <span className={FILTER_LABEL_CLASS}>Payment type</span>

            <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={FILTER_CLASS} aria-label="Payment type">

              {paymentTypeOptions.map((o) => (

                <option key={o.value} value={o.value}>{o.label}</option>

              ))}

            </select>

          </label>

          <label className="block">

            <span className={FILTER_LABEL_CLASS}>Branch</span>

            <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={FILTER_CLASS} aria-label="Branch">

              <option value="all">All branches</option>

              {branchOptions.map((b) => (

                <option key={b._id} value={b._id}>{b.branchCode}</option>

              ))}

            </select>

          </label>

          <label className="block">

            <span className={FILTER_LABEL_CLASS}>Status</span>

            <select value={receiptStatus} onChange={(e) => setReceiptStatus(e.target.value)} className={FILTER_CLASS} aria-label="Receipt status">

              <option value="all">All statuses</option>

              {statusOptions.map((s) => (

                <option key={s.value} value={s.value}>{s.label}</option>

              ))}

            </select>

          </label>

          <label className="block">

            <span className={FILTER_LABEL_CLASS}>Center</span>

            <select value={centerId} onChange={(e) => setCenterId(e.target.value)} className={FILTER_CLASS} aria-label="Center">

              <option value="all">All centers</option>

              {centerOptions.map((c) => (

                <option key={c._id} value={c._id}>{c.centerName}</option>

              ))}

            </select>

          </label>

          <label className="block">

            <span className={FILTER_LABEL_CLASS}>From</span>

            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className={FILTER_CLASS} aria-label="From date" />

          </label>

          <label className="block">

            <span className={FILTER_LABEL_CLASS}>To</span>

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

      ) : !hasRows ? (

        <FinanceEmptyState

          title="No completed receipts"

          description="Receipts appear here when students fully pay or complete EMI."

        />

      ) : (

        <>

          <ReceiptCenterTable

            rows={rows}

            canSend={canReceipts}

            selectedIds={selectedIds}

            onToggleSelect={toggleSelect}

            onToggleSelectAll={toggleSelectAll}

            onSendReceipt={setSendRow}

            onPreview={openPreview}

            onDownload={handleDownload}

            onEditReceipt={handleEditReceipt}

            canEdit={canReceipts}

            sortKey={sortKey}

            sortDir={sortDir}

            onSort={handleSort}

            page={page}

            pageSize={PAGE_SIZE}

            totalCount={pagination.total}

            onPageChange={setPage}

          />

          <ReceiptMobileCards

            rows={rows}

            selectedIds={selectedIds}

            onToggleSelect={toggleSelect}

            onPreview={(row, action) => (action === 'download' ? handleDownload(row) : openPreview(row))}

            onSendReceipt={setSendRow}

            onEditReceipt={handleEditReceipt}

            canSend={canReceipts}

            canEdit={canReceipts}

          />

        </>

      )}



      <SendReceiptDialog

        open={!!sendRow}

        row={sendRow}

        previewRow={sendPreviewRow}

        emailDefaults={sendEmailDefaults}

        channelsEnabled={sendChannelsEnabled}

        gstSettings={sendGstSettings}

        onClose={() => setSendRow(null)}

        onSend={handleSend}

        onPrint={handlePrint}

        onDownload={handleDownload}

        sending={sending}

        previewLoading={sendPreviewLoading}

      />



      <ReceiptPreviewModal

        open={Boolean(previewPayment) || previewLoading}

        onClose={closePreview}

        payment={previewPayment}

        loading={previewLoading}

        gstSettings={previewGstSettings}

        onPrint={() => handlePrint(previewPayment)}

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
