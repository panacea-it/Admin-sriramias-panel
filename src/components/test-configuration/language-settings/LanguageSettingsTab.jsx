import { useEffect, useMemo, useState } from 'react'
import { Globe } from 'lucide-react'
import { toast } from '@/utils/toast'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import PageBanner from '../../figma/PageBanner'
import { BannerButton, StatusBadge } from '../../academics/AcademicsUi'
import {
  LanguageSettingsTableActions,
  createTestConfigActionsColumn,
  testConfigStatusColumn,
  testConfigTableProps,
} from '../TestConfigTableActions'
import ConfirmTestConfigStatusModal from '../ConfirmTestConfigStatusModal'
import { useEditModal } from '../../../hooks/useEditModal'
import { deleteLanguage, fetchLanguages, upsertLanguage } from '../../../api/testConfigurationAPI'
import ConfigFilterToolbar from '../ConfigFilterToolbar'
import LanguageFormModal from './LanguageFormModal'
import LanguageViewModal from './LanguageViewModal'

function displayDate(row, key) {
  return row?.[key] || row?.createdAt || '—'
}

export default function LanguageSettingsTab() {
  const modal = useEditModal()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteRow, setDeleteRow] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [viewRow, setViewRow] = useState(null)
  const [statusTarget, setStatusTarget] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)

  const reload = async () => {
    setLoading(true)
    try {
      const list = await fetchLanguages({ search, status, sortBy: 'createdOn', sortDir: 'desc' })
      setRows(list || [])
    } catch (err) {
      toast.error(err?.message || 'Failed to load languages')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status])

  const handleSave = async (form, meta) => {
    const saved = await upsertLanguage(form, meta)
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
      await deleteLanguage(deleteRow.id)
      setRows((prev) => prev.filter((r) => String(r.id) !== String(deleteRow.id)))
      toast.success('Language deleted')
      setDeleteOpen(false)
      setDeleteRow(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete language')
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
      const saved = await upsertLanguage(
        {
          languageName: statusTarget.languageName,
          status: nextStatus,
        },
        { id: statusTarget.id, isEdit: true },
      )
      setRows((prev) =>
        prev.map((row) => (String(row.id) === String(statusTarget.id) ? { ...row, ...saved } : row)),
      )
      toast.success(enabling ? 'Language enabled' : 'Language disabled')
      setStatusTarget(null)
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update language status')
    } finally {
      setStatusLoading(false)
    }
  }

  const columns = useMemo(
    () => [
      {
        key: 'id',
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
        render: (r) => <StatusBadge status={r.status} />,
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
    <div className="space-y-5 sm:space-y-6">
      <PageBanner
        icon={Globe}
        title="Language Settings"
        className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
      >
        <BannerButton onClick={modal.openCreate}>Add Language</BannerButton>
      </PageBanner>

      <ConfigFilterToolbar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by language name…"
        status={status}
        onStatusChange={setStatus}
      />

      <PaginatedFigmaTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyMessage="No languages found."
        itemLabel="languages"
        resetDeps={[search, status]}
        tableMinWidth={920}
        {...testConfigTableProps}
      />

      <LanguageFormModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        existingRows={rows}
        onSubmit={handleSave}
      />

      <LanguageViewModal open={Boolean(viewRow)} onClose={() => setViewRow(null)} row={viewRow} />

      

      <ConfirmTestConfigStatusModal
        open={Boolean(statusTarget)}
        entityLabel="Language"
        enabling={statusTarget?.status !== 'Active'}
        loading={statusLoading}
        onCancel={() => {
          if (!statusLoading) setStatusTarget(null)
        }}
        onConfirm={confirmStatusChange}
      />
    </div>
  )
}
