import mongoose from 'mongoose'

const branchGstSchema = new mongoose.Schema(
  {
    branchId: String,
    branchName: String,
    branchCode: String,
    centerName: String,
    gstEnabled: { type: Boolean, default: true },
    gstNumber: String,
    stateCode: String,
    invoicePrefix: String,
    receiptPrefix: String,
    address: String,
    logoUrl: String,
    signatureUrl: String,
    signatoryName: String,
    signatoryDesignation: String,
    footerText: String,
    financeManager: String,
  },
  { _id: false },
)

const gstSettingsSchema = new mongoose.Schema(
  {
    key: { type: String, unique: true, default: 'default' },
    gstPercent: { type: Number, default: 18 },
    invoicePrefix: { type: String, default: 'INV-SRI-' },
    receiptPrefix: { type: String, default: 'RCP-SRI-' },
    taxEnabled: { type: Boolean, default: true },
    financialYear: { type: Number, default: () => new Date().getFullYear() },
    companyName: { type: String, default: 'Sriram IAS' },
    companyAddress: { type: String, default: '' },
    logoUrl: { type: String, default: '' },
    signatureUrl: { type: String, default: '' },
    signatoryName: { type: String, default: 'Finance Manager' },
    signatoryDesignation: { type: String, default: 'Authorized Signatory' },
    footerNotes: { type: String, default: 'Thank you for your payment.' },
    termsAndConditions: { type: String, default: '' },
    watermarkEnabled: { type: Boolean, default: true },
    autoSendReceipt: { type: Boolean, default: false },
    branchGst: { type: [branchGstSchema], default: [] },
  },
  { timestamps: true },
)

export default mongoose.model('GstSettings', gstSettingsSchema)
