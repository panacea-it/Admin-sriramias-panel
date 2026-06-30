import { formatOrderBookNames } from './bookstoreApiHelpers'

const ORDER_DISPLAY_HINTS = {
  'BSO-1001': {
    buyerName: 'Aarav Patel',
    bookName: 'UPSC Prelims GS Manual 2026',
  },
  'BSO-1002': {
    buyerName: 'Sneha Reddy',
    bookName: 'Indian Polity — Laxmikanth Companion',
  },
  'BSO-1003': {
    buyerName: 'Rahul Verma',
    bookName: 'Current Affairs Digest',
  },
}

export function withInvoiceDisplayFields(invoice) {
  const hint = ORDER_DISPLAY_HINTS[invoice.orderId]
  const buyerName =
    String(invoice.buyerName || '').trim() ||
    hint?.buyerName ||
    'Guest Buyer'
  const bookName =
    String(invoice.bookName || '').trim() ||
    formatOrderBookNames(invoice.items) ||
    hint?.bookName ||
    'Book purchase'

  return {
    ...invoice,
    buyerName,
    bookName,
    invoiceDate: invoice.invoiceDate ?? invoice.createdAt ?? null,
  }
}

export function withInvoicesDisplayFields(invoices = []) {
  return invoices.map(withInvoiceDisplayFields)
}
