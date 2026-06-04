import mongoose from 'mongoose'

const trackingConfigSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    pageVisitTracking: { type: Boolean, default: true },
    clickTracking: { type: Boolean, default: true },
    scrollDepthTracking: { type: Boolean, default: true },
    paymentTracking: { type: Boolean, default: true },
    popupEnabled: { type: Boolean, default: true },
    popupDelaySeconds: { type: Number, default: 10 },
    utmTracking: { type: Boolean, default: true },
    referrerTracking: { type: Boolean, default: true },
    autoLeadRules: {
      inquiryForm: { type: Boolean, default: true },
      brochureDownload: { type: Boolean, default: true },
      signupForm: { type: Boolean, default: true },
      paymentPage: { type: Boolean, default: true },
      paymentFailed: { type: Boolean, default: true },
      popupForm: { type: Boolean, default: true },
      testAttempt: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
)

export default mongoose.models.TrackingConfig || mongoose.model('TrackingConfig', trackingConfigSchema)
