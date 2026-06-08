import mongoose from 'mongoose'

const liveClassBookingSchema = new mongoose.Schema(
  {
    classroomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Classroom', required: true },
    source: { type: String, enum: ['live-classes', 'subject'], required: true },
    sourceId: { type: String, required: true },
    title: { type: String, default: '' },
    date: { type: String, required: true },
    startTime: { type: String, required: true },
    durationMinutes: { type: Number, default: 60 },
    startAt: { type: Date, required: true, index: true },
    endAt: { type: Date, required: true, index: true },
    center: { type: String, default: '' },
    teacher: { type: String, default: '' },
  },
  { timestamps: true },
)

liveClassBookingSchema.index({ classroomId: 1, startAt: 1, endAt: 1 })
liveClassBookingSchema.index({ source: 1, sourceId: 1 }, { unique: true })

export default mongoose.models.LiveClassBooking ||
  mongoose.model('LiveClassBooking', liveClassBookingSchema)
