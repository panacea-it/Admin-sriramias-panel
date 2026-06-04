import { Search, UserPlus } from 'lucide-react'
import { FINANCE_COURSES } from '../../../data/financeMockData'
import { VERIFICATION_STUDENT_OPTIONS } from '../../../data/financeVerificationData'
import { formatINR } from '../../../utils/financeFilters'

const fieldClass =
  'mt-1 h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-[#222] outline-none focus:border-[#55ace7] focus:ring-2 focus:ring-[#55ace7]/25'

export default function EditableStudentCard({
  profile,
  onChange,
  centerOptions,
  financials,
  onSearchSelect,
  onWalkIn,
}) {
  const set = (key, value) => onChange({ ...profile, [key]: value })

  return (
    <section className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-bold text-[#246392]">Student information</h3>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onWalkIn}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#55ace7]/30 bg-[#eef6fc] px-2.5 py-1.5 text-xs font-semibold text-[#246392] hover:bg-[#e0f0fa]"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Walk-in student
          </button>
        </div>
      </div>

      <label className="mb-3 block text-xs font-semibold text-[#686868]">
        <span className="mb-1 flex items-center gap-1">
          <Search className="h-3.5 w-3.5" />
          Search registered student
        </span>
        <select
          value={profile.studentId || ''}
          onChange={(e) => onSearchSelect(e.target.value)}
          className={fieldClass}
        >
          <option value="">— Or enter details manually below —</option>
          {VERIFICATION_STUDENT_OPTIONS.map((s) => (
            <option key={s.studentId} value={s.studentId}>
              {s.studentName} · {s.centerName}
            </option>
          ))}
        </select>
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs font-semibold text-[#555] sm:col-span-2">
          Student name *
          <input
            value={profile.studentName}
            onChange={(e) => set('studentName', e.target.value)}
            className={fieldClass}
            placeholder="Full name"
          />
        </label>
        <label className="block text-xs font-semibold text-[#555]">
          Mobile *
          <input
            type="tel"
            maxLength={10}
            value={profile.mobile}
            onChange={(e) => set('mobile', e.target.value.replace(/\D/g, '').slice(0, 10))}
            className={fieldClass}
            placeholder="10-digit mobile"
          />
        </label>
        <label className="block text-xs font-semibold text-[#555]">
          Email
          <input
            type="email"
            value={profile.email}
            onChange={(e) => set('email', e.target.value)}
            className={fieldClass}
            placeholder="student@email.com"
          />
        </label>
        <label className="block text-xs font-semibold text-[#555]">
          Center *
          <select
            value={profile.centerName}
            onChange={(e) => set('centerName', e.target.value)}
            className={fieldClass}
          >
            <option value="">Select center</option>
            {centerOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-semibold text-[#555]">
          Course *
          <select
            value={profile.courseId}
            onChange={(e) => set('courseId', e.target.value)}
            className={fieldClass}
          >
            <option value="">Select course</option>
            {FINANCE_COURSES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        {profile.isWalkIn && (
          <label className="block text-xs font-semibold text-[#555] sm:col-span-2">
            Course fee / pending balance (₹)
            <input
              type="number"
              min="0"
              value={profile.customFee}
              onChange={(e) => set('customFee', e.target.value)}
              className={fieldClass}
              placeholder="For walk-in counseling"
            />
          </label>
        )}
      </div>

      {financials && (
        <div className="mt-3 flex flex-wrap gap-4 rounded-lg bg-gradient-to-r from-[#f0f7fc] to-[#eef6fc] px-3 py-2.5 text-sm">
          <span>
            <span className="text-[#686868]">Payable </span>
            <strong className="tabular-nums text-[#111]">{formatINR(financials.finalPayable)}</strong>
          </span>
          <span>
            <span className="text-[#686868]">Paid </span>
            <strong className="tabular-nums text-emerald-700">{formatINR(financials.amountPaid)}</strong>
          </span>
          <span>
            <span className="text-[#686868]">Pending </span>
            <strong className="tabular-nums text-[#246392]">{formatINR(financials.pendingAmount)}</strong>
          </span>
        </div>
      )}
    </section>
  )
}
