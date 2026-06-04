import mongoose from 'mongoose'

const schema = new mongoose.Schema(
  {
    contentId: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
  },
  { timestamps: true, collection: 'content_bookmarks' },
)

schema.index({ contentId: 1, studentId: 1 }, { unique: true })

export default mongoose.models.ContentBookmark ||
  mongoose.model('ContentBookmark', schema)
