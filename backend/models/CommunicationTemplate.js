import mongoose from 'mongoose'

const auditEntrySchema = new mongoose.Schema(
  {
    action: String,
    by: String,
    at: Date,
  },
  { _id: false },
)

const communicationTemplateSchema = new mongoose.Schema(
  {
    templateId: { type: String, unique: true, sparse: true, trim: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, trim: true },
    channel: { type: String, trim: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
    subject: { type: String, trim: true, default: '' },
    body: { type: String, trim: true, default: '' },
    createdBy: { type: String, trim: true },
    lastModifiedBy: { type: String, trim: true },
    auditTrail: [auditEntrySchema],
  },
  { timestamps: true },
)

export default mongoose.model('CommunicationTemplate', communicationTemplateSchema)
