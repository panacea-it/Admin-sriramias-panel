import { useEffect, useState } from 'react'
import { UserPlus } from 'lucide-react'
import Modal from '../../ui/Modal'
import SearchableSelect from '../../categories/SearchableSelect'
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
    <Modal open={open} onClose={onClose} size="md" title="Assign Evaluator">
      <div className="space-y-4 p-1">
        <div className="rounded-xl bg-[#eef2fc] p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-[#55ace7]">Student</p>
          <p className="mt-1 text-base font-bold text-[#1a3a5c]">{paper.studentName}</p>
          <p className="mt-2 text-sm text-slate-600">
            <span className="font-semibold">Subject:</span> {paper.subjectName}
          </p>
          <p className="text-sm text-slate-600">
            <span className="font-semibold">Current mentor:</span>{' '}
            {paper.mentorName ? (
              paper.mentorName
            ) : (
              <span className="italic text-slate-500">Unassigned</span>
            )}
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-slate-600">Available mentors</label>
          <SearchableSelect
            options={mentors}
            value={mentorId}
            onChange={setMentorId}
            disabled={loading || !mentors.length}
            placeholder={loading ? 'Loading…' : 'Select mentor'}
            triggerClassName="flex h-11 w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 text-left text-sm font-medium"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving || !mentorId}
            onClick={handleAssign}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#55ace7] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[#4699d4] disabled:opacity-60"
          >
            <UserPlus className="h-4 w-4" />
            Assign
          </button>
        </div>
      </div>
    </Modal>
  )
}
