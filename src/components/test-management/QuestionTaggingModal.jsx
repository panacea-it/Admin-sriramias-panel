import { useEffect, useMemo, useState } from 'react'
import { Tag } from 'lucide-react'
import { toast } from '@/utils/toast'
import Modal from '../ui/Modal'
import ModalPanelHeader from '../courses/ModalPanelHeader'
import BatchFormStickyFooter from '../courses/batch-form/BatchFormStickyFooter'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import QuestionFilterToolbar from './QuestionFilterToolbar'
import { StatusBadge } from '../academics/AcademicsUi'
import { fetchQuestions } from '../../api/questionBankAPI'
import { QUESTION_DIFFICULTIES, QUESTION_STATUSES, QUESTION_TYPES } from '../../data/testManagementSeed'

function uniqueSorted(values) {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b)))
}

export default function QuestionTaggingModal({ open, onClose, config, onSaveTags }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  const [selectedIds, setSelectedIds] = useState([])

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [subject, setSubject] = useState('all')
  const [topic, setTopic] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [type, setType] = useState('all')

  useEffect(() => {
    if (!open) return
    setSelectedIds(config?.taggedQuestionIds || [])
  }, [open, config])

  useEffect(() => {
    if (!open) return
    let active = true
    ;(async () => {
      setLoading(true)
      try {
        const list = await fetchQuestions({ search, status, subject, topic, difficulty, type })
        if (active) setRows(list || [])
      } catch (err) {
        toast.error(err?.message || 'Failed to load questions')
      } finally {
        if (active) setLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [open, search, status, subject, topic, difficulty, type])

  const subjects = useMemo(() => uniqueSorted(rows.map((r) => r.subject)), [rows])
  const topics = useMemo(() => uniqueSorted(rows.map((r) => r.topic)), [rows])

  const selection = {
    selectedIds,
    onToggle: (id) =>
      setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id])),
    onTogglePage: (pageIds, select) =>
      setSelectedIds((prev) => {
        const set = new Set(prev)
        for (const id of pageIds) {
          if (select) set.add(id)
          else set.delete(id)
        }
        return Array.from(set)
      }),
    getRowId: (row) => row.id,
  }

  const columns = [
    { key: 'id', label: 'Question ID', headerClassName: 'pl-6 sm:pl-10', cellClassName: 'pl-6 sm:pl-10' },
    { key: 'title', label: 'Question Title', render: (r) => <span className="font-medium">{r.title}</span> },
    { key: 'subject', label: 'Subject' },
    { key: 'topic', label: 'Topic' },
    { key: 'difficulty', label: 'Difficulty' },
    { key: 'type', label: 'Question Type' },
    { key: 'marks', label: 'Marks' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
  ]

  const close = () => onClose?.()

  const submit = async (e) => {
    e?.preventDefault?.()
    setSaving(true)
    try {
      await onSaveTags?.(selectedIds)
      toast.success('Questions tagged successfully')
      close()
    } catch (err) {
      toast.error(err?.message || 'Failed to save tags')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open={open} onClose={close} size="full" title="Tag Questions">
      <form
        onSubmit={submit}
        className="flex max-h-[min(92vh,920px)] flex-col overflow-hidden rounded-2xl bg-[#eef2f7] shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
      >
        <ModalPanelHeader title="Tag Questions" onBack={close} icon={Tag} />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="space-y-5">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="text-sm font-semibold text-[#1a3a5c]">
                Configuration: <span className="font-black">{config?.testName || '—'}</span>
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                Select questions to tag into this configuration (tagging only — no exam engine logic).
              </p>
            </div>

            <QuestionFilterToolbar
              search={search}
              onSearchChange={(e) => setSearch(e.target.value)}
              status={status}
              onStatusChange={(e) => setStatus(e.target.value)}
              subject={subject}
              onSubjectChange={(e) => setSubject(e.target.value)}
              topic={topic}
              onTopicChange={(e) => setTopic(e.target.value)}
              difficulty={difficulty}
              onDifficultyChange={(e) => setDifficulty(e.target.value)}
              type={type}
              onTypeChange={(e) => setType(e.target.value)}
              subjects={subjects}
              topics={topics}
              difficultyOptions={[{ value: 'all', label: 'Difficulty' }, ...QUESTION_DIFFICULTIES.map((d) => ({ value: d, label: d }))]}
              typeOptions={[{ value: 'all', label: 'Question Type' }, ...QUESTION_TYPES.map((t) => ({ value: t, label: t }))]}
              statusOptions={[{ value: 'all', label: 'Status' }, ...QUESTION_STATUSES.map((s) => ({ value: s, label: s }))]}
            />

            <PaginatedFigmaTable
              columns={columns}
              data={rows}
              loading={loading}
              emptyMessage="No questions found."
              itemLabel="questions"
              resetDeps={[search, status, subject, topic, difficulty, type]}
              rowClassName="hover:bg-slate-50/90"
              selection={selection}
              stickyHeader
            />
          </div>
        </div>

        <BatchFormStickyFooter
          isEditMode
          saving={saving}
          onReset={() => setSelectedIds(config?.taggedQuestionIds || [])}
          createLabel="Save Tags"
          updateLabel="Save Tags"
        />
      </form>
    </Modal>
  )
}

