import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import InvoicesTable from '../../components/bookstore/InvoicesTable'
import InvoiceRowActions from '../../components/bookstore/InvoiceRowActions'
import InvoicePreviewModal from '../../components/bookstore/InvoicePreviewModal'
import { fetchBookstoreInvoices } from '../../api/bookstoreAPI'
import { withInvoicesDisplayFields } from '../../utils/bookstoreInvoiceDisplay'
import { toast } from '../../utils/toast'

export default function BookstoreInvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchBookstoreInvoices()
      .then((res) => setInvoices(res?.items || []))
      .finally(() => setLoading(false))
  }, [])

  const displayInvoices = useMemo(
    () => withInvoicesDisplayFields(invoices),
    [invoices],
  )

  const handleDownload = useCallback((invoice) => {
    toast.info(`PDF download placeholder for ${invoice?.id ?? 'invoice'}`)
  }, [])

  const renderRowActions = useCallback(
    (row) => (
      <InvoiceRowActions
        invoiceId={row.id}
        onPreview={() => setPreview(row)}
        onDownload={() => handleDownload(row)}
      />
    ),
    [handleDownload],
  )

  return (
    <BookstorePageShell icon={FileText} title="Invoice Management">
      <p className="rounded-xl border border-slate-200/70 bg-white px-4 py-3 text-sm text-[#686868] shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
        GST invoice generation, auto-invoice on paid orders, and email delivery placeholders are ready for backend wiring.
      </p>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
        <div className="overflow-hidden rounded-xl border border-slate-100">
          <InvoicesTable
            invoices={displayInvoices}
            loading={loading}
            renderActions={renderRowActions}
          />
        </div>
      </div>

      <InvoicePreviewModal
        open={Boolean(preview)}
        invoice={preview}
        onClose={() => setPreview(null)}
        onDownload={() => handleDownload(preview)}
      />
    </BookstorePageShell>
  )
}
