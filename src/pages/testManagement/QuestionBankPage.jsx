import { useCallback, useMemo, useState } from 'react'
import { FileQuestion, RefreshCw, UploadCloud } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import { BannerButton } from '../../components/academics/AcademicsUi'
import QuestionFormModal from '../../components/test-management/QuestionFormModal'
import QuestionBankStatsCards from '../../components/questionBank/QuestionBankStatsCards'
import QuestionBankFilters from '../../components/questionBank/QuestionBankFilters'
import QuestionBankTable from '../../components/questionBank/QuestionBankTable'
import QuestionDetailDrawer from '../../components/questionBank/QuestionDetailDrawer'
import DeleteQuestionDialog from '../../components/questionBank/DeleteQuestionDialog'
import BulkImportWizard from '../../components/questionBank/BulkImportWizard'
import { useQuestionBankManagement } from '../../hooks/useQuestionBankManagement'
import { useEditModal } from '../../hooks/useEditModal'
import {
  useCreateQuestion,
  useDeleteQuestion,
  useDuplicateQuestion,
  useQuestion,
  useUpdateQuestion,
  useUpdateQuestionStatus,
} from '../../hooks/questionBank'
import {
  getQuestionBankErrorMessage,
  mapApiValidationErrors,
  nextQuestionStatus,
} from '../../utils/questionBankApiHelpers'
import { questionRowToForm as legacyRowToForm } from '../../utils/testManagementQuestionForm'
import { getApiErrorMessage } from '../../utils/apiError'

export default function QuestionBankPage() {
  const modal = useEditModal()
  const management = useQuestionBankManagement()

  const createMutation = useCreateQuestion()
  const updateMutation = useUpdateQuestion()
  const deleteMutation = useDeleteQuestion()
  const statusMutation = useUpdateQuestionStatus()
  const duplicateMutation = useDuplicateQuestion()

  const [viewId, setViewId] = useState(null)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [originalForm, setOriginalForm] = useState(null)

  const { data: viewQuestion, isLoading: viewLoading } = useQuestion(viewId, {
    enabled: Boolean(viewId),
  })

  const hasActiveFilters = useMemo(
    () =>
      Boolean(
        management.search.trim() ||
          management.type !== 'all' ||
          management.category !== 'all' ||
          management.subject !== 'all' ||
          management.topic !== 'all' ||
          management.difficulty !== 'all' ||
          management.tag !== 'all' ||
          management.status !== 'all',
      ),
    [management],
  )

  const emptyMessage = hasActiveFilters ? 'No questions match your filters.' : 'No questions found.'

  const openCreate = useCallback(() => {
    setOriginalForm(null)
    modal.openCreate()
  }, [modal])

  const openEdit = useCallback(
    (row) => {
      const form = legacyRowToForm(row)
      setOriginalForm(form)
      modal.openEdit(row)
    },
    [modal],
  )

  const openView = useCallback((row) => {
    setViewId(row.id)
  }, [])

  const handleDuplicate = useCallback(
    async (row) => {
      try {
        const prefill = await duplicateMutation.mutateAsync(row.id)
        setOriginalForm(null)
        modal.openDuplicate(prefill || { ...row, id: '' })
      } catch (err) {
        toast.error(getQuestionBankErrorMessage(err, 'Failed to duplicate question'))
      }
    },
    [duplicateMutation, modal],
  )

  const handleToggleStatus = useCallback(
    async (row) => {
      const nextStatus = nextQuestionStatus(row.status)
      try {
        await statusMutation.mutateAsync({ id: row.id, status: nextStatus })
        toast.success(`Status updated to ${nextStatus}`)
      } catch (err) {
        toast.error(getQuestionBankErrorMessage(err, 'Failed to update status'))
      }
    },
    [statusMutation],
  )

  const handleDelete = useCallback(async () => {
    if (!deleteTarget?.id) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Question permanently deleted')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(getQuestionBankErrorMessage(err, 'Failed to delete question'))
    }
  }, [deleteMutation, deleteTarget])

  const handleSave = useCallback(
    async (form, { isEdit, id }) => {
      try {
        if (isEdit && id) {
          await updateMutation.mutateAsync({
            id,
            original: originalForm || legacyRowToForm(modal.selectedItem),
            current: form,
          })
        } else {
          await createMutation.mutateAsync(form)
        }
        setOriginalForm(null)
      } catch (err) {
        if (err?.code === 'NO_CHANGES') {
          toast.message('No changes to save')
          return
        }
        const fieldErrors = mapApiValidationErrors(err)
        const message = getApiErrorMessage(err, 'Failed to save question')
        throw Object.assign(new Error(message), { fieldErrors })
      }
    },
    [createMutation, updateMutation, originalForm, modal],
  )

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
            Bulk Import
          </button>
          <button
            type="button"
            onClick={() => management.refreshQuestions()}
            disabled={management.isFetching}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-white/90 px-4 text-sm font-semibold text-[#1a3a5c] shadow-sm disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${management.isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <BannerButton onClick={openCreate}>Add Question</BannerButton>
        </div>
      </PageBanner>

      <QuestionBankStatsCards analytics={management.analytics} loading={management.tableLoading} />

      <div className="w-full space-y-5">
        <QuestionBankFilters
          search={management.search}
          onSearchChange={(e) => management.setSearch(e.target.value)}
          type={management.type}
          onTypeChange={(e) => management.setType(e.target.value)}
          category={management.category}
          onCategoryChange={(e) => management.setCategory(e.target.value)}
          subject={management.subject}
          onSubjectChange={(e) => {
            management.setSubject(e.target.value)
            management.setTopic('all')
          }}
          topic={management.topic}
          onTopicChange={(e) => management.setTopic(e.target.value)}
          difficulty={management.difficulty}
          onDifficultyChange={(e) => management.setDifficulty(e.target.value)}
          tag={management.tag}
          onTagChange={(e) => management.setTag(e.target.value)}
          status={management.status}
          onStatusChange={(e) => management.setStatus(e.target.value)}
          sortPreset={management.sortPreset}
          onSortPresetChange={(e) => management.setSortPreset(e.target.value)}
          filterOptions={management.filterOptions}
          disabled={management.tableLoading && management.rows.length === 0}
        />

        <div className="w-full overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
          <QuestionBankTable
            rows={management.rows}
            loading={management.tableLoading}
            controlledPagination={management.controlledPagination}
            emptyMessage={emptyMessage}
            onView={openView}
            onEdit={openEdit}
            onDuplicate={handleDuplicate}
            onToggleStatus={handleToggleStatus}
            onDelete={setDeleteTarget}
          />
        </div>
      </div>

      <QuestionFormModal
        open={modal.isOpen}
        onClose={() => {
          modal.close()
          setOriginalForm(null)
        }}
        item={modal.selectedItem}
        duplicateSource={modal.duplicateSource}
        onSubmit={handleSave}
        lockTypeOnEdit
      />

      <QuestionDetailDrawer
        open={Boolean(viewId)}
        onClose={() => setViewId(null)}
        question={viewQuestion}
        loading={viewLoading}
      />

      <DeleteQuestionDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        question={deleteTarget}
        onConfirm={handleDelete}
        deleting={deleteMutation.isPending}
      />

      <BulkImportWizard
        open={bulkOpen}
        onClose={() => setBulkOpen(false)}
        onImported={() => management.refreshQuestions()}
      />
    </div>
  )
}
