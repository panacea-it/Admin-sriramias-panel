import mongoose from 'mongoose'

const schema = new mongoose.Schema(
  {
    contentId: { type: String, required: true, index: true },
    version: { type: Number, required: true },
    fileName: String,
    changedBy: String,
    changedAt: { type: Date, default: Date.now },
    note: String,
  },
  { timestamps: true, collection: 'content_versions' },
)

export default mongoose.models.ContentVersion ||
  mongoose.model('ContentVersion', schema)
