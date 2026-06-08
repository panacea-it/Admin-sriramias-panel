import { useMemo } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts'
import Modal from '../ui/Modal'
import { calcPercentile } from '../../utils/testManagement/analyticsEngine'

const COLORS = ['#246392', '#55ace7', '#655ed3', '#39bf2e', '#c96565']

function Section({ title, children }) {
  return (
    <div className="rounded-xl bg-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
      <div className="bg-gradient-to-r from-[#55ace7] to-[#246392] px-4 py-3 sm:px-5">
        <h3 className="text-sm font-bold text-white sm:text-base">{title}</h3>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </div>
  )
}

export default function ResultAnalyticsModal({ open, onClose, row, cohortRows = [] }) {
  const testCohort = useMemo(() => {
    if (!row?.testId) return []
    return cohortRows.filter((r) => String(r.testId) === String(row.testId))
  }, [cohortRows, row])

  const totalInTest = testCohort.filter((r) => r.status === 'Evaluated' || r.status === 'Published').length
  const percentile = row?.airRank ? calcPercentile(row.airRank, totalInTest) : null

  const difficultySplit = useMemo(() => {
    // Mock split: infer difficulty from percentage bands
    const pct = Number(row?.percentage) || 0
    const easy = Math.max(0, Math.min(55, pct))
    const medium = Math.max(0, Math.min(30, pct - 20))
    const hard = Math.max(0, Math.min(15, pct - 60))
    const remaining = Math.max(0, 100 - (easy + medium + hard))
    return [
      { name: 'Easy', value: Math.round((easy + remaining * 0.55) * 10) / 10 },
      { name: 'Medium', value: Math.round((medium + remaining * 0.3) * 10) / 10 },
      { name: 'Hard', value: Math.round((hard + remaining * 0.15) * 10) / 10 },
    ]
  }, [row?.percentage])

  const radar = useMemo(() => {
    // Mock analytics dimensions (API-ready)
    const pct = Number(row?.percentage) || 0
    return [
      { metric: 'Accuracy', value: Math.max(30, Math.min(95, pct + 8)) },
      { metric: 'Time Mgmt', value: Math.max(25, Math.min(92, pct - 6)) },
      { metric: 'Coverage', value: Math.max(20, Math.min(90, pct + 2)) },
      { metric: 'Revision', value: Math.max(18, Math.min(88, pct - 10)) },
      { metric: 'Consistency', value: Math.max(22, Math.min(94, pct + 4)) },
    ]
  }, [row?.percentage])

  if (!row) return null

  return (
    <Modal open={open} onClose={onClose} size="full" title="Result Analytics">
      <div className="overflow-hidden rounded-2xl bg-[#f7f7f7]">
        <div className="bg-gradient-to-r from-[#55ace7] via-[#8b98bb] to-[#b8887a] px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-white sm:text-xl">Analytics View</h2>
              <p className="mt-1 text-sm text-white/85">
                {row.studentName} • {row.testName} • {row.subject}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20">
                AIR: {row.airRank ?? '—'}
              </div>
              <div className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20">
                Percentile: {percentile == null ? '—' : `${percentile}%`}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Section title="Section-wise Analytics (Difficulty Split)">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={difficultySplit} dataKey="value" nameKey="name" innerRadius={55} outerRadius={95} paddingAngle={3}>
                      {difficultySplit.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2 text-xs font-semibold text-slate-600">
                {difficultySplit.map((d, i) => (
                  <div key={d.name} className="rounded-lg bg-slate-50 px-2 py-1 ring-1 ring-slate-200">
                    <span className="inline-block h-2 w-2 rounded-full align-middle" style={{ background: COLORS[i % COLORS.length] }} />{' '}
                    {d.name}: <span className="font-extrabold text-[#1a3a5c]">{d.value}%</span>
                  </div>
                ))}
              </div>
            </Section>

            <Section title="Performance Radar (Interactive)">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radar}>
                    <PolarGrid stroke="#e2e8f0" />
                    <PolarAngleAxis dataKey="metric" tick={{ fontSize: 12, fill: '#475569', fontWeight: 700 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                    <Radar dataKey="value" stroke="#246392" fill="#55ace7" fillOpacity={0.35} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-500">
                API-ready dimensions: accuracy, time management, coverage, revision, consistency.
              </div>
            </Section>
          </div>

          <Section title="Comparison Analytics (Student vs Topper / Batch Avg)">
            <div className="rounded-xl bg-[#eef2fc] p-4">
              <div className="text-sm font-extrabold text-[#1a3a5c]">Comparison analytics is enabled</div>
              <div className="mt-1 text-sm font-semibold text-slate-700">
                Use “Compare Performance” from the results table to open interactive comparisons for this test.
              </div>
            </div>
          </Section>
        </div>
      </div>
    </Modal>
  )
}

