import mongoose from 'mongoose'

const attemptSchema = new mongoose.Schema(
  {
    attemptNo: Number,
    transactionId: String,
    gatewayResponse: String,
    status: String,
    dateTime: Date,
    failureReason: String,
    paymentMode: String,
    errorCode: String,
    retrySource: String,
    deviceId: String,
    ipAddress: String,
    browser: String,
    os: String,
  },
  { _id: false },
)

const adminLogSchema = new mongoose.Schema(
  {
    adminName: String,
    action: String,
    comment: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
)

const timelineEventSchema = new mongoose.Schema(
  {
    event: String,
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false },
)

const paymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, unique: true, sparse: true, trim: true },
    studentId: { type: String, trim: true },
    studentName: { type: String, trim: true },
    mobile: { type: String, trim: true },
    email: { type: String, trim: true },
    courseId: { type: String, trim: true },
    courseName: { type: String, trim: true },
    courseType: { type: String, trim: true },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Partial', 'Pending', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    paymentType: { type: String, enum: ['Full', 'EMI', 'Partial'], default: 'Full' },
    paymentMode: { type: String, trim: true, default: '' },
    amountPaid: { type: Number, default: 0 },
    pendingAmount: { type: Number, default: 0 },
    totalFees: { type: Number, default: 0 },
    gst: { type: Number, default: 0 },
    transactionId: { type: String, trim: true, default: '' },
    paymentDate: { type: Date, default: null },
    branch: { type: String, trim: true, default: '' },
    centerId: { type: String, trim: true, index: true },
    centerName: { type: String, trim: true, index: true },
    counselorId: { type: String, trim: true, default: '' },
    batchId: { type: String, trim: true, default: '' },
    attempts: { type: [attemptSchema], default: [] },
    adminLogs: { type: [adminLogSchema], default: [] },
    timeline: { type: [timelineEventSchema], default: [] },
    receiptNumber: { type: String, default: null },
    invoiceNumber: { type: String, default: null },
    branchCode: { type: String, default: null },
    receiptGeneratedAt: { type: Date, default: null },
    receiptGeneratedBy: { type: String, default: null },
    receiptSentAt: { type: Date, default: null },
    receiptSentBy: { type: String, default: null },
    receiptDownloadedAt: { type: Date, default: null },
    receiptLifecycleStatus: {
      type: String,
      enum: ['Generated', 'Sent', 'Downloaded', 'Failed', 'Cancelled'],
      default: null,
    },
    receiptCommunications: { type: mongoose.Schema.Types.Mixed, default: {} },
    receiptResendHistory: { type: [mongoose.Schema.Types.Mixed], default: [] },
    verificationHash: { type: String, default: null },
    signatureSignedAt: { type: Date, default: null },
    /** Offline approval workflow */
    isOfflineRequest: { type: Boolean, default: false },
    offlineStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending',
    },
    paymentProof: { type: String, default: '' },
    proofFiles: { type: [mongoose.Schema.Types.Mixed], default: [] },
    requestedDate: { type: Date, default: null },
    offlineWorkflowStatus: {
      type: String,
      enum: ['Pending', 'Under Verification', 'Approved', 'Rejected', 'Reconciliation Pending'],
      default: 'Pending',
    },
    reconciliationStatus: {
      type: String,
      enum: ['Matched', 'Pending Verification', 'Mismatch Detected', 'Reconciled'],
      default: 'Pending Verification',
    },
    reconciliationNotes: { type: String, default: '' },
    cashCollectedAmount: { type: Number, default: null },
    reconciliationVerifiedAmount: { type: Number, default: null },
    duplicateStatus: {
      type: String,
      enum: ['Unique', 'Possible Duplicate', 'Duplicate Confirmed', 'Override Approved'],
      default: 'Unique',
    },
    duplicateOverride: { type: Boolean, default: false },
    approvedBy: { type: String, default: '' },
    approvedAt: { type: Date, default: null },
    rejectedBy: { type: String, default: '' },
    rejectionReason: { type: String, default: '' },
    approvalRemarks: { type: String, default: '' },
    verificationNotes: { type: String, default: '' },
    utrNumber: { type: String, default: '' },
    uploadHash: { type: String, default: '' },
    offlineAuditTrail: { type: [mongoose.Schema.Types.Mixed], default: [] },
    notificationLog: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { timestamps: true },
)

paymentSchema.index({ centerId: 1, paymentDate: -1 })
paymentSchema.index({ centerId: 1, paymentStatus: 1 })
paymentSchema.index({ paymentStatus: 1, paymentDate: -1 })

export default mongoose.model('Payment', paymentSchema)
