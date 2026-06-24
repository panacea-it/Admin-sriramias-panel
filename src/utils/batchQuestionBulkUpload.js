import { normalizeTestSeriesQuestion } from './batchTestSeriesForm'
import { processQuestionsInChunks } from './batchQuestionMerge'

const SUPPORTED_EXT = new Set([
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'csv',
  'ppt',
  'pptx',
  'txt',
  'tsv',
])

const PARSE_CHUNK_SIZE = 150

export function getFileExtension(name = '') {
  const parts = String(name).toLowerCase().split('.')
  return parts.length > 1 ? parts.pop() : ''
}

export function isSupportedBulkExtension(ext) {
  return SUPPORTED_EXT.has(ext)
}

function parseAnswerToken(raw) {
  const t = String(raw || '').trim().toUpperCase()
  if (/^[1-4]$/.test(t)) return t
  if (/^[A-D]$/.test(t)) return String('ABCD'.indexOf(t) + 1)
  const match = t.match(/option\s*([1-4])/i)
  if (match) return match[1]
  return t
}

function rowToQuestion(row, index) {
  if (!row || typeof row !== 'object') return null
  const keys = Object.keys(row)
  const lower = Object.fromEntries(keys.map((k) => [k.toLowerCase().trim(), row[k]]))

  const question =
    lower.question ||
    lower['question text'] ||
    lower.q ||
    row[1] ||
    ''
  const questionNo =
    lower.questionno ||
    lower['question no'] ||
    lower['question number'] ||
    lower.no ||
    lower.qno ||
    row[0] ||
    index + 1

  const options = [
    lower.option1 || lower['option 1'] || lower.a || row[2],
    lower.option2 || lower['option 2'] || lower.b || row[3],
    lower.option3 || lower['option 3'] || lower.c || row[4],
    lower.option4 || lower['option 4'] || lower.d || row[5],
  ].map((o) => String(o ?? '').trim())

  const answer = parseAnswerToken(
    lower.answer || lower.correct || lower['correct answer'] || lower.ans || row[6],
  )

  if (!String(question).trim()) return null

  return normalizeTestSeriesQuestion(
    {
      questionNo,
      question: String(question).trim(),
      options,
      answer,
    },
    index,
  )
}

export function parseQuestionsFromCsvText(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)

  if (!lines.length) return []

  const delimiter = lines[0].includes('\t') ? '\t' : lines[0].includes(';') ? ';' : ','
  const rows = lines.map((line) => line.split(delimiter).map((c) => c.trim().replace(/^"|"$/g, '')))

  const header = rows[0].map((h) => h.toLowerCase())
  const hasHeader =
    header.includes('question') ||
    header.includes('questionno') ||
    header.includes('option1')

  const dataRows = hasHeader ? rows.slice(1) : rows

  if (hasHeader) {
    return dataRows
      .map((cells, i) => {
        const obj = {}
        rows[0].forEach((key, idx) => {
          obj[key] = cells[idx]
        })
        return rowToQuestion(obj, i)
      })
      .filter(Boolean)
  }

  return dataRows
    .map((cells, i) =>
      rowToQuestion(
        {
          questionNo: cells[0],
          question: cells[1],
          option1: cells[2],
          option2: cells[3],
          option3: cells[4],
          option4: cells[5],
          answer: cells[6],
        },
        i,
      ),
    )
    .filter(Boolean)
}

export function parseQuestionsFromPlainText(text) {
  const blocks = String(text || '').split(/(?=Q\s*\d+|Question\s*\d+[:.]?\s*)/i)
  const results = []

  blocks.forEach((block, index) => {
    const trimmed = block.trim()
    if (!trimmed) return

    const qMatch = trimmed.match(/^(?:Q|Question)\s*(\d+)[:.]?\s*([\s\S]+?)(?=\n\s*[A-D1-4][\).:\-]|$)/i)
    const questionNo = qMatch ? parseInt(qMatch[1], 10) : index + 1
    let questionBody = qMatch ? qMatch[2].trim() : trimmed

    const optLines = [...trimmed.matchAll(/(?:^|\n)\s*([A-D1-4])[\).:\-]\s*(.+)/gim)]
    const options = ['', '', '', '']
    optLines.forEach((m) => {
      const label = m[1].toUpperCase()
      const idx = /^[1-4]$/.test(label) ? parseInt(label, 10) - 1 : 'ABCD'.indexOf(label)
      if (idx >= 0 && idx < 4) options[idx] = m[2].trim()
    })

    const ansMatch = trimmed.match(/(?:Answer|Correct(?:\s+Answer)?)\s*[:=-]\s*([A-D1-4])/i)
    const answer = ansMatch ? parseAnswerToken(ansMatch[1]) : ''

    if (questionBody) {
      questionBody = questionBody.split(/\n\s*[A-D1-4][\).:\-]/i)[0].trim()
      results.push(
        normalizeTestSeriesQuestion(
          { questionNo, question: questionBody, options, answer },
          results.length,
        ),
      )
    }
  })

  if (results.length) return results
  return parseQuestionsFromCsvText(text)
}

async function parseExcelFile(file, onProgress) {
  const XLSX = await import('xlsx')
  onProgress?.(35)
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '' })
  onProgress?.(55)
  return processQuestionsInChunks(json, (row, i) => rowToQuestion(row, i), PARSE_CHUNK_SIZE)
}

async function extractOfficeXmlText(file) {
  const buffer = await file.arrayBuffer()
  const bytes = new Uint8Array(buffer)
  const decoder = new TextDecoder('utf-8', { fatal: false })
  const raw = decoder.decode(bytes)
  const wt = [...raw.matchAll(/<w:t[^>]*>([^<]*)<\/w:t>/g)].map((m) => m[1])
  const at = [...raw.matchAll(/<a:t[^>]*>([^<]*)<\/a:t>/g)].map((m) => m[1])
  const chunks = wt.length ? wt : at
  if (chunks.length) return chunks.join('\n')
  return raw.replace(/[^\x20-\x7E\n\r\t]/g, '\n')
}

async function parsePdfFile(file, onProgress) {
  onProgress?.(25)
  const pdfjs = await import('pdfjs-dist/build/pdf.mjs')
  if (typeof window !== 'undefined' && pdfjs.GlobalWorkerOptions) {
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url,
      ).toString()
    } catch {
      pdfjs.GlobalWorkerOptions.workerSrc = ''
    }
  }
  const data = new Uint8Array(await file.arrayBuffer())
  onProgress?.(40)
  const doc = await pdfjs.getDocument({ data }).promise
  const parts = []
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p)
    const content = await page.getTextContent()
    parts.push(content.items.map((item) => item.str).join(' '))
    if (p % 5 === 0) onProgress?.(40 + Math.round((p / doc.numPages) * 40))
  }
  onProgress?.(85)
  return parseQuestionsFromPlainText(parts.join('\n'))
}

export async function parseQuestionBulkFile(file, { onProgress } = {}) {
  const ext = getFileExtension(file.name)
  if (!isSupportedBulkExtension(ext)) {
    throw new Error(`Unsupported file type: .${ext}`)
  }

  onProgress?.(5)

  let questions = []
  let parseNote = ''

  try {
    if (ext === 'xlsx' || ext === 'xls') {
      questions = await parseExcelFile(file, onProgress)
      parseNote = 'Imported from Excel spreadsheet'
    } else if (ext === 'csv' || ext === 'tsv') {
      onProgress?.(30)
      const text = await file.text()
      onProgress?.(60)
      questions = await processQuestionsInChunks(
        parseQuestionsFromCsvText(text),
        (q) => q,
        PARSE_CHUNK_SIZE,
      )
      parseNote = 'Imported from CSV'
    } else if (ext === 'txt') {
      onProgress?.(30)
      const text = await file.text()
      onProgress?.(60)
      questions = await processQuestionsInChunks(
        parseQuestionsFromPlainText(text),
        (q) => q,
        PARSE_CHUNK_SIZE,
      )
      parseNote = 'Imported from text file'
    } else if (ext === 'pdf') {
      questions = await parsePdfFile(file, onProgress)
      parseNote = questions.length ? 'Extracted from PDF' : 'PDF parsed but no questions detected'
    } else if (ext === 'docx' || ext === 'doc') {
      onProgress?.(25)
      const text = await extractOfficeXmlText(file)
      onProgress?.(60)
      questions = await processQuestionsInChunks(
        parseQuestionsFromPlainText(text),
        (q) => q,
        PARSE_CHUNK_SIZE,
      )
      parseNote = 'Extracted from Word document'
    } else if (ext === 'pptx' || ext === 'ppt') {
      onProgress?.(25)
      const text = await extractOfficeXmlText(file)
      onProgress?.(60)
      questions = await processQuestionsInChunks(
        parseQuestionsFromPlainText(text),
        (q) => q,
        PARSE_CHUNK_SIZE,
      )
      parseNote = 'Extracted from presentation slides'
    }
  } catch (err) {
    return {
      questions: [],
      metadata: buildFileMetadata(file, ext, {
        status: 'error',
        error: err.message || 'Parse failed',
      }),
    }
  }

  onProgress?.(100)

  return {
    questions,
    metadata: buildFileMetadata(file, ext, {
      status: questions.length ? 'success' : 'warning',
      questionCount: questions.length,
      note:
        parseNote ||
        (questions.length ? 'Imported successfully' : 'No questions detected — check file format'),
    }),
  }
}

function buildFileMetadata(file, ext, extra = {}) {
  return {
    id: `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type || ext,
    uploadedAt: new Date().toISOString(),
    ...extra,
  }
}

export function filterQuestionsByRange(questions = [], from, to) {
  const f = parseInt(String(from), 10)
  const t = parseInt(String(to), 10)
  if (!Number.isFinite(f) && !Number.isFinite(t)) return questions
  return questions.filter((q) => {
    if (Number.isFinite(f) && q.questionNo < f) return false
    if (Number.isFinite(t) && q.questionNo > t) return false
    return true
  })
}

export function mergeQuestionsIntoList(existing = [], incoming = []) {
  const map = new Map(existing.map((q) => [String(q.questionNo), q]))
  for (const q of incoming) {
    map.set(String(q.questionNo), q)
  }
  return [...map.values()].sort((a, b) => a.questionNo - b.questionNo)
}
