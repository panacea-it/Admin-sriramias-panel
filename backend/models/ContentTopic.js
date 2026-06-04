import mongoose from 'mongoose'

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    subjectId: { type: String, required: true },
    chapter: { type: String, default: '' },
    description: { type: String, default: '' },
    displayOrder: { type: Number, default: 0 },
    status: { type: String, default: 'Active' },
  },
  { timestamps: true, collection: 'content_topics' },
)

export default mongoose.models.ContentTopic ||
  mongoose.model('ContentTopic', schema)
