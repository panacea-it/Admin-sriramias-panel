import { LayoutGrid, X, Building2, BookOpen, BarChart3, Loader2 } from 'lucide-react'
import Modal from '../ui/Modal'
import CategoryStatusBadge from './CategoryStatusBadge'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { useCenters } from '../../contexts/CentersContext'
import { getCentreNames, getProgramStats } from '../../utils/programHelpers'

function SectionTitle({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2 border-b border-[#eef2fc] pb-2">
      {Icon && <Icon className="h-4 w-4 text-[#246392]" strokeWidth={2.2} />}
      <h3 className="text-sm font-bold uppercase tracking-wide text-[#246392]">{children}</h3>
    </div>
  )
}

function DetailItem({ label, children }) {
  return (
    <div>
      <p className="text-xs font-medium text-[#686868]">{label}</p>
      <div className="mt-1 text-sm font-semibold text-[#111]">{children}</div>
    </div>
  )
}

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl bg-[#f0f7fc] px-4 py-3 text-center ring-1 ring-[#d1e9f6]">
      <p className="text-2xl font-bold text-[#246392]">{value}</p>
      <p className="mt-0.5 text-xs font-medium text-[#686868]">{label}</p>
    </div>
  )
}

export default function ViewProgramModal({
  open,
  onClose,
  program,
  linkedCourses = [],
  loading = false,
  centresCatalog,
}) {
  const { activeCenters } = useCenters()
  const centres = centresCatalog?.length ? centresCatalog : activeCenters

  if (!open || !program) return null

  const centreNames =
    program.centreNames?.length > 0
      ? program.centreNames
      : getCentreNames(centres, program.centerIds)
  const stats = getProgramStats(linkedCourses)

  return (
    <Modal open={open} onClose={onClose} size="lg" title={`View ${program.name}`}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <header className="flex items-start justify-between gap-3 bg-gradient-to-r from-[#55ace7] via-[#5a7ba8] to-[#1a3a5c] px-5 py-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-sm">
              <LayoutGrid className="h-6 w-6 text-[#246392]" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 text-white">
              <h2 className="truncate text-lg font-bold sm:text-xl">{program.name}</h2>
              <p className="text-sm text-white/85">{program.programId || program.id}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="max-h-[min(70vh,560px)] space-y-6 overflow-y-auto p-5 sm:p-6">
          {loading ? (
            <div className="flex min-h-[200px] items-center justify-center gap-2 text-sm font-medium text-[#686868]">
              <Loader2 className="h-5 w-5 animate-spin text-[#246392]" />
              Loading program details…
            </div>
          ) : (
            <>
          <section className="space-y-4">
            <SectionTitle icon={LayoutGrid}>Program Details</SectionTitle>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailItem label="Program ID">{program.programId || program.id}</DetailItem>
              <DetailItem label="Program Name">{program.name}</DetailItem>
              <DetailItem label="Status">
                <CategoryStatusBadge status={program.status} />
              </DetailItem>
              <DetailItem label="Created On">
                {formatCategoryDateTime(program.createdAt)}
              </DetailItem>
              <DetailItem label="Modified On">
                {formatCategoryDateTime(program.updatedAt || program.modifiedAt)}
              </DetailItem>
            </dl>
          </section>

          <section className="space-y-3">
            <SectionTitle icon={Building2}>Centre Details</SectionTitle>
            {centreNames.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#e5e7eb] bg-[#fafafa] px-4 py-5 text-center text-sm text-[#686868]">
                No centres assigned
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {centreNames.map((name) => (
                  <li
                    key={name}
                    className="rounded-full bg-[#e8f4fc] px-3 py-1.5 text-sm font-semibold text-[#246392]"
                  >
                    {name}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-3">
            <SectionTitle icon={BookOpen}>Linked Courses</SectionTitle>
            {linkedCourses.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#e5e7eb] bg-[#fafafa] px-4 py-5 text-center text-sm text-[#686868]">
                No courses linked to this program
              </p>
            ) : (
              <div className="overflow-hidden rounded-xl border border-[#e5e7eb] bg-white">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#246392] text-xs font-semibold uppercase text-white">
                    <tr>
                      <th className="px-4 py-3">Course ID</th>
                      <th className="px-4 py-3">Course Name</th>
                      <th className="px-4 py-3">Exam Category</th>
                      <th className="px-4 py-3">Subcategory</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#f0f0f0] bg-white">
                    {linkedCourses.map((c) => (
                      <tr key={c.id} className="transition hover:bg-slate-50/90">
                        <td className="px-4 py-3 font-mono text-xs text-[#444]">{c.courseId}</td>
                        <td className="px-4 py-3 font-medium text-[#111]">{c.name}</td>
                        <td className="px-4 py-3 text-[#444]">{c.examCategory}</td>
                        <td className="px-4 py-3 text-[#444]">{c.examSubcategory}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section className="space-y-3">
            <SectionTitle icon={BarChart3}>Statistics</SectionTitle>
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="Courses Linked" value={stats.totalCourses} />
              <StatCard label="Subjects" value={stats.totalSubjects} />
              <StatCard label="Topics" value={stats.totalTopics} />
            </div>
          </section>
            </>
          )}
        </div>

        <footer className="border-t border-[#eef2fc] bg-[#fafafa] px-5 py-4 text-right sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-w-[120px] rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110"
          >
            Close
          </button>
        </footer>
      </div>
    </Modal>
  )
}
