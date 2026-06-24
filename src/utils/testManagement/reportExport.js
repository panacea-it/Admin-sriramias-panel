import * as XLSX from 'xlsx'

function safeFileName(name) {
  return String(name || 'report')
    .replace(/[^\w\s.-]+/g, '')
    .trim()
    .replace(/\s+/g, '_')
    .slice(0, 80)
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function downloadResultsExcel(rows = [], { filename = 'results.xlsx', sheetName = 'Results' } = {}) {
  const normalized = rows.map((r) => ({
    Result_ID: r.resultId ?? r.id,
    Student: r.studentName,
    Roll_Number: r.rollNumber,
    Batch: r.batchName,
    Test: r.testName,
    Subject: r.subject,
    Score: r.score,
    Total: r.total,
    Percentage: r.percentage,
    AIR_Rank: r.airRank,
    Status: r.status,
    Test_Date: r.testDate,
  }))

  const ws = XLSX.utils.json_to_sheet(normalized)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, sheetName)
  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  downloadBlob(new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename)
}

export function openPrintablePdfLikeReport({ title = 'Student Report', html }) {
  const w = window.open('', '_blank', 'noopener,noreferrer')
  if (!w) return false
  const doc = w.document
  doc.open()
  doc.write(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>${String(title).replaceAll('<', '&lt;')}</title>
    <style>
      body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Arial; padding:24px; color:#0f172a;}
      .brand{display:flex; align-items:center; justify-content:space-between; gap:12px; border-bottom:2px solid #e2e8f0; padding-bottom:14px; margin-bottom:18px;}
      .brand h1{font-size:18px; margin:0;}
      .muted{color:#64748b;}
      table{border-collapse:collapse; width:100%; margin-top:14px;}
      th,td{border:1px solid #e2e8f0; padding:10px; font-size:12px; text-align:left;}
      th{background:#f8fafc;}
      .grid{display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px;}
      .card{border:1px solid #e2e8f0; border-radius:12px; padding:12px;}
      @media print{ body{padding:0;} .no-print{display:none;} }
    </style>
  </head>
  <body>
    <div class="brand">
      <h1>SRIRAM IAS — ${String(title).replaceAll('<', '&lt;')}</h1>
      <div class="muted">${new Date().toLocaleString()}</div>
    </div>
    <div class="no-print muted" style="margin-bottom:10px;">Use your browser’s “Print” → “Save as PDF”.</div>
    ${html || ''}
  </body>
</html>`)
  doc.close()
  w.focus()
  w.print()
  return true
}

export function buildStudentReportHtml({ student, test, result, insights }) {
  const safe = (v) => String(v ?? '—').replaceAll('<', '&lt;')
  const weak = Array.isArray(insights?.weakSubjects) ? insights.weakSubjects : []
  return `
    <div class="grid">
      <div class="card">
        <div class="muted">Student Details</div>
        <h2 style="margin:8px 0 0 0; font-size:16px;">${safe(student?.name)}</h2>
        <div class="muted" style="margin-top:4px;">Roll: ${safe(student?.rollNumber)} • Batch: ${safe(student?.batchName)}</div>
      </div>
      <div class="card">
        <div class="muted">Test Details</div>
        <div style="margin-top:8px; font-weight:700;">${safe(test?.testName)}</div>
        <div class="muted" style="margin-top:4px;">Subject: ${safe(test?.subject)} • Date: ${safe(test?.testDate)}</div>
      </div>
    </div>
    <div class="card" style="margin-top:12px;">
      <div class="muted">Score Summary</div>
      <div style="margin-top:8px; font-size:14px;">
        <strong>Score:</strong> ${safe(result?.score)}/${safe(result?.total)} &nbsp; • &nbsp;
        <strong>Percentage:</strong> ${safe(result?.percentage)}% &nbsp; • &nbsp;
        <strong>AIR Rank:</strong> ${safe(result?.airRank)}
      </div>
    </div>
    <div class="card" style="margin-top:12px;">
      <div class="muted">Weak Area Analysis (Auto)</div>
      <ul style="margin:10px 0 0 18px;">
        ${weak.length ? weak.map((w) => `<li>${safe(w.subject)} — ${safe(w.avg)}%</li>`).join('') : '<li>Not enough data to identify weak areas.</li>'}
      </ul>
    </div>
  `
}

export function buildExportFileName(base, ext) {
  return `${safeFileName(base)}.${String(ext || '').replace('.', '')}`
}

