import {
  createEmptyTestSeriesBlock,
  getTestSeriesFlat,
  normalizeTestSeriesBlock,
  resolveTestSeriesDurationMinutes,
  validateTestSeriesForm,
} from './batchTestSeriesForm'
import { deriveQuestionCount, validateTestSeriesQuestions } from './testSeriesQuestionSlots'

export function createEmptyTestForm() {
  return {
    center: 'Delhi Center',
    status: 'Draft',
    testSeries: createEmptyTestSeriesBlock(),
  }
}

/** Map legacy table row → full form with nested testSeries. */
export function testRowToForm(row) {
  if (!row) return createEmptyTestForm()
  if (row.formData?.testSeries) {
    return {
      ...createEmptyTestForm(),
      ...row.formData,
      testSeries: normalizeTestSeriesBlock(row.formData.testSeries),
    }
  }

  const durationDigits = String(row.duration || '').match(/(\d+)/)
  const durationMinutes = durationDigits ? durationDigits[1] : '60'
  const qCount = parseInt(String(row.totalQuestions || ''), 10) || 0

  return {
    center: row.center || 'Delhi Center',
    status: row.status || 'Draft',
    testSeries: normalizeTestSeriesBlock({
      details: {
        testName: row.name || '',
        testType: row.type || 'Prelims',
        durationMinutes,
        totalMarks: '',
        instructions: row.description || '',
      },
      schedule: { date: row.scheduledAt || '', time: row.scheduleTime || '' },
      resultSettings: { resultDate: row.resultDate || '', rankingEnabled: true },
      questions: row.questions || [],
      questionCount: qCount,
      uploadedFiles: row.uploadedFiles || [],
    }),
  }
}

export function testFormToRow(form, existing) {
  const ts = normalizeTestSeriesBlock(form.testSeries || {})
  const flat = getTestSeriesFlat(ts)
  const durationMins = resolveTestSeriesDurationMinutes(ts)
  const questionCount = deriveQuestionCount(ts)

  return {
    id: existing?.id ?? Date.now(),
    name: flat.testName?.trim() || existing?.name || 'Untitled Test',
    type: flat.testType || existing?.type || 'Prelims',
    center: form.center || existing?.center || 'Delhi Center',
    totalQuestions: String(questionCount || ts.questions?.length || 0),
    duration: durationMins ? `${durationMins} min` : existing?.duration || '',
    scheduledAt: flat.scheduleDate || existing?.scheduledAt || '',
    scheduleTime: flat.scheduleTime || '',
    resultDate: flat.resultDate || '',
    status: form.status || existing?.status || 'Draft',
    description: flat.instructions || '',
    testSeries: ts,
    formData: {
      center: form.center,
      status: form.status,
      testSeries: ts,
    },
  }
}

export function validateTestForm(form = {}) {
  const errors = {}
  if (!form.center?.trim()) errors.center = 'Center is required'
  if (!form.status?.trim()) errors.status = 'Status is required'

  const ts = normalizeTestSeriesBlock(form.testSeries || {})
  Object.assign(errors, validateTestSeriesForm(ts))
  Object.assign(errors, validateTestSeriesQuestions(ts))

  return errors
}
