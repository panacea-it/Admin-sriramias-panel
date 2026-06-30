import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileText } from 'lucide-react'
import BookstorePageShell from '../../components/bookstore/BookstorePageShell'
import InvoicesTable from '../../components/bookstore/InvoicesTable'
import InvoiceRowActions from '../../components/bookstore/InvoiceRowActions'
import InvoicePreviewModal from '../../components/bookstore/InvoicePreviewModal'
import { downloadBookstoreInvoice, fetchBookstoreInvoices } from '../../api/bookstoreAPI'
import { withInvoicesDisplayFields } from '../../utils/bookstoreInvoiceDisplay'
import { downloadBookstoreInvoicePdf } from '../../utils/bookstoreInvoicePdf'
import { toast } from '../../utils/toast'
import { getApiErrorMessage } from '../../utils/apiError'

export default function BookstoreInvoicesPage() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [preview, setPreview] = useState(null)

  useEffect(() => {
    setLoading(true)
    fetchBookstoreInvoices({ limit: 100 })
      .then((res) => setInvoices(res?.items || []))
      .catch((error) => {
        toast.error(getApiErrorMessage(error, 'Unable to fetch invoices.'))
        setInvoices([])
      })
      .finally(() => setLoading(false))
  }, [])

  const displayInvoices = useMemo(
    () => withInvoicesDisplayFields(invoices),
    [invoices],
  )

  const handleDownload = useCallback(async (invoice) => {
    if (!invoice) return

    try {
      if (invoice.invoiceUrl) {
        window.open(invoice.invoiceUrl, '_blank', 'noopener,noreferrer')
        toast.success(`Invoice ${invoice.id} opened`)
        return
      }

      if (invoice.orderId) {
        const result = await downloadBookstoreInvoice(invoice.orderId)
        if (typeof result === 'string' && result) {
          window.open(result, '_blank', 'noopener,noreferrer')
          toast.success(`Invoice ${invoice.id} opened`)
          return
        }
        if (result === true) {
          toast.success(`Invoice ${invoice.id} downloaded`)
          return
        }
      }

      const downloaded = downloadBookstoreInvoicePdf(invoice)
      if (downloaded) {
        toast.success(`Invoice ${invoice.id} downloaded`)
      } else {
        toast.error('Unable to download invoice')
      }
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Unable to download invoice.'))
    }
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
        Paid orders with generated invoices appear here. Download uses the stored invoice file when available.
      </p>

      <div className="rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5">
        <div className="min-w-0 rounded-xl border border-slate-100">
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
