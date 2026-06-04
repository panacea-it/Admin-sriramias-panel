import mongoose from 'mongoose'

const fileSchema = new mongoose.Schema(
  {
    name: String,
    size: Number,
    mimeType: String,
    url: String,
  },
  { _id: true },
)

const accessSchema = new mongoose.Schema(
  {
    batchSpecific: { type: Boolean, default: false },
    courseSpecific: { type: Boolean, default: false },
    paidOnly: { type: Boolean, default: false },
    trialUsers: { type: Boolean, default: false },
    expiryDate: String,
    downloadEnabled: { type: Boolean, default: true },
    streamingOnly: { type: Boolean, default: false },
    watermark: { type: Boolean, default: false },
    maxDownloads: { type: Number, default: 0 },
  },
  { _id: false },
)

const contentLibrarySchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    contentType: { type: String, required: true },
    thumbnailUrl: { type: String, default: '' },
    tags: [String],
    keywords: [String],
    seoSlug: { type: String, default: '' },
    estimatedDuration: { type: String, default: '' },
    difficulty: { type: String, default: 'Intermediate' },
    subjectIds: [String],
    topicIds: [String],
    courseIds: [String],
    batchIds: [String],
    subtopic: { type: String, default: '' },
    chapter: { type: String, default: '' },
    categoryId: { type: String, default: '' },
    files: [fileSchema],
    externalUrl: { type: String, default: '' },
    visibility: { type: String, default: 'Private' },
    access: { type: accessSchema, default: () => ({}) },
    status: { type: String, default: 'Draft' },
    uploadedBy: { type: String, default: 'Admin' },
    uploadedAt: { type: Date, default: Date.now },
    publishedAt: { type: Date },
    scheduledAt: { type: Date },
    views: { type: Number, default: 0 },
    downloads: { type: Number, default: 0 },
    approvalStatus: { type: String, default: 'approved' },
    version: { type: Number, default: 1 },
    dependencies: [{ topicId: String, label: String }],
    notifyOnPublish: { type: Boolean, default: true },
    deletedAt: { type: Date },
    recycleExpiresAt: { type: Date },
  },
  { timestamps: true, collection: 'content_library' },
)

export default mongoose.models.ContentLibrary ||
  mongoose.model('ContentLibrary', contentLibrarySchema)
