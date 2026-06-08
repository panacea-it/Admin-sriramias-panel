import { useMemo, useState } from 'react'
import { Trophy, Users } from 'lucide-react'
import { formatINR } from '../../utils/financeFilters'
import { cn } from '../../utils/cn'
import FinanceSearchInput from './FinanceSearchInput'
import FinanceSectionHeader from './FinanceSectionHeader'
import FinanceEmptyState from './FinanceEmptyState'

export function TopPerformingCourseCard({ course, leaderboard = [], loading, className }) {
  if (loading) {
    return (
      <div className={cn('rounded-xl bg-white/90 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.08)]', className)}>
        <div className="h-32 animate-pulse rounded-lg bg-slate-100" />
      </div>
    )
  }
  if (!course) {
    return (
      <div className={cn('rounded-xl bg-white/90 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.08)]', className)}>
        <p className="py-6 text-center text-sm text-[#686868]">Adjust filters to see top courses.</p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl bg-white/90 shadow-[0_8px_24px_rgba(15,23,42,0.08)]',
        className,
      )}
    >
      <div className="bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 py-3 sm:px-5">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-white" />
          <h3 className="text-sm font-bold text-white sm:text-base">Top Performing Course</h3>
        </div>
        <p className="text-xs text-white/80">Highest revenue generating course</p>
      </div>
      <div className="p-4 sm:p-5">
        <p className="truncate text-lg font-bold text-[#1a3a5c]" title={course.course}>
          {course.course}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-center sm:gap-3">
          <div className="rounded-lg bg-[#eef2fc] p-2">
            <p className="text-[10px] font-semibold uppercase text-[#686868]">Revenue</p>
            <p className="text-sm font-bold text-[#246392] sm:text-base">{formatINR(course.revenue)}</p>
          </div>
          <div className="rounded-lg bg-[#eef2fc] p-2">
            <p className="text-[10px] font-semibold uppercase text-[#686868]">Students</p>
            <p className="text-sm font-bold text-[#1a3a5c] sm:text-base">{course.studentCount}</p>
          </div>
          <div className="rounded-lg bg-[#eef2fc] p-2">
            <p className="text-[10px] font-semibold uppercase text-[#686868]">Growth</p>
            <p className="text-sm font-bold text-[#69df66] sm:text-base">+{course.growthPct}%</p>
          </div>
        </div>
        {leaderboard.length > 1 && (
          <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3">
            {leaderboard.slice(1, 4).map((row, i) => (
              <li key={row.course} className="flex items-center justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-[#686868]">
                    {i + 2}
                  </span>
                  <span className="truncate font-medium">{row.course}</span>
                </span>
                <span className="shrink-0 font-semibold text-[#246392]">{formatINR(row.revenue)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function CounselorRevenuePanel({ counselors = [], loading, className }) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return counselors
    return counselors.filter((c) => c.counselorName?.toLowerCase().includes(q))
  }, [counselors, search])

  return (
    <div
      className={cn(
        'overflow-hidden rounded-xl bg-white/90 shadow-[0_8px_24px_rgba(15,23,42,0.08)] sm:p-1',
        className,
      )}
    >
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5">
        <FinanceSectionHeader
          title="Counselor-wise Revenue"
          subtitle="Revenue, students & conversion"
          className="mb-3"
        />
        <FinanceSearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search counselor…"
          aria-label="Search counselors"
        />
      </div>
      {loading ? (
        <div className="space-y-2 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="p-4">
          <p className="py-6 text-center text-sm text-[#686868]">No revenue data for current filters.</p>
        </div>
      ) : (
        <>
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b bg-slate-50/80 text-xs font-semibold uppercase text-[#686868]">
                  <th className="px-4 py-2">Counselor</th>
                  <th className="px-4 py-2">Revenue</th>
                  <th className="px-4 py-2">Students</th>
                  <th className="px-4 py-2">Conversion</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.counselorId} className="border-b border-slate-50">
                    <td className="px-4 py-3 font-medium">{c.counselorName}</td>
                    <td className="px-4 py-3 font-semibold text-[#246392]">{formatINR(c.revenue)}</td>
                    <td className="px-4 py-3">{c.studentCount}</td>
                    <td className="px-4 py-3">{c.conversionPct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="divide-y divide-slate-100 md:hidden">
            {filtered.map((c) => (
              <li key={c.counselorId} className="flex flex-col gap-2 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-[#222]">{c.counselorName}</span>
                  <span className="font-bold text-[#246392]">{formatINR(c.revenue)}</span>
                </div>
                <div className="flex gap-4 text-xs text-[#686868]">
                  <span className="inline-flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    {c.studentCount} students
                  </span>
                  <span>{c.conversionPct}% conversion</span>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
