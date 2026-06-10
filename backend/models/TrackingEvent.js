import mongoose from 'mongoose'

const trackingEventSchema = new mongoose.Schema(
  {
    type: { type: String, required: true, index: true },
    leadId: String,
    sessionId: String,
    path: String,
    source: String,
    payload: mongoose.Schema.Types.Mixed,
    device: String,
    browser: String,
    geo: String,
  },
  { timestamps: true },
)

export default mongoose.models.TrackingEvent || mongoose.model('TrackingEvent', trackingEventSchema)
