import mongoose from 'mongoose'

const videoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    duration: { type: String, default: '' },
    featured: { type: Boolean, default: false },
    orderIndex: { type: Number, default: 0 },
    sourceType: { type: String, enum: ['upload', 'youtube', 'vimeo'], default: 'upload' },
    views: { type: Number, default: 0 },
    watchProgress: { type: Number, default: 0 },
  },
  { timestamps: true },
)

const testSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    testType: {
      type: String,
      enum: ['mcq', 'descriptive', 'assignment'],
      default: 'mcq',
    },
    linkedTestId: { type: String, default: '' },
    instructions: { type: String, default: '' },
    durationMinutes: { type: Number, default: 0 },
    marks: { type: Number, default: 0 },
    difficulty: { type: String, default: 'medium' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    orderIndex: { type: Number, default: 0 },
  },
  { timestamps: true },
)

/** Prelims section question — stored per section when section-wise mode enabled */
const prelimsSectionQuestionSchema = new mongoose.Schema(
  {
    questionId: { type: String, default: '' },
    questionNo: { type: Number, default: 1 },
    questionType: {
      type: String,
      enum: ['mcq', 'multiSelect', 'trueFalse'],
      default: 'mcq',
    },
    questionText: { type: String, default: '' },
    options: { type: [String], default: [] },
    correctAnswer: { type: String, default: '' },
    explanation: { type: String, default: '' },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
    marks: { type: mongoose.Schema.Types.Mixed, default: '' },
    negativeMarks: { type: mongoose.Schema.Types.Mixed, default: '' },
    image: { type: String, default: '' },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { _id: false },
)

/** Prelims section config — Faculty Subjects → Prelims Test only */
const prelimsSectionSchema = new mongoose.Schema(
  {
    sectionId: { type: String, required: true },
    sectionMasterId: { type: String, default: '' },
    sectionName: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    totalQuestions: { type: mongoose.Schema.Types.Mixed, default: '' },
    totalMarks: { type: mongoose.Schema.Types.Mixed, default: '' },
    marksPerQuestion: { type: mongoose.Schema.Types.Mixed, default: '' },
    negativeMarks: { type: mongoose.Schema.Types.Mixed, default: '' },
    duration: { type: String, default: '30' },
    durationCustom: { type: String, default: '' },
    timerEnabled: { type: Boolean, default: false },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    lockSection: { type: Boolean, default: false },
    order: { type: Number, default: 1 },
    questionCount: { type: Number, default: 0 },
    questions: { type: [prelimsSectionQuestionSchema], default: [] },
    uploadedFiles: { type: [mongoose.Schema.Types.Mixed], default: [] },
  },
  { _id: false },
)

/** Full prelims test series payload stored on content items */
const prelimsTestSeriesSchema = new mongoose.Schema(
  {
    languages: {
      type: [String],
      default: [],
    },
    sectionWiseEnabled: { type: Boolean, default: false },
    sectionTimerExpiryAction: {
      type: String,
      enum: ['moveNext', 'submitSection'],
      default: 'moveNext',
    },
    sections: { type: [prelimsSectionSchema], default: [] },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    schedule: { type: mongoose.Schema.Types.Mixed, default: {} },
    resultSettings: { type: mongoose.Schema.Types.Mixed, default: {} },
    questions: { type: [mongoose.Schema.Types.Mixed], default: [] },
    uploadedFiles: { type: [mongoose.Schema.Types.Mixed], default: [] },
    questionCount: { type: Number, default: 0 },
    attemptLimitEnabled: { type: Boolean, default: false },
    maxAttempts: { type: Number, default: 1 },
    attemptRestrictionType: {
      type: String,
      enum: ['lifetime', 'daily', 'weekly'],
      default: 'lifetime',
    },
    showRemainingAttempts: { type: Boolean, default: true },
    shuffleQuestions: { type: Boolean, default: false },
    shuffleOptions: { type: Boolean, default: false },
    shuffleSections: { type: Boolean, default: false },
  },
  { _id: false },
)

const contentItemSchema = new mongoose.Schema(
  {
    id: { type: String, default: '' },
    itemType: { type: String, default: '' },
    title: { type: String, default: '' },
    linkedExistingFormId: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    lastUpdated: { type: Date },
    data: { type: mongoose.Schema.Types.Mixed, default: null },
    testSeries: { type: prelimsTestSeriesSchema, default: null },
    batchIds: { type: [String], default: [] },
    batchId: { type: String, default: '' },
  },
  { _id: false },
)

const contentFolderSchema = new mongoose.Schema(
  {
    id: { type: String, default: '' },
    parentFolderId: { type: String, default: null },
    folderName: { type: String, default: '', trim: true },
    description: { type: String, default: '' },
    orderIndex: { type: Number, default: 0 },
    updatedAt: { type: Date },
    items: { type: [contentItemSchema], default: [] },
  },
  { _id: false },
)

const contentCategorySchema = new mongoose.Schema(
  {
    id: { type: String, default: '' },
    categoryType: { type: String, default: '' },
    label: { type: String, default: '' },
    orderIndex: { type: Number, default: 0 },
    folders: { type: [contentFolderSchema], default: [] },
  },
  { _id: false },
)

const pdfSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    pdfUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    orderIndex: { type: Number, default: 0 },
  },
  { timestamps: true },
)

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, default: 'Untitled Note' },
    content: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    attachments: { type: [mongoose.Schema.Types.Mixed], default: [] },
    lastAutosave: { type: Date },
  },
  { timestamps: true },
)

const topicSchema = new mongoose.Schema(
  {
    topicName: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    facultyName: { type: String, default: '' },
    orderIndex: { type: Number, default: 0 },
    videos: { type: [videoSchema], default: [] },
    tests: { type: [testSchema], default: [] },
    pdfs: { type: [pdfSchema], default: [] },
    notes: { type: [noteSchema], default: [] },
  },
  { timestamps: true },
)

const folderSchema = new mongoose.Schema(
  {
    parentFolderId: { type: String, default: null },
    folderName: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    orderIndex: { type: Number, default: 0 },
    topics: { type: [topicSchema], default: [] },
  },
  { timestamps: true },
)

const schema = new mongoose.Schema(
  {
    subjectId: { type: String, required: true, unique: true, index: true },
    subjectName: { type: String, default: '' },
    categoryIds: { type: [String], default: [] },
    facultyId: { type: String, default: '' },
    facultyName: { type: String, default: '' },
    folders: { type: [folderSchema], default: [] },
    categories: { type: [contentCategorySchema], default: [] },
    publishStatus: { type: String, enum: ['draft', 'published'], default: 'draft' },
  },
  { timestamps: true, collection: 'faculty_subject_content' },
)

export default mongoose.models.FacultySubjectContent ||
  mongoose.model('FacultySubjectContent', schema)
