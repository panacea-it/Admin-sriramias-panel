import { MOCK_BOOKSTORE_PAYMENTS } from '../data/bookstoreMockData'

const ORDER_DISPLAY_HINTS = {
  'BSO-1001': {
    customerName: 'Aarav Patel',
    bookName: 'UPSC Prelims GS Manual 2026',
  },
  'BSO-1002': {
    customerName: 'Sneha Reddy',
    bookName: 'Indian Polity — Laxmikanth Companion',
  },
  'BSO-1003': {
    customerName: 'Rahul Verma',
    bookName: 'Current Affairs Digest',
  },
}

export function withPaymentDisplayFields(payment) {
  const hint = ORDER_DISPLAY_HINTS[payment.orderId]
  return {
    ...payment,
    customerName: payment.customerName ?? hint?.customerName ?? 'Guest Customer',
    bookName: payment.bookName ?? hint?.bookName ?? 'Book purchase',
  }
}

export function withPaymentsDisplayFields(payments = []) {
  return payments.map(withPaymentDisplayFields)
}

export function updateMockPaymentStatus(paymentId, status) {
  const payment = MOCK_BOOKSTORE_PAYMENTS.find((p) => p.id === paymentId)
  if (payment) payment.status = status
}
