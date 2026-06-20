import { CURRENT_AFFAIRS_FIELD_LAYOUT, isDailyPracticeCategory } from '../constants/currentAffairsForm'
import {
  clampDayForMonth,
  composeCurrentAffairsDate,
  getDaysInMonth,
} from './currentAffairsDateHelpers'
import { validateUploadFileSync } from './uploadValidation'
import { getFileExtension } from './batchQuestionBulkUpload'
import {
  generateQuestionsFromRange,
  validateCurrentAffairsQuestion,
} from './currentAffairsQuestions'

function isPdfFileName(name) {
  return getFileExtension(name) === 'pdf'
}

function isBulkFileName(name) {
  const ext = getFileExtension(name)
  return ext === 'xlsx' || ext === 'csv'
}

function isSampleFileName(name) {
  const ext = getFileExtension(name)
  return ext === 'pdf' || ext === 'xls' || ext === 'xlsx'
}

const SAMPLE_FILE_MAX_BYTES = 10 * 1024 * 1024

function requireField(errors, key, value, message) {
  if (!String(value ?? '').trim()) {
    errors[key] = message || 'This field is required'
  }
}

function validatePositiveNumberField(errors, key, value, label) {
  const raw = String(value ?? '').trim()
  if (!raw) {
    errors[key] = `${label} is required`
    return
  }
  const num = Number(raw)
  if (!Number.isFinite(num) || num <= 0 || !/^\d+$/.test(raw)) {
    errors[key] = `Enter a valid positive number`
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
    if (key === 'sampleUpload') {
      const hasExistingSample = Boolean(form.existingSampleUrl)
      const required = !options.isEdit || !hasExistingSample
      if (!form.sampleFileName) {
        if (required) errors.sampleUpload = 'Sample PDF / Excel file is required'
      } else if (!isSampleFileName(form.sampleFileName)) {
        errors.sampleUpload = 'Allowed: PDF, XLS, XLSX'
      }
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
      const day = String(form.date ?? '').trim()
      if (!day) {
        errors.date = 'Date is required'
        continue
      }
      if (!form.month || !form.year) {
        errors.date = 'Select year and month first'
        continue
      }
      const composed = composeCurrentAffairsDate(form.year, form.month, day)
      if (!composed) {
        errors.date = `Select a valid day for ${form.month}`
      }
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
    if (key === 'duration') {
      validatePositiveNumberField(errors, 'duration', form.duration, 'Duration')
      continue
    }
    if (key === 'totalMarks') {
      validatePositiveNumberField(errors, 'totalMarks', form.totalMarks, 'Total marks')
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
    const questions = form.questions || []
    if (!questions.length) {
      errors.questions = 'Upload questions using Bulk Upload Questions'
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

export function validateCurrentAffairsSampleFile(file) {
  if (!file) {
    return { valid: false, message: 'Sample PDF / Excel file is required' }
  }
  if (!isSampleFileName(file.name)) {
    return { valid: false, message: 'Allowed: PDF, XLS, XLSX' }
  }
  if (file.size > SAMPLE_FILE_MAX_BYTES) {
    return { valid: false, message: 'File size must be 10 MB or less' }
  }
  return { valid: true }
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
