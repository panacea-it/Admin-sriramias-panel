import {
  applyEarlyEmiClosure,
  computeCurrentPlanAnalytics,
  getEmiMonthLabel,
  installmentNetAmount,
  installmentPaidAmount,
  installmentRemaining,
} from './emiSchedule'

const PROOF_REQUIRED_MODES = ['Cash', 'Cheque', 'DD']
const UTR_REQUIRED_MODES = ['UPI', 'Bank Transfer', 'POS Machine', 'Card']

export function normalizeInstallment(raw, index = 0) {
  const no = raw.installmentNo ?? raw.emiNo ?? index + 1
  const dueDate = raw.dueDate || raw.emiDate || ''
  const emiAmount = Number(raw.emiAmount) || 0
  let paidAmount = Number(raw.paidAmount)
  if (Number.isNaN(paidAmount)) {
    if (raw.status === 'Paid') paidAmount = emiAmount
    else if (raw.status === 'Partial') paidAmount = Math.min(emiAmount, Number(raw.partialPaid) || 0)
    else paidAmount = 0
  }
  const receiptNumber =
    raw.receiptNumber || (typeof raw.receipt === 'string' ? raw.receipt : '') || ''

  return {
    installmentNo: no,
    emiNo: no,
    emiMonth: raw.emiMonth || getEmiMonthLabel(dueDate),
    dueDate,
    emiDate: dueDate,
    emiAmount,
    paidAmount,
    lateFee: Number(raw.lateFee) || 0,
    discount: Number(raw.discount) || 0,
    customCharge: Number(raw.customCharge) || 0,
    status: raw.status || 'Due',
    paymentMode: raw.paymentMode || '',
    paymentType: raw.paymentType || 'Offline',
    receiptNumber,
    referenceNumber: raw.referenceNumber || raw.utrNumber || '',
    utrNumber: raw.utrNumber || raw.referenceNumber || '',
    paidDate: raw.paidDate || '',
    remarks: raw.remarks || '',
    proofFileName: raw.proofFileName || null,
    proofUrl: raw.proofUrl || null,
    proofDataUrl: raw.proofDataUrl || null,
    collectedBy: raw.collectedBy || '',
    paymentHistory: Array.isArray(raw.paymentHistory) ? [...raw.paymentHistory] : [],
  }
}

export function normalizeEmiPlan(plan) {
  if (!plan) return null
  const installments = (plan.installments || []).map((row, i) => normalizeInstallment(row, i))
  const startDate =
    plan.emiStartDate || installments[0]?.dueDate || ''
  const endDate =
    plan.emiEndDate || installments[installments.length - 1]?.dueDate || ''

  return {
    ...plan,
    mobile: plan.mobile || '',
    email: plan.email || '',
    emiStartDate: startDate,
    emiEndDate: endDate,
    emiDurationMonths: plan.emiDurationMonths || installments.length,
    planStatus: plan.planStatus || derivePlanStatus(installments, plan),
    overdueAmount: plan.overdueAmount ?? computeOverdueAmount(installments),
    planHistory: Array.isArray(plan.planHistory) ? [...plan.planHistory] : [],
    installments,
  }
}

function derivePlanStatus(installments, plan) {
  if (plan.planStatus === 'Closed Early') return 'Closed Early'
  const allPaid = installments.every((r) => ['Paid', 'Closed'].includes(r.status))
  if (allPaid && installments.length) return 'EMI Completed'
  return 'EMI Running'
}

function computeOverdueAmount(installments) {
  return installments
    .filter((r) => r.status === 'Overdue' || (r.status === 'Due' && r.dueDate && r.dueDate < todayIso()))
    .reduce((s, r) => s + installmentRemaining(r), 0)
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function recalcPlanFromInstallments(plan, installments) {
  const rows = installments.map((r, i) => normalizeInstallment(r, i))
  const analytics = computeCurrentPlanAnalytics({ schedule: rows })
  const totalPaidFromRows = rows.reduce((s, r) => s + installmentPaidAmount(r), 0)
  const totalFees = plan.totalFees || 0
  const pendingAmount = Math.max(0, totalFees - totalPaidFromRows)
  const completionPercent = totalFees
    ? Math.min(100, Math.round((totalPaidFromRows / totalFees) * 100))
    : 0

  return {
    ...plan,
    installments: rows,
    totalPaid: totalPaidFromRows,
    pendingAmount,
    completionPercent,
    overdueAmount: computeOverdueAmount(rows),
    planStatus: derivePlanStatus(rows, plan),
    emiEndDate: rows.length ? rows[rows.length - 1].dueDate : plan.emiEndDate,
  }
}

export function appendPlanHistory(history, action, by = 'Finance Admin') {
  return [
    {
      action,
      by,
      at: new Date().toISOString(),
    },
    ...(history || []),
  ]
}

export function appendRowHistory(row, action, by = 'Finance Admin') {
  return {
    ...row,
    paymentHistory: [
      ...(row.paymentHistory || []),
      { action, at: new Date().toISOString(), by },
    ],
  }
}

export function validateEmiEditPlan(plan, installments) {
  const errors = []
  const rows = installments.map((r, i) => normalizeInstallment(r, i))

  for (const row of rows) {
    if (['Paid', 'Partial'].includes(row.status)) {
      const due = installmentNetAmount(row)
      const paid = installmentPaidAmount(row)
      if (paid > due + 0.5) {
        errors.push(`Installment #${row.installmentNo}: partial payment cannot exceed EMI amount.`)
        break
      }
    }
    if (row.status === 'Paid' || row.status === 'Partial') {
      if (PROOF_REQUIRED_MODES.includes(row.paymentMode) && !row.proofFileName && !row.proofUrl) {
        errors.push(
          `Installment #${row.installmentNo}: payment proof is required for ${row.paymentMode} payments.`,
        )
      }
      if (UTR_REQUIRED_MODES.includes(row.paymentMode) && !row.utrNumber && !row.referenceNumber) {
        errors.push(
          `Installment #${row.installmentNo}: UTR/reference is required for ${row.paymentMode}.`,
        )
      }
    }
  }

  const dates = rows.map((r) => r.dueDate).filter(Boolean)
  for (let i = 1; i < dates.length; i += 1) {
    if (dates[i] < dates[i - 1]) {
      errors.push('Installment due dates must stay in chronological order.')
      break
    }
  }

  if (plan?.planStatus !== 'Closed Early') {
    const openSum = rows
      .filter((r) => !['Closed', 'Cancelled'].includes(r.status))
      .reduce((s, r) => s + installmentNetAmount(r), 0)
    const paidSum = rows.reduce((s, r) => s + installmentPaidAmount(r), 0)
    const expectedOpen = Math.max(0, (plan?.totalFees || 0) - paidSum)
    const openRemaining = rows
      .filter((r) => !['Paid', 'Closed', 'Cancelled'].includes(r.status))
      .reduce((s, r) => s + installmentRemaining(r), 0)
    if (Math.abs(openRemaining - expectedOpen) > 5 && openSum > 0) {
      errors.push(
        `Installment schedule (₹${openRemaining.toLocaleString('en-IN')} remaining) should align with plan pending balance (₹${expectedOpen.toLocaleString('en-IN')}).`,
      )
    }
  }

  return errors
}

export function canDeleteInstallment(row) {
  return !['Paid', 'Partial', 'Closed'].includes(row.status)
}

export function splitInstallmentAt(installments, index) {
  const rows = installments.map((r, i) => normalizeInstallment(r, i))
  const row = rows[index]
  if (!row || ['Paid', 'Closed', 'Partial'].includes(row.status)) return rows

  const remaining = installmentRemaining(row) || row.emiAmount
  const half = Math.floor(remaining / 2)
  const other = remaining - half
  const due = row.dueDate || todayIso()

  const first = appendRowHistory(
    {
      ...row,
      emiAmount: half,
      paidAmount: row.paidAmount || 0,
      status: row.paidAmount > 0 ? 'Partial' : 'Due',
    },
    'Installment split (part 1)',
  )

  const second = normalizeInstallment(
    {
      installmentNo: rows.length + 1,
      emiMonth: getEmiMonthLabel(addDays(due, 15)),
      dueDate: addDays(due, 15),
      emiAmount: other,
      status: 'Due',
      paymentHistory: [{ action: 'Created from split', at: new Date().toISOString(), by: 'Finance Admin' }],
    },
    rows.length,
  )

  const next = [...rows.slice(0, index), first, second, ...rows.slice(index + 1)]
  return renumberInstallments(next)
}

export function mergeInstallmentWithNext(installments, index) {
  const rows = installments.map((r, i) => normalizeInstallment(r, i))
  const a = rows[index]
  const b = rows[index + 1]
  if (!a || !b) return rows
  if (!canDeleteInstallment(a) || !canDeleteInstallment(b)) return rows
  if (['Paid', 'Partial'].includes(a.status) || ['Paid', 'Partial'].includes(b.status)) return rows

  const merged = appendRowHistory(
    {
      ...a,
      emiAmount: installmentNetAmount(a) + installmentNetAmount(b),
      remarks: [a.remarks, b.remarks].filter(Boolean).join(' · '),
    },
    `Merged with installment #${b.installmentNo}`,
  )

  const next = [...rows.slice(0, index), merged, ...rows.slice(index + 2)]
  return renumberInstallments(next)
}

function renumberInstallments(rows) {
  return rows.map((r, i) => ({
    ...r,
    installmentNo: i + 1,
    emiNo: i + 1,
  }))
}

function addDays(iso, days) {
  const d = new Date(iso)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function applyEarlyClosureToPlan(plan, installments, { amount, remarks, proofFileName, proofUrl }) {
  const closed = applyEarlyEmiClosure(installments, remarks)
  const history = appendPlanHistory(plan.planHistory, `EMI closed early — collected ₹${amount}`, 'Finance Admin')
  return {
    plan: {
      ...plan,
      planStatus: 'Closed Early',
      pendingAmount: 0,
      completionPercent: 100,
      planHistory: history,
    },
    installments: closed.map((r, i) => {
      if (i === 0 && proofFileName) {
        return { ...r, proofFileName, proofUrl }
      }
      return r
    }),
  }
}

export function buildEmiReceiptPayment(plan, row) {
  return {
    studentName: plan.studentName,
    studentId: plan.studentId,
    mobile: plan.mobile,
    email: plan.email,
    courseName: plan.courseName,
    receiptNumber: row.receiptNumber || `RCP-EMI-${row.installmentNo}`,
    paymentDate: row.paidDate || new Date().toISOString(),
    amountPaid: installmentPaidAmount(row) || row.emiAmount,
    totalFees: plan.totalFees,
    pendingAmount: plan.pendingAmount,
    paymentMode: row.paymentMode,
    paymentType: 'EMI',
    installmentNo: row.installmentNo,
    collectedBy: row.collectedBy || 'Finance Admin',
  }
}

export function readProofFile(file) {
  return new Promise((resolve, reject) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf']
    if (!allowed.includes(file.type) && !file.name.match(/\.(jpe?g|png|pdf)$/i)) {
      reject(new Error('Only JPG, PNG, and PDF files are allowed.'))
      return
    }
    const reader = new FileReader()
    reader.onload = () =>
      resolve({
        proofFileName: file.name,
        proofUrl: typeof reader.result === 'string' ? reader.result : null,
        proofDataUrl: typeof reader.result === 'string' ? reader.result : null,
      })
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function downloadProof(row) {
  const url = row.proofDataUrl || row.proofUrl
  if (!url) return false
  const a = document.createElement('a')
  a.href = url
  a.download = row.proofFileName || 'payment-proof'
  a.click()
  return true
}
