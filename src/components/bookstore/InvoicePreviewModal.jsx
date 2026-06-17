import BookstoreModal, { BookstoreModalFooter } from './modal/BookstoreModal'
import Button from '../ui/Button'
import BookstoreStatusBadge from './BookstoreStatusBadge'
import { BOOKSTORE_LABEL_CLASS } from './modal/bookstoreFormStyles'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'

function DetailField({ label, children, className }) {
  return (
    <div className={className}>
      <dt className={BOOKSTORE_LABEL_CLASS}>{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-[#111]">{children}</dd>
    </div>
  )
}

export default function InvoicePreviewModal({ open, invoice, onClose, onDownload }) {
  return (
    <BookstoreModal
      open={open}
      onClose={onClose}
      title="Invoice preview"
      subtitle={invoice?.id}
      size="lg"
      footer={
        invoice && (
          <BookstoreModalFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Close
            </Button>
            <Button type="button" onClick={onDownload}>
              Download PDF
            </Button>
          </BookstoreModalFooter>
        )
      }
    >
      {invoice && (
        <dl className="grid gap-5 sm:grid-cols-2">
          <DetailField label="Invoice ID">
            <span className="font-semibold text-[#246392]">{invoice.id}</span>
          </DetailField>
          <DetailField label="Order ID">{invoice.orderId}</DetailField>
          <DetailField label="Buyer Name">{invoice.buyerName}</DetailField>
          <DetailField label="Book Name">{invoice.bookName}</DetailField>
          <DetailField label="Invoice Date">
            {invoice.invoiceDate ? formatCategoryDateTime(invoice.invoiceDate) : '—'}
          </DetailField>
          <DetailField label="GSTIN">
            <span className="font-mono text-[13px]">{invoice.gstin}</span>
          </DetailField>
          <DetailField label="Amount">
            <span className="font-bold tabular-nums">{formatINR(invoice.amount)}</span>
          </DetailField>
          <DetailField label="Status">
            <BookstoreStatusBadge status={invoice.status} />
          </DetailField>
        </dl>
      )}
    </BookstoreModal>
  )
}
