import mongoose from 'mongoose'

const leadSchema = new mongoose.Schema(
  {
    leadId: { type: String, unique: true, index: true },
    studentName: String,
    mobile: { type: String, index: true },
    email: String,
    interestedCourse: String,
    source: String,
    utmCampaign: String,
    counselorId: String,
    counselorName: String,
    team: String,
    center: String,
    status: { type: String, default: 'New Lead' },
    paymentStatus: { type: String, default: 'Pending' },
    locked: { type: Boolean, default: false },
    assignedTo: String,
    priority: { type: String, default: 'Normal' },
    remark: String,
    lastActivity: String,
  },
  { timestamps: true },
)

export default mongoose.models.Lead || mongoose.model('Lead', leadSchema)
