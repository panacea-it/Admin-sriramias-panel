import mongoose from 'mongoose'

const enrollmentTransferAuditSchema = new mongoose.Schema(
  {
    enrollmentMongoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BatchEnrollment',
      index: true,
    },
    studentId: { type: String, trim: true, default: '' },
    studentName: { type: String, trim: true, default: '' },
    oldBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    oldBatchLabel: { type: String, trim: true, default: '' },
    newBatchId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
    },
    newBatchLabel: { type: String, trim: true, default: '' },
    performedBy: { type: String, trim: true, default: '' },
    remarks: { type: String, trim: true, default: '' },
    transferReason: { type: String, trim: true, default: '' },
    transferDate: { type: String, trim: true, default: '' },
    branch: { type: String, trim: true, default: '' },
    course: { type: String, trim: true, default: '' },
    transferAttendance: { type: Boolean, default: true },
    transferFee: { type: Boolean, default: true },
    transferTests: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  },
)

export default mongoose.model('EnrollmentTransferAudit', enrollmentTransferAuditSchema)
