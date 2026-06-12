import mongoose from 'mongoose'

const batchEnrollmentSchema = new mongoose.Schema(
  {
    enrollmentId: { type: String, trim: true, default: '', unique: true, sparse: true },
    studentName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, default: '' },
    mobileNumber: { type: String, trim: true, default: '' },
    batchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['PENDING', 'PAID', 'PARTIAL', 'OVERDUE', 'REFUNDED'],
      default: 'PENDING',
    },
    attendancePercentage: { type: Number, default: 0, min: 0, max: 100 },
    courseProgressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
    enrolledAt: { type: Date, default: Date.now },
    transferDate: { type: String, default: '' },
    transferReason: { type: String, default: '' },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  },
)

export default mongoose.model('BatchEnrollment', batchEnrollmentSchema)
