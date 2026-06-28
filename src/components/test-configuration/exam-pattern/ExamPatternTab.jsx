import { useCallback, useEffect, useMemo, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { toast } from '@/utils/toast'
import TestManagementPageShell from '../../test-management/TestManagementPageShell'
import AdminDataPanel from '../../admin/AdminDataPanel'
import TestConfigDataTable from '../TestConfigDataTable'
import TestConfigStatusBadge from '../TestConfigStatusBadge'
import { BannerButton } from '../../academics/AcademicsUi'
import ConfirmDeleteDialog from '../../subjects/ConfirmDeleteDialog'
import {
  ExamPatternTableActions,
  createTestConfigActionsColumn,
  testConfigStatusColumn,
} from '../TestConfigTableActions'
import { useExamPatternManagement } from '../../../hooks/useExamPatternManagement'
import {
  useCreateExamPattern,
  useDeleteExamPattern,
  useExamPattern,
  useUpdateExamPattern,
  useUpdateExamPatternStatus,
} from '../../../hooks/useExamPatterns'
import {
  buildCreateExamPatternPayload,
  buildUpdateExamPatternPayload,
  EXAM_PATTERN_SORT_OPTIONS,
  formatExamPatternDateTime,
} from '../../../utils/examPatternApiHelpers'
import ConfigFilterToolbar, { FilterSelect } from '../ConfigFilterToolbar'
import ExamPatternFormModal from './ExamPatternFormModal'
import ExamPatternViewModal from './ExamPatternViewModal'
import ConfirmExamPatternStatusModal from './ConfirmExamPatternStatusModal'

export default function ExamPatternTab() {
  const {
    rows,
    tableLoading,
    search,
    setSearch,
    status,
    setStatus,
    sortPreset,
    setSortPreset,
    controlledPagination,
  } = useExamPatternManagement()

  const createMutation = useCreateExamPattern()
  const updateMutation = useUpdateExamPattern()
  const statusMutation = useUpdateExamPatternStatus()
  const deleteMutation = useDeleteExamPattern()

  const [modalOpen, setModalOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRowId, setViewRowId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)

  const editDetailId = modalOpen && editRow?.id ? editRow.id : null
  const { data: editDetail, isLoading: editDetailLoading } = useExamPattern(editDetailId, {
    enabled: Boolean(editDetailId),
  })

  const viewDetailId = viewRowId || null
  const { data: viewDetail, isLoading: viewLoading } = useExamPattern(viewDetailId, {
    enabled: Boolean(viewDetailId),
  })

  const handleView = useCallback((row) => {
    setViewRowId(row.id)
  }, [])

  const handleEdit = useCallback((row) => {
    setEditRow(row)
    setModalOpen(true)
  }, [])

  useEffect(() => {
    if (!modalOpen) {
      setEditRow(null)
    }
  }, [modalOpen])

  const handleSave = async (form) => {
    const isEdit = Boolean(editRow?.id)

    if (isEdit) {
      const response = await updateMutation.mutateAsync({
        id: editRow.id,
        payload: buildUpdateExamPatternPayload(form),
      })
      toast.success(response?.message || 'Exam instruction updated successfully')
    } else {
      const response = await createMutation.mutateAsync(buildCreateExamPatternPayload(form))
      toast.success(response?.message || 'Exam instruction created successfully')
    }
    setModalOpen(false)
    setEditRow(null)
  }

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      const response = await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success(response?.message || 'Exam instruction deleted successfully')
      setDeleteTarget(null)
    } catch {
      // Error toast handled by mutation onError
    }
  }, [deleteTarget, deleteMutation])

  const confirmStatusChange = useCallback(async () => {
    if (!statusTarget) return
    const activating = statusTarget.status !== 'Active'
    const nextApiStatus = activating ? 'ACTIVE' : 'INACTIVE'

    try {
      const response = await statusMutation.mutateAsync({
        id: statusTarget.id,
        status: nextApiStatus,
      })
      toast.success(response?.message || 'Exam instruction status updated')
      setStatusTarget(null)
    } catch {
      // Error toast handled by mutation onError
    }
  }, [statusTarget, statusMutation])

  const columns = useMemo(
    () => [
      {
        key: 'instructionId',
        label: 'Instruction ID',
        headerClassName: 'pl-6 sm:pl-10',
        cellClassName: 'pl-6 sm:pl-10',
        render: (r) => r.instructionId || r.id || '—',
      },
      {
        key: 'instructionDescription',
        label: 'Instruction Description',
        render: (r) => (
          <span className="line-clamp-2 max-w-md font-medium text-[#1a3a5c]">
            {r.instructionDescription || '—'}
          </span>
        ),
      },
      {
        key: 'createdAt',
        label: 'Created On',
        width: 168,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (r) => formatExamPatternDateTime(r.createdAt),
      },
      {
        key: 'updatedAt',
        label: 'Modified On',
        width: 168,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (r) => formatExamPatternDateTime(r.updatedAt),
      },
      {
        ...testConfigStatusColumn,
        render: (r) => <TestConfigStatusBadge status={r.status} />,
      },
      createTestConfigActionsColumn((row) => (
        <ExamPatternTableActions
          row={row}
          onView={() => handleView(row)}
          onEdit={() => handleEdit(row)}
          onToggleStatus={() => setStatusTarget(row)}
          onDelete={() => setDeleteTarget(row)}
        />
      )),
    ],
    [handleView, handleEdit],
  )

  const formItem = editDetail || editRow
  const saving = createMutation.isPending || updateMutation.isPending

  return (
    <TestManagementPageShell
      icon={ClipboardList}
      title="Exam Pattern"
      actions={
        <BannerButton
          onClick={() => {
            setEditRow(null)
            setModalOpen(true)
          }}
        >
          Add Instruction
        </BannerButton>
      }
    >
      <AdminDataPanel
        toolbar={
          <ConfigFilterToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search instructions…"
            status={status}
            onStatusChange={setStatus}
            extraFilters={
              <FilterSelect
                value={sortPreset}
                onChange={setSortPreset}
                label="Sort By"
                includeAll={false}
                options={EXAM_PATTERN_SORT_OPTIONS.map((o) => o.value)}
                optionLabels={Object.fromEntries(EXAM_PATTERN_SORT_OPTIONS.map((o) => [o.value, o.label]))}
              />
            }
          />
        }
      >
        <TestConfigDataTable
          columns={columns}
          data={rows}
          loading={tableLoading}
          emptyMessage="No instructions found."
          itemLabel="instructions"
          controlledPagination={controlledPagination}
          resetDeps={[search, status, sortPreset]}
          tableMinWidth={980}
        />
      </AdminDataPanel>

      <ExamPatternFormModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditRow(null)
        }}
        item={formItem}
        loading={editDetailLoading && Boolean(editRow)}
        onSubmit={handleSave}
        saving={saving}
      />

      <ExamPatternViewModal
        open={Boolean(viewRowId)}
        onClose={() => setViewRowId(null)}
        row={viewDetail}
        loading={viewLoading}
      />

      <ConfirmExamPatternStatusModal
        open={Boolean(statusTarget)}
        activating={statusTarget?.status !== 'Active'}
        loading={statusMutation.isPending}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete instruction?"
        message={
          deleteTarget
            ? `Are you sure you want to delete instruction "${deleteTarget.instructionId || deleteTarget.id}"? This action cannot be undone.`
            : ''
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </TestManagementPageShell>
  )
}
