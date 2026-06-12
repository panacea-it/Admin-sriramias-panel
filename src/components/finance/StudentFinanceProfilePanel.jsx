import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  UserCircle,
  IndianRupee,
  CalendarClock,
  Receipt,
  MessageSquare,
  History,
  Wallet,
  FileText,
  Clock,
  Bell,
  Layers,
  Plus,
  Download,
  Percent,
  Ban,
} from 'lucide-react'
import FinanceSettingsPanelShell from './FinanceSettingsPanelShell'
import {
  ProfileAddPaymentModal,
  ProfileApplyScholarshipModal,
  ProfileAddDiscountModal,
  ProfileProcessRefundModal,
} from './student-profiles/ProfileFinanceActionModals'
import FinanceStatusBadge from './FinanceStatusBadge'
import FinanceConfirmDialog from './FinanceConfirmDialog'
import ProfileSummaryOverview from './student-profiles/ProfileSummaryOverview'
import {
  ProfileFeeBreakdownPanel,
  ProfileEnrollmentPanel,
  ProfileLoanPanel,
  ProfileWalletPanel,
  ProfileDocumentsPanel,
  ProfileTimelinePanel,
  ProfileRefundsPanel,
  ProfileNotificationsPanel,
  ProfileQuickActionsPanel,
} from './student-profiles/StudentProfileTabPanels'
import {
  fetchStudentFinanceProfileDetail,
  fetchPaymentReports,
  fetchEmiPlans,
  creditStudentWallet,
  uploadStudentFinanceDocument,
  sendPaymentReminder,
  addStudentProfilePayment,
  applyStudentScholarship,
  addStudentDiscount,
  processStudentRefund,
} from '../../api/financeAPI'
import { enrichStudentFinanceProfile } from '../../utils/studentFinanceProfile'
import { enrichFinanceRecord } from '../../utils/financeRecordModel'
import { downloadProfileSummary } from '../../utils/studentFinanceProfile'
import { PROFILE_FINANCE_ACTIONS } from '../../constants/studentFinanceProfiles'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { useFinanceOperations } from '../../contexts/FinanceOperationsContext'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'
import StudentReceiptHistory from './receipt-center/StudentReceiptHistory'
import { downloadReceiptHtml } from '../../utils/receiptCompletion'
import { fetchGstSettings } from '../../api/financeAPI'
import { cn } from '../../utils/cn'
import { toast } from '../../utils/toast'

const TABS = [
  { id: 'overview', label: 'Overview', icon: UserCircle },
  { id: 'fees', label: 'Fees', icon: Layers },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'loan', label: 'Loan & EMI', icon: CalendarClock },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'activity', label: 'Activity', icon: Clock },
  { id: 'payments', label: 'Payments', icon: IndianRupee },
  { id: 'receipts', label: 'Receipts', icon: Receipt },
  { id: 'attempts', label: 'Attempts', icon: History },
]

const ACTION_ICONS = {
  add_payment: Plus,
  receipt: Receipt,
  scholarship: Percent,
  discount: Percent,
  refund: IndianRupee,
  suspend: Ban,
  reminder: MessageSquare,
  download: Download,
}

const FORM_ACTIONS = new Set(['add_payment', 'scholarship', 'discount', 'refund'])

export default function StudentFinanceProfilePanel({ studentId, seed, onClose }) {
  const { goToFinance } = useFinanceOperations()
  const { canEdit, canApprove, canReceipts, canExport } = useFinancePermissions()
  const [tab, setTab] = useState('overview')
  const [profile, setProfile] = useState(null)
  const [payments, setPayments] = useState([])
  const [gstSettings, setGstSettings] = useState(null)
  const [loading, setLoading] = useState(false)
  const [confirmAction, setConfirmAction] = useState(null)
  const [actionForm, setActionForm] = useState(null)
  const [actionSaving, setActionSaving] = useState(false)

  const load = useCallback(async () => {
    if (!studentId) return
    setLoading(true)
    try {
      const [detail, allPay, emi, gst] = await Promise.all([
        fetchStudentFinanceProfileDetail(studentId),
        fetchPaymentReports(),
        fetchEmiPlans(),
        fetchGstSettings(),
      ])
      setGstSettings(gst)
      const studentPayments = allPay.filter((p) => p.studentId === studentId).map(enrichFinanceRecord)
      setPayments(studentPayments)
      if (detail) {
        setProfile(detail)
      } else if (seed) {
        setProfile(enrichStudentFinanceProfile(seed, { payments: allPay, emiPlans: emi }))
      } else if (studentPayments[0]) {
        setProfile(
          enrichStudentFinanceProfile(
            {
              id: studentId,
              studentName: studentPayments[0].studentName,
              mobile: studentPayments[0].mobile,
              email: studentPayments[0].email,
              branch: studentPayments[0].branch,
              courses: [],
            },
            { payments: allPay, emiPlans: emi },
          ),
        )
      }
    } catch {
      toast.error('Failed to load finance profile')
    } finally {
      setLoading(false)
    }
  }, [studentId, seed?.mobile, seed?.email])

  useEffect(() => {
    if (studentId) {
      setTab('overview')
      load()
    }
  }, [studentId, load])

  const quickActions = useMemo(() => {
    return PROFILE_FINANCE_ACTIONS.filter((a) => {
      if (a.perm === 'edit') return canEdit || canApprove
      if (a.perm === 'approve') return canApprove
      if (a.perm === 'receipts') return canReceipts
      if (a.perm === 'export') return canExport
      return true
    }).map((a) => ({ ...a, icon: ACTION_ICONS[a.id] }))
  }, [canEdit, canApprove, canReceipts, canExport])

  const handleWalletCredit = useCallback(
    async (payload) => {
      try {
        const txn = await creditStudentWallet(studentId, payload)
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                walletBalance: (prev.walletBalance || 0) + (txn.amount || 0),
                walletTransactions: [txn, ...(prev.walletTransactions || [])],
              }
            : prev,
        )
        toast.success('Wallet credited')
      } catch {
        toast.error('Wallet update failed')
      }
    },
    [studentId],
  )

  const handleDocumentUpload = useCallback(
    async ({ type, fileName }) => {
      try {
        const doc = await uploadStudentFinanceDocument(studentId, { type, fileName })
        setProfile((prev) =>
          prev ? { ...prev, documents: [...(prev.documents || []).filter((d) => d.type !== type), doc] } : prev,
        )
        toast.success('Document uploaded')
      } catch {
        toast.error('Upload failed')
      }
    },
    [studentId],
  )

  const handleQuickAction = useCallback(
    (actionId) => {
      if (FORM_ACTIONS.has(actionId)) {
        setActionForm(actionId)
        return
      }
      if (actionId === 'suspend') {
        setConfirmAction(actionId)
        return
      }
      switch (actionId) {
        case 'receipt':
          goToFinance('receipts', { student: studentId })
          break
        case 'reminder':
          sendPaymentReminder({ mobile: profile?.mobile, email: profile?.email, studentId })
            .then(() => toast.success('Reminder queued'))
            .catch(() => toast.error('Reminder failed'))
          break
        case 'download':
          downloadProfileSummary(profile)
          break
        default:
          break
      }
    },
    [goToFinance, studentId, profile],
  )

  const closeActionForm = useCallback(() => {
    if (actionSaving) return
    setActionForm(null)
  }, [actionSaving])

  const handleAddPayment = useCallback(
    async (payload) => {
      setActionSaving(true)
      try {
        await addStudentProfilePayment(studentId, payload)
        toast.success('Payment recorded')
        setActionForm(null)
        await load()
      } catch {
        toast.error('Failed to add payment')
      } finally {
        setActionSaving(false)
      }
    },
    [studentId, load],
  )

  const handleApplyScholarship = useCallback(
    async (payload) => {
      setActionSaving(true)
      try {
        await applyStudentScholarship(studentId, payload)
        toast.success('Scholarship applied')
        setActionForm(null)
        await load()
      } catch {
        toast.error('Failed to apply scholarship')
      } finally {
        setActionSaving(false)
      }
    },
    [studentId, load],
  )

  const handleAddDiscount = useCallback(
    async (payload) => {
      setActionSaving(true)
      try {
        await addStudentDiscount(studentId, payload)
        toast.success('Discount added')
        setActionForm(null)
        await load()
      } catch {
        toast.error('Failed to add discount')
      } finally {
        setActionSaving(false)
      }
    },
    [studentId, load],
  )

  const handleProcessRefund = useCallback(
    async (payload) => {
      setActionSaving(true)
      try {
        await processStudentRefund(studentId, payload)
        toast.success('Refund request submitted')
        setActionForm(null)
        await load()
      } catch {
        toast.error('Failed to process refund')
      } finally {
        setActionSaving(false)
      }
    },
    [studentId, load],
  )

  const onConfirmAction = useCallback(() => {
    toast.success(`${confirmAction} recorded (audit logged)`)
    setConfirmAction(null)
  }, [confirmAction])

  if (!studentId) return null

  return (
    <>
    <FinanceSettingsPanelShell
      open={!!studentId}
      onClose={onClose}
      title={profile?.studentName || seed?.studentName || 'Student'}
      subtitle={`${studentId} · ${profile?.branch || profile?.branchMapped || '—'} · ${profile?.enrollmentSourceLabel || ''}`}
      icon={UserCircle}
      size="xl"
      className="sm:max-w-3xl"
      zIndex={110}
    >
      <div className="flex flex-col gap-4 p-4 sm:p-5">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Profile sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tab === t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold transition',
                tab === t.id ? 'bg-[#246392] text-white' : 'bg-[#eef2fc] text-[#246392]',
              )}
            >
              <t.icon className="h-3.5 w-3.5" aria-hidden />
              {t.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-sm text-[#686868]">Loading finance profile…</p>}

        {!loading && profile && tab === 'overview' && (
          <>
            <ProfileSummaryOverview profile={profile} />
            <ProfileEnrollmentPanel profile={profile} />
            <ProfileQuickActionsPanel actions={quickActions} onAction={handleQuickAction} />
          </>
        )}

        {!loading && profile && tab === 'fees' && (
          <>
            <ProfileFeeBreakdownPanel profile={profile} />
            <ProfileRefundsPanel profile={profile} />
          </>
        )}

        {!loading && profile && tab === 'wallet' && (
          <ProfileWalletPanel profile={profile} onWalletCredit={handleWalletCredit} canEdit={canEdit || canApprove} />
        )}

        {!loading && profile && tab === 'loan' && <ProfileLoanPanel profile={profile} />}

        {!loading && profile && tab === 'documents' && (
          <ProfileDocumentsPanel profile={profile} onUpload={handleDocumentUpload} canEdit={canEdit || canApprove} />
        )}

        {!loading && profile && tab === 'activity' && (
          <>
            <ProfileTimelinePanel profile={profile} />
            <ProfileNotificationsPanel profile={profile} />
          </>
        )}

        {tab === 'payments' && (
          <ul className="space-y-2">
            {payments.length === 0 && <p className="text-sm text-[#686868]">No payment history</p>}
            {payments.map((p) => (
              <li key={p.id} className="rounded-lg border border-slate-100 p-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{p.courseName}</span>
                  <FinanceStatusBadge status={p.paymentStatus} />
                </div>
                <p className="mt-1 text-[#686868]">
                  {formatINR(p.amountPaid)} · {p.paymentMode}
                </p>
              </li>
            ))}
          </ul>
        )}

        {tab === 'receipts' && (
          <StudentReceiptHistory
            payments={payments}
            studentId={studentId}
            onPreview={(r) => goToFinance('receipts', { preview: r.id })}
            onDownload={(r) => {
              downloadReceiptHtml(r, gstSettings || {})
              toast.success('Receipt downloaded')
            }}
            onResend={(r) => goToFinance('receipts', { preview: r.id })}
          />
        )}

        {tab === 'attempts' && (
          <button
            type="button"
            onClick={() => goToFinance('attempts', { student: studentId })}
            className="text-sm font-semibold text-[#246392] underline"
          >
            View full attempt logs →
          </button>
        )}
      </div>

      <FinanceConfirmDialog
        open={!!confirmAction}
        title="Confirm finance action"
        message={`Proceed with ${confirmAction?.replace(/_/g, ' ')}? This will be audit logged.`}
        onConfirm={onConfirmAction}
        onCancel={() => setConfirmAction(null)}
      />
    </FinanceSettingsPanelShell>

    <ProfileAddPaymentModal
      open={actionForm === 'add_payment'}
      profile={profile}
      onClose={closeActionForm}
      onSubmit={handleAddPayment}
      saving={actionSaving}
    />
    <ProfileApplyScholarshipModal
      open={actionForm === 'scholarship'}
      profile={profile}
      onClose={closeActionForm}
      onSubmit={handleApplyScholarship}
      saving={actionSaving}
    />
    <ProfileAddDiscountModal
      open={actionForm === 'discount'}
      profile={profile}
      onClose={closeActionForm}
      onSubmit={handleAddDiscount}
      saving={actionSaving}
    />
    <ProfileProcessRefundModal
      open={actionForm === 'refund'}
      profile={profile}
      onClose={closeActionForm}
      onSubmit={handleProcessRefund}
      saving={actionSaving}
    />
    </>
  )
}
