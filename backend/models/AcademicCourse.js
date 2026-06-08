import mongoose from 'mongoose'

const academicCourseSchema = new mongoose.Schema(
  {
    courseId: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    courseName: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'In Active'],
      default: 'Active',
    },
    centerId: { type: String, default: '' },
    centerName: { type: String, default: '' },
    programId: { type: String, default: '' },
    program: { type: String, default: '' },
    /** Local storage row id from Categories → Courses (e.g. "001") */
    sourceRowId: { type: String, default: '' },
    examCategoryId: { type: String, default: '' },
    examCategory: { type: String, default: '' },
    examSubCategoryId: { type: String, default: '' },
    examSubCategory: { type: String, default: '' },
    subjects: [
      {
        subjectName: { type: String, trim: true },
        facultyName: { type: String, trim: true, default: '' },
      },
    ],
    feeDetails: {
      courseFee: { type: Number, default: 0 },
      discountFee: { type: Number, default: 0 },
      installmentAvailable: { type: Boolean, default: false },
      currency: { type: String, default: 'INR' },
    },
    courseOverview: { type: String, default: '' },
    overview: { type: String, default: '' },
    /** Legacy text bullets; may also store slot objects from admin UI */
    keyFeatures: { type: [mongoose.Schema.Types.Mixed], default: [] },
    whyChooseCourse: { type: String, default: '' },
    howCourseHelps: { type: String, default: '' },
    whyChooseFeatures: {
      type: [
        {
          id: String,
          icon: String,
          iconPreview: String,
          iconFileName: String,
          title: String,
          description: String,
          isHighlighted: Boolean,
          order: Number,
        },
      ],
      default: [],
    },
    howWill: {
      type: [
        {
          id: String,
          kind: String,
          fileName: String,
          placeholder: String,
          preview: String,
        },
      ],
      default: [],
    },
    whyChooseTitle: { type: String, default: '' },
    whyChooseSubtitle: { type: String, default: '' },
    sectionTitleOverview: { type: String, default: '' },
    sectionTitleKeyFeatures: { type: String, default: '' },
    sectionTitleWhyChoose: { type: String, default: '' },
    sectionTitleHowHelps: { type: String, default: '' },
    /** Rich marketing UI state (overview slots, feature cards, media grid) */
    courseFormData: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true },
)

academicCourseSchema.index({ courseId: 1 }, { unique: true })
academicCourseSchema.index({ status: 1, courseName: 1 })

export default mongoose.models.AcademicCourse ||
  mongoose.model('AcademicCourse', academicCourseSchema)
