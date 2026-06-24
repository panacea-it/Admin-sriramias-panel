import { useCallback, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Monitor } from 'lucide-react'
import { toast } from '@/utils/toast'
import TestManagementPageShell from '../../../components/test-management/TestManagementPageShell'
import AdminDataPanel from '../../../components/admin/AdminDataPanel'
import CbtTestsFilterToolbar from '../../../components/test-management/cbt-tests/CbtTestsFilterToolbar'
import CbtTestsDataTable from '../../../components/test-management/cbt-tests/CbtTestsDataTable'
import CbtTestStatusBadge from '../../../components/test-management/cbt-tests/CbtTestStatusBadge'
import {
  CbtTestTableActions,
  createCbtTestActionsColumn,
} from '../../../components/test-management/cbt-tests/CbtTestTableActions'
import ConfirmCbtTestDeleteModal from '../../../components/test-management/cbt-tests/ConfirmCbtTestDeleteModal'
import { BannerButton } from '../../../components/academics/AcademicsUi'
import { TEST_MANAGEMENT_ROUTES } from '../../../constants/testManagementNav'
import { useCbtTestsManagement } from '../../../hooks/useCbtTestsManagement'
import { useDeleteCBTTest } from '../../../hooks/useDeleteCBTTest'
import { useDuplicateCBTTest, usePublishCBTTest } from '../../../hooks/usePublishCBTTest'
import { handleCbtApiError } from '../../../utils/cbtApiError'
import { formatCbtScheduleDisplay } from '../../../utils/cbtTestFormHelpers'
import { formatBookstoreDate, formatCategoryDateTime } from '../../../utils/formatDateTime'

function LanguageBadges({ languages }) {
  if (!languages?.length) return '—'
  return (
    <div className="flex flex-wrap gap-1">
      {languages.map((lang) => (
        <span
          key={lang}
          className="rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold uppercase text-sky-800 ring-1 ring-sky-500/20"
        >
          {lang}
        </span>
      ))}
    </div>
  )
}

export default function CbtTestsListPage() {
  const navigate = useNavigate()
  const {
    rows,
    tableLoading,
    error,
    search,
    setSearch,
    facultySubjectId,
    setFacultySubjectId,
    folderId,
    setFolderId,
    batchId,
    setBatchId,
    language,
    setLanguage,
    publishStatus,
    setPublishStatus,
    scheduleDateFrom,
    setScheduleDateFrom,
    scheduleDateTo,
    setScheduleDateTo,
    sortPreset,
    setSortPreset,
    controlledPagination,
    refreshTests,
  } = useCbtTestsManagement()

  const deleteMutation = useDeleteCBTTest()
  const publishMutation = usePublishCBTTest()
  const duplicateMutation = useDuplicateCBTTest()

  const [deleteTarget, setDeleteTarget] = useState(null)

  const handlePublish = useCallback(
    async (row, nextStatus) => {
      try {
        const result = await publishMutation.mutateAsync({
          id: row.id,
          publishStatus: nextStatus,
        })
        toast.success(result?.message || `Status set to ${nextStatus}`)
        await refreshTests()
      } catch (err) {
        toast.error(handleCbtApiError(err))
      }
    },
    [publishMutation, refreshTests],
  )

  const handleDuplicate = useCallback(
    async (row) => {
      try {
        const result = await duplicateMutation.mutateAsync({ id: row.id })
        toast.success(result?.message || 'Test duplicated as draft')
        await refreshTests()
      } catch (err) {
        toast.error(handleCbtApiError(err))
      }
    },
    [duplicateMutation, refreshTests],
  )

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      const result = await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success(result?.message || 'CBT test deleted')
      setDeleteTarget(null)
      await refreshTests()
    } catch (err) {
      toast.error(handleCbtApiError(err))
    }
  }, [deleteTarget, deleteMutation, refreshTests])

  const columns = useMemo(
    () => [
      {
        key: 'prelimsTestId',
        label: 'Test ID',
        width: 100,
        render: (row) => (
          <span className="font-mono text-xs font-bold text-[#1a3a5c]">{row.prelimsTestId || '—'}</span>
        ),
      },
      {
        key: 'testName',
        label: 'Test Name',
        headerClassName: 'min-w-[160px]',
        cellClassName: 'min-w-[160px]',
        render: (row) => (
          <span className="block max-w-[220px] truncate font-semibold" title={row.testName}>
            {row.testName}
          </span>
        ),
      },
      { key: 'folderName', label: 'Topic', render: (row) => row.folderName || '—' },
      {
        key: 'facultySubjectName',
        label: 'Faculty Subject',
        render: (row) => row.facultySubjectName || '—',
      },
      {
        key: 'batchNamesLabel',
        label: 'Batches',
        render: (row) => (
          <span className="block max-w-[140px] truncate" title={row.batchNamesLabel}>
            {row.batchNamesLabel || '—'}
          </span>
        ),
      },
      {
        key: 'languages',
        label: 'Languages',
        render: (row) => <LanguageBadges languages={row.languages} />,
      },
      {
        key: 'totalQuestions',
        label: 'Questions',
        align: 'center',
        render: (row) => row.totalQuestions ?? 0,
      },
      {
        key: 'durationLabel',
        label: 'Duration',
        render: (row) => row.durationLabel || '—',
      },
      {
        key: 'schedule',
        label: 'Schedule',
        render: (row) => formatCbtScheduleDisplay(row.scheduleDate, row.scheduleTime),
      },
      {
        key: 'resultDate',
        label: 'Result Date',
        render: (row) => formatBookstoreDate(row.resultDate),
      },
      {
        key: 'publishStatus',
        label: 'Status',
        align: 'center',
        render: (row) => <CbtTestStatusBadge status={row.publishStatus} />,
      },
      {
        key: 'updatedAt',
        label: 'Updated',
        render: (row) => formatCategoryDateTime(row.updatedAt),
      },
      createCbtTestActionsColumn((row) => (
        <CbtTestTableActions
          row={row}
          onView={() => navigate(TEST_MANAGEMENT_ROUTES.cbtTestsView(row.id))}
          onEdit={() => navigate(TEST_MANAGEMENT_ROUTES.cbtTestsEdit(row.id))}
          onManageQuestions={() => navigate(TEST_MANAGEMENT_ROUTES.cbtTestQuestions(row.id))}
          onPublish={() => handlePublish(row, 'PUBLISHED')}
          onUnpublish={() => handlePublish(row, 'UNPUBLISHED')}
          onDuplicate={() => handleDuplicate(row)}
          onDelete={() => setDeleteTarget(row)}
        />
      )),
    ],
    [navigate, handlePublish, handleDuplicate],
  )

  return (
    <TestManagementPageShell
      icon={Monitor}
      title="CBT Tests"
      actions={
        <Link to={TEST_MANAGEMENT_ROUTES.cbtTestsCreate}>
          <BannerButton type="button" showPlusIcon>
            Create CBT Test
          </BannerButton>
        </Link>
      }
    >
      <AdminDataPanel>
        <CbtTestsFilterToolbar
          search={search}
          onSearchChange={setSearch}
          facultySubjectId={facultySubjectId}
          onFacultySubjectChange={setFacultySubjectId}
          folderId={folderId}
          onFolderChange={setFolderId}
          batchId={batchId}
          onBatchChange={setBatchId}
          language={language}
          onLanguageChange={setLanguage}
          publishStatus={publishStatus}
          onPublishStatusChange={setPublishStatus}
          scheduleDateFrom={scheduleDateFrom}
          onScheduleDateFromChange={setScheduleDateFrom}
          scheduleDateTo={scheduleDateTo}
          onScheduleDateToChange={setScheduleDateTo}
          sortPreset={sortPreset}
          onSortPresetChange={setSortPreset}
          disabled={tableLoading && rows.length === 0}
        />

        {error ? (
          <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
            {handleCbtApiError(error)}
          </div>
        ) : (
          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            <CbtTestsDataTable
              columns={columns}
              data={rows}
              loading={tableLoading}
              emptyMessage="No CBT tests found."
              controlledPagination={controlledPagination}
              resetDeps={[
                search,
                facultySubjectId,
                folderId,
                batchId,
                language,
                publishStatus,
                scheduleDateFrom,
                scheduleDateTo,
                sortPreset,
              ]}
            />
          </div>
        )}
      </AdminDataPanel>

      <ConfirmCbtTestDeleteModal
        open={Boolean(deleteTarget)}
        testName={deleteTarget?.testName}
        loading={deleteMutation.isPending}
        onConfirm={confirmDelete}
        onClose={() => setDeleteTarget(null)}
      />
    </TestManagementPageShell>
  )
}
