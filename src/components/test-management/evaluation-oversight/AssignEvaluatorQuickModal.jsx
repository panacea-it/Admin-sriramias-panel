import { useEffect, useState } from 'react'
import { ClipboardCheck, UserPlus } from 'lucide-react'
import Modal from '../../ui/Modal'
import ModalPanelHeader from '../../courses/ModalPanelHeader'
import SearchableSelect from '../../categories/SearchableSelect'
import { CourseFormField } from '../../courses/CourseFormField'
import { assignEvaluator, fetchMentorsForSubject } from '../../../api/evaluationOversightAPI'
import { toast } from '../../../utils/toast'

export default function AssignEvaluatorQuickModal({ open, onClose, paper, onAssigned }) {
  const [mentorId, setMentorId] = useState('')
  const [mentors, setMentors] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open || !paper?.subjectId) return
    setMentorId('')
    setLoading(true)
    fetchMentorsForSubject(paper.subjectId, { excludeId: paper.mentorId })
      .then((list) => {
        setMentors(
          list.map((m) => ({
            value: m.id,
            label: `${m.name}${m.available ? '' : ' (Unavailable)'} · ${m.pendingCount} pending`,
          })),
        )
        const first = list.find((m) => m.available) || list[0]
        if (first) setMentorId(first.id)
      })
      .finally(() => setLoading(false))
  }, [open, paper?.subjectId, paper?.mentorId])

  const handleClose = () => {
    if (!saving) onClose?.()
  }

  const handleAssign = async () => {
    if (!paper?.id || !mentorId) {
      toast.error('Select a mentor')
      return
    }
    setSaving(true)
    try {
      const updated = await assignEvaluator(paper.id, mentorId)
      toast.success(`Assigned to ${updated.mentorName}`)
      onAssigned?.(updated)
      onClose?.()
    } catch (err) {
      toast.error(err?.message || 'Assignment failed')
    } finally {
      setSaving(false)
    }
  }

  if (!paper) return null

  return (
    <Modal open={open} onClose={handleClose} size="md" title="Assign Evaluator" showCloseButton={false}>
      <div className="flex max-h-[min(90vh,640px)] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] ring-1 ring-slate-200/80">
        <ModalPanelHeader
          icon={ClipboardCheck}
          iconClassName="text-[#246392]"
          title="Assign Evaluator"
          subtitle={paper.studentName}
          onClose={handleClose}
          closeVariant="icon"
          plainCloseIcon
        />

        <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <div className="rounded-xl border border-slate-100 bg-[#eef6fc]/50 p-4 sm:p-5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#55ace7]">Student</p>
            <p className="mt-1 text-lg font-bold text-[#1a3a5c]">{paper.studentName}</p>
            <dl className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Subject</dt>
                <dd className="mt-1 text-sm font-medium text-[#333]">{paper.subjectName}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Current mentor
                </dt>
                <dd className="mt-1 text-sm font-medium text-[#333]">
                  {paper.mentorName ? (
                    paper.mentorName
                  ) : (
                    <span className="italic text-slate-500">Unassigned</span>
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-6">
            <CourseFormField label="Available mentors">
              <SearchableSelect
                options={mentors}
                value={mentorId}
                onChange={setMentorId}
                disabled={loading || !mentors.length || saving}
                loading={loading}
                placeholder={loading ? 'Loading…' : 'Select mentor'}
              />
            </CourseFormField>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-[#fafbfc] px-6 py-4 sm:flex-row sm:justify-end sm:px-8">
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="inline-flex h-11 min-w-[120px] items-center justify-center rounded-xl border border-slate-200 bg-white px-6 text-sm font-semibold text-[#686868] shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !mentorId}
            onClick={handleAssign}
            className="inline-flex h-11 min-w-[120px] items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#0d3b66] to-[#05192d] px-6 text-sm font-bold text-white shadow-sm transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            {saving ? 'Assigning…' : 'Assign'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
