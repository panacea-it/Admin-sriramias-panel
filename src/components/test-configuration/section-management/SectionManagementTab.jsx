import { useEffect, useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import { toast } from '@/utils/toast'
import TestManagementPageShell from '../../test-management/TestManagementPageShell'
import AdminDataPanel from '../../admin/AdminDataPanel'
import TestConfigDataTable from '../TestConfigDataTable'
import TestConfigStatusBadge from '../TestConfigStatusBadge'
import { BannerButton } from '../../academics/AcademicsUi'
import {
  SectionManagementTableActions,
  createTestConfigActionsColumn,
  testConfigStatusColumn,
} from '../TestConfigTableActions'
import ConfirmTestConfigStatusModal from '../ConfirmTestConfigStatusModal'
import { useEditModal } from '../../../hooks/useEditModal'
import {
  deleteSectionConfig,
  fetchSectionConfigs,
  upsertSectionConfig,
} from '../../../api/testConfigurationAPI'
import ConfigFilterToolbar, { FilterSelect } from '../ConfigFilterToolbar'
import SectionConfigFormModal from './SectionConfigFormModal'
import SectionViewModal from './SectionViewModal'
import { purgeLegacySectionStorage } from '../../../utils/sectionManagementStorage'

const SORT_OPTIONS = [
  { value: 'createdOn:desc', label: 'Created On (Newest)' },
  { value: 'createdOn:asc', label: 'Created On (Oldest)' },
  { value: 'modifiedOn:desc', label: 'Modified On (Newest)' },
  { value: 'modifiedOn:asc', label: 'Modified On (Oldest)' },
  { value: 'sectionName:asc', label: 'Section Name (A–Z)' },
  { value: 'sectionName:desc', label: 'Section Name (Z–A)' },
]

function parseSort(value) {
  const [sortBy, sortDir] = String(value || 'createdOn:desc').split(':')
  return { sortBy, sortDir }
}

function displayDate(row, key) {
  return row?.[key] || row?.createdAt || '—'
}

function displaySectionName(row) {
  return row?.sectionName || row?.configurationName || '—'
}

export default function SectionManagementTab() {
  const modal = useEditModal()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [sort, setSort] = useState('createdOn:desc')
  const [viewRow, setViewRow] = useState(null)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteRow, setDeleteRow] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)

  const { sortBy, sortDir } = parseSort(sort)

  const reload = async () => {
    setLoading(true)
    try {
      const list = await fetchSectionConfigs({ search, status, sortBy, sortDir })
      setRows(list || [])
    } catch (err) {
      toast.error(err?.message || 'Failed to load sections')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    purgeLegacySectionStorage()
  }, [])

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, sort])

  const handleSave = async (form, meta) => {
    const saved = await upsertSectionConfig(form, meta)
    setRows((prev) => {
      if (meta.isEdit) {
        return prev.map((r) => (String(r.id) === String(meta.id) ? { ...r, ...saved } : r))
      }
      return [saved, ...prev]
    })
  }

  const handleDelete = async () => {
    if (!deleteRow) return
    setDeleting(true)
    try {
      await deleteSectionConfig(deleteRow.id)
      setRows((prev) => prev.filter((r) => String(r.id) !== String(deleteRow.id)))
      toast.success('Section deleted')
      setDeleteOpen(false)
      setDeleteRow(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete section')
    } finally {
      setDeleting(false)
    }
  }

  const confirmStatusChange = async () => {
    if (!statusTarget) return
    const enabling = statusTarget.status !== 'Active'
    const nextStatus = enabling ? 'Active' : 'Deactivated'

    setStatusLoading(true)
    try {
      const saved = await upsertSectionConfig(
        {
          sectionName: statusTarget.sectionName || statusTarget.configurationName,
          status: nextStatus,
        },
        { id: statusTarget.id, isEdit: true },
      )
      setRows((prev) =>
        prev.map((row) => (String(row.id) === String(statusTarget.id) ? { ...row, ...saved } : row)),
      )
      toast.success(enabling ? 'Section enabled' : 'Section disabled')
      setStatusTarget(null)
    } catch (err) {
      toast.error(err?.message || 'Failed to update section status')
    } finally {
      setStatusLoading(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'id',
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
          onView={() => setViewRow(row)}
          onEdit={() => modal.openEdit(row)}
          onToggleStatus={() => setStatusTarget(row)}
          onDelete={() => {
            setDeleteRow(row)
            setDeleteOpen(true)
          }}
        />
      )),
    ],
    [modal],
  )

  return (
    <TestManagementPageShell
      icon={Layers}
      title="Section Management"
      actions={<BannerButton onClick={modal.openCreate}>Add Section</BannerButton>}
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
                value={sort}
                onChange={setSort}
                label="Sort By"
                includeAll={false}
                options={SORT_OPTIONS.map((o) => o.value)}
                optionLabels={Object.fromEntries(SORT_OPTIONS.map((o) => [o.value, o.label]))}
              />
            }
          />
        }
      >
        <TestConfigDataTable
          columns={columns}
          data={rows}
          loading={loading}
          emptyMessage="No sections found."
          itemLabel="sections"
          resetDeps={[search, status, sort]}
          tableMinWidth={980}
        />
      </AdminDataPanel>

      <SectionConfigFormModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        existingRows={rows}
        onSubmit={handleSave}
      />

      <SectionViewModal open={Boolean(viewRow)} onClose={() => setViewRow(null)} row={viewRow} />

      

      <ConfirmTestConfigStatusModal
        open={Boolean(statusTarget)}
        entityLabel="Section"
        enabling={statusTarget?.status !== 'Active'}
        loading={statusLoading}
        onCancel={() => {
          if (!statusLoading) setStatusTarget(null)
        }}
        onConfirm={confirmStatusChange}
      />
    </TestManagementPageShell>
  )
}
