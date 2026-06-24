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
  return {
    ...invoice,
    buyerName: invoice.buyerName ?? hint?.buyerName ?? 'Guest Buyer',
    bookName: invoice.bookName ?? hint?.bookName ?? 'Book purchase',
    invoiceDate: invoice.invoiceDate ?? invoice.createdAt ?? null,
  }
}

export function withInvoicesDisplayFields(invoices = []) {
  return invoices.map(withInvoiceDisplayFields)
}
