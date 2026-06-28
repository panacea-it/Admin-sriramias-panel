import { useCallback, useEffect, useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import { toast } from '@/utils/toast'
import TestManagementPageShell from '../../test-management/TestManagementPageShell'
import AdminDataPanel from '../../admin/AdminDataPanel'
import TestConfigDataTable from '../TestConfigDataTable'
import TestConfigStatusBadge from '../TestConfigStatusBadge'
import { BannerButton } from '../../academics/AcademicsUi'
import ConfirmDeleteDialog from '../../subjects/ConfirmDeleteDialog'
import {
  SectionManagementTableActions,
  createTestConfigActionsColumn,
  testConfigStatusColumn,
} from '../TestConfigTableActions'
import ConfirmTestConfigStatusModal from '../ConfirmTestConfigStatusModal'
import { useTestConfigSectionManagement } from '../../../hooks/useTestConfigSectionManagement'
import {
  useCreateTestConfigSection,
  useDeleteTestConfigSection,
  useTestConfigSection,
  useUpdateTestConfigSection,
  useUpdateTestConfigSectionStatus,
} from '../../../hooks/useTestConfigSections'
import {
  buildCreateTestConfigSectionPayload,
  buildUpdateTestConfigSectionPayload,
  TEST_CONFIG_SECTION_SORT_OPTIONS,
} from '../../../utils/testConfigSectionApiHelpers'
import ConfigFilterToolbar, { FilterSelect } from '../ConfigFilterToolbar'
import SectionConfigFormModal from './SectionConfigFormModal'
import SectionViewModal from './SectionViewModal'

function displayDate(row, key) {
  return row?.[key] || row?.createdAt || '—'
}

function displaySectionName(row) {
  return row?.sectionName || row?.configurationName || '—'
}

export default function SectionManagementTab() {
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
  } = useTestConfigSectionManagement()

  const createMutation = useCreateTestConfigSection()
  const updateMutation = useUpdateTestConfigSection()
  const statusMutation = useUpdateTestConfigSectionStatus()
  const deleteMutation = useDeleteTestConfigSection()

  const [modalOpen, setModalOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRowId, setViewRowId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)

  const editDetailId = modalOpen && editRow?.id ? editRow.id : null
  const { data: editDetail, isLoading: editDetailLoading } = useTestConfigSection(editDetailId, {
    enabled: Boolean(editDetailId),
  })

  const viewDetailId = viewRowId || null
  const { data: viewDetail, isLoading: viewLoading } = useTestConfigSection(viewDetailId, {
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
        payload: buildUpdateTestConfigSectionPayload(form),
      })
      toast.success(response?.message || 'Section updated successfully')
    } else {
      const response = await createMutation.mutateAsync(buildCreateTestConfigSectionPayload(form))
      toast.success(response?.message || 'Section created successfully')
    }
    setModalOpen(false)
    setEditRow(null)
  }

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      const response = await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success(response?.message || 'Section deleted successfully')
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
      toast.success(response?.message || 'Section status updated')
      setStatusTarget(null)
    } catch {
      // Error toast handled by mutation onError
    }
  }, [statusTarget, statusMutation])

  const columns = useMemo(
    () => [
      {
        key: 'sectionId',
        label: 'Section ID',
        headerClassName: 'pl-6 sm:pl-10',
        cellClassName: 'pl-6 sm:pl-10',
        render: (r) => r.sectionId || r.id,
      },
      {
        key: 'sectionName',
        label: 'Section Name',
        render: (r) => <span className="font-medium text-[#1a3a5c]">{displaySectionName(r)}</span>,
      },
      {
        key: 'createdOn',
        label: 'Created On',
        width: 168,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (r) => displayDate(r, 'createdOn'),
      },
      {
        key: 'modifiedOn',
        label: 'Modified On',
        width: 168,
        headerClassName: 'whitespace-nowrap',
        cellClassName: 'whitespace-nowrap align-middle',
        render: (r) => displayDate(r, 'modifiedOn'),
      },
      {
        ...testConfigStatusColumn,
        render: (r) => <TestConfigStatusBadge status={r.status} />,
      },
      createTestConfigActionsColumn((row) => (
        <SectionManagementTableActions
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
      icon={Layers}
      title="Section Management"
      actions={
        <BannerButton
          onClick={() => {
            setEditRow(null)
            setModalOpen(true)
          }}
        >
          Add Section
        </BannerButton>
      }
    >
      <AdminDataPanel
        toolbar={
          <ConfigFilterToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by section name…"
            status={status}
            onStatusChange={setStatus}
            extraFilters={
              <FilterSelect
                value={sortPreset}
                onChange={setSortPreset}
                label="Sort By"
                includeAll={false}
                options={TEST_CONFIG_SECTION_SORT_OPTIONS.map((o) => o.value)}
                optionLabels={Object.fromEntries(
                  TEST_CONFIG_SECTION_SORT_OPTIONS.map((o) => [o.value, o.label]),
                )}
              />
            }
          />
        }
      >
        <TestConfigDataTable
          columns={columns}
          data={rows}
          loading={tableLoading}
          emptyMessage="No sections found."
          itemLabel="sections"
          controlledPagination={controlledPagination}
          resetDeps={[search, status, sortPreset]}
          tableMinWidth={980}
        />
      </AdminDataPanel>

      <SectionConfigFormModal
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

      <SectionViewModal
        open={Boolean(viewRowId)}
        onClose={() => setViewRowId(null)}
        row={viewDetail}
        loading={viewLoading}
      />

      <ConfirmTestConfigStatusModal
        open={Boolean(statusTarget)}
        enabling={statusTarget?.status !== 'Active'}
        loading={statusMutation.isPending}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete section?"
        message={
          deleteTarget
            ? `Are you sure you want to delete section "${displaySectionName(deleteTarget)}"? This action cannot be undone.`
            : ''
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </TestManagementPageShell>
  )
}
