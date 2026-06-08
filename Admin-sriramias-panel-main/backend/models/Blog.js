import mongoose from 'mongoose'

const blogSectionSchema = new mongoose.Schema(
  {
    topic: { type: String, trim: true, default: '' },
    image: { type: String, default: '' },
    imageName: { type: String, default: '' },
    content: { type: String, default: '' },
  },
  { _id: true },
)

const blogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Blog title is required'],
      trim: true,
      maxlength: [300, 'Title cannot exceed 300 characters'],
    },
    slug: {
      type: String,
      trim: true,
      lowercase: true,
      default: '',
    },
    metaTitle: { type: String, trim: true, default: '' },
    metaDescription: { type: String, trim: true, default: '' },
    focusKeywords: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    bodyHtml: { type: String, default: '' },
    backgroundImage: { type: String, default: '' },
    backgroundImageName: { type: String, default: '' },
    sections: { type: [blogSectionSchema], default: [] },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    publishedAt: { type: Date, default: Date.now },
    lastSavedAt: { type: Date, default: Date.now },
    slugManuallyEdited: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  },
)

blogSchema.index({ slug: 1 }, { unique: true, sparse: true })
blogSchema.index({ status: 1, publishedAt: -1 })

export default mongoose.model('Blog', blogSchema)
