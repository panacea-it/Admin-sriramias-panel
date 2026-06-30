import { useCallback, useEffect, useState } from 'react'
import { UserCircle } from 'lucide-react'
import FinanceSettingsPanelShell from './FinanceSettingsPanelShell'
import ProfileSummaryOverview from './student-profiles/ProfileSummaryOverview'
import { ProfileEnrollmentPanel } from './student-profiles/StudentProfileTabPanels'
import { fetchStudentFinanceProfile } from '../../api/studentFinanceProfilesAPI'
import { toast } from '../../utils/toast'

export default function StudentFinanceProfilePanel({ studentId, seed, onClose }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    if (!studentId) return
    setLoading(true)
    setError(null)
    setProfile(null)
    try {
      const detail = await fetchStudentFinanceProfile(studentId)
      setProfile(detail)
    } catch (err) {
      if (err.status === 404) {
        setError('Finance profile not found for this student')
      } else {
        toast.error(err.message || 'Failed to load finance profile')
        setError(err.message || 'Failed to load finance profile')
      }
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    if (studentId) {
      load()
    }
  }, [studentId, load])

  if (!studentId) return null

  const displayName = profile?.studentName || seed?.studentName || 'Student'
  const subtitleParts = [
    studentId,
    profile?.branch || seed?.branch || '—',
    profile?.enrollmentSourceLabel || seed?.enrollmentSourceLabel || '',
  ].filter(Boolean)

  return (
    <FinanceSettingsPanelShell
      open={!!studentId}
      onClose={onClose}
      title={displayName}
      subtitle={subtitleParts.join(' · ')}
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

        {!loading && error && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-sm text-[#686868]">{error}</p>
            <button
              type="button"
              onClick={load}
              className="mt-3 text-sm font-semibold text-[#246392] hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && profile && (
          <>
            <ProfileSummaryOverview profile={profile} />
            <ProfileEnrollmentPanel profile={profile} />
          </>
        )}
      </div>
    </FinanceSettingsPanelShell>
  )
}
