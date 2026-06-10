const now = new Date()
const iso = (d) => d.toISOString()
const daysAgo = (n) => {
  const d = new Date(now)
  d.setDate(d.getDate() - n)
  return iso(d)
}

function buildAttempts(baseId) {
  return [
    {
      attemptNo: 1,
      transactionId: `TXN-${baseId}-A1`,
      gatewayResponse: 'FAILED',
      status: 'Failed',
      dateTime: daysAgo(12),
      failureReason: 'Insufficient funds',
      paymentMode: 'UPI',
    },
    {
      attemptNo: 2,
      transactionId: `TXN-${baseId}-A2`,
      gatewayResponse: 'FAILED',
      status: 'Failed',
      dateTime: daysAgo(10),
      failureReason: 'Gateway timeout',
      paymentMode: 'Card',
    },
    {
      attemptNo: 3,
      transactionId: `TXN-${baseId}-A3`,
      gatewayResponse: 'SUCCESS',
      status: 'Success',
      dateTime: daysAgo(8),
      failureReason: '',
      paymentMode: 'UPI',
    },
  ]
}

export const SEED_PAYMENTS = [
  {
    paymentId: 'PAY-001',
    studentId: 'STU-24001',
    studentName: 'Aarav Sharma',
    mobile: '9876543210',
    email: 'aarav@example.com',
    courseId: 'CRS-101',
    courseName: 'UPSC Prelims Foundation',
    courseType: 'Online',
    paymentStatus: 'Paid',
    paymentType: 'Full',
    paymentMode: 'UPI',
    amountPaid: 45000,
    pendingAmount: 0,
    totalFees: 45000,
    gst: 8100,
    transactionId: 'TXN-PAY-001-A3',
    paymentDate: daysAgo(8),
    branch: 'Delhi HQ',
    attempts: buildAttempts('PAY-001'),
    adminLogs: [
      {
        adminName: 'Priya Accounts',
        action: 'Status verified',
        comment: 'UPI receipt matched',
        timestamp: daysAgo(7),
      },
    ],
    timeline: [
      { event: 'Payment Initiated', timestamp: daysAgo(12) },
      { event: 'Successful', timestamp: daysAgo(8) },
    ],
    receiptNumber: 'RCP-2026-0001',
  },
  {
    paymentId: 'PAY-002',
    studentId: 'STU-24002',
    studentName: 'Neha Verma',
    mobile: '9123456780',
    email: 'neha@example.com',
    courseId: 'CRS-102',
    courseName: 'GS Mains Comprehensive',
    courseType: 'Offline',
    paymentStatus: 'Partial',
    paymentType: 'EMI',
    paymentMode: 'Bank Transfer',
    amountPaid: 30000,
    pendingAmount: 45000,
    totalFees: 75000,
    gst: 13500,
    transactionId: 'TXN-PAY-002-A1',
    paymentDate: daysAgo(5),
    branch: 'Lucknow',
    attempts: buildAttempts('PAY-002'),
    adminLogs: [],
    timeline: [{ event: 'Payment Initiated', timestamp: daysAgo(5) }],
    receiptNumber: 'RCP-2026-0002',
  },
  {
    paymentId: 'PAY-003',
    studentId: 'STU-24003',
    studentName: 'Rahul Mehta',
    mobile: '9988776655',
    email: 'rahul@example.com',
    courseId: 'CRS-103',
    courseName: 'Optional Sociology',
    courseType: 'Hybrid',
    paymentStatus: 'Pending',
    paymentType: 'Full',
    paymentMode: 'Card',
    amountPaid: 0,
    pendingAmount: 55000,
    totalFees: 55000,
    gst: 9900,
    transactionId: '',
    paymentDate: null,
    branch: 'Patna',
    attempts: buildAttempts('PAY-003').map((a) => ({ ...a, status: 'Failed' })),
    adminLogs: [],
    timeline: [{ event: 'Payment Initiated', timestamp: daysAgo(2) }],
    receiptNumber: null,
  },
]

export const SEED_OFFLINE = [
  {
    paymentId: 'OFF-001',
    isOfflineRequest: true,
    offlineStatus: 'Pending',
    studentName: 'Vikram Singh',
    studentId: 'STU-24010',
    courseName: 'GS Mains Comprehensive',
    courseId: 'CRS-102',
    amountPaid: 20000,
    totalFees: 20000,
    paymentProof: 'cash-slip-001.jpg',
    paymentMode: 'Cash',
    requestedDate: daysAgo(2),
  },
  {
    paymentId: 'OFF-002',
    isOfflineRequest: true,
    offlineStatus: 'Pending',
    studentName: 'Anita Das',
    studentId: 'STU-24011',
    courseName: 'UPSC Prelims Foundation',
    courseId: 'CRS-101',
    amountPaid: 15000,
    totalFees: 15000,
    paymentProof: 'upi-screenshot.png',
    paymentMode: 'UPI Offline',
    requestedDate: daysAgo(1),
  },
]

export const SEED_EMI_PLANS = [
  {
    planId: 'EMI-001',
    studentId: 'STU-24002',
    studentName: 'Neha Verma',
    courseId: 'CRS-102',
    courseName: 'GS Mains Comprehensive',
    totalFees: 75000,
    totalPaid: 30000,
    pendingAmount: 45000,
    completionPercent: 40,
    installments: [
      {
        emiNo: 1,
        emiDate: '2026-01-10',
        emiAmount: 15000,
        status: 'Paid',
        dueDate: '2026-01-10',
        paidDate: '2026-01-10',
        paymentMode: 'UPI',
        receipt: 'RCP-E1',
      },
      {
        emiNo: 2,
        emiDate: '2026-02-10',
        emiAmount: 15000,
        status: 'Paid',
        dueDate: '2026-02-10',
        paidDate: '2026-02-12',
        paymentMode: 'Bank Transfer',
        receipt: 'RCP-E2',
      },
      {
        emiNo: 3,
        emiDate: '2026-03-10',
        emiAmount: 15000,
        status: 'Due',
        dueDate: '2026-03-10',
        paidDate: '',
        paymentMode: '',
        receipt: null,
      },
    ],
  },
]

export const SEED_COMM_LOGS = [
  {
    logId: 'COM-001',
    recipient: 'aarav@example.com',
    type: 'Payment Receipt',
    channel: 'Email',
    status: 'Delivered',
    timestamp: daysAgo(8),
  },
  {
    logId: 'COM-002',
    recipient: '9876543210',
    type: 'Admission Confirmation',
    channel: 'WhatsApp',
    status: 'Delivered',
    timestamp: daysAgo(8),
  },
]

export const SEED_GST = {
  key: 'default',
  gstPercent: 18,
  invoicePrefix: 'INV-SRI-',
  receiptPrefix: 'RCP-SRI-',
  taxEnabled: true,
  branchGst: [
    { branchId: 'BR-DEL', branchName: 'Delhi HQ', gstEnabled: true, gstNumber: '29ABCDEDELF1Z5' },
    { branchId: 'BR-LKO', branchName: 'Lucknow', gstEnabled: true, gstNumber: '29ABCDELKOF1Z5' },
  ],
}

export function buildSeedDashboard(payments, emiPlans) {
  const paid = payments.filter((p) => p.paymentStatus === 'Paid')
  return {
    stats: {
      totalPayments: payments.length,
      totalRevenue: payments.reduce((s, p) => s + (p.amountPaid || 0), 0),
      pendingPayments: payments.filter((p) => p.paymentStatus === 'Pending').length,
      failedPayments: payments.filter((p) => p.paymentStatus === 'Failed').length,
      emiActiveStudents: emiPlans.length,
      offlineApprovalsPending: payments.filter((p) => p.isOfflineRequest && p.offlineStatus === 'Pending')
        .length,
      todayCollections: paid.reduce((s, p) => s + (p.amountPaid || 0), 0),
      monthlyCollections: payments.reduce((s, p) => s + (p.amountPaid || 0), 0),
    },
    monthlyRevenue: [{ month: 'May', amount: payments.reduce((s, p) => s + (p.amountPaid || 0), 0) }],
    paymentStatusBreakdown: [
      { label: 'Paid', value: 50, color: '#69df66' },
      { label: 'Pending', value: 50, color: '#55ace7' },
    ],
    courseWiseRevenue: [],
    emiTrend: [],
    recentPayments: paid.slice(0, 5),
    recentFailed: payments.filter((p) => p.paymentStatus === 'Pending').slice(0, 3),
    pendingEmiDues: emiPlans[0]?.installments?.filter((e) => e.status === 'Due') || [],
  }
}
