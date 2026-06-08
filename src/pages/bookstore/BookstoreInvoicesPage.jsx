import { useEffect, useState } from 'react'
import { FileText, Download } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import BookstoreStatusBadge from '../../components/bookstore/BookstoreStatusBadge'
import BookstoreModal from '../../components/bookstore/modal/BookstoreModal'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import { fetchBookstoreInvoices } from '../../api/bookstoreAPI'
import { formatINR } from '../../utils/financeFilters'
import { toast } from '../../utils/toast'

export default function BookstoreInvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    fetchBookstoreInvoices().then((res) => setInvoices(res?.items || []))
  }, [])

  const columns = [
    { key: 'id', label: 'Invoice' },
    { key: 'orderId', label: 'Order' },
    { key: 'gstin', label: 'GSTIN' },
    { key: 'amount', label: 'Amount', render: (r) => formatINR(r.amount) },
    { key: 'status', label: 'Status', render: (r) => <BookstoreStatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <button type="button" onClick={() => setPreview(row)} className="inline-flex items-center gap-1 text-sm font-semibold text-[#7c5cbf]">
          <Download className="h-4 w-4" /> Preview
        </button>
      ),
    },
  ]

  return (
    <BookstorePageShell icon={FileText} title="Invoice Management">
      <p className="mb-4 rounded-xl bg-white p-4 text-sm text-[#686868] shadow-sm">
        GST invoice generation, auto-invoice on paid orders, and email delivery placeholders are ready for backend wiring.
      </p>
      <PaginatedFigmaTable columns={columns} data={invoices} itemLabel="invoices" />
      <BookstoreModal
        open={Boolean(preview)}
        onClose={() => setPreview(null)}
        title="Invoice preview"
        subtitle={preview?.id}
        size="md"
      >
        {preview && (
          <div className="rounded-xl border border-[#eef0f4] bg-[#fafbfc] p-5 text-sm">
            <p className="font-bold text-[#111]">Tax Invoice</p>
            <p className="mt-2 text-[#686868]">Order: {preview.orderId}</p>
            <p className="text-[#686868]">GSTIN: {preview.gstin}</p>
            <p className="mt-4 text-2xl font-bold text-[#7c5cbf]">{formatINR(preview.amount)}</p>
            <button type="button" onClick={() => toast.info('PDF download placeholder')} className="mt-4 text-sm font-semibold text-[#7c5cbf]">
              Download PDF
            </button>
          </div>
        )}
      </BookstoreModal>
    </BookstorePageShell>
  )
}
