import mongoose from 'mongoose'

const schema = new mongoose.Schema(
  {
    contentId: { type: String, required: true, index: true },
    event: { type: String, enum: ['view', 'download', 'complete'], required: true },
    studentId: String,
    watchSeconds: { type: Number, default: 0 },
    completionPct: { type: Number, default: 0 },
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true, collection: 'content_analytics' },
)

export default mongoose.models.ContentAnalytics ||
  mongoose.model('ContentAnalytics', schema)
