import { useCallback, useMemo, useState } from 'react'
import { Download, Eye, Pencil } from 'lucide-react'
import AdminDataPanel from '../../../../../components/admin/AdminDataPanel'
import TestConfigDataTable from '../../../../../components/test-configuration/TestConfigDataTable'
import ConfigFilterToolbar, { FilterSelect } from '../../../../../components/test-configuration/ConfigFilterToolbar'
import TableActionMenu from '../../../../../components/common/TableActionMenu'
import ConfirmDeleteDialog from '../../../../../components/subjects/ConfirmDeleteDialog'
import ErrorState from '../../../../../components/feedback/ErrorState'
import { createActionsColumn } from '../../../../../utils/tableColumnHelpers'
import { formatPublishStatusLabel } from '../../../../../utils/facultySubjectChildApiHelpers'
import { getApiErrorMessage } from '../../../../../utils/apiError'
import { toast } from '../../../../../utils/toast'
import {
  useCreateMainsAnswerWriting,
  useDeleteMainsAnswerWriting,
  useMainsAnswerWriting,
  useMainsAnswerWritingDashboard,
  useMainsAnswerWritings,
  useUpdateMainsAnswerWriting,
  useUpdateMainsAnswerWritingPublishStatus,
} from '../../../../../hooks/useSubjectMainsAnswerWriting'
import {
  buildControlledPagination,
  useFacultySubjectChildListState,
} from '../../../../../hooks/useFacultySubjectChildListState'
import { MAINS_PUBLISH_STATUS_OPTIONS } from '../../../../../utils/mainsAnswerWritingApiHelpers'
import {
  FacultySubjectChildDashboard,
  FacultySubjectChildEmptyState,
  FacultySubjectChildTabHeader,
} from '../FacultySubjectChildTabUi'
import MainsAnswerWritingFormModal from './MainsAnswerWritingFormModal'
import PublishStatusConfirmModal from './PublishStatusConfirmModal'

function StatusBadge({ status }) {
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

export default function MainsAnswerWritingTab({
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

  const { data: dashboard, isLoading: dashboardLoading } = useMainsAnswerWritingDashboard(
    dashboardFilters,
    { enabled: Boolean(facultySubjectId) },
  )

  const { data, isLoading, isFetching, error, refetch } = useMainsAnswerWritings(listParams, {
    enabled: Boolean(facultySubjectId),
  })

  const createMutation = useCreateMainsAnswerWriting()
  const updateMutation = useUpdateMainsAnswerWriting()
  const deleteMutation = useDeleteMainsAnswerWriting()
  const publishMutation = useUpdateMainsAnswerWritingPublishStatus()

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [publishTarget, setPublishTarget] = useState(null)

  const { data: editDetail, isLoading: editLoading } = useMainsAnswerWriting(editId, {
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
      { label: 'Total Entries', value: dashboard?.totalEntries },
      { label: 'Published', value: dashboard?.publishedCount, tone: 'text-emerald-700' },
      { label: 'Draft', value: dashboard?.draftCount },
      { label: 'Unpublished', value: dashboard?.unpublishedCount },
    ],
    [dashboard],
  )

  const handleCreate = useCallback(() => {
    setEditId(null)
    setModalOpen(true)
  }, [])

  const handleEdit = useCallback((row) => {
    setEditId(row.id)
    setModalOpen(true)
  }, [])

  const handleSave = useCallback(
    async (formData, isEdit) => {
      if (isEdit) {
        const response = await updateMutation.mutateAsync({ id: editId, formData })
        toast.success(response?.message || 'Entry updated')
      } else {
        const response = await createMutation.mutateAsync(formData)
        toast.success(response?.message || 'Entry created')
      }
      setModalOpen(false)
      setEditId(null)
    },
    [createMutation, updateMutation, editId],
  )

  const handleDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success('Entry deleted')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete entry'))
    }
  }, [deleteTarget, deleteMutation])

  const handlePublishConfirm = useCallback(async () => {
    if (!publishTarget) return
    const nextStatus =
      publishTarget.publishStatus === 'PUBLISHED' ? 'UNPUBLISHED' : 'PUBLISHED'
    try {
      await publishMutation.mutateAsync({ id: publishTarget.id, publishStatus: nextStatus })
      toast.success(`Publish status set to ${nextStatus}`)
      setPublishTarget(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update publish status'))
    }
  }, [publishTarget, publishMutation])

  const columns = useMemo(
    () => [
      { key: 'mainsAnswerWritingId', label: 'ID', width: 110 },
      { key: 'testName', label: 'Test Name', minWidth: 180 },
      { key: 'topicName', label: 'Topic', width: 140 },
      {
        key: 'scheduleDate',
        label: 'Schedule',
        width: 130,
        render: (row) =>
          row.scheduleDate ? new Date(row.scheduleDate).toLocaleDateString() : '—',
      },
      {
        key: 'publishStatus',
        label: 'Status',
        width: 120,
        align: 'center',
        render: (row) => <StatusBadge status={row.publishStatus} />,
      },
      { key: 'batchNamesLabel', label: 'Batches', width: 160 },
      createActionsColumn({
        width: 72,
        align: 'center',
        render: (row) => (
          <TableActionMenu
            triggerLabel="Mains entry actions"
            className="mx-auto"
            items={[
              {
                label: 'Open PDF',
                icon: Eye,
                onClick: () => row.pdfUrl && window.open(row.pdfUrl, '_blank', 'noopener'),
                disabled: !row.pdfUrl,
              },
              { label: 'Edit', icon: Pencil, onClick: () => handleEdit(row), disabled: !canMutate },
              {
                label: row.publishStatus === 'PUBLISHED' ? 'Unpublish' : 'Publish',
                icon: Download,
                onClick: () => setPublishTarget(row),
                disabled: !canMutate,
              },
            ]}
          />
        ),
      }),
    ],
    [canMutate, handleEdit],
  )

  if (error) {
    return (
      <ErrorState
        message={getApiErrorMessage(error, 'Failed to load mains answer writing entries')}
        onRetry={() => refetch()}
      />
    )
  }

  const showEmpty = !isLoading && totalItems === 0 && !search && statusFilter === 'all'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <FacultySubjectChildTabHeader
        title="Mains Answer Writing"
        folderName={folderName}
        onRefresh={() => refetch()}
        refreshing={isFetching}
        onCreate={canMutate ? handleCreate : undefined}
        createLabel="Create Entry"
      />

      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
        <FacultySubjectChildDashboard cards={dashboardCards} loading={dashboardLoading} />

        <AdminDataPanel
          toolbar={
            <ConfigFilterToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search entries…"
              status={statusFilter}
              onStatusChange={setStatusFilter}
              disabled={isLoading}
              extraFilters={
                <FilterSelect
                  label="All Status"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={MAINS_PUBLISH_STATUS_OPTIONS.map((o) => o.value)}
                  optionLabels={Object.fromEntries(
                    MAINS_PUBLISH_STATUS_OPTIONS.map((o) => [o.value, o.label]),
                  )}
                />
              }
            />
          }
        >
          {showEmpty ? (
            <FacultySubjectChildEmptyState
              title="No mains answer writing entries"
              description="Upload a PDF question paper and configure schedule details."
              onCreate={canMutate ? handleCreate : undefined}
              createLabel="Create Entry"
            />
          ) : (
            <TestConfigDataTable
              columns={columns}
              data={rows}
              loading={isLoading || isFetching}
              emptyMessage="No entries match your filters."
              itemLabel="entries"
              controlledPagination={pagination}
              variant="admin"
            />
          )}
        </AdminDataPanel>
      </div>

      <MainsAnswerWritingFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditId(null)
        }}
        facultySubjectId={facultySubjectId}
        folderId={folderId}
        editDetail={editId ? editDetail : null}
        loading={editLoading}
        saving={createMutation.isPending || updateMutation.isPending}
        onSave={handleSave}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete mains entry?"
        message={`Delete "${deleteTarget?.testName || 'this entry'}"?`}
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
