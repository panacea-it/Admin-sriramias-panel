import mongoose from 'mongoose'

const followUpSchema = new mongoose.Schema(
  {
    leadId: { type: String, index: true },
    studentName: String,
    counselorId: String,
    counselorName: String,
    scheduledAt: Date,
    status: { type: String, default: 'Upcoming' },
    priority: { type: String, default: 'Normal' },
    notes: String,
  },
  { timestamps: true },
)

export default mongoose.models.FollowUp || mongoose.model('FollowUp', followUpSchema)
