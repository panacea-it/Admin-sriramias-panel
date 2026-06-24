import { LayoutGrid, Building2, Loader2 } from 'lucide-react'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import CategoryStatusBadge from './CategoryStatusBadge'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { useCenters } from '../../contexts/CentersContext'
import { getCentreNames } from '../../utils/programHelpers'

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

  void linkedCourses

  const centreNames =
    program.centreNames?.length > 0
      ? program.centreNames
      : getCentreNames(centres, program.centerIds)

  return (
    <Modal open={open} onClose={onClose} size="lg" title={`View ${program.name}`} showCloseButton={false}>
      <div className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.22)]">
        <ModalPanelHeader
          title={program.name}
          subtitle={program.programId || program.id}
          onClose={onClose}
          icon={LayoutGrid}
          iconClassName="text-[#246392]"
          closeVariant="icon"
          plainCloseIcon
        />

        <div className="space-y-5 p-5 sm:space-y-6 sm:p-6">
          {loading ? (
            <div className="flex min-h-[160px] items-center justify-center gap-2 text-sm font-medium text-[#686868]">
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
                  <DetailItem label="Linked Courses">{program.linkedCount ?? 0}</DetailItem>
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
            </>
          )}
        </div>

        <footer className="border-t border-[#eef2fc] bg-[#fafafa] px-5 py-4 text-right sm:px-6">
          <button
            type="button"
            onClick={onClose}
            className="min-w-[120px] rounded-full bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-6 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#55ace7]/50 focus-visible:ring-offset-2"
          >
            Close
          </button>
        </footer>
      </div>
    </Modal>
  )
}
