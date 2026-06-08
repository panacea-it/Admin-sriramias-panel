import { FINANCE_STANDARD_EXPORT_COLUMNS } from '../constants/financeConstants'
import { formatCategoryDateTime } from './formatDateTime'
import { formatINR } from './financeFilters'
import { enrichFinanceRecord, enrichFinanceRows } from './financeRecordModel'

const MONEY_KEYS = new Set(['amountPaid', 'pendingAmount', 'totalFees', 'totalPaid', 'gstAmount', 'overdueAmount', 'amount'])

function cellValue(row, key) {
  const v = row[key]
  if (v == null || v === '') return ''
  if (MONEY_KEYS.has(key) && typeof v === 'number') return formatINR(v)
  if (key === 'paymentDate' && v) return formatCategoryDateTime(v)
  return String(v)
}

export function mapRowsForExport(rows, columnDefs = FINANCE_STANDARD_EXPORT_COLUMNS) {
  return enrichFinanceRows(rows).map((row) => {
    const out = {}
    columnDefs.forEach((col) => {
      out[col.label] = col.export ? col.export(row) : cellValue(row, col.key)
    })
    return out
  })
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function exportFinanceCsv(rows, filename = 'finance-export.csv', columnDefs) {
  const mapped = mapRowsForExport(rows, columnDefs)
  if (!mapped.length) return false
  const headers = Object.keys(mapped[0])
  const escape = (v) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(','), ...mapped.map((row) => headers.map((h) => escape(row[h])).join(','))]
  downloadBlob(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }), filename)
  return true
}

export function exportFinanceExcel(rows, filename = 'finance-export.xls', columnDefs) {
  const mapped = mapRowsForExport(rows, columnDefs)
  if (!mapped.length) return false
  const headers = Object.keys(mapped[0])
  const escape = (v) => {
    const s = String(v ?? '')
    return s.includes('\t') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join('\t'), ...mapped.map((row) => headers.map((h) => escape(row[h])).join('\t'))]
  downloadBlob(new Blob([lines.join('\n')], { type: 'application/vnd.ms-excel' }), filename)
  return true
}

export function exportFinancePrint(title, rows, columnDefs) {
  const mapped = mapRowsForExport(rows, columnDefs)
  if (!mapped.length) {
    window.print()
    return
  }
  const headers = Object.keys(mapped[0])
  const th = headers.map((h) => `<th>${h}</th>`).join('')
  const body = mapped
    .map((row) => `<tr>${headers.map((h) => `<td>${row[h] ?? ''}</td>`).join('')}</tr>`)
    .join('')
  const html = `<table><thead><tr>${th}</tr></thead><tbody>${body}</tbody></table>`
  printReport(title, html)
}

/** PDF via print dialog (no extra dependency) */
export function exportFinancePdf(title, rows, columnDefs) {
  exportFinancePrint(title, rows, columnDefs)
}

export function printReport(title = 'Finance Report', contentHtml = '') {
  const win = window.open('', '_blank')
  if (!win) {
    window.print()
    return
  }
  win.document.write(`
    <html><head><title>${title}</title>
    <style>body{font-family:Poppins,Inter,sans-serif;padding:24px;color:#111;}
    h1{font-size:18px;color:#246392;} table{width:100%;border-collapse:collapse;font-size:12px;}
    th,td{border:1px solid #e2e8f0;padding:8px;text-align:left;} th{background:#246392;color:#fff;}</style></head>
    <body><h1>${title}</h1>${contentHtml}</body></html>
  `)
  win.document.close()
  win.focus()
  win.print()
}

/** @deprecated use exportFinanceCsv */
export function exportToCsv(rows, filename = 'export.csv') {
  if (!rows?.length) return
  if (typeof rows === 'string') return
  const first = rows[0]
  if (first && typeof first === 'object' && !Array.isArray(first)) {
    return exportFinanceCsv(rows, filename)
  }
  const headers = Object.keys(rows[0])
  const escape = (v) => {
    const s = String(v ?? '')
    return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [headers.join(','), ...rows.map((row) => headers.map((h) => escape(row[h])).join(','))]
  downloadBlob(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' }), filename)
}

/** @deprecated use exportFinanceExcel */
export function exportToExcel(rows, filename = 'export.xls') {
  exportFinanceExcel(rows, filename)
}
