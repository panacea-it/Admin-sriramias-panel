import mongoose from 'mongoose'

const schema = new mongoose.Schema(
  {
    instructionId: { type: String, required: true, unique: true, trim: true },
    instructionDescription: { type: String, required: true, trim: true },
    status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  },
  { timestamps: true, collection: 'test_exam_patterns' },
)

schema.index({ instructionDescription: 1 })

export default mongoose.models.TestExamPattern || mongoose.model('TestExamPattern', schema)
