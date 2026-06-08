import { useMemo } from 'react'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import Modal from '../ui/Modal'

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

function avg(values) {
  const list = values.filter((x) => Number.isFinite(Number(x))).map((x) => Number(x))
  if (!list.length) return 0
  return list.reduce((a, b) => a + b, 0) / list.length
}

export default function ComparePerformanceModal({ open, onClose, row, cohortRows = [] }) {
  const testRows = useMemo(() => {
    if (!row?.testId) return []
    return cohortRows.filter((r) => String(r.testId) === String(row.testId))
  }, [cohortRows, row])

  const evaluated = testRows.filter((r) => r.status === 'Evaluated' || r.status === 'Published')
  const topper = evaluated.length ? [...evaluated].sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0))[0] : null
  const batchRows = evaluated.filter((r) => String(r.batchId) === String(row?.batchId))
  const batchAvg = avg(batchRows.map((r) => r.percentage))

  const series = useMemo(() => {
    const base = [
      { label: 'Student', value: Number(row?.percentage) || 0 },
      { label: 'Batch Avg', value: Number.isFinite(batchAvg) ? Math.round(batchAvg * 10) / 10 : 0 },
      { label: 'Topper', value: Number(topper?.percentage) || 0 },
    ]
    return base
  }, [batchAvg, row?.percentage, topper?.percentage])

  if (!row) return null

  return (
    <Modal open={open} onClose={onClose} size="full" title="Compare Performance">
      <div className="overflow-hidden rounded-2xl bg-[#f7f7f7]">
        <div className="bg-gradient-to-r from-[#55ace7] via-[#8b98bb] to-[#b8887a] px-5 py-4 sm:px-6">
          <h2 className="text-lg font-extrabold text-white sm:text-xl">Comparison Analytics</h2>
          <p className="mt-1 text-sm text-white/85">
            {row.studentName} • {row.testName} • {row.subject}
          </p>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Section title="Student vs Topper vs Batch Average">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="value" stroke="#246392" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-500">
                Supports: student vs topper, student vs batch average. (API-ready for percentile charts.)
              </div>
            </Section>

            <Section title="Insights">
              <div className="space-y-3">
                <div className="rounded-xl bg-[#eef2fc] p-4">
                  <div className="text-sm font-extrabold text-[#1a3a5c]">Topper</div>
                  <div className="mt-1 text-sm font-semibold text-slate-700">
                    {topper ? `${topper.studentName} — ${topper.percentage}%` : 'Not available (no evaluated results yet).'}
                  </div>
                </div>
                <div className="rounded-xl bg-[#eef2fc] p-4">
                  <div className="text-sm font-extrabold text-[#1a3a5c]">Batch Average</div>
                  <div className="mt-1 text-sm font-semibold text-slate-700">
                    {row.batchName}: {Math.round((batchAvg || 0) * 10) / 10}%
                  </div>
                </div>
                <div className="rounded-xl bg-[#fff7ed] p-4 ring-1 ring-orange-200">
                  <div className="text-sm font-extrabold text-orange-800">Next Best Action</div>
                  <div className="mt-1 text-sm font-semibold text-orange-900/90">
                    Target +6% to reach topper band. Increase revision + timed practice for weak areas.
                  </div>
                </div>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </Modal>
  )
}

