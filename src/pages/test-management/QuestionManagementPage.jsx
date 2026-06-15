import { useCallback, useEffect, useMemo, useState } from 'react'
import { FileQuestion, UploadCloud } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import { BannerButton } from '../../components/academics/AcademicsUi'
import StatCard from '../../components/dashboard/StatCard'
import QuestionFormModal from '../../components/test-management/QuestionFormModal'
import QuestionPreviewModal from '../../components/test-management/QuestionPreviewModal'
import QuestionBulkUploadModal from '../../components/test-management/QuestionBulkUploadModal'
import QuestionFilterToolbar from '../../components/test-management/QuestionFilterToolbar'
import QuestionBankTable from '../../components/test-management/QuestionBankTable'
import { deleteQuestion, fetchQuestions, upsertQuestion } from '../../api/testManagementAPI'
import {
  QUESTION_BANK_TYPES,
  QUESTION_DIFFICULTIES,
  QUESTION_STATUSES,
  QUESTION_TAG_SUGGESTIONS,
} from '../../data/testManagementSeed'
import ConfirmDeleteDialog from '../../components/subjects/ConfirmDeleteDialog'
import { nextQuestionStatus, getQuestionPreviewText } from '../../utils/testManagementQuestionForm'
import { useEditModal } from '../../hooks/useEditModal'

export default function QuestionManagementPage() {
  const modal = useEditModal()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [subject, setSubject] = useState('all')
  const [topic, setTopic] = useState('all')
  const [difficulty, setDifficulty] = useState('all')
  const [tag, setTag] = useState('all')
  const [status, setStatus] = useState('all')

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewQuestion, setPreviewQuestion] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteRow, setDeleteRow] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const reload = async () => {
    setLoading(true)
    try {
      const list = await fetchQuestions({ type, subject, topic, difficulty, tags: tag, status })
      setRows(list || [])
    } catch (err) {
      toast.error(err?.message || 'Failed to load questions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, subject, topic, difficulty, tag, status])

  const displayRows = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return rows

    return rows.filter((row) => {
      const id = String(row.id || '').toLowerCase()
      const subjectText = String(row.subject || '').toLowerCase()
      const preview = getQuestionPreviewText(row).toLowerCase()
      return id.includes(query) || subjectText.includes(query) || preview.includes(query)
    })
  }, [rows, search])

  const subjects = useMemo(
    () => Array.from(new Set(rows.map((r) => r.subject).filter(Boolean))).sort(),
    [rows],
  )
  const topics = useMemo(
    () => Array.from(new Set(rows.map((r) => r.topic).filter(Boolean))).sort(),
    [rows],
  )

  const difficultyCounts = useMemo(() => {
    const counts = { Easy: 0, Medium: 0, Hard: 0 }
    rows.forEach((r) => {
      if (r.difficulty && counts[r.difficulty] != null) counts[r.difficulty] += 1
    })
    return counts
  }, [rows])

  const filterResetDeps = useMemo(
    () => [search, type, subject, topic, difficulty, tag, status],
    [search, type, subject, topic, difficulty, tag, status],
  )

  const handleSave = async (form, { isEdit, id }) => {
    const saved = await upsertQuestion({ ...form }, { isEdit, id })
    setRows((prev) => {
      const next = Array.isArray(prev) ? [...prev] : []
      if (isEdit) {
        const idx = next.findIndex((q) => String(q.id) === String(id))
        if (idx >= 0) next[idx] = { ...next[idx], ...saved }
        return next
      }
      return [saved, ...next]
    })
  }

  const handleDelete = async (id) => {
    setDeleting(true)
    try {
      await deleteQuestion(id)
      setRows((prev) => prev.filter((r) => String(r.id) !== String(id)))
      toast.success('Question deleted')
      setDeleteOpen(false)
      setDeleteRow(null)
    } finally {
      setDeleting(false)
    }
  }

  const toggleStatus = useCallback(async (row) => {
    const nextStatus = nextQuestionStatus(row.status)
    const saved = await upsertQuestion({ ...row, status: nextStatus }, { isEdit: true, id: row.id })
    setRows((prev) => prev.map((r) => (String(r.id) === String(row.id) ? { ...r, ...saved } : r)))
    toast.success(`Status updated to ${nextStatus}`)
  }, [])

  const openPreview = useCallback((row) => {
    setPreviewQuestion(row)
    setPreviewOpen(true)
  }, [])

  const handleEdit = useCallback((row) => modal.openEdit(row), [modal])
  const handleDuplicate = useCallback((row) => modal.openDuplicate(row), [modal])
  const handleDeleteRequest = useCallback((row) => {
    setDeleteRow(row)
    setDeleteOpen(true)
  }, [])

  const hasActiveFilters = Boolean(
    search.trim() ||
      type !== 'all' ||
      subject !== 'all' ||
      topic !== 'all' ||
      difficulty !== 'all' ||
      tag !== 'all' ||
      status !== 'all',
  )

  const emptyMessage = hasActiveFilters
    ? 'No questions match your filters.'
    : 'No questions found.'

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageBanner
        icon={FileQuestion}
        title="Question Bank"
        className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
      >
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setBulkOpen(true)}
            className="inline-flex h-10 min-h-[38px] items-center justify-center gap-2 rounded-lg bg-white/90 px-4 text-sm font-semibold text-[#1a3a5c] shadow-[0_4px_10px_rgba(0,0,0,0.12)] transition hover:bg-white sm:text-base"
          >
            <UploadCloud className="h-4 w-4" strokeWidth={2.2} />
            Bulk Upload
          </button>
          <BannerButton onClick={modal.openCreate}>Add Question</BannerButton>
        </div>
      </PageBanner>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          title="Total Questions"
          value={rows.length}
          color="#246392"
          graphColor="#55ace7"
          icon={FileQuestion}
        />
        <StatCard
          title="Easy"
          value={difficultyCounts.Easy}
          color="#16a34a"
          graphColor="#16a34a"
          icon={FileQuestion}
        />
        <StatCard
          title="Medium/Hard"
          value={difficultyCounts.Medium + difficultyCounts.Hard}
          color="#f59e0b"
          graphColor="#f59e0b"
          icon={FileQuestion}
        />
      </div>

      <div className="w-full space-y-5">
        <QuestionFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          searchPlaceholder="Search by Question ID, Subject, or Question Preview..."
          type={type}
          onTypeChange={(e) => setType(e.target.value)}
          subject={subject}
          onSubjectChange={(e) => setSubject(e.target.value)}
          topic={topic}
          onTopicChange={(e) => setTopic(e.target.value)}
          difficulty={difficulty}
          onDifficultyChange={(e) => setDifficulty(e.target.value)}
          tag={tag}
          onTagChange={(e) => setTag(e.target.value)}
          status={status}
          onStatusChange={(e) => setStatus(e.target.value)}
          disabled={loading && rows.length === 0}
          typeOptions={[{ value: 'all', label: 'Type' }, ...QUESTION_BANK_TYPES.map((t) => ({ value: t, label: t }))]}
          subjects={subjects}
          topics={topics}
          difficultyOptions={[
            { value: 'all', label: 'Difficulty' },
            ...QUESTION_DIFFICULTIES.map((d) => ({ value: d, label: d })),
          ]}
          tagOptions={[
            { value: 'all', label: 'Tags' },
            ...QUESTION_TAG_SUGGESTIONS.map((t) => ({ value: t, label: t })),
          ]}
          statusOptions={[
            { value: 'all', label: 'Status' },
            ...QUESTION_STATUSES.map((s) => ({ value: s, label: s })),
          ]}
        />

        <div className="w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <QuestionBankTable
            rows={displayRows}
            loading={loading}
            resetDeps={filterResetDeps}
            emptyMessage={emptyMessage}
            onView={openPreview}
            onEdit={handleEdit}
            onDuplicate={handleDuplicate}
            onToggleStatus={toggleStatus}
            onDelete={handleDeleteRequest}
          />
        </div>
      </div>

      <QuestionFormModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        duplicateSource={modal.duplicateSource}
        onSubmit={handleSave}
      />

      <QuestionPreviewModal
        open={previewOpen}
        onClose={() => {
          setPreviewOpen(false)
          setPreviewQuestion(null)
        }}
        question={previewQuestion}
      />

      <QuestionBulkUploadModal open={bulkOpen} onClose={() => setBulkOpen(false)} onUploaded={() => reload()} />

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Delete question?"
        message={
          deleteRow
            ? `This will permanently delete ${deleteRow.id}. This action cannot be undone.`
            : 'This will permanently delete the question. This action cannot be undone.'
        }
        onCancel={() => {
          if (!deleting) {
            setDeleteOpen(false)
            setDeleteRow(null)
          }
        }}
        onConfirm={() => handleDelete(deleteRow?.id)}
        loading={deleting}
        confirmLabel="Delete"
      />
    </div>
  )
}
