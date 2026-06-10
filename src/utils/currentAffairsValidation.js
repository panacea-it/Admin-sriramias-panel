import { CURRENT_AFFAIRS_FIELD_LAYOUT, isDailyPracticeCategory } from '../constants/currentAffairsForm'
import { validateUploadFileSync } from './uploadValidation'
import { getFileExtension } from './batchQuestionBulkUpload'
import {
  generateQuestionsFromRange,
  parseSectionRange,
  validateCurrentAffairsQuestion,
} from './currentAffairsQuestions'

function isPdfFileName(name) {
  return getFileExtension(name) === 'pdf'
}

function isBulkFileName(name) {
  const ext = getFileExtension(name)
  return ext === 'xlsx' || ext === 'csv'
}

function requireField(errors, key, value, message) {
  if (!String(value ?? '').trim()) {
    errors[key] = message || 'This field is required'
  }
}

function validatePdfField(errors, key, fileName, { required = true, hasExistingPdf = false } = {}) {
  if (!fileName) {
    if (required && !hasExistingPdf) errors[key] = 'PDF file is required'
    return
  }
  if (!isPdfFileName(fileName)) {
    errors[key] = 'Only .pdf files are allowed'
  }
}

function validateRowFields(form, rowKeys, errors, options = {}) {
  const hasExistingPdf = Boolean(form.existingPdfUrl)
  for (const key of rowKeys) {
    if (key === 'category') {
      requireField(errors, 'category', form.category)
      continue
    }
    if (key === 'pdfUpload' || key === 'magazineUpload') {
      const required = !options.isEdit || !hasExistingPdf
      validatePdfField(errors, key, form.fileName, { required, hasExistingPdf })
      continue
    }
    if (key === 'name') {
      requireField(errors, 'name', form.name)
      continue
    }
    if (key === 'year') {
      requireField(errors, 'year', form.year)
      continue
    }
    if (key === 'month') {
      requireField(errors, 'month', form.month)
      continue
    }
    if (key === 'date') {
      requireField(errors, 'date', form.date)
      continue
    }
    if (key === 'mainsCategory') {
      requireField(errors, 'mainsCategory', form.mainsCategory)
      continue
    }
    if (key === 'paperName') {
      requireField(errors, 'paperName', form.paperName)
      continue
    }
  }
}

export function validateCurrentAffairsForm(form, { isEdit = false } = {}) {
  const errors = {}
  const category = form.category || ''

  if (!category) {
    errors.category = 'Select a category'
    return { valid: false, errors }
  }

  const layout = CURRENT_AFFAIRS_FIELD_LAYOUT[category]
  if (!layout) {
    errors.category = 'Invalid category'
    return { valid: false, errors }
  }

  for (const row of layout) {
    validateRowFields(form, row, errors, { isEdit })
  }

  if (isDailyPracticeCategory(category)) {
    const range = parseSectionRange(form.sectionFrom, form.sectionTo)
    Object.assign(errors, range.fieldErrors)

    const questions = form.questions || []
    if (!questions.length) {
      errors.questions = 'Generate questions using the From and To range'
    } else if (range.valid && questions.length !== range.count) {
      errors.questions = `Expected ${range.count} questions for range ${range.from}–${range.to}`
    } else {
      questions.forEach((q, i) => {
        Object.assign(errors, validateCurrentAffairsQuestion(q, i))
      })
    }
  }

  return { valid: Object.keys(errors).length === 0, errors }
}

export function validateCurrentAffairsPdfFile(file) {
  return validateUploadFileSync(file, 'PDF_STANDARD')
}

export function validateCurrentAffairsBulkFile(file) {
  return validateUploadFileSync(file, 'EXCEL_BULK')
}

export function mergeImportedQuestions(existing = [], imported = [], range = null) {
  if (range?.valid) {
    const merged = [...existing]
    for (const row of imported) {
      const no = parseInt(String(row.questionNo), 10)
      const idx = merged.findIndex((q) => parseInt(q.questionNo, 10) === no)
      if (idx >= 0) merged[idx] = row
      else merged.push(row)
    }
    return generateQuestionsFromRange(range.from, range.to, merged)
  }
  return [...existing, ...imported]
}
