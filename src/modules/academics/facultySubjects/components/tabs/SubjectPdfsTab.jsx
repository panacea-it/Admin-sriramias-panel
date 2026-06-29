import { useCallback, useMemo, useState } from 'react'
import { Download, Eye, Pencil } from 'lucide-react'
import AdminDataPanel from '../../../../../components/admin/AdminDataPanel'
import TestConfigDataTable from '../../../../../components/test-configuration/TestConfigDataTable'
import ConfigFilterToolbar, { FilterSelect } from '../../../../../components/test-configuration/ConfigFilterToolbar'
import TableActionMenu from '../../../../../components/common/TableActionMenu'
import ConfirmDeleteDialog from '../../../../../components/subjects/ConfirmDeleteDialog'
import ErrorState from '../../../../../components/feedback/ErrorState'
import { createActionsColumn } from '../../../../../utils/tableColumnHelpers'
import { formatVisibilityLabel } from '../../../../../utils/facultySubjectChildApiHelpers'
import { getApiErrorMessage } from '../../../../../utils/apiError'
import { toast } from '../../../../../utils/toast'
import {
  useCreateSubjectPdf,
  useDeleteSubjectPdf,
  useDownloadSubjectPdf,
  useSubjectPdf,
  useSubjectPdfDashboard,
  useSubjectPdfs,
  useUpdateSubjectPdf,
  useUpdateSubjectPdfVisibility,
} from '../../../../../hooks/useSubjectPDFs'
import {
  buildControlledPagination,
  useFacultySubjectChildListState,
} from '../../../../../hooks/useFacultySubjectChildListState'
import { SUBJECT_PDF_VISIBILITY_OPTIONS } from '../../../../../utils/subjectPdfApiHelpers'
import {
  FacultySubjectChildDashboard,
  FacultySubjectChildEmptyState,
  FacultySubjectChildTabHeader,
} from '../FacultySubjectChildTabUi'
import SubjectPdfFormModal from './SubjectPdfFormModal'

function VisibilityBadge({ visibility }) {
  const label = formatVisibilityLabel(visibility)
  const tone =
    visibility === 'PUBLISHED'
      ? 'bg-emerald-100 text-emerald-800'
      : visibility === 'PRIVATE'
        ? 'bg-slate-200 text-slate-800'
        : visibility === 'VISIBILITY'
          ? 'bg-sky-100 text-sky-800'
          : 'bg-amber-100 text-amber-800'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  )
}

export default function SubjectPdfsTab({
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
      visibility: statusFilter === 'all' ? undefined : statusFilter,
    }),
    [baseFilters, statusFilter],
  )

  const dashboardFilters = useMemo(
    () => ({ facultySubjectId, folderId: folderId || undefined }),
    [facultySubjectId, folderId],
  )

  const { data: dashboard, isLoading: dashboardLoading } = useSubjectPdfDashboard(dashboardFilters, {
    enabled: Boolean(facultySubjectId),
  })

  const { data, isLoading, isFetching, error, refetch } = useSubjectPdfs(listParams, {
    enabled: Boolean(facultySubjectId),
  })

  const createMutation = useCreateSubjectPdf()
  const updateMutation = useUpdateSubjectPdf()
  const deleteMutation = useDeleteSubjectPdf()
  const visibilityMutation = useUpdateSubjectPdfVisibility()
  const downloadMutation = useDownloadSubjectPdf()

  const [modalOpen, setModalOpen] = useState(false)
  const [editId, setEditId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const { data: editDetail, isLoading: editLoading } = useSubjectPdf(editId, {
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
      { label: 'Total PDFs', value: dashboard?.totalPdfs },
      { label: 'Total Views', value: dashboard?.totalViews },
      { label: 'Published', value: dashboard?.publishedCount, tone: 'text-emerald-700' },
      { label: 'Draft', value: dashboard?.draftCount },
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
        toast.success(response?.message || 'PDF updated')
      } else {
        const response = await createMutation.mutateAsync(formData)
        toast.success(response?.message || 'PDF created')
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
      toast.success('PDF deleted')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to delete PDF'))
    }
  }, [deleteTarget, deleteMutation])

  const handleDownload = useCallback(
    async (row) => {
      try {
        const response = await downloadMutation.mutateAsync(row.id)
        const url = response?.data?.pdfUrl
        if (url) window.open(url, '_blank', 'noopener')
        else toast.error('Download URL not available')
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to download PDF'))
      }
    },
    [downloadMutation],
  )

  const handleVisibilityToggle = useCallback(
    async (row) => {
      const next =
        row.visibility === 'PUBLISHED'
          ? 'DRAFT'
          : row.visibility === 'PRIVATE'
            ? 'PUBLISHED'
            : 'PUBLISHED'
      try {
        await visibilityMutation.mutateAsync({ id: row.id, visibility: next })
        toast.success(`Visibility set to ${formatVisibilityLabel(next)}`)
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Failed to update visibility'))
      }
    },
    [visibilityMutation],
  )

  const columns = useMemo(
    () => [
      { key: 'subjectPdfId', label: 'PDF ID', width: 110 },
      { key: 'pdfTitle', label: 'Title', minWidth: 200 },
      {
        key: 'visibility',
        label: 'Visibility',
        width: 120,
        align: 'center',
        render: (row) => <VisibilityBadge visibility={row.visibility} />,
      },
      {
        key: 'viewCount',
        label: 'Views',
        width: 90,
        align: 'center',
        render: (row) => row.viewCount ?? 0,
      },
      { key: 'batchNamesLabel', label: 'Batches', width: 160 },
      createActionsColumn({
        width: 72,
        align: 'center',
        render: (row) => (
          <TableActionMenu
            triggerLabel="PDF actions"
            className="mx-auto"
            items={[
              {
                label: 'Preview',
                icon: Eye,
                onClick: () => row.pdfUrl && window.open(row.pdfUrl, '_blank', 'noopener'),
                disabled: !row.pdfUrl,
              },
              {
                label: 'Download',
                icon: Download,
                onClick: () => handleDownload(row),
              },
              { label: 'Edit', icon: Pencil, onClick: () => handleEdit(row), disabled: !canMutate },
              {
                label: 'Toggle visibility',
                icon: Eye,
                onClick: () => handleVisibilityToggle(row),
                disabled: !canMutate,
              },
            ]}
          />
        ),
      }),
    ],
    [canMutate, handleDownload, handleEdit, handleVisibilityToggle],
  )

  if (error) {
    return (
      <ErrorState
        message={getApiErrorMessage(error, 'Failed to load PDFs')}
        onRetry={() => refetch()}
      />
    )
  }

  const showEmpty = !isLoading && totalItems === 0 && !search && statusFilter === 'all'

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <FacultySubjectChildTabHeader
        title="Subject PDFs"
        folderName={folderName}
        onRefresh={() => refetch()}
        refreshing={isFetching}
        onCreate={canMutate ? handleCreate : undefined}
        createLabel="Upload PDF"
      />

      <div className="min-h-0 flex-1 space-y-4 overflow-auto p-4">
        <FacultySubjectChildDashboard cards={dashboardCards} loading={dashboardLoading} />

        <AdminDataPanel
          toolbar={
            <ConfigFilterToolbar
              search={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search PDFs…"
              status={statusFilter}
              onStatusChange={setStatusFilter}
              disabled={isLoading}
              extraFilters={
                <FilterSelect
                  label="All Visibility"
                  value={statusFilter}
                  onChange={setStatusFilter}
                  options={SUBJECT_PDF_VISIBILITY_OPTIONS.map((o) => o.value)}
                  optionLabels={Object.fromEntries(
                    SUBJECT_PDF_VISIBILITY_OPTIONS.map((o) => [o.value, o.label]),
                  )}
                />
              }
            />
          }
        >
          {showEmpty ? (
            <FacultySubjectChildEmptyState
              title="No PDFs in this folder"
              description="Upload study material PDFs and assign them to batches."
              onCreate={canMutate ? handleCreate : undefined}
              createLabel="Upload PDF"
            />
          ) : (
            <TestConfigDataTable
              columns={columns}
              data={rows}
              loading={isLoading || isFetching}
              emptyMessage="No PDFs match your filters."
              itemLabel="PDFs"
              controlledPagination={pagination}
              variant="admin"
            />
          )}
        </AdminDataPanel>
      </div>

      <SubjectPdfFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditId(null)
        }}
        facultySubjectId={facultySubjectId}
        folderId={folderId}
        editDetail={editDetail}
        loading={editLoading}
        saving={createMutation.isPending || updateMutation.isPending}
        onSave={handleSave}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete PDF?"
        message={`Delete "${deleteTarget?.pdfTitle || 'this PDF'}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </div>
  )
}
