import mongoose from 'mongoose'

const schema = new mongoose.Schema(
  {
    languageId: { type: String, required: true, unique: true, trim: true },
    languageName: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true, collection: 'test_languages' },
)

schema.index({ languageName: 1 })

export default mongoose.models.TestLanguage || mongoose.model('TestLanguage', schema)
