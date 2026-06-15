import { useCallback, useEffect, useState } from 'react'
import { UserCircle } from 'lucide-react'
import FinanceSettingsPanelShell from './FinanceSettingsPanelShell'
import ProfileSummaryOverview from './student-profiles/ProfileSummaryOverview'
import { ProfileEnrollmentPanel } from './student-profiles/StudentProfileTabPanels'
import {
  fetchStudentFinanceProfileDetail,
  fetchPaymentReports,
  fetchEmiPlans,
  fetchGstSettings,
} from '../../api/financeAPI'
import { enrichStudentFinanceProfile } from '../../utils/studentFinanceProfile'
import { enrichFinanceRecord } from '../../utils/financeRecordModel'
import { toast } from '../../utils/toast'

export default function StudentFinanceProfilePanel({ studentId, seed, onClose }) {
  const [profile, setProfile] = useState(null)
  const [payments, setPayments] = useState([])
  const [gstSettings, setGstSettings] = useState(null)
  const [loading, setLoading] = useState(false)

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
      load()
    }
  }, [studentId, load])

  if (!studentId) return null

  return (
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
      <div className="flex flex-col gap-5 p-4 sm:p-5">
        <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Profile sections">
          <button
            type="button"
            role="tab"
            aria-selected
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#246392] px-3 py-2 text-xs font-semibold text-white transition"
          >
            <UserCircle className="h-3.5 w-3.5" aria-hidden />
            Overview
          </button>
        </div>

        {loading && <p className="text-sm text-[#686868]">Loading finance profile…</p>}

        {!loading && profile && (
          <>
            <ProfileSummaryOverview profile={profile} />
            <ProfileEnrollmentPanel profile={profile} />
          </>
        )}
      </div>
    </FinanceSettingsPanelShell>
  )
}
