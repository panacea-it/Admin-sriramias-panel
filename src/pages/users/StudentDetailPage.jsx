import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, BookOpen, CalendarCheck, ClipboardList, CreditCard, FolderOpen, GraduationCap, Mail, MapPin, Package, Pencil, Phone, User, Wallet } from 'lucide-react'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import ProgressBar from '../../components/batch-management/ProgressBar'
import AddOfflinePaymentModal from '../../components/finance/AddOfflinePaymentModal'
import EmiEditModal from '../../components/finance/EmiEditModal'
import FinanceStatusBadge from '../../components/finance/FinanceStatusBadge'
import { StatusBadge } from '../../components/academics/AcademicsUi'
import { fetchEmiPlans, submitOfflinePaymentReport, updateEmiPlan } from '../../api/financeAPI'
import {
  buildStudent360,
  mapManageUserRowToStudentProfile,
} from '../../utils/studentDetailAggregator'
import { enrichEnrollmentsWithPaymentInfo } from '../../utils/enrollmentPaymentLink'
import { enrichEmiPlans } from '../../utils/emiManagement'
import { formatINR } from '../../utils/financeFilters'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { cn } from '../../utils/cn'
import { toast } from '../../utils/toast'
import { useFinancePermissions } from '../../hooks/useFinancePermissions'
import StudentContentPanel from '../../components/content-library/student/StudentContentPanel'
import {
  getUserById,
  normalizeUnifiedUsersResponse,
} from '../../services/userManagementService'

const TABS = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'courses', label: 'Courses & Batches', icon: BookOpen },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'orders', label: 'Orders', icon: Package },
  { id: 'wallet', label: 'Wallet', icon: Wallet },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'tests', label: 'Tests', icon: ClipboardList },
  { id: 'content', label: 'Content Library', icon: FolderOpen },
  { id: 'activity', label: 'Activity', icon: GraduationCap },
  { id: 'address', label: 'Address', icon: MapPin },
]

function formatAddressField(value) {
  const v = typeof value === 'string' ? value.trim() : value
  if (v == null || v === '') return 'Not Available'
  return v
}

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-xl border border-[#eef2fc] bg-white px-4 py-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#686868]">{label}</p>
      <p className="mt-1 text-xl font-bold text-[#111]">{value}</p>
      {sub ? <p className="mt-0.5 text-xs text-[#686868]">{sub}</p> : null}
    </div>
  )
}

function DetailItem({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#686868]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#111]">{children}</p>
    </div>
  )
}

function OverviewTab({ data }) {
  const { profile } = data
  return (
    <div className="grid gap-6 rounded-xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:grid-cols-2 sm:p-6">
      <DetailItem label="Email">
        <span className="inline-flex items-center gap-2">
          <Mail className="h-4 w-4 text-[#686868]" />
          {profile.email}
        </span>
      </DetailItem>
      <DetailItem label="Phone">
        <span className="inline-flex items-center gap-2">
          <Phone className="h-4 w-4 text-[#686868]" />
          {profile.phone}
        </span>
      </DetailItem>
      <DetailItem label="Parent Name">{profile.parentName || '—'}</DetailItem>
      <DetailItem label="Parent Phone Number">
        <span className="inline-flex items-center gap-2">
          <Phone className="h-4 w-4 text-[#686868]" />
          {profile.parentPhone || '—'}
        </span>
      </DetailItem>
      <DetailItem label="Assigned Center">{profile.assignedCenter}</DetailItem>
      <DetailItem label="Status">
        <StatusBadge status={profile.status} />
      </DetailItem>
      <DetailItem label="Joined Date">{formatCategoryDateTime(profile.joinedAt)}</DetailItem>
      <DetailItem label="Last Updated">{formatCategoryDateTime(profile.updatedAt)}</DetailItem>
      <div className="sm:col-span-2">
        <DetailItem label="Counselor notes">
          <span className="font-normal text-[#444]">
            Student profile linked from List Users. Faculty Subjects and batches are managed
            separately under Academics.
          </span>
        </DetailItem>
      </div>
    </div>
  )
}

const addCourseBatchBtnClass =
  'inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 text-sm font-semibold text-white shadow-[0_4px_14px_rgba(36,99,146,0.28)] transition hover:brightness-110 active:scale-[0.98] sm:w-auto'

const emiActionBtnClass =
  'inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#55ace7]/30 bg-white px-3 text-xs font-semibold text-[#246392] shadow-sm transition hover:bg-[#eef6fc] disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm'

function CoursesTab({ enrollments, studentProfile, payments, orders }) {
  const { canManageEmi } = useFinancePermissions()
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [emiPlans, setEmiPlans] = useState([])
  const [emiLoading, setEmiLoading] = useState(true)
  const [emiSaving, setEmiSaving] = useState(false)
  const [editEmiPlan, setEditEmiPlan] = useState(null)

  const initialStudentProfile = useMemo(
    () => ({
      studentId: studentProfile.userId,
      studentName: studentProfile.fullName,
      mobile: studentProfile.phone,
      email: studentProfile.email,
      centerName: studentProfile.assignedCenter,
      isWalkIn: false,
    }),
    [studentProfile],
  )

  const loadEmiPlans = useCallback(async () => {
    setEmiLoading(true)
    try {
      const raw = await fetchEmiPlans()
      setEmiPlans(enrichEmiPlans(raw))
    } catch {
      toast.error('Failed to load EMI plans')
      setEmiPlans([])
    } finally {
      setEmiLoading(false)
    }
  }, [])

  useEffect(() => {
    loadEmiPlans()
  }, [loadEmiPlans])

  const tableRows = useMemo(
    () =>
      enrichEnrollmentsWithPaymentInfo(enrollments, {
        payments,
        orders,
        emiPlans,
        profile: studentProfile,
      }),
    [enrollments, payments, orders, emiPlans, studentProfile],
  )

  const handleAddCourseBatchSubmit = async (form) => {
    setSubmitLoading(true)
    try {
      const result = await submitOfflinePaymentReport(form)
      if (result?.draft) {
        toast.success('Saved as draft')
      } else if (form.emiEnabled && result?.emiPlan) {
        toast.success('Course & batch enrollment submitted with EMI plan')
      } else {
        toast.success('Course & batch enrollment submitted successfully')
      }
      setAddModalOpen(false)
      loadEmiPlans()
    } catch {
      toast.error('Failed to submit course & batch enrollment')
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleOpenEmiModal = (row) => {
    if (!row.isEmi) return
    const plan = emiPlans.find((p) => p.id === row.emiPlanId) || row.emiPlan
    if (!plan) {
      toast.error('No EMI plan found for this enrollment')
      return
    }
    setEditEmiPlan(plan)
  }

  const handleEmiSave = async (installments, meta) => {
    if (!meta?.planId) return
    setEmiSaving(true)
    try {
      await updateEmiPlan(meta.planId, installments, meta.plan)
      toast.success('EMI plan updated')
      setEditEmiPlan(null)
      await loadEmiPlans()
    } catch {
      toast.error('Failed to update EMI plan')
    } finally {
      setEmiSaving(false)
    }
  }

  const columns = [
    { key: 'courseName', label: 'Course', render: (r) => <span className="font-medium">{r.courseName}</span> },
    { key: 'batchName', label: 'Batch' },
    { key: 'batchId', label: 'Batch ID', render: (r) => <span className="font-mono text-xs">{r.batchId}</span> },
    { key: 'trainerName', label: 'Mentor' },
    {
      key: 'dates',
      label: 'Start – End',
      render: (r) => (
        <span className="whitespace-nowrap text-sm text-[#444]">
          {r.startDate || '—'} – {r.endDate || '—'}
        </span>
      ),
    },
    { key: 'enrollmentId', label: 'Enrollment ID', render: (r) => <span className="font-mono text-xs">{r.enrollmentId}</span> },
    {
      key: 'batchStatus',
      label: 'Batch Status',
      render: (r) => <StatusBadge status={r.batchStatus} />,
    },
    { key: 'progress', label: 'Progress', render: (r) => `${r.progress ?? 0}%` },
    {
      key: 'modeOfPayment',
      label: 'Mode of Payment',
      render: (r) => (
        <span
          className={cn(
            'whitespace-nowrap text-sm font-medium',
            r.modeOfPayment === 'Not Available' ? 'text-[#9ca3af]' : 'text-[#444]',
            r.isEmi && 'text-[#246392]',
          )}
        >
          {r.modeOfPayment || 'Not Available'}
        </span>
      ),
    },
    {
      key: 'emiActions',
      label: 'Actions',
      render: (r) =>
        r.isEmi ? (
          <button
            type="button"
            onClick={() => handleOpenEmiModal(r)}
            disabled={!canManageEmi || emiLoading}
            className={emiActionBtnClass}
          >
            <Pencil className="h-3.5 w-3.5" />
            Manage EMI
          </button>
        ) : (
          <span className="text-xs text-[#9ca3af]">—</span>
        ),
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setAddModalOpen(true)}
          className={addCourseBatchBtnClass}
        >
          ➕ Add Course &amp; Batch
        </button>
      </div>

      <PaginatedFigmaTable
        columns={columns}
        data={tableRows}
        loading={emiLoading}
        emptyMessage="No course or batch enrollments found for this student."
        itemLabel="enrollments"
        tableMinWidth={960}
      />

      <AddOfflinePaymentModal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSubmit={handleAddCourseBatchSubmit}
        loading={submitLoading}
        initialStudentProfile={initialStudentProfile}
      />

      <EmiEditModal
        open={!!editEmiPlan}
        plan={editEmiPlan}
        onClose={() => setEditEmiPlan(null)}
        onSubmit={handleEmiSave}
        saving={emiSaving}
      />
    </div>
  )
}

function PaymentsTab({ payments, stats }) {
  const columns = [
    { key: 'transactionId', label: 'Transaction ID', render: (r) => <span className="font-mono text-xs">{r.transactionId}</span> },
    { key: 'courseName', label: 'Course' },
    { key: 'amountPaid', label: 'Paid', render: (r) => formatINR(r.amountPaid) },
    { key: 'pendingAmount', label: 'Pending', render: (r) => formatINR(r.pendingAmount) },
    { key: 'paymentMode', label: 'Mode' },
    { key: 'paymentStatus', label: 'Status', render: (r) => <FinanceStatusBadge status={r.paymentStatus} /> },
    { key: 'paymentDate', label: 'Date', render: (r) => formatCategoryDateTime(r.paymentDate) },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total paid" value={formatINR(stats.totalPaid)} />
        <StatCard label="Pending" value={formatINR(stats.totalPending)} />
        <StatCard
          label="Last payment"
          value={stats.lastPaymentDate ? formatCategoryDateTime(stats.lastPaymentDate) : '—'}
        />
      </div>
      <PaginatedFigmaTable
        columns={columns}
        data={payments}
        emptyMessage="No payment records found."
        itemLabel="payments"
      />
    </div>
  )
}

function AttendanceTab({ attendance, enrollments }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <StatCard label="Average attendance" value={`${attendance.avgAttendance}%`} />
        <StatCard label="Average progress" value={`${attendance.avgProgress}%`} />
      </div>
      <div className="space-y-4 rounded-xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
        <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-[#246392]">
          Per batch
        </h3>
        {enrollments.length === 0 ? (
          <p className="text-sm text-[#686868]">No batch data for attendance.</p>
        ) : (
          enrollments.map((e) => (
            <div key={e.id} className="border-b border-[#eef2fc] py-4 last:border-0">
              <p className="font-semibold text-[#111]">
                {e.courseName} — {e.batchName}
              </p>
              <p className="mt-1 text-xs text-[#686868]">Attendance</p>
              <ProgressBar value={e.attendance} className="mt-2" />
              <p className="mt-3 text-xs text-[#686868]">Course progress</p>
              <ProgressBar value={e.progress} className="mt-1" />
            </div>
          ))
        )}
      </div>
      {attendance.sessions.length > 0 && (
        <div className="rounded-xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#246392]">
            Recent sessions
          </h3>
          <ul className="space-y-2">
            {attendance.sessions.map((s, i) => (
              <li
                key={`${s.date}-${i}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-[#f8fafc] px-3 py-2 text-sm"
              >
                <span className="font-medium text-[#111]">{s.topic}</span>
                <span className="text-[#686868]">{s.batchLabel}</span>
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-xs font-semibold',
                    s.status === 'Present'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800',
                  )}
                >
                  {s.status}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function OrdersTab({ orders, stats }) {
  const columns = [
    {
      key: 'orderId',
      label: 'Order ID',
      render: (r) => <span className="font-mono text-xs">{r.orderId}</span>,
    },
    { key: 'courseName', label: 'Item', render: (r) => <span className="font-medium">{r.courseName}</span> },
    { key: 'orderType', label: 'Type' },
    { key: 'subtotal', label: 'Subtotal', render: (r) => formatINR(r.subtotal) },
    { key: 'discount', label: 'Discount', render: (r) => formatINR(r.discount) },
    { key: 'walletUsed', label: 'Wallet used', render: (r) => formatINR(r.walletUsed) },
    { key: 'amountPaid', label: 'Paid', render: (r) => formatINR(r.amountPaid) },
    { key: 'paymentMode', label: 'Payment' },
    { key: 'status', label: 'Status', render: (r) => <FinanceStatusBadge status={r.status} /> },
    { key: 'orderDate', label: 'Date', render: (r) => formatCategoryDateTime(r.orderDate) },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total orders" value={String(stats.orderCount)} />
        <StatCard label="Completed" value={String(stats.ordersCompleted)} />
        <StatCard label="Order value (paid)" value={formatINR(stats.orderTotal)} />
        <StatCard
          label="Pending / other"
          value={String(stats.orderCount - stats.ordersCompleted)}
        />
      </div>
      <PaginatedFigmaTable
        columns={columns}
        data={orders}
        emptyMessage="No orders found for this student."
        itemLabel="orders"
      />
    </div>
  )
}

function WalletTab({ wallet }) {
  const columns = [
    {
      key: 'reference',
      label: 'Reference',
      render: (r) => <span className="font-mono text-xs">{r.reference}</span>,
    },
    { key: 'description', label: 'Description', render: (r) => <span className="font-medium">{r.description}</span> },
    {
      key: 'type',
      label: 'Type',
      render: (r) => <FinanceStatusBadge status={r.type} />,
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (r) => (
        <span className={cn('font-semibold', r.type === 'Credit' ? 'text-emerald-700' : 'text-rose-700')}>
          {r.type === 'Credit' ? '+' : '−'}
          {formatINR(r.amount)}
        </span>
      ),
    },
    { key: 'balanceAfter', label: 'Balance after', render: (r) => formatINR(r.balanceAfter) },
    { key: 'timestamp', label: 'Date', render: (r) => formatCategoryDateTime(r.timestamp) },
  ]

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Current balance" value={formatINR(wallet.balance)} />
        <StatCard label="Lifetime credited" value={formatINR(wallet.lifetimeCredited)} />
        <StatCard label="Lifetime debited" value={formatINR(wallet.lifetimeDebited)} />
        <StatCard label="Transactions" value={String(wallet.transactions.length)} />
      </div>
      <PaginatedFigmaTable
        columns={columns}
        data={wallet.transactions}
        emptyMessage="No wallet transactions found."
        itemLabel="transactions"
      />
    </div>
  )
}

function TestsTab({ tests }) {
  const columns = [
    { key: 'testName', label: 'Test Name', render: (r) => <span className="font-medium">{r.testName}</span> },
    { key: 'testType', label: 'Type' },
    { key: 'date', label: 'Date', render: (r) => formatCategoryDateTime(r.date) },
    {
      key: 'score',
      label: 'Score',
      render: (r) => (r.status === 'Completed' ? `${r.score} / ${r.maxScore}` : '—'),
    },
    { key: 'status', label: 'Status', render: (r) => <FinanceStatusBadge status={r.status} /> },
    { key: 'rank', label: 'Rank', render: (r) => (r.rank != null ? `#${r.rank}` : '—') },
  ]

  return (
    <PaginatedFigmaTable
      columns={columns}
      data={tests}
      emptyMessage="No test attempts recorded."
      itemLabel="tests"
    />
  )
}

function ActivityTab({ activity }) {
  if (!activity.length) {
    return (
      <div className="rounded-xl bg-white px-6 py-12 text-center text-sm text-[#686868] shadow-sm">
        No activity recorded yet.
      </div>
    )
  }
  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
      <ul className="space-y-0">
        {activity.map((ev) => (
          <li
            key={ev.id}
            className="relative flex gap-4 border-l-2 border-[#cbeeff] py-4 pl-6 last:pb-0"
          >
            <span className="absolute -left-[7px] top-5 h-3 w-3 rounded-full bg-[#55ace7]" />
            <div>
              <p className="font-semibold text-[#111]">{ev.title}</p>
              <p className="mt-1 text-xs capitalize text-[#686868]">{ev.type}</p>
              <p className="mt-0.5 text-xs text-[#9ca0a8]">{formatCategoryDateTime(ev.timestamp)}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function AddressTab({ profile }) {
  const address = formatAddressField(profile?.address)
  const city = formatAddressField(profile?.city)
  const pinCode = formatAddressField(profile?.pinCode)
  const isEmpty = (v) => v === 'Not Available'

  return (
    <div className="rounded-xl bg-white p-5 shadow-[0_4px_16px_rgba(15,23,42,0.06)] sm:p-6">
      <h3 className="mb-5 text-sm font-bold uppercase tracking-wide text-[#246392]">
        Address Information
      </h3>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <DetailItem label="Address">
            <span className={cn(isEmpty(address) && 'font-medium text-[#9ca3af]')}>{address}</span>
          </DetailItem>
        </div>
        <DetailItem label="City">
          <span className={cn(isEmpty(city) && 'font-medium text-[#9ca3af]')}>{city}</span>
        </DetailItem>
        <DetailItem label="Pin Code">
          <span className={cn(isEmpty(pinCode) && 'font-medium text-[#9ca3af]')}>{pinCode}</span>
        </DetailItem>
      </div>
    </div>
  )
}

export default function StudentDetailPage() {
  const { userId } = useParams()
  const [activeTab, setActiveTab] = useState('overview')
  const [apiProfile, setApiProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const loadStudent = async () => {
      if (!userId) {
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const response = await getUserById(userId)
        const envelope = response?.data ?? response
        const record = envelope?.summary ?? envelope
        const normalized = normalizeUnifiedUsersResponse(record, {
          page: 1,
          limit: 1,
        })
        const row = normalized.items[0]

        if (active && row) {
          setApiProfile(mapManageUserRowToStudentProfile(row))
        } else if (active) {
          setApiProfile(null)
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error(error)
        }
        if (active) {
          setApiProfile(null)
          toast.error('Unable to load student profile from the API')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    loadStudent()

    return () => {
      active = false
    }
  }, [userId])

  const data = useMemo(
    () => buildStudent360(userId, { apiProfile }),
    [userId, apiProfile],
  )

  if (loading) {
    return (
      <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 py-12 text-center">
        <p className="text-[#686868]">Loading student profile…</p>
      </div>
    )
  }

  if (!data.profile) {
    return (
      <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 py-12 text-center">
        <p className="text-[#686868]">Student not found.</p>
        <Link to="/users/manage" className="mt-4 inline-block font-semibold text-[#246392] hover:underline">
          ← Back to List Users
        </Link>
      </div>
    )
  }

  if (!data.isStudent) {
    return (
      <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 py-12 text-center">
        <p className="text-[#686868]">This user is not a student. Open List Users to view staff profiles.</p>
        <Link to="/users/manage" className="mt-4 inline-block font-semibold text-[#246392] hover:underline">
          ← Back to List Users
        </Link>
      </div>
    )
  }

  const { profile, stats } = data

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-10 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-6">
        <Link
          to="/users/manage"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#246392] hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to List Users
        </Link>

        <div className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)]">
          <div className="bg-gradient-to-r from-[#55ace7] via-[#8b98bb] to-[#b8887a] px-5 py-6 sm:px-8">
            <div className="flex flex-wrap items-center gap-4">
              {profile.profileImage ? (
                <img
                  src={profile.profileImage}
                  alt=""
                  className="h-16 w-16 rounded-xl border-2 border-white object-cover shadow-md"
                />
              ) : (
                <span className="flex h-16 w-16 items-center justify-center rounded-xl bg-white/90 text-xl font-bold text-[#246392]">
                  {profile.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .slice(0, 2)}
                </span>
              )}
              <div className="min-w-0 text-white">
                <h1 className="text-xl font-bold sm:text-2xl">{profile.fullName}</h1>
                <p className="font-mono text-sm text-white/90">{profile.userId}</p>
                {profile.parentName ? (
                  <p className="mt-1 text-sm text-white/90">
                    Parent: <span className="font-semibold">{profile.parentName}</span>
                  </p>
                ) : null}
                {profile.parentPhone ? (
                  <p className="mt-0.5 text-sm text-white/90">
                    Parent phone: <span className="font-semibold">{profile.parentPhone}</span>
                  </p>
                ) : null}
                {profile.phone ? (
                  <p className="mt-0.5 text-sm text-white/90">
                    Phone: <span className="font-semibold">{profile.phone}</span>
                  </p>
                ) : null}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={profile.status} />
                  <span className="rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
                    {profile.assignedCenter}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 border-b border-[#eef2fc] bg-[#fafcff] p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <StatCard label="Total paid" value={formatINR(stats.totalPaid)} />
            <StatCard label="Pending" value={formatINR(stats.totalPending)} />
            <StatCard label="Wallet balance" value={formatINR(stats.walletBalance)} />
            <StatCard label="Orders" value={String(stats.orderCount)} />
            <StatCard label="Avg attendance" value={`${stats.avgAttendance}%`} />
            <StatCard label="Tests completed" value={String(stats.testsAttempted)} />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 rounded-xl bg-white p-2 shadow-sm">
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition',
                  active
                    ? 'bg-[#246392] text-white shadow-sm'
                    : 'text-[#444] hover:bg-[#eef6fc]',
                )}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        <div>
          {activeTab === 'overview' && <OverviewTab data={data} />}
          {activeTab === 'courses' && (
            <CoursesTab
              enrollments={data.enrollments}
              studentProfile={profile}
              payments={data.payments}
              orders={data.orders}
            />
          )}
          {activeTab === 'payments' && <PaymentsTab payments={data.payments} stats={data.stats} />}
          {activeTab === 'orders' && <OrdersTab orders={data.orders} stats={data.stats} />}
          {activeTab === 'wallet' && <WalletTab wallet={data.wallet} />}
          {activeTab === 'attendance' && (
            <AttendanceTab attendance={data.attendance} enrollments={data.enrollments} />
          )}
          {activeTab === 'tests' && <TestsTab tests={data.tests} />}
          {activeTab === 'content' && (
            <StudentContentPanel
              studentId={userId}
              batchIds={data.enrollments?.map((e) => e.batchId).filter(Boolean) || ['batch-2025']}
              courseIds={data.enrollments?.map((e) => e.courseId).filter(Boolean) || ['course-gs']}
            />
          )}
          {activeTab === 'activity' && <ActivityTab activity={data.activity} />}
          {activeTab === 'address' && <AddressTab profile={profile} />}
        </div>
      </section>
    </div>
  )
}
