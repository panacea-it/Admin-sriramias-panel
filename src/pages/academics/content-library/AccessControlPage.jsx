import { useState } from 'react'
import { Lock, Plus, Trash2 } from 'lucide-react'
import { toast } from '@/utils/toast'
import { useContentLibrary } from '../../../contexts/ContentLibraryContext'
import ContentEntityModal from '../../../components/content-library/ContentEntityModal'
import { generateId, upsertAccessRule, deleteAccessRule } from '../../../api/contentLibraryAPI'
import { ACCESS_SCOPES } from '../../../utils/contentLibraryTypes'

export default function AccessControlPage() {
  const { accessRules, items, refresh } = useContentLibrary()
  const [open, setOpen] = useState(false)
  const [edit, setEdit] = useState(null)

  const save = (form) => {
    upsertAccessRule({
      id: edit?.id || generateId('rule'),
      name: form.name,
      scope: form.scope,
      targetIds: form.targetIds ? form.targetIds.split(',').map((s) => s.trim()) : [],
      membership: form.membership,
      locked: form.locked === 'true' || form.locked === true,
      dateStart: form.dateStart,
      dateEnd: form.dateEnd,
      contentIds: form.contentIds ? form.contentIds.split(',').map((s) => s.trim()) : [],
      status: 'Active',
    })
    toast.success('Access rule saved')
    refresh()
  }

  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 text-sm text-slate-600">
        <Lock className="mt-0.5 h-4 w-4 shrink-0 text-[#55ace7]" />
        Control batch, course, student, membership, premium, trial, date-limited, and locked content.
      </p>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => { setEdit(null); setOpen(true) }}
          className="inline-flex items-center gap-2 rounded-lg bg-[#1a3a5c] px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" /> Add rule
        </button>
      </div>
      <div className="space-y-3">
        {accessRules.map((rule) => (
          <article key={rule.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-[#1a3a5c]">{rule.name}</h3>
                <p className="mt-1 text-sm text-slate-500">
                  Scope: {rule.scope} · Membership: {rule.membership || 'any'}
                  {rule.locked && ' · Locked'}
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  {rule.contentIds?.length || 0} content item(s) · Targets: {rule.targetIds?.join(', ') || '—'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  deleteAccessRule(rule.id)
                  toast.success('Rule deleted')
                  refresh()
                }}
                className="text-[#c96565]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
      <ContentEntityModal
        open={open}
        onClose={() => setOpen(false)}
        title="Access rule"
        initial={edit}
        fields={[
          { name: 'name', label: 'Rule name', required: true },
          {
            name: 'scope',
            label: 'Scope',
            type: 'select',
            options: ACCESS_SCOPES.map((s) => ({ value: s, label: s })),
          },
          { name: 'targetIds', label: 'Target IDs (comma-separated)' },
          { name: 'membership', label: 'Membership (paid / trial / premium)' },
          { name: 'contentIds', label: 'Content IDs (comma-separated)' },
          { name: 'dateStart', label: 'Start date', type: 'date' },
          { name: 'dateEnd', label: 'End date', type: 'date' },
          {
            name: 'locked',
            label: 'Locked',
            type: 'select',
            options: [
              { value: 'false', label: 'No' },
              { value: 'true', label: 'Yes' },
            ],
          },
        ]}
        onSubmit={save}
      />
      <p className="text-xs text-slate-400">{items.length} content items available for assignment</p>
    </div>
  )
}
