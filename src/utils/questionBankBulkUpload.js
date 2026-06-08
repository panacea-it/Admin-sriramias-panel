const SUPPORTED_TYPES = ['MCQ', 'Numerical', 'Match the Following', 'Assertion Reason', 'Descriptive']

export const QUESTION_TYPE_LABELS = {
  MCQ: 'MCQ',
  Numerical: 'Numerical',
  'Match the Following': 'Match the Following',
  'Assertion Reason': 'Assertion Reason',
  Descriptive: 'Descriptive',
}

export function getFileExtension(name = '') {
  const parts = String(name).toLowerCase().split('.')
  return parts.length > 1 ? parts.pop() : ''
}

export function isSupportedBulkFile(file) {
  if (!file) return false
  const ext = getFileExtension(file.name)
  return ext === 'xlsx' || ext === 'csv'
}

export function normalizeStatus(raw) {
  const t = String(raw || '').trim().toLowerCase()
  if (t === 'active') return 'Active'
  if (t === 'inactive' || t === 'in active') return 'Inactive'
  return ''
}

export function normalizeDifficulty(raw) {
  const t = String(raw || '').trim().toLowerCase()
  if (t === 'easy') return 'Easy'
  if (t === 'medium') return 'Medium'
  if (t === 'hard') return 'Hard'
  return ''
}

export function parseTags(raw) {
  return String(raw || '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}

export function normalizeType(raw) {
  const t = String(raw || '').trim()
  if (!t) return ''
  // allow common aliases
  const lower = t.toLowerCase()
  if (lower === 'match' || lower === 'matchthefollowing' || lower === 'match the following') return 'Match the Following'
  if (lower === 'assertionreason' || lower === 'assertion reason') return 'Assertion Reason'
  if (lower === 'mcq') return 'MCQ'
  if (lower === 'numerical' || lower === 'num') return 'Numerical'
  if (lower === 'descriptive' || lower === 'mains') return 'Descriptive'
  if (lower === 'prelims') return 'MCQ'
  const exact = SUPPORTED_TYPES.find((x) => x.toLowerCase() === lower)
  return exact || ''
}

export function templateDefinition(type) {
  switch (type) {
    case 'MCQ':
      return {
        fileName: 'MCQ_Template.xlsx',
        columns: [
          'questionType',
          'questionText',
          'optionA',
          'optionB',
          'optionC',
          'optionD',
          'correctAnswer',
          'explanation',
          'difficulty',
          'subject',
          'topic',
          'tags',
          'status',
        ],
        rows: [
          {
            questionType: 'MCQ',
            questionText: 'What is the capital of India?',
            optionA: 'New Delhi',
            optionB: 'Mumbai',
            optionC: 'Chennai',
            optionD: 'Kolkata',
            correctAnswer: 'A',
            explanation: 'New Delhi is the capital of India.',
            difficulty: 'Easy',
            subject: 'Polity',
            topic: 'Basics',
            tags: 'india,capital,polity',
            status: 'Active',
          },
          {
            questionType: 'MCQ',
            questionText: 'Who is the final authority to interpret the Constitution of India?',
            optionA: 'Parliament',
            optionB: 'Supreme Court',
            optionC: 'President',
            optionD: 'Council of Ministers',
            correctAnswer: 'B',
            explanation: 'The Supreme Court is the final interpreter.',
            difficulty: 'Easy',
            subject: 'Polity',
            topic: 'Judiciary',
            tags: 'constitution,judiciary',
            status: 'Inactive',
          },
        ],
      }
    case 'Numerical':
      return {
        fileName: 'Numerical_Template.xlsx',
        columns: [
          'questionType',
          'questionText',
          'numericalAnswer',
          'explanation',
          'difficulty',
          'subject',
          'topic',
          'tags',
          'status',
        ],
        rows: [
          {
            questionType: 'Numerical',
            questionText: 'The Tropic of Cancer passes through how many Indian states?',
            numericalAnswer: '8',
            explanation: 'It passes through 8 states.',
            difficulty: 'Easy',
            subject: 'Geography',
            topic: 'Indian Geography',
            tags: 'geography,latitudes',
            status: 'Active',
          },
          {
            questionType: 'Numerical',
            questionText: 'How many Fundamental Duties are listed in the Constitution of India?',
            numericalAnswer: '11',
            explanation: 'There are 11 Fundamental Duties (Article 51A).',
            difficulty: 'Medium',
            subject: 'Polity',
            topic: 'Fundamental Duties',
            tags: 'polity,constitution',
            status: 'Active',
          },
        ],
      }
    case 'Match the Following':
      return {
        fileName: 'Match_The_Following_Template.xlsx',
        columns: [
          'questionType',
          'leftColumn',
          'rightColumn',
          'correctMapping',
          'explanation',
          'difficulty',
          'subject',
          'topic',
          'tags',
          'status',
        ],
        rows: [
          {
            questionType: 'Match the Following',
            leftColumn: 'Kosi; Narmada; Godavari; Brahmaputra',
            rightColumn: 'Bihar; Central India; Deccan; Assam',
            correctMapping: 'A-1, B-2, C-3, D-4',
            explanation: 'Kosi–Bihar, Narmada–Central India, Godavari–Deccan, Brahmaputra–Assam.',
            difficulty: 'Medium',
            subject: 'Geography',
            topic: 'Rivers',
            tags: 'geography,rivers',
            status: 'Active',
          },
          {
            questionType: 'Match the Following',
            leftColumn: 'Ashoka; Akbar; Shivaji; Tipu Sultan',
            rightColumn: 'Maurya; Mughal; Maratha; Mysore',
            correctMapping: 'A-1, B-2, C-3, D-4',
            explanation: 'Match rulers to dynasties/kingdoms.',
            difficulty: 'Easy',
            subject: 'History',
            topic: 'Indian History',
            tags: 'history',
            status: 'Inactive',
          },
        ],
      }
    case 'Assertion Reason':
      return {
        fileName: 'Assertion_Reason_Template.xlsx',
        columns: [
          'questionType',
          'assertion',
          'reason',
          'correctAnswer',
          'explanation',
          'difficulty',
          'subject',
          'topic',
          'tags',
          'status',
        ],
        rows: [
          {
            questionType: 'Assertion Reason',
            assertion: 'The Preamble is a part of the Constitution of India.',
            reason: 'The Preamble was amended by the 42nd Constitutional Amendment Act.',
            correctAnswer: 'Both A and R are true, but R is not the correct explanation of A',
            explanation: 'Both statements are true; R does not explain why it is part of the Constitution.',
            difficulty: 'Medium',
            subject: 'Polity',
            topic: 'Preamble',
            tags: 'constitution,preamble',
            status: 'Active',
          },
          {
            questionType: 'Assertion Reason',
            assertion: 'Directive Principles are enforceable by courts.',
            reason: 'They are fundamental in the governance of the country.',
            correctAnswer: 'A is false, but R is true',
            explanation: 'DPSPs are not justiciable; reason statement is true.',
            difficulty: 'Easy',
            subject: 'Polity',
            topic: 'DPSP',
            tags: 'constitution',
            status: 'Inactive',
          },
        ],
      }
    case 'Descriptive':
      return {
        fileName: 'Descriptive_Template.xlsx',
        columns: [
          'questionType',
          'questionText',
          'explanation',
          'difficulty',
          'subject',
          'topic',
          'tags',
          'status',
        ],
        rows: [
          {
            questionType: 'Descriptive',
            questionText: 'Discuss the doctrine of Separation of Powers in the Indian constitutional framework.',
            explanation: 'Cover checks and balances with examples and case laws.',
            difficulty: 'Medium',
            subject: 'Polity',
            topic: 'Constitution',
            tags: 'constitution,mains',
            status: 'Active',
          },
          {
            questionType: 'Descriptive',
            questionText: 'Explain the ethical issues in the use of AI in governance and suggest safeguards.',
            explanation: 'Bias, accountability, privacy, transparency, human oversight.',
            difficulty: 'Hard',
            subject: 'Ethics',
            topic: 'AI & Governance',
            tags: 'ethics,ai',
            status: 'Active',
          },
        ],
      }
    default:
      throw new Error('Unknown template type')
  }
}

export async function downloadTemplateXlsx(type) {
  const def = templateDefinition(type)
  const XLSX = await import('xlsx')
  const ws = XLSX.utils.json_to_sheet(def.rows, { header: def.columns })
  // Ensure column order and headers exist even when empty
  XLSX.utils.sheet_add_aoa(ws, [def.columns], { origin: 'A1' })
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Template')
  XLSX.writeFile(wb, def.fileName)
}

function parseCsvLine(line) {
  const out = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"' && line[i + 1] === '"') {
      cur += '"'
      i++
      continue
    }
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) {
      out.push(cur)
      cur = ''
      continue
    }
    cur += ch
  }
  out.push(cur)
  return out.map((v) => v.trim())
}

export async function parseBulkFileToRows(file) {
  const ext = getFileExtension(file?.name)
  if (ext === 'xlsx') {
    const XLSX = await import('xlsx')
    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer, { type: 'array' })
    const sheet = wb.Sheets[wb.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    return Array.isArray(json) ? json : []
  }
  if (ext === 'csv') {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    if (!lines.length) return []
    const header = parseCsvLine(lines[0]).map((h) => h.trim())
    return lines.slice(1).map((line) => {
      const cells = parseCsvLine(line)
      const obj = {}
      header.forEach((h, idx) => {
        obj[h] = cells[idx] ?? ''
      })
      return obj
    })
  }
  throw new Error('Unsupported file. Upload .xlsx or .csv')
}

function normalizeText(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .trim()
}

function tokenSet(s) {
  const t = normalizeText(s)
  if (!t) return new Set()
  return new Set(t.split(' ').filter((x) => x.length > 2))
}

function jaccard(a, b) {
  if (!a.size && !b.size) return 1
  let inter = 0
  for (const x of a) if (b.has(x)) inter++
  const union = a.size + b.size - inter
  return union ? inter / union : 0
}

function getRowSignature(type, row) {
  if (type === 'Assertion Reason') return normalizeText(`${row.assertion || ''} ${row.reason || ''}`)
  if (type === 'Match the Following') return normalizeText(`${row.leftColumn || ''} ${row.rightColumn || ''} ${row.correctMapping || ''}`)
  return normalizeText(row.questionText || row.question || row.question_text || '')
}

export function validateBulkRows(rows, { existing = [], duplicateMode = 'skip' } = {}) {
  const existingSigs = existing
    .map((q) => normalizeText(q?.content?.question || q?.content?.assertion || ''))
    .filter(Boolean)
  const existingTokenSets = existingSigs.map((s) => tokenSet(s))

  const seen = new Map() // signature -> firstIndex
  const results = []

  rows.forEach((raw, idx) => {
    const rowNumber = idx + 2 // assuming header row is 1
    const row = raw && typeof raw === 'object' ? raw : {}
    const qType = normalizeType(row.questionType ?? row.questiontype ?? row.type)
    const errors = []
    if (!qType) errors.push('Invalid questionType')

    const status = normalizeStatus(row.status)
    if (!status) errors.push('Invalid status (Active/Inactive)')
    const difficulty = normalizeDifficulty(row.difficulty)
    if (!difficulty) errors.push('Invalid difficulty (Easy/Medium/Hard)')
    if (!String(row.subject || '').trim()) errors.push('Missing subject')
    if (!String(row.topic || '').trim()) errors.push('Missing topic')

    if (qType === 'MCQ') {
      if (!String(row.questionText || '').trim()) errors.push('Missing questionText')
      ;['optionA', 'optionB', 'optionC', 'optionD'].forEach((k) => {
        if (!String(row[k] || '').trim()) errors.push(`Missing ${k}`)
      })
      const ca = String(row.correctAnswer || '').trim().toUpperCase()
      if (!['A', 'B', 'C', 'D'].includes(ca)) errors.push('correctAnswer must be A/B/C/D')
    } else if (qType === 'Numerical') {
      if (!String(row.questionText || '').trim()) errors.push('Missing questionText')
      if (!String(row.numericalAnswer || '').trim()) errors.push('Missing numericalAnswer')
    } else if (qType === 'Match the Following') {
      if (!String(row.leftColumn || '').trim()) errors.push('Missing leftColumn')
      if (!String(row.rightColumn || '').trim()) errors.push('Missing rightColumn')
      if (!String(row.correctMapping || '').trim()) errors.push('Missing correctMapping')
    } else if (qType === 'Assertion Reason') {
      if (!String(row.assertion || '').trim()) errors.push('Missing assertion')
      if (!String(row.reason || '').trim()) errors.push('Missing reason')
      if (!String(row.correctAnswer || '').trim()) errors.push('Missing correctAnswer')
    } else if (qType === 'Descriptive') {
      if (!String(row.questionText || '').trim()) errors.push('Missing questionText')
    }

    const signature = qType ? getRowSignature(qType, row) : ''
    let duplicate = false
    let duplicateReason = ''
    if (signature) {
      if (seen.has(signature)) {
        duplicate = true
        duplicateReason = `Duplicate in file (same as row ${seen.get(signature)})`
      } else {
        seen.set(signature, rowNumber)
      }
      if (!duplicate && existingSigs.includes(signature)) {
        duplicate = true
        duplicateReason = 'Duplicate found in existing question bank'
      }
      if (!duplicate) {
        const ts = tokenSet(signature)
        for (let i = 0; i < existingTokenSets.length; i++) {
          if (jaccard(ts, existingTokenSets[i]) >= 0.9) {
            duplicate = true
            duplicateReason = 'Very similar question found in existing bank'
            break
          }
        }
      }
    }

    const isValid = errors.length === 0
    const validationStatus = !isValid ? 'Invalid' : duplicate ? 'Duplicate' : 'Valid'
    const errorMessage = !isValid ? errors.join(' · ') : duplicate ? duplicateReason : ''

    results.push({
      rowNumber,
      validationStatus,
      errorMessage,
      parsed: {
        questionType: qType,
        status,
        difficulty,
        subject: String(row.subject || '').trim(),
        topic: String(row.topic || '').trim(),
        tags: parseTags(row.tags),
        raw: row,
      },
      shouldUpload: isValid && (!duplicate || duplicateMode === 'upload_anyway'),
    })
  })

  const summary = {
    totalRows: results.length,
    validRows: results.filter((r) => r.validationStatus === 'Valid').length,
    duplicateRows: results.filter((r) => r.validationStatus === 'Duplicate').length,
    invalidRows: results.filter((r) => r.validationStatus === 'Invalid').length,
  }

  return { results, summary }
}

export async function downloadErrorReportXlsx(failedRows, fileName = 'BulkUpload_ErrorReport.xlsx') {
  const XLSX = await import('xlsx')
  const rows = failedRows.map((r) => ({
    rowNumber: r.rowNumber,
    status: r.validationStatus,
    errorMessage: r.errorMessage,
  }))
  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Errors')
  XLSX.writeFile(wb, fileName)
}

