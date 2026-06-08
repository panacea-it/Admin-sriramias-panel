import mongoose from 'mongoose'

const trackingSchema = new mongoose.Schema(
  {
    sentAt: Date,
    deliveredAt: Date,
    openedAt: Date,
    readAt: Date,
    failedAt: Date,
    failedReason: String,
    retryCount: { type: Number, default: 0 },
  },
  { _id: false },
)

const auditEntrySchema = new mongoose.Schema(
  {
    action: String,
    by: String,
    at: Date,
  },
  { _id: false },
)

const communicationLogSchema = new mongoose.Schema(
  {
    logId: { type: String, unique: true, sparse: true, trim: true },
    studentId: { type: String, trim: true },
    studentName: { type: String, trim: true },
    paymentReference: { type: String, trim: true },
    recipient: { type: String, trim: true },
    type: { type: String, trim: true },
    channel: { type: String, trim: true },
    status: { type: String, trim: true, default: 'Queued' },
    deliveryStatus: { type: String, trim: true },
    openStatus: { type: String, trim: true },
    readStatus: { type: String, trim: true },
    sentBy: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
    tracking: trackingSchema,
    followUpTag: { type: String, trim: true },
    followUpPriority: { type: String, enum: ['High', 'Medium', 'Low', null], default: null },
    followUpNotes: { type: String, trim: true },
    nextFollowUpDate: { type: Date },
    counselorId: { type: String, trim: true },
    counselorName: { type: String, trim: true },
    templateId: { type: String, trim: true },
    auditTrail: [auditEntrySchema],
    meta: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
)

export default mongoose.model('CommunicationLog', communicationLogSchema)
