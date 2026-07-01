/** @typedef {import('../../types/gstSettings.types').GstSettingsDetails} GstSettingsDetails */
/** @typedef {import('../../types/gstSettings.types').GstSettingsPayload} GstSettingsPayload */
/** @typedef {import('../../types/gstSettings.types').GstSettingsForm} GstSettingsForm */
/** @typedef {import('../../types/gstSettings.types').GstPreview} GstPreview */

const SAMPLE_TAXABLE = 100000

/**
 * @param {Partial<GstSettingsDetails>|null|undefined} details
 * @returns {GstSettingsForm}
 */
export function mapDetailsToForm(details) {
  const global = details?.globalSettings || {}
  const branding = details?.branding || {}
  const automation = details?.automation || {}
  const branches = details?.branchSettings || []

  return {
    gstPercent: Number(global.gstPercent ?? 18),
    invoicePrefix: global.invoicePrefix ?? '',
    receiptPrefix: global.receiptPrefix ?? '',
    taxEnabled: global.enableTax !== false,
    financialYear: Number(branding.financialYear) || new Date().getFullYear(),
    companyName: branding.companyName ?? '',
    companyAddress: branding.companyAddress ?? '',
    logoUrl: branding.logoUrl ?? '',
    signatureUrl: branding.signatureImageUrl ?? '',
    signatoryName: branding.signatoryName ?? '',
    signatoryDesignation: branding.signatoryDesignation ?? '',
    footerNotes: branding.footerNotes ?? '',
    termsAndConditions: branding.termsAndConditions ?? '',
    watermarkEnabled: automation.pdfWatermarkEnabled !== false,
    autoSendReceipt: Boolean(automation.autoSendReceiptEnabled),
    branchGst: branches.map((branch) => ({
      centerId: branch.centerId,
      centerName: branch.centerName,
      branchName: branch.centerName,
      branchId: branch.centerId || branch.branchCode,
      branchCode: branch.branchCode ?? '',
      gstEnabled: branch.gstEnabled !== false,
      gstNumber: branch.gstin ?? '',
    })),
  }
}

/**
 * @param {GstSettingsForm} form
 * @returns {GstSettingsPayload}
 */
export function mapFormToPayload(form) {
  return {
    globalSettings: {
      gstPercent: Number(form.gstPercent ?? 0),
      invoicePrefix: String(form.invoicePrefix ?? '').trim(),
      receiptPrefix: String(form.receiptPrefix ?? '').trim(),
      enableTax: form.taxEnabled !== false,
    },
    branchSettings: (form.branchGst || []).map((branch) => ({
      centerId: branch.centerId || branch.branchId || '',
      centerName: branch.centerName || branch.branchName || '',
      branchCode: String(branch.branchCode ?? '').trim().toUpperCase(),
      gstEnabled: branch.gstEnabled !== false,
      gstin: String(branch.gstNumber ?? branch.gstin ?? '').trim().toUpperCase(),
    })),
    branding: {
      companyName: String(form.companyName ?? '').trim(),
      companyAddress: String(form.companyAddress ?? '').trim(),
      financialYear: String(form.financialYear ?? new Date().getFullYear()),
      logoUrl: String(form.logoUrl ?? '').trim(),
      signatureImageUrl: String(form.signatureUrl ?? form.signatureImageUrl ?? '').trim(),
      signatoryName: String(form.signatoryName ?? '').trim(),
      signatoryDesignation: String(form.signatoryDesignation ?? '').trim(),
      footerNotes: String(form.footerNotes ?? '').trim(),
      termsAndConditions: String(form.termsAndConditions ?? '').trim(),
    },
    automation: {
      pdfWatermarkEnabled: form.watermarkEnabled !== false,
      autoSendReceiptEnabled: Boolean(form.autoSendReceipt),
    },
  }
}

/**
 * @param {GstSettingsPayload} payload
 * @returns {GstPreview}
 */
export function buildMockPreview(payload) {
  const { globalSettings, branchSettings, branding } = payload
  const branch = branchSettings?.[0] || {}
  const branchCode = branch.branchCode || 'DEL'
  const fy = String(branding.financialYear || new Date().getFullYear())
  const invoicePrefix = globalSettings.invoicePrefix || 'INV-'
  const receiptPrefix = globalSettings.receiptPrefix || 'RCP-'
  const invoiceNumber = `${branchCode}-${invoicePrefix}${fy}-00125`
  const receiptNumber = `${branchCode}-${receiptPrefix}${fy}-00125`

  const taxActive =
    globalSettings.enableTax === true &&
    branch.gstEnabled === true &&
    Boolean(String(branch.gstin || '').trim())

  const gstPercent = Number(globalSettings.gstPercent ?? 0)
  const cgstRate = taxActive ? gstPercent / 2 : 0
  const sgstRate = taxActive ? gstPercent / 2 : 0
  const cgst = taxActive ? Math.round(SAMPLE_TAXABLE * (cgstRate / 100)) : 0
  const sgst = taxActive ? Math.round(SAMPLE_TAXABLE * (sgstRate / 100)) : 0
  const total = taxActive ? SAMPLE_TAXABLE + cgst + sgst : SAMPLE_TAXABLE

  const branchFormatExamples = (branchSettings || [])
    .slice(0, 3)
    .map((b) => `${b.branchCode || 'DEL'}-${invoicePrefix}${fy}-00125`)

  return {
    companyName: branding.companyName || 'Sriram IAS',
    financialYear: fy,
    invoiceNumber,
    receiptNumber,
    gstRateLabel: taxActive ? `${gstPercent}%` : 'Disabled',
    showTaxRows: taxActive,
    taxableAmount: SAMPLE_TAXABLE,
    cgstRate,
    sgstRate,
    cgst,
    sgst,
    total,
    branchFormatExamples,
    footerNotes: branding.footerNotes || '',
    termsAndConditions: branding.termsAndConditions || '',
  }
}

/**
 * @param {Partial<GstSettingsDetails>|null|undefined} details
 * @returns {GstSettingsDetails}
 */
export function normalizeDetailsResponse(details) {
  const payload = mapFormToPayload(mapDetailsToForm(details))
  const preview = details?.preview || buildMockPreview(payload)
  return {
    ...payload,
    preview,
    updatedAt: details?.updatedAt,
  }
}

/**
 * Stable JSON snapshot for dirty-state comparison.
 * @param {GstSettingsForm} form
 */
export function serializeFormPayload(form) {
  return JSON.stringify(mapFormToPayload(form))
}
