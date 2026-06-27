/** Fixed category options for the dynamic Current Affairs form */
export const CURRENT_AFFAIRS_FORM_CATEGORIES = [
  'Current Affairs',
  'Monthly Magazine',
  'Infographics',
  'Monthly Recap',
  'Daily Practice Questions',
]

export const MAINS_CATEGORY_OPTIONS = ['Prelims', 'Mains']

export const CURRENT_AFFAIRS_PDF_ACCEPT = '.pdf,application/pdf'

export const CURRENT_AFFAIRS_BULK_ACCEPT =
  '.xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv'

export const FIELD_KEYS = {
  category: 'category',
  name: 'name',
  year: 'year',
  month: 'month',
  date: 'date',
  pdfUpload: 'pdfUpload',
  magazineUpload: 'magazineUpload',
  sampleUpload: 'sampleUpload',
  mainsCategory: 'mainsCategory',
  paperName: 'paperName',
  duration: 'duration',
  totalMarks: 'totalMarks',
}

/** Grid rows per category — each row is an array of field keys */
export const CURRENT_AFFAIRS_FIELD_LAYOUT = {
  'Current Affairs': [
    ['category', 'name', 'year'],
    ['month', 'pdfUpload'],
  ],
  'Monthly Magazine': [
    ['category', 'name', 'year'],
    ['month', 'magazineUpload'],
    ['sampleUpload'],
  ],
  Infographics: [
    ['category', 'name', 'year'],
    ['month', 'pdfUpload'],
  ],
  'Monthly Recap': [
    ['category', 'name', 'year'],
    ['month', 'pdfUpload'],
  ],
  'Daily Practice Questions': [
    ['category', 'mainsCategory', 'paperName'],
    ['year', 'month', 'date'],
    ['duration', 'totalMarks'],
  ],
}

export const FIELD_LABELS = {
  category: 'Current Affairs Category',
  name: 'Name',
  year: 'Year',
  month: 'Month',
  date: 'Date',
  pdfUpload: 'Upload PDF',
  magazineUpload: 'Upload Magazine',
  sampleUpload: 'Upload PDF (Card Preview)',
  mainsCategory: 'Mains Category',
  paperName: 'Paper Name',
  duration: 'Duration',
  totalMarks: 'Total Marks',
}

export function getFieldLabel(key, category) {
  if (key === 'name' && category === 'Monthly Magazine') return 'Magazine Name'
  return FIELD_LABELS[key] || key
}

export function isDailyPracticeCategory(category) {
  return category === 'Daily Practice Questions'
}
