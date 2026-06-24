/** Language-wise question paper PDF mapping for Prelims Test Series */

function resolvePaperFromMaster(language, masterRows = []) {
  const row = masterRows.find(
    (entry) =>
      String(entry?.languageName || '')
        .trim()
        .toLowerCase() === String(language || '').trim().toLowerCase(),
  )
  if (!row) return null

  const fileName = String(
    row.questionPaperFileName ||
      row.questionPaperName ||
      row.fileName ||
      '',
  ).trim()
  const pdfUrl = String(
    row.questionPaperUrl || row.questionPaperPdf || row.pdfUrl || row.questionPaper || '',
  ).trim()

  if (!fileName && !pdfUrl) return null

  return normalizeLanguageQuestionPaper({
    language,
    fileName: fileName || `${language} Question Paper`,
    fileSize:
      row.fileSize != null && !Number.isNaN(Number(row.fileSize))
        ? Number(row.fileSize)
        : row.questionPaperSize != null && !Number.isNaN(Number(row.questionPaperSize))
          ? Number(row.questionPaperSize)
          : null,
    pdfUrl,
  })
}

function hasLanguagePaperContent(paper) {
  return Boolean(paper?.fileName?.trim() || paper?.pdfUrl?.trim())
}

export function normalizeLanguageQuestionPaper(raw = {}) {
  return {
    language: String(raw.language || '').trim(),
    fileName: String(raw.fileName || '').trim(),
    fileSize:
      raw.fileSize != null && !Number.isNaN(Number(raw.fileSize))
        ? Number(raw.fileSize)
        : null,
    pdfUrl: String(raw.pdfUrl || raw.url || '').trim(),
  }
}

export function normalizeLanguageQuestionPapers(raw = []) {
  if (!Array.isArray(raw)) return []
  const map = new Map()
  raw.forEach((item) => {
    const normalized = normalizeLanguageQuestionPaper(item)
    if (normalized.language) map.set(normalized.language, normalized)
  })
  return [...map.values()]
}

/** Keep papers only for selected languages; preserve existing uploads or resolve from master. */
export function syncLanguageQuestionPapers(
  papers = [],
  languages = [],
  optionOrder = [],
  masterRows = [],
) {
  const langs = [...new Set((Array.isArray(languages) ? languages : []).map(String).filter(Boolean))]
  const order =
    Array.isArray(optionOrder) && optionOrder.length
      ? optionOrder.filter((lang) => langs.includes(lang))
      : langs
  const trailing = langs.filter((lang) => !order.includes(lang))
  const orderedLangs = [...order, ...trailing]

  const byLang = new Map(
    normalizeLanguageQuestionPapers(papers).map((paper) => [paper.language, paper]),
  )

  return orderedLangs.map((language) => {
    const existing = byLang.get(language)
    if (existing && hasLanguagePaperContent(existing)) return existing

    const fromMaster = resolvePaperFromMaster(language, masterRows)
    if (fromMaster) return fromMaster

    return (
      existing || {
        language,
        fileName: '',
        fileSize: null,
        pdfUrl: '',
      }
    )
  })
}

export function languagePaperErrorKey(language, errorPrefix = 'testSeries_') {
  const safe = String(language || 'unknown').replace(/[^\w-]/g, '_')
  return `${errorPrefix}languagePaper_${safe}`
}

export function validateLanguageQuestionPapers(
  languages = [],
  papers = [],
  { errorPrefix = 'testSeries_' } = {},
) {
  const errors = {}
  const synced = syncLanguageQuestionPapers(papers, languages)

  synced.forEach((paper) => {
    const hasFile = Boolean(paper.fileName?.trim() || paper.pdfUrl?.trim())
    if (!hasFile) {
      errors[languagePaperErrorKey(paper.language, errorPrefix)] =
        `${paper.language} Question Paper PDF is required.`
    }
  })

  return errors
}

export function resolveLanguageQuestionPapersFromBlock(testSeries = {}) {
  const fromDetails = testSeries?.details?.languageQuestionPapers
  const fromRoot = testSeries?.languageQuestionPapers
  return normalizeLanguageQuestionPapers(fromDetails ?? fromRoot ?? [])
}
