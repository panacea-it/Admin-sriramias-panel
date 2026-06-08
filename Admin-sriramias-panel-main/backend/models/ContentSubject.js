import mongoose from 'mongoose'

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, default: '' },
    description: { type: String, default: '' },
    icon: { type: String, default: '' },
    color: { type: String, default: '#55ace7' },
    status: { type: String, default: 'Active' },
    displayOrder: { type: Number, default: 0 },
  },
  { timestamps: true, collection: 'content_subjects' },
)

export default mongoose.models.ContentSubject ||
  mongoose.model('ContentSubject', schema)
