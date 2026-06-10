import mongoose from 'mongoose'

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, default: '' },
    color: { type: String, default: '#55ace7' },
    status: { type: String, default: 'Active' },
    isSystem: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'content_categories' },
)

export default mongoose.models.ContentCategory ||
  mongoose.model('ContentCategory', schema)
