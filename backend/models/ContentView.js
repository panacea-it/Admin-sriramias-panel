import mongoose from 'mongoose'

const schema = new mongoose.Schema(
  {
    contentId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    progress: { type: Number, default: 0 },
    watchSeconds: { type: Number, default: 0 },
    lastPosition: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'content_views' },
)

export default mongoose.models.ContentView ||
  mongoose.model('ContentView', schema)
