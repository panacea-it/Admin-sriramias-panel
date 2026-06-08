import mongoose from 'mongoose'

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    scope: { type: String, required: true },
    targetIds: [String],
    membership: { type: String, default: '' },
    locked: { type: Boolean, default: false },
    dateStart: String,
    dateEnd: String,
    contentIds: [String],
    status: { type: String, default: 'Active' },
  },
  { timestamps: true, collection: 'content_access_rules' },
)

export default mongoose.models.ContentAccessRule ||
  mongoose.model('ContentAccessRule', schema)
