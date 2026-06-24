/** Receipt lifecycle statuses */
export const RECEIPT_LIFECYCLE_STATUSES = [
  'Generated',
  'Sent',
  'Downloaded',
  'Failed',
  'Cancelled',
]

/** Notification delivery statuses */
export const RECEIPT_NOTIFICATION_STATUSES = ['Sent', 'Delivered', 'Failed', 'Pending']

/** Primary branch codes for invoice numbering */
export const RECEIPT_BRANCH_CODES = ['DEL', 'HYD', 'PUN']

/** Map center names / codes to invoice branch codes */
export const CENTER_TO_BRANCH_CODE = {
  'Delhi Center': 'DEL',
  'Delhi HQ': 'DEL',
  'Hyderabad Center': 'HYD',
  'Pune Center': 'PUN',
  'Mumbai Center': 'PUN',
  DLH: 'DEL',
  HYD: 'HYD',
  MUM: 'PUN',
  PUN: 'PUN',
  DEL: 'DEL',
}

export const RECEIPT_RESEND_CHANNELS = [
  { id: 'WhatsApp', label: 'WhatsApp' },
  { id: 'SMS', label: 'SMS' },
  { id: 'Email', label: 'Email' },
]

export const RECEIPT_TABLE_COLUMNS = [
  { key: 'receiptNumber', label: 'Receipt #', sortable: true },
  { key: 'invoiceNumber', label: 'Invoice #', sortable: true },
  { key: 'studentName', label: 'Student', sortable: true },
  { key: 'branchCode', label: 'Branch', sortable: true },
  { key: 'courseName', label: 'Course', sortable: true },
  { key: 'paymentMode', label: 'Payment Mode', sortable: true },
  { key: 'gstAmount', label: 'GST', sortable: true, align: 'right' },
  { key: 'totalAmount', label: 'Total', sortable: true, align: 'right' },
  { key: 'receiptLifecycleStatus', label: 'Status', sortable: true },
  { key: 'receiptGeneratedAt', label: 'Generated On', sortable: true },
]
