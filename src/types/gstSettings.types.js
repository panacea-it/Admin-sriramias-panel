/**
 * @typedef {Object} ApiResponse
 * @property {boolean} success
 * @property {number} statusCode
 * @property {string} message
 * @property {*} data
 * @property {unknown} error
 */

/**
 * @typedef {Object} GlobalSettings
 * @property {number} gstPercent
 * @property {string} invoicePrefix
 * @property {string} receiptPrefix
 * @property {boolean} enableTax
 */

/**
 * @typedef {Object} BranchSetting
 * @property {string} centerId
 * @property {string} centerName
 * @property {string} branchCode
 * @property {boolean} gstEnabled
 * @property {string} gstin
 */

/**
 * @typedef {Object} BrandingSettings
 * @property {string} companyName
 * @property {string} companyAddress
 * @property {string} financialYear
 * @property {string} logoUrl
 * @property {string} signatureImageUrl
 * @property {string} signatoryName
 * @property {string} signatoryDesignation
 * @property {string} footerNotes
 * @property {string} termsAndConditions
 */

/**
 * @typedef {Object} AutomationSettings
 * @property {boolean} pdfWatermarkEnabled
 * @property {boolean} autoSendReceiptEnabled
 */

/**
 * @typedef {Object} GstSettingsPayload
 * @property {GlobalSettings} globalSettings
 * @property {BranchSetting[]} branchSettings
 * @property {BrandingSettings} branding
 * @property {AutomationSettings} automation
 */

/**
 * @typedef {Object} GstPreview
 * @property {string} companyName
 * @property {string} financialYear
 * @property {string} invoiceNumber
 * @property {string} receiptNumber
 * @property {string} gstRateLabel
 * @property {boolean} showTaxRows
 * @property {number} taxableAmount
 * @property {number} cgstRate
 * @property {number} sgstRate
 * @property {number} cgst
 * @property {number} sgst
 * @property {number} total
 * @property {string[]} branchFormatExamples
 * @property {string} footerNotes
 * @property {string} termsAndConditions
 */

/**
 * @typedef {GstSettingsPayload & { preview: GstPreview, updatedAt?: string }} GstSettingsDetails
 */

/**
 * Flat UI form shape used by GstInvoiceSettingsPage and receipt helpers.
 * @typedef {Object} GstSettingsForm
 * @property {number} gstPercent
 * @property {string} invoicePrefix
 * @property {string} receiptPrefix
 * @property {boolean} taxEnabled
 * @property {number|string} financialYear
 * @property {string} companyName
 * @property {string} companyAddress
 * @property {string} logoUrl
 * @property {string} signatureUrl
 * @property {string} signatoryName
 * @property {string} signatoryDesignation
 * @property {string} footerNotes
 * @property {string} termsAndConditions
 * @property {boolean} watermarkEnabled
 * @property {boolean} autoSendReceipt
 * @property {Array<{
 *   centerId?: string,
 *   centerName?: string,
 *   branchName?: string,
 *   branchId?: string,
 *   branchCode?: string,
 *   gstEnabled?: boolean,
 *   gstNumber?: string,
 *   stateCode?: string,
 * }>} branchGst
 */

export {}
