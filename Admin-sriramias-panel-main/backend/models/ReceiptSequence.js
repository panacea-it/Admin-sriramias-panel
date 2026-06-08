import mongoose from 'mongoose'

const receiptSequenceSchema = new mongoose.Schema(
  {
    branchCode: { type: String, required: true, trim: true },
    financialYear: { type: Number, required: true },
    counter: { type: Number, default: 0 },
  },
  { timestamps: true },
)

receiptSequenceSchema.index({ branchCode: 1, financialYear: 1 }, { unique: true })

export default mongoose.model('ReceiptSequence', receiptSequenceSchema)
