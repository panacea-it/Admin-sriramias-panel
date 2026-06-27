import { z } from 'zod'

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid selection — please re-select')

export const facultySubjectCategoryEnum = z.enum([
  'LIVE_CLASS',
  'RECORDING',
  'PRELIMS_TEST',
  'MAINS_ANSWER_WRITING',
  'PDF',
])

export const facultySubjectFormSchema = z.object({
  subjectName: z
    .string()
    .trim()
    .min(2, 'Faculty subject name must be at least 2 characters')
    .max(200, 'Name must be at most 200 characters'),
  subject: objectId.nonempty('Please select a master subject'),
  teacher: objectId.nonempty('Please select a faculty member'),
  topics: z.array(objectId).optional().default([]),
  categories: z
    .array(z.union([facultySubjectCategoryEnum, z.string()]))
    .min(1, 'Select at least one delivery category'),
  status: z.enum(['Active', 'In Active']).default('Active'),
})

export const EMPTY_FACULTY_SUBJECT_FORM = {
  subjectName: '',
  subject: '',
  teacher: '',
  topics: [],
  categories: [],
  status: 'Active',
}
