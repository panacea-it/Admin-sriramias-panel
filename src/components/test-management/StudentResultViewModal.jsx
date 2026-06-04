import { useMemo } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts'
import Modal from '../ui/Modal'
import { calcPercentage, getWeakSubjects } from '../../utils/testManagement/analyticsEngine'

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

export default function StudentResultViewModal({
  open,
  onClose,
  row,
  allRows = [],
}) {
  const studentRows = useMemo(() => {
    const id = row?.studentId
    if (!id) return []
    return allRows.filter((r) => String(r.studentId) === String(id))
  }, [allRows, row?.studentId])

  const subjectWise = useMemo(() => {
    const map = new Map()
    for (const r of studentRows) {
      const subject = r.subject || 'General'
      const cur = map.get(subject) || { subject, score: 0, total: 0 }
      cur.score += Number(r.score) || 0
      cur.total += Number(r.total) || 0
      map.set(subject, cur)
    }
    return Array.from(map.values())
      .map((x) => ({ subject: x.subject, percentage: calcPercentage(x.score, x.total) }))
      .sort((a, b) => b.percentage - a.percentage)
  }, [studentRows])

  const trend = useMemo(() => {
    const rows = [...studentRows].sort((a, b) => String(a.testDate ?? '').localeCompare(String(b.testDate ?? '')))
    return rows.map((r, idx) => ({
      label: r.testDate ? String(r.testDate).slice(5) : `T${idx + 1}`,
      score: Number(r.percentage) || 0,
    }))
  }, [studentRows])

  const weakSubjects = useMemo(() => getWeakSubjects(studentRows, { top: 3 }), [studentRows])

  if (!row) return null

  return (
    <Modal open={open} onClose={onClose} size="full" title="Student Result">
      <div className="overflow-hidden rounded-2xl bg-[#f7f7f7]">
        <div className="bg-gradient-to-r from-[#55ace7] via-[#8b98bb] to-[#b8887a] px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-extrabold text-white sm:text-xl">Student Result View</h2>
              <p className="mt-1 text-sm text-white/85">
                {row.studentName} • {row.rollNumber} • {row.batchName}
              </p>
            </div>
            <div className="rounded-xl bg-white/15 px-4 py-2 text-sm font-bold text-white ring-1 ring-white/20">
              AIR Rank: {row.airRank ?? '—'}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-4 sm:p-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Section title="A. Student Details">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <div className="text-xs font-semibold text-slate-500">Name</div>
                  <div className="mt-0.5 font-extrabold text-[#1a3a5c]">{row.studentName}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Roll Number</div>
                  <div className="mt-0.5 font-extrabold text-[#1a3a5c]">{row.rollNumber}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Batch</div>
                  <div className="mt-0.5 font-extrabold text-[#1a3a5c]">{row.batchName}</div>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500">Test</div>
                  <div className="mt-0.5 font-extrabold text-[#1a3a5c]">{row.testName}</div>
                </div>
              </div>
            </Section>

            <Section title="B. Score Summary">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#eef2fc] p-4">
                  <div className="text-xs font-semibold text-slate-500">Total Score</div>
                  <div className="mt-1 text-2xl font-black text-[#1a3a5c]">
                    {row.score}/{row.total}
                  </div>
                </div>
                <div className="rounded-xl bg-[#eef2fc] p-4">
                  <div className="text-xs font-semibold text-slate-500">Percentage</div>
                  <div className="mt-1 text-2xl font-black text-[#1a3a5c]">{row.percentage}%</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-sm font-extrabold text-[#1a3a5c]">Subject-wise scores</div>
                <div className="mt-2 space-y-2">
                  {subjectWise.slice(0, 6).map((s) => (
                    <div key={s.subject} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                      <div className="min-w-0 truncate text-sm font-semibold text-[#222]" title={s.subject}>{s.subject}</div>
                      <div className="shrink-0 text-sm font-extrabold text-[#246392]">{s.percentage}%</div>
                    </div>
                  ))}
                </div>
              </div>
            </Section>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Section title="C. Performance Graph (Progress Trend)">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="label" stroke="#64748b" tick={{ fontSize: 12 }} />
                    <YAxis stroke="#64748b" tick={{ fontSize: 12 }} domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#246392" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-500">Shows test-by-test score progression for the student.</div>
            </Section>

            <Section title="D. Weak Area Analysis">
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-xl bg-[#fff7ed] p-4 ring-1 ring-orange-200">
                  <div className="text-sm font-extrabold text-orange-800">Low scoring subjects (auto)</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-orange-900/90">
                    {weakSubjects.length ? weakSubjects.map((w) => (
                      <li key={w.subject}>{w.subject} — {w.avg}%</li>
                    )) : <li>Not enough data to identify weak areas.</li>}
                  </ul>
                </div>
                <div className="rounded-xl bg-[#eef2fc] p-4">
                  <div className="text-sm font-extrabold text-[#1a3a5c]">Improvement suggestions</div>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm font-semibold text-slate-700">
                    <li>Focus on PYQs and timed practice for weak subjects.</li>
                    <li>Maintain an error-log and revise it weekly.</li>
                    <li>Attempt 1 mini-test per week for consistency.</li>
                  </ul>
                </div>
              </div>
            </Section>
          </div>

          <Section title="E. Answer Review">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                <div className="text-sm font-extrabold text-[#1a3a5c]">Evaluator remarks</div>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Good structure and examples. Improve introduction clarity and add more data points where possible.
                </p>
              </div>
              <div className="rounded-xl bg-white p-4 ring-1 ring-slate-200">
                <div className="text-sm font-extrabold text-[#1a3a5c]">Marked answer sheets / annotations</div>
                <div className="mt-2 rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-600">
                  Mock review placeholder — API hook ready for PDF/images + annotation overlays.
                </div>
              </div>
            </div>
          </Section>

          <Section title="Section-wise Analytics (Quick)">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={subjectWise.slice(0, 6)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="subject" stroke="#64748b" tick={{ fontSize: 12 }} />
                  <YAxis stroke="#64748b" tick={{ fontSize: 12 }} domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#55ace7" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Section>
        </div>
      </div>
    </Modal>
  )
}

