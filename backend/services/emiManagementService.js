/** EMI management — schedule preview, enrichment helpers (API layer) */

export function addMonthsToDate(isoDate, months) {
  const d = new Date(isoDate)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

export function generateLoanEmiSchedule({
  totalCourseFee = 0,
  downPayment = 0,
  loanAmount,
  interestRateAnnual = 0,
  emiDuration = 6,
  startDate,
  frequency = 'monthly',
  customMonthsStep = 1,
}) {
  const principal =
    loanAmount != null ? Number(loanAmount) : Math.max(0, Number(totalCourseFee) - Number(downPayment))
  const count = Math.max(1, Math.min(60, Number(emiDuration) || 1))
  const monthsStep =
    frequency === 'quarterly' ? 3 : frequency === 'custom' ? Math.max(1, Number(customMonthsStep) || 1) : 1
  const start = startDate || new Date().toISOString().slice(0, 10)
  const monthlyRate = (Number(interestRateAnnual) || 0) / 12 / 100

  let emiAmount
  if (monthlyRate > 0) {
    const factor = (1 + monthlyRate) ** count
    emiAmount = Math.round((principal * monthlyRate * factor) / (factor - 1))
  } else {
    emiAmount = Math.ceil(principal / count)
  }

  const installments = []
  let balance = principal
  const today = new Date().toISOString().slice(0, 10)

  for (let i = 0; i < count; i += 1) {
    const dueDate = addMonthsToDate(start, i * monthsStep)
    const interestAmount = monthlyRate > 0 ? Math.round(balance * monthlyRate) : 0
    let principalAmount = emiAmount - interestAmount
    if (i === count - 1) principalAmount = balance
    const totalPayable = principalAmount + interestAmount
    balance = Math.max(0, balance - principalAmount)

    let status = 'Scheduled'
    if (dueDate < today) status = 'Overdue'
    else if (dueDate === today) status = 'Due'

    installments.push({
      installmentNo: i + 1,
      emiNo: i + 1,
      dueDate,
      emiDate: dueDate,
      principalAmount,
      interestAmount,
      emiAmount: totalPayable,
      totalPayable,
      remainingBalance: balance,
      status,
      paidAmount: 0,
    })
  }

  return {
    installments,
    totalEmiAmount: principal,
    loanAmount: principal,
    startDate: start,
    endDate: installments[installments.length - 1]?.dueDate || start,
    frequency,
  }
}
