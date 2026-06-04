import mongoose from 'mongoose'

const courseSchema = new mongoose.Schema(
  {
    /** Display title — batch name for Academics → Batches */
    courseName: {
      type: String,
      required: [true, 'Batch name is required'],
      trim: true,
      maxlength: [300, 'Name cannot exceed 300 characters'],
    },
    batchId: { type: String, trim: true, default: '' },
    batchName: { type: String, trim: true, default: '' },
    /** Catalog course id from Categories → Courses */
    courseId: { type: String, trim: true, default: '' },
    academicCourseId: { type: String, trim: true, default: '' },
    linkedCourseName: { type: String, trim: true, default: '' },
    commencement: { type: String, default: '' },
    durationLabel: { type: String, default: '' },
    batchStartFrom: { type: String, default: '' },
    batchEndTo: { type: String, default: '' },
    bannerUrl: { type: String, default: '' },
    bannerFileName: { type: String, default: '' },
    mentorEmail: { type: String, trim: true, default: '' },
    mentorEmployeeId: { type: String, trim: true, default: '' },
    mentorName: { type: String, trim: true, default: '' },
    mentorRoleId: { type: String, trim: true, default: '' },
    mentorRoleLabel: { type: String, trim: true, default: '' },
    trainerName: { type: String, trim: true, default: '' },
    /** Legacy list fields — kept optional for older documents */
    category: { type: String, trim: true, default: 'Batch' },
    center: { type: String, trim: true, default: '—' },
    price: { type: String, trim: true, default: '—' },
    status: {
      type: String,
      enum: ['Active', 'In Active', 'Draft'],
      default: 'Active',
    },
    feeDetails: {
      courseFee: { type: Number, default: 0 },
      discountFee: { type: Number, default: 0 },
      installmentAvailable: { type: Boolean, default: false },
      currency: { type: String, default: 'INR' },
    },
    /** Batch-only snapshot for edit prefill */
    formData: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: true },
  },
)

export default mongoose.model('Course', courseSchema)
