import mongoose from 'mongoose'

const rubricItemSchema = new mongoose.Schema(
  {
    key: String,
    label: String,
    max: Number,
    score: { type: Number, default: 0 },
    feedback: { type: String, default: '' },
    remarksLabel: String,
    placeholder: String,
  },
  { _id: false },
)

const evaluationPaperSchema = new mongoose.Schema(
  {
    paperId: { type: String, required: true, unique: true, index: true },
    studentName: { type: String, required: true },
    rollNumber: { type: String, default: '' },
    batchId: String,
    batchName: String,
    subjectId: { type: String, index: true },
    subjectName: String,
    subTopicId: String,
    subTopicName: String,
    testId: { type: String, index: true },
    testName: String,
    mentorId: String,
    mentorName: String,
    mentorInitials: String,
    mentorAvailable: { type: Boolean, default: true },
    status: {
      type: String,
      enum: ['Evaluated', 'In Progress', 'Not Started', 'Overdue'],
      default: 'Not Started',
    },
    scoreObtained: Number,
    scoreMax: { type: Number, default: 100 },
    scoreDisplay: String,
    submittedAt: Date,
    evaluatedAt: Date,
    rubric: [rubricItemSchema],
    remarks: { type: String, default: '' },
    internalComments: { type: String, default: '' },
    highlightNotes: { type: String, default: '' },
    annotations: { type: mongoose.Schema.Types.Mixed, default: [] },
    answerSheet: {
      fileName: String,
      url: String,
      dataUrl: String,
      pages: Number,
      pageImages: [String],
    },
    questionText: String,
    questionMarks: Number,
    locked: { type: Boolean, default: false },
  },
  { timestamps: true },
)

export default mongoose.models.EvaluationPaper ||
  mongoose.model('EvaluationPaper', evaluationPaperSchema)
