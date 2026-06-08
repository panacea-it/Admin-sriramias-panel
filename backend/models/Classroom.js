import mongoose from 'mongoose'

const classroomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    capacity: { type: Number, min: 1, default: null },
    description: { type: String, default: '' },
    status: { type: String, enum: ['Active', 'In Active'], default: 'Active' },
    color: { type: String, default: '#246392' },
  },
  { timestamps: true },
)

classroomSchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } })
classroomSchema.index({ code: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } })

export default mongoose.models.Classroom || mongoose.model('Classroom', classroomSchema)
