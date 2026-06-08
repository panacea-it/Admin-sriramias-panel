import mongoose from 'mongoose'

const schema = new mongoose.Schema(
  {
    sectionId: { type: String, required: true, unique: true, trim: true },
    sectionName: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true, collection: 'test_section_configs' },
)

schema.index({ sectionName: 1 })

export default mongoose.models.TestSectionConfig || mongoose.model('TestSectionConfig', schema)
