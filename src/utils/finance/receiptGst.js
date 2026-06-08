/**
 * GST breakup for receipts — supports CGST/SGST (intra-state) and IGST (inter-state).
 */

export function getFinancialYearShort(date = new Date()) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = d.getMonth() + 1
  return month >= 4 ? year : year - 1
}

export function resolveBranchGstSettings(row, gstSettings = {}) {
  const branches = gstSettings.branchGst || []
  const centerName = row.centerName || row.branch || ''
  const match =
    branches.find((b) => b.branchName === centerName || b.centerName === centerName) ||
    branches.find((b) => b.branchId === row.branchCode) ||
    branches[0] ||
    {}
  return {
    gstEnabled: gstSettings.taxEnabled !== false && match.gstEnabled !== false,
    gstPercent: Number(gstSettings.gstPercent ?? 18),
    gstNumber: match.gstNumber || '29ABCDESRI0001Z5',
    stateCode: match.stateCode || '29',
    branchCode: match.branchCode || match.branchId || 'SRI',
    companyName: gstSettings.companyName || 'Sriram IAS',
    companyAddress: match.address || gstSettings.companyAddress || '',
    logoUrl: match.logoUrl || gstSettings.logoUrl || '',
    signatureUrl: match.signatureUrl || gstSettings.signatureUrl || '',
    signatoryName: match.signatoryName || gstSettings.signatoryName || 'Finance Manager',
    signatoryDesignation: match.signatoryDesignation || gstSettings.signatoryDesignation || 'Authorized Signatory',
    footerText: match.footerText || gstSettings.footerNotes || 'Thank you for your payment.',
    termsAndConditions: gstSettings.termsAndConditions || '',
  }
}

/** Split total (tax-inclusive) into base + tax components */
export function calcGstBreakup(totalAmount, gstPercent = 18, { interState = false } = {}) {
  const total = Number(totalAmount) || 0
  const rate = Number(gstPercent) / 100
  if (rate <= 0) {
    return {
      baseAmount: total,
      gstAmount: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      gstPercent: 0,
      totalAmount: total,
      interState,
    }
  }
  const baseAmount = Math.round(total / (1 + rate))
  const gstAmount = total - baseAmount
  const half = Math.round(gstAmount / 2)
  return {
    baseAmount,
    gstAmount,
    cgst: interState ? 0 : half,
    sgst: interState ? 0 : gstAmount - half,
    igst: interState ? gstAmount : 0,
    gstPercent: Number(gstPercent),
    totalAmount: total,
    interState,
  }
}

export function calcReceiptGst(row, gstSettings = {}) {
  const branch = resolveBranchGstSettings(row, gstSettings)
  const total = row.totalFees ?? row.amountPaid ?? row.totalAmount ?? 0
  if (!branch.gstEnabled) {
    return calcGstBreakup(total, 0)
  }
  const interState = Boolean(row.interState ?? row.isInterState)
  return calcGstBreakup(total, branch.gstPercent, { interState })
}
