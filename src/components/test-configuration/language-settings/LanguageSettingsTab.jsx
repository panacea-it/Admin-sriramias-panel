import { useEffect, useState } from 'react'
import { Globe } from 'lucide-react'
import { toast } from '@/utils/toast'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import PageBanner from '../../figma/PageBanner'
import { BannerButton, StatusBadge } from '../../academics/AcademicsUi'
import { TopicRowActions } from '../../subjects/ActionButtons'
import ConfirmDeleteDialog from '../../subjects/ConfirmDeleteDialog'
import { useEditModal } from '../../../hooks/useEditModal'
import { deleteLanguage, fetchLanguages, upsertLanguage } from '../../../api/testConfigurationAPI'
import ConfigFilterToolbar from '../ConfigFilterToolbar'
import LanguageFormModal from './LanguageFormModal'

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

  const columns = [
    { key: 'id', label: 'Language ID', headerClassName: 'pl-6 sm:pl-10', cellClassName: 'pl-6 sm:pl-10' },
    {
      key: 'languageName',
      label: 'Language Name',
      render: (r) => <span className="font-medium text-[#1a3a5c]">{r.languageName}</span>,
    },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'createdOn',
      label: 'Created On',
      render: (r) => displayDate(r, 'createdOn'),
    },
    {
      key: 'modifiedOn',
      label: 'Modified On',
      render: (r) => displayDate(r, 'modifiedOn'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <TopicRowActions
          onEdit={() => modal.openEdit(row)}
          onDelete={() => {
            setDeleteRow(row)
            setDeleteOpen(true)
          }}
        />
      ),
    },
  ]

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
        rowClassName="hover:bg-slate-50/90"
        stickyHeader
        stickyLastColumn
        zebraStriping
        tableMinWidth={920}
      />

      <LanguageFormModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        existingRows={rows}
        onSubmit={handleSave}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Delete language?"
        message={`Are you sure you want to delete "${deleteRow?.languageName || 'this language'}"?`}
        onConfirm={handleDelete}
        onCancel={() => {
          setDeleteOpen(false)
          setDeleteRow(null)
        }}
        loading={deleting}
      />
    </div>
  )
}
