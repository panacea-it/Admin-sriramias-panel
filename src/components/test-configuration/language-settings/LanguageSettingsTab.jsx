import { useCallback, useEffect, useMemo, useState } from 'react'
import { Globe } from 'lucide-react'
import { toast } from '@/utils/toast'
import TestManagementPageShell from '../../test-management/TestManagementPageShell'
import TestConfigDataTable from '../TestConfigDataTable'
import TestConfigStatusBadge from '../TestConfigStatusBadge'
import AdminDataPanel from '../../admin/AdminDataPanel'
import { BannerButton } from '../../academics/AcademicsUi'
import ConfirmDeleteDialog from '../../subjects/ConfirmDeleteDialog'
import {
  LanguageSettingsTableActions,
  createTestConfigActionsColumn,
  testConfigStatusColumn,
} from '../TestConfigTableActions'
import ConfirmTestConfigStatusModal from '../ConfirmTestConfigStatusModal'
import { useTestConfigLanguageManagement } from '../../../hooks/useTestConfigLanguageManagement'
import {
  useCreateTestConfigLanguage,
  useDeleteTestConfigLanguage,
  useTestConfigLanguage,
  useUpdateTestConfigLanguage,
  useUpdateTestConfigLanguageStatus,
} from '../../../hooks/useTestConfigLanguages'
import {
  buildCreateTestConfigLanguagePayload,
  buildUpdateTestConfigLanguagePayload,
  TEST_CONFIG_LANGUAGE_SORT_OPTIONS,
} from '../../../utils/testConfigLanguageApiHelpers'
import ConfigFilterToolbar, { FilterSelect } from '../ConfigFilterToolbar'
import LanguageFormModal from './LanguageFormModal'
import LanguageViewModal from './LanguageViewModal'

function displayDate(row, key) {
  return row?.[key] || row?.createdAt || '—'
}

export default function LanguageSettingsTab() {
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
  } = useTestConfigLanguageManagement()

  const createMutation = useCreateTestConfigLanguage()
  const updateMutation = useUpdateTestConfigLanguage()
  const statusMutation = useUpdateTestConfigLanguageStatus()
  const deleteMutation = useDeleteTestConfigLanguage()

  const [modalOpen, setModalOpen] = useState(false)
  const [editRow, setEditRow] = useState(null)
  const [viewRowId, setViewRowId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)

  const editDetailId = modalOpen && editRow?.id ? editRow.id : null
  const { data: editDetail, isLoading: editDetailLoading } = useTestConfigLanguage(editDetailId, {
    enabled: Boolean(editDetailId),
  })

  const viewDetailId = viewRowId || null
  const { data: viewDetail, isLoading: viewLoading } = useTestConfigLanguage(viewDetailId, {
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
        payload: buildUpdateTestConfigLanguagePayload(form),
      })
      toast.success(response?.message || 'Language updated successfully')
    } else {
      const response = await createMutation.mutateAsync(buildCreateTestConfigLanguagePayload(form))
      toast.success(response?.message || 'Language created successfully')
    }
    setModalOpen(false)
    setEditRow(null)
  }

  const confirmDelete = useCallback(async () => {
    if (!deleteTarget) return
    try {
      const response = await deleteMutation.mutateAsync(deleteTarget.id)
      toast.success(response?.message || 'Language deleted successfully')
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
      toast.success(response?.message || 'Language status updated')
      setStatusTarget(null)
    } catch {
      // Error toast handled by mutation onError
    }
  }, [statusTarget, statusMutation])

  const columns = useMemo(
    () => [
      {
        key: 'languageId',
        label: 'Language ID',
        headerClassName: 'pl-6 sm:pl-10',
        cellClassName: 'pl-6 sm:pl-10',
        render: (r) => r.languageId || r.id,
      },
      {
        key: 'languageName',
        label: 'Language Name',
        render: (r) => <span className="font-medium text-[#1a3a5c]">{r.languageName}</span>,
      },
      {
        ...testConfigStatusColumn,
        render: (r) => <TestConfigStatusBadge status={r.status} />,
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
      createTestConfigActionsColumn((row) => (
        <LanguageSettingsTableActions
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
      icon={Globe}
      title="Language Settings"
      actions={
        <BannerButton
          onClick={() => {
            setEditRow(null)
            setModalOpen(true)
          }}
        >
          Add Language
        </BannerButton>
      }
    >
      <AdminDataPanel
        toolbar={
          <ConfigFilterToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by language name…"
            status={status}
            onStatusChange={setStatus}
            extraFilters={
              <FilterSelect
                value={sortPreset}
                onChange={setSortPreset}
                label="Sort By"
                includeAll={false}
                options={TEST_CONFIG_LANGUAGE_SORT_OPTIONS.map((o) => o.value)}
                optionLabels={Object.fromEntries(
                  TEST_CONFIG_LANGUAGE_SORT_OPTIONS.map((o) => [o.value, o.label]),
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
          emptyMessage="No languages found."
          itemLabel="languages"
          controlledPagination={controlledPagination}
          resetDeps={[search, status, sortPreset]}
          tableMinWidth={920}
        />
      </AdminDataPanel>

      <LanguageFormModal
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

      <LanguageViewModal
        open={Boolean(viewRowId)}
        onClose={() => setViewRowId(null)}
        row={viewDetail}
        loading={viewLoading}
      />

      <ConfirmTestConfigStatusModal
        open={Boolean(statusTarget)}
        entityLabel="Language"
        enabling={statusTarget?.status !== 'Active'}
        loading={statusMutation.isPending}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmStatusChange}
      />

      <ConfirmDeleteDialog
        open={Boolean(deleteTarget)}
        title="Delete language?"
        message={
          deleteTarget
            ? `Are you sure you want to delete language "${deleteTarget.languageName}"? This action cannot be undone.`
            : ''
        }
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteMutation.isPending}
      />
    </TestManagementPageShell>
  )
}
