import mongoose from 'mongoose'

const youtubeVideoSchema = new mongoose.Schema(
  {
    videoId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Video name is required'],
      trim: true,
      maxlength: [300, 'Name cannot exceed 300 characters'],
    },
    url: {
      type: String,
      required: [true, 'Video URL is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive'],
      default: 'Active',
    },
    /** Dynamic rank — positive integer, one video per rank (sparse unique). */
    priorityOrder: {
      type: Number,
      default: null,
      min: 1,
    },
    /** @deprecated legacy field — use priorityOrder */
    priorityLevel: {
      type: Number,
      default: 0,
    },
    isFeatured: { type: Boolean, default: false },
    isPinned: { type: Boolean, default: false },
    customOrder: { type: Number, default: 0 },
    priorityExpiryDate: { type: Date, default: null },
    analyticsLabels: {
      type: [String],
      enum: ['Featured', 'Trending', 'Most Watched'],
      default: [],
    },
    dateBucket: {
      type: String,
      enum: ['Today', 'This Week', 'This Month'],
      default: 'Today',
    },
    displayTime: { type: String, default: '10 AM' },
    displayDate: { type: String, default: '' },
  },
  { timestamps: true },
)

youtubeVideoSchema.index(
  { priorityOrder: 1 },
  {
    unique: true,
    sparse: true,
    partialFilterExpression: { priorityOrder: { $type: 'number', $gte: 1 } },
  },
)
youtubeVideoSchema.index({ priorityOrder: 1, createdAt: -1 })
youtubeVideoSchema.index({ status: 1 })
youtubeVideoSchema.index({ isPinned: 1 })

export default mongoose.model('YoutubeVideo', youtubeVideoSchema)
