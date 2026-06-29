import { useCallback, useMemo, useState } from 'react'
import { Copy, Eye, Pencil, Upload } from 'lucide-react'
import AdminDataPanel from '../../../../../components/admin/AdminDataPanel'
import TestConfigDataTable from '../../../../../components/test-configuration/TestConfigDataTable'
import ConfigFilterToolbar, { FilterSelect } from '../../../../../components/test-configuration/ConfigFilterToolbar'
import TableActionMenu from '../../../../../components/common/TableActionMenu'
import ConfirmDeleteDialog from '../../../../../components/subjects/ConfirmDeleteDialog'
import ErrorState from '../../../../../components/feedback/ErrorState'
import { createActionsColumn } from '../../../../../utils/tableColumnHelpers'
import { formatPublishStatusLabel } from '../../../../../utils/facultySubjectChildApiHelpers'
import { PRELIMS_PUBLISH_STATUS_OPTIONS, canPublishPrelimsTest } from '../../../../../utils/prelimsTestApiHelpers'
import { mapChildModuleFormErrors } from '../../../../../utils/facultySubjectChildApiHelpers'
import { getApiErrorMessage } from '../../../../../utils/apiError'
import { toast } from '../../../../../utils/toast'
import {
  useCreatePrelimsTest,
  useDeletePrelimsTest,
  useDuplicatePrelimsTest,
  usePrelimsTest,
  usePrelimsTestDashboard,
  usePrelimsTests,
  useUpdatePrelimsTestPublishStatus,
} from '../../../../../hooks/useSubjectPrelimsTests'
import {
  buildControlledPagination,
  useFacultySubjectChildListState,
} from '../../../../../hooks/useFacultySubjectChildListState'
import {
  FacultySubjectChildDashboard,
  FacultySubjectChildEmptyState,
  FacultySubjectChildTabHeader,
} from '../FacultySubjectChildTabUi'
import PrelimsTestFormModal from './PrelimsTestFormModal'
import PublishStatusConfirmModal from './PublishStatusConfirmModal'

function PublishBadge({ status }) {
  const label = formatPublishStatusLabel(status)
  const tone =
    status === 'PUBLISHED'
      ? 'bg-emerald-100 text-emerald-800'
      : status === 'UNPUBLISHED'
        ? 'bg-amber-100 text-amber-800'
        : 'bg-slate-100 text-slate-700'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  )
}

export default function PrelimsTestsTab({
  facultySubjectId,
  folderId,
  folderName,
  canMutate = true,
}) {
  const listState = useFacultySubjectChildListState({ facultySubjectId, folderId })
  const { search, setSearch, statusFilter, setStatusFilter, baseFilters, controlledPagination } =
    listState

  const listParams = useMemo(
    () => ({
      ...baseFilters,
      publishStatus: statusFilter === 'all' ? undefined : statusFilter,
    }),
    [baseFilters, statusFilter],
  )

  const dashboardFilters = useMemo(
    () => ({ facultySubjectId, folderId: folderId || undefined }),
    [facultySubjectId, folderId],
  )

  const { data: dashboard, isLoading: dashboardLoading } = usePrelimsTestDashboard(dashboardFilters, {
    enabled: Boolean(facultySubjectId),
  })

  const { data, isLoading, isFetching, error, refetch } = usePrelimsTests(listParams, {
    enabled: Boolean(facultySubjectId),
  })

  const createMutation = useCreatePrelimsTest()
  const deleteMutation = useDeletePrelimsTest()
  const publishMutation = useUpdatePrelimsTestPublishStatus()
  const duplicateMutation = useDuplicatePrelimsTest()

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [publishTarget, setPublishTarget] = useState(null)

  const { data: editDetail, isLoading: editLoading } = usePrelimsTest(editId, {
    enabled: Boolean(editId) && modalOpen,
  })

  const rows = data?.rows ?? []
  const totalItems = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const pagination = buildControlledPagination({
    ...controlledPagination,
    totalItems,
    totalPages,
  })

  const dashboardCards = useMemo(
    () => [
      { label: 'Total Tests', value: dashboard?.totalTests },
      { label: 'Published', value: dashboard?.publishedCount, tone: 'text-emerald-700' },
      { label: 'Draft', value: dashboard?.draftCount },
      { label: 'Questions', value: dashboard?.totalQuestions },
    ],
    [dashboard],
  )

  const statusOptions = useMemo(
    () => [{ value: 'all', label: 'All Status' }, ...PRELIMS_PUBLISH_STATUS_OPTIONS],
    [],
  )

  const handleCreate = useCallback(() => {
    setEditId(null)
    setModalOpen(true)
  }, [])

  const handleEdit = useCallback((row) => {
    setEditId(row.id)
    setModalOpen(true)
  }, [])

  const handleDuplicate = useCallback(
    async (row) => {
      try {
        await duplicateMutation.mutateAsync({ id: row.id })
        toast.success('Prelims test duplicated as draft')
      } catch (error) {
        toast.error(getApiErrorMessage(error, 'Failed to duplicate test'))
      }
    },
    [duplicateMutation],
  )

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Prelims test deleted')
      setDeleteTarget(null)
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Failed to delete test'))
    }
  }, [deleteTarget, deleteMutation])

  const handlePublishConfirm = useCallback(async () => {
    if (!publishTarget) return
    const nextStatus =
      publishTarget.publishStatus === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED'

    if (nextStatus === 'PUBLISHED' && !canPublishPrelimsTest(publishTarget.raw)) {
      toast.error('All configured languages must have uploaded questions before publishing.')
      setPublishTarget(null)
      return
    }

    try {
      await publishMutation.mutateAsync({ id: publishTarget.id, publishStatus: nextStatus })
      toast.success(`Publish status set to ${nextStatus}`)
      setPublishTarget(null)
    } catch (error) {
      const mapped = mapChildModuleFormErrors(error)
      toast.error(mapped.message || getApiErrorMessage(error, 'Failed to update publish status'))
    }
  }, [publishTarget, publishMutation])

  const columns = useMemo(
    () => [
      { key: 'prelimsTestId', label: 'Test ID', width: 110 },
      { key: 'testName', label: 'Test Name', minWidth: 180 },
      {
        key: 'languages',
        label: 'Languages',
        width: 140,
        render: (row) => (row.languages || []).join(', ') || '—',
      },
      {
        key: 'totalQuestions',
        label: 'Questions',
        width: 100,
        align: 'center',
        render: (row) => row.totalQuestions ?? 0,
      },
      {
        key: 'schedule',
        label: 'Schedule',
        width: 150,
        render: (row) => {
          const date = row.scheduleDate ? new Date(row.scheduleDate).toLocaleDateString() : '—'
          return row.scheduleTime ? `${date} ${row.scheduleTime}` : date
        },
      },
      {
        key: 'publishStatus',
        label: 'Status',
        width: 120,
        align: 'center',
        render: (row) => <PublishBadge status={row.publishStatus} />,
      },
      { key: 'batchNamesLabel', label: 'Batches', width: 160 },
      createActionsColumn({
        width: 72,
        align: 'center',
        render: (row) => (
          <TableActionMenu
            triggerLabel="Prelims test actions"
            className="mx-auto"
            items={[
              { label: 'Edit', icon: Pencil, onClick: () => handleEdit(row) },
              {
                label: row.publishStatus === 'PUBLISHED' ? 'Unpublish' : 'Publish',
                icon: Upload,
                onClick: () => setPublishTarget(row),
                disabled: !canMutate,
              },
              { label: 'Duplicate', icon: Copy, onClick: () => handleDuplicate(row), disabled: !canMutate },
            ]}
          />
        ),
      }),
    ],
    [canMutate, handleDuplicate, handleEdit],
  )

  if (error) {
    return (
      <ErrorState
        message={getApiErrorMessage(error, 'Failed to load prelims tests')}
        onRetry={() => refetch()}
      />
    )
  }

  const showEmpty = !isLoading && totalItems === 0 && !search && statusFilter === 'all'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <FacultySubjectChildTabHeader
        title="Prelims Tests"
        folderName={folderName}
        onRefresh={() => refetch()}
        refreshing={isFetching}
        onCreate={canMutate ? handleCreate : undefined}
        createLabel="Create Test"
      />

      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
        <FacultySubjectChildDashboard cards={dashboardCards} loading={dashboardLoading} />

        <AdminDataPanel
          toolbar={
            <ConfigFilterToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search tests…"
              status={statusFilter}
              onStatusChange={setStatusFilter}
              disabled={isLoading}
              extraFilters={
                <FilterSelect
                  label="All Status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={PRELIMS_PUBLISH_STATUS_OPTIONS.map((o) => o.value)}
                  optionLabels={Object.fromEntries(
                    PRELIMS_PUBLISH_STATUS_OPTIONS.map((o) => [o.value, o.label]),
                  )}
                />
              }
            />
          }
        >
          {showEmpty ? (
            <FacultySubjectChildEmptyState
              title="No prelims tests in this folder"
              description="Create a prelims test with question sheets for each selected language."
              onCreate={canMutate ? handleCreate : undefined}
              createLabel="Create Test"
            />
          ) : (
            <TestConfigDataTable
              columns={columns}
              data={rows}
              loading={isLoading || isFetching}
              emptyMessage="No tests match your filters."
              itemLabel="tests"
              controlledPagination={pagination}
              variant="admin"
            />
          )}
        </AdminDataPanel>
      </div>

      <PrelimsTestFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditId(null)
        }}
        facultySubjectId={facultySubjectId}
        folderId={folderId}
        editDetail={editDetail}
        loading={editLoading}
        saving={createMutation.isPending}
        onCreate={async (formData) => {
          const response = await createMutation.mutateAsync(formData)
          toast.success(response?.message || 'Prelims test created')
          setModalOpen(false)
          setEditId(null)
        }}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete prelims test?"
        message={`Delete "${deleteTarget?.testName || 'this test'}"? Questions will be removed.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />

      <PublishStatusConfirmModal
        open={Boolean(publishTarget)}
        row={publishTarget}
        loading={publishMutation.isPending}
        onCancel={() => setPublishTarget(null)}
        onConfirm={handlePublishConfirm}
      />
    </div>
  )
}
