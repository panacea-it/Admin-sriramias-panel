import { EMI_FREQUENCIES } from '../constants/offlinePaymentEmi'

export function addMonthsToDate(isoDate, months) {
  const d = new Date(isoDate)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

export function getEmiMonthLabel(isoDate) {
  if (!isoDate) return '—'
  const d = new Date(isoDate)
  return d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })
}

export function formatDisplayDate(isoDate) {
  if (!isoDate) return '—'
  return new Date(isoDate).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

/**
 * Preview one duration option for counseling cards (monthly EMI, start/end).
 */
export function previewDurationOption({
  months,
  pendingBalance = 0,
  downPayment = 0,
  startDate,
}) {
  const count = Math.max(1, Number(months) || 1)
  const down = Math.max(0, Number(downPayment) || 0)
  const principal = Math.max(0, Number(pendingBalance) - down)
  const monthly = count > 0 ? Math.ceil(principal / count) : 0
  const start = startDate || new Date().toISOString().slice(0, 10)
  const endDate = addMonthsToDate(start, count - 1)

  return {
    months: count,
    monthlyAmount: monthly,
    startDate: start,
    endDate,
    totalPrincipal: principal,
  }
}

/**
 * Build installment rows from EMI strategy inputs.
 */
export function generateEmiSchedule({
  installmentCount = 6,
  downPayment = 0,
  startDate,
  frequency = 'monthly',
  pendingBalance = 0,
  lateFeePercent = 0,
  planDiscount = 0,
  customCharge = 0,
}) {
  const count = Math.max(0, Number(installmentCount) || 0)
  const down = Math.max(0, Number(downPayment) || 0)
  const pending = Math.max(0, Number(pendingBalance) || 0)
  const principal = Math.max(0, pending - down)
  const baseAmount = count > 0 ? Math.floor(principal / count) : 0
  const remainder = principal - baseAmount * count
  const freq = EMI_FREQUENCIES.find((f) => f.id === frequency) || EMI_FREQUENCIES[0]
  const start = startDate || new Date().toISOString().slice(0, 10)
  const today = new Date().toISOString().slice(0, 10)

  const installments = []
  for (let i = 0; i < count; i += 1) {
    const dueDate = addMonthsToDate(start, i * freq.monthsStep)
    const emiAmount = baseAmount + (i === count - 1 ? remainder : 0)
    const lateFee =
      lateFeePercent > 0 && dueDate < today
        ? Math.round((emiAmount * lateFeePercent) / 100)
        : 0
    let status = 'Scheduled'
    if (dueDate < today) status = 'Overdue'
    else if (dueDate === today) status = 'Pending'

    installments.push({
      installmentNo: i + 1,
      emiNo: i + 1,
      emiMonth: getEmiMonthLabel(dueDate),
      dueDate,
      emiDate: dueDate,
      emiAmount,
      lateFee,
      discount: 0,
      customCharge: 0,
      status,
      paymentType: 'Offline',
      paymentMode: '',
      receiptNumber: '',
      paidDate: '',
      referenceNumber: '',
      utrNumber: '',
      remarks: '',
      proofFileName: null,
      paidAmount: 0,
      paymentHistory: [],
    })
  }

  const endDate = installments.length ? installments[installments.length - 1].dueDate : start

  return {
    installments,
    totalEmiAmount: principal,
    downPayment: down,
    pendingAfterDown: principal,
    startDate: start,
    endDate,
    planDiscount: Number(planDiscount) || 0,
    customCharge: Number(customCharge) || 0,
  }
}

export function installmentDueAmount(row) {
  return installmentNetAmount(row)
}

export function installmentPaidAmount(row) {
  return Number(row.paidAmount) || 0
}

export function installmentRemaining(row) {
  return Math.max(0, installmentDueAmount(row) - installmentPaidAmount(row))
}

/** Sum of remaining balance on open installments */
export function computeOpenEmiBalance(schedule = []) {
  return (schedule || [])
    .filter((r) => !['Paid', 'Closed', 'Cancelled'].includes(r.status))
    .reduce((s, r) => s + installmentRemaining(r), 0)
}

/** Mark all unpaid installments closed after early full settlement */
export function applyEarlyEmiClosure(schedule = [], closureNote = '') {
  return (schedule || []).map((row) => {
    if (['Paid', 'Closed'].includes(row.status)) return row
    return {
      ...row,
      status: 'Closed',
      paidAmount: row.emiAmount,
      remarks: closureNote || 'Closed via early EMI settlement',
      paymentHistory: [
        ...(row.paymentHistory || []),
        {
          action: 'EMI closed early — balance settled',
          at: new Date().toISOString(),
          by: 'Finance Admin',
        },
      ],
    }
  })
}

/** Net amount for one installment row */
export function installmentNetAmount(row) {
  return (
    (Number(row.emiAmount) || 0) +
    (Number(row.lateFee) || 0) +
    (Number(row.customCharge) || 0) -
    (Number(row.discount) || 0)
  )
}

/**
 * After admin edits one installment amount, rebalance remaining unpaid rows to match principal.
 */
export function rebalanceInstallmentAmounts(schedule, changedNo, newAmount, expectedPrincipal) {
  const rows = schedule.map((r) => ({ ...r }))
  const idx = rows.findIndex((r) => r.installmentNo === changedNo)
  if (idx < 0) return rows

  rows[idx].emiAmount = Math.max(0, Number(newAmount) || 0)

  const lockedSum = rows.reduce((s, r, i) => {
    if (i === idx || ['Paid', 'Closed'].includes(r.status)) {
      return s + (Number(r.emiAmount) || 0)
    }
    return s
  }, 0)

  const remaining = Math.max(0, expectedPrincipal - lockedSum)
  const adjustable = rows
    .map((r, i) => ({ r, i }))
    .filter(({ r, i }) => i !== idx && !['Paid', 'Closed'].includes(r.status))

  if (adjustable.length === 0) return rows

  const per = Math.floor(remaining / adjustable.length)
  let leftover = remaining - per * adjustable.length
  adjustable.forEach(({ i }, ai) => {
    rows[i].emiAmount = per + (ai === adjustable.length - 1 ? leftover : 0)
    rows[i].emiMonth = getEmiMonthLabel(rows[i].dueDate)
  })

  return rows
}

export function computeCurrentPlanAnalytics({ schedule = [], downPayment = 0 }) {
  const rows = schedule || []
  const totalEmiAmount = rows.reduce((s, r) => s + installmentNetAmount(r), 0)
  const paidEmi = rows
    .filter((r) => r.status === 'Paid')
    .reduce((s, r) => s + installmentNetAmount(r), 0)
  const pendingEmi = rows
    .filter((r) => !['Paid', 'Cancelled'].includes(r.status))
    .reduce((s, r) => s + installmentNetAmount(r), 0)
  const overdueEmi = rows
    .filter((r) => r.status === 'Overdue')
    .reduce((s, r) => s + installmentNetAmount(r), 0)
  const overdueCount = rows.filter((r) => r.status === 'Overdue').length
  const paidCount = rows.filter((r) => r.status === 'Paid').length
  const collectionPct =
    rows.length > 0 ? Math.round((paidCount / rows.length) * 100) : 0

  const nextRow = [...rows]
    .filter((r) => !['Paid', 'Cancelled'].includes(r.status))
    .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))[0]

  return {
    totalEmiAmount,
    paidEmi,
    pendingEmi,
    overdueEmi,
    overdueCount,
    nextDueDate: nextRow?.dueDate || null,
    collectionPct,
    downPayment: Number(downPayment) || 0,
    installmentCount: rows.length,
  }
}

export function validateEmiPlan({ financials, downPayment, installmentCount, schedule }) {
  const errors = []
  const down = Number(downPayment) || 0
  const pending = financials?.pendingAmount ?? 0
  const finalPayable = financials?.finalPayable ?? pending

  if (down > finalPayable) {
    errors.push('Down payment cannot exceed total payable amount.')
  }
  if (down > pending) {
    errors.push('Down payment cannot exceed remaining balance.')
  }

  const scheduleTotal = (schedule || []).reduce((s, row) => s + (Number(row.emiAmount) || 0), 0)
  const expectedPrincipal = Math.max(0, pending - down)
  if (Math.abs(scheduleTotal - expectedPrincipal) > 1) {
    errors.push(
      `EMI total (₹${scheduleTotal.toLocaleString('en-IN')}) must equal pending balance after down payment (₹${expectedPrincipal.toLocaleString('en-IN')}).`,
    )
  }

  for (const row of schedule || []) {
    if (installmentNetAmount(row) < 0) {
      errors.push('Installment amount cannot be negative after discounts.')
      break
    }
  }

  const dates = (schedule || []).map((r) => r.dueDate).filter(Boolean)
  for (let i = 1; i < dates.length; i += 1) {
    if (dates[i] < dates[i - 1]) {
      errors.push('Installment due dates must be in chronological order.')
      break
    }
  }

  const count = Number(installmentCount)
  if (count < 0) {
    errors.push('Installment count cannot be negative.')
  }

  return errors
}

export function computeEmiAnalytics(plans = [], draftSchedule = []) {
  const allInstallments = plans.flatMap((p) => p.installments || [])
  const draft = draftSchedule || []
  const combined = [...allInstallments, ...draft]

  const totalPlans = plans.length + (draft.length ? 1 : 0)
  const active = plans.filter((p) => (p.pendingAmount || 0) > 0).length
  const completed = plans.filter((p) => (p.pendingAmount || 0) <= 0).length
  const overdue = combined.filter((i) => i.status === 'Overdue').length
  const paidCount = combined.filter((i) => i.status === 'Paid').length
  const collectionPct =
    combined.length > 0 ? Math.round((paidCount / combined.length) * 100) : 0
  const pendingCollections = combined
    .filter((i) => !['Paid', 'Cancelled'].includes(i.status))
    .reduce((s, i) => s + installmentNetAmount(i), 0)

  return {
    totalPlans,
    active,
    completed,
    overdue,
    collectionPct,
    pendingCollections,
  }
}

/**
 * Opens a print-friendly EMI schedule window.
 */
export function printEmiScheduleDocument({
  financials,
  emiConfig,
  installments,
  paymentId,
}) {
  const rows = installments || []
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>EMI Schedule — ${financials?.studentName || 'Student'}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 24px; color: #111; }
    h1 { color: #246392; font-size: 20px; margin: 0 0 8px; }
    .meta { font-size: 13px; color: #555; margin-bottom: 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { background: #246392; color: #fff; text-align: left; padding: 8px; }
    td { border-bottom: 1px solid #e2e8f0; padding: 8px; }
    .terms { margin-top: 24px; font-size: 12px; color: #444; }
    .sign { margin-top: 40px; display: flex; justify-content: space-between; }
    .sign div { width: 40%; border-top: 1px solid #333; padding-top: 8px; font-size: 12px; }
  </style>
</head>
<body>
  <h1>EMI Payment Schedule</h1>
  <div class="meta">
    <p><strong>Student:</strong> ${financials?.studentName || '—'} (${financials?.applicationId || ''})</p>
    <p><strong>Course:</strong> ${financials?.courseName || '—'} · ${financials?.centerName || ''}</p>
    <p><strong>Duration:</strong> ${emiConfig?.installmentCount || rows.length} installments · Start ${emiConfig?.startDate || '—'}</p>
    <p><strong>Down payment:</strong> ₹${Number(emiConfig?.downPayment || 0).toLocaleString('en-IN')}</p>
    <p><strong>Reference:</strong> ${paymentId || '—'}</p>
  </div>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>EMI Month</th>
        <th>Due Date</th>
        <th>Amount (₹)</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          (r) => `
        <tr>
          <td>${r.installmentNo}</td>
          <td>${r.emiMonth || '—'}</td>
          <td>${r.dueDate || '—'}</td>
          <td>${Number(r.emiAmount || 0).toLocaleString('en-IN')}</td>
          <td>${r.status || 'Scheduled'}</td>
        </tr>`,
        )
        .join('')}
    </tbody>
  </table>
  <div class="terms">
    <p><strong>Payment terms:</strong> All installments are payable at the institute counter via Cash, UPI, Bank Transfer, Cheque, or DD. Late fees may apply on overdue installments as per institute policy.</p>
    <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
  </div>
  <div class="sign">
    <div>Student / Parent signature</div>
    <div>Finance approval</div>
  </div>
</body>
</html>`

  const win = window.open('', '_blank', 'width=900,height=700')
  if (!win) return false
  win.document.write(html)
  win.document.close()
  win.focus()
  win.print()
  return true
}
