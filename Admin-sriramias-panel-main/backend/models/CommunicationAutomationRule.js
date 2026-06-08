import mongoose from 'mongoose'

const executionLogSchema = new mongoose.Schema(
  {
    at: Date,
    status: String,
    count: Number,
    error: String,
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

const communicationAutomationRuleSchema = new mongoose.Schema(
  {
    ruleId: { type: String, unique: true, sparse: true, trim: true },
    name: { type: String, required: true, trim: true },
    triggerEvent: { type: String, trim: true },
    triggerTiming: { type: String, trim: true },
    channel: { type: String, trim: true },
    templateId: { type: String, trim: true },
    templateName: { type: String, trim: true },
    audience: { type: String, trim: true },
    escalationLevel: { type: String, trim: true },
    active: { type: Boolean, default: true },
    priority: { type: Number, default: 1 },
    reminderFrequency: { type: String, trim: true },
    autoStopCondition: { type: String, trim: true },
    lastExecutedAt: Date,
    lastExecutionStatus: { type: String, trim: true },
    executionLogs: [executionLogSchema],
    auditTrail: [auditEntrySchema],
  },
  { timestamps: true },
)

export default mongoose.model('CommunicationAutomationRule', communicationAutomationRuleSchema)
