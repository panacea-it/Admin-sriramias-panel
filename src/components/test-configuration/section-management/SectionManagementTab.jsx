import { useEffect, useState } from 'react'
import { Eye, Pencil, Trash2, Layers } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../figma/PageBanner'
import PaginatedFigmaTable from '../../figma/PaginatedFigmaTable'
import { BannerButton, StatusBadge } from '../../academics/AcademicsUi'
import TableActionMenu from '../../common/TableActionMenu'
import ConfirmDeleteDialog from '../../subjects/ConfirmDeleteDialog'
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
    } finally {
      setDeleting(false)
    }
  }

  const columns = [
    {
      key: 'id',
      label: 'Section ID',
      headerClassName: 'pl-6 sm:pl-10',
      cellClassName: 'pl-6 sm:pl-10',
    },
    {
      key: 'sectionName',
      label: 'Section Name',
      render: (r) => <span className="font-medium text-[#1a3a5c]">{displaySectionName(r)}</span>,
    },
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
      key: 'status',
      label: 'Status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <TableActionMenu
          triggerLabel="Section actions"
          items={[
            { label: 'View', icon: Eye, onClick: () => setViewRow(row) },
            { label: 'Edit', icon: Pencil, onClick: () => modal.openEdit(row) },
            {
              label: 'Delete',
              icon: Trash2,
              danger: true,
              onClick: () => {
                setDeleteRow(row)
                setDeleteOpen(true)
              },
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageBanner
        icon={Layers}
        title="Section Management"
        className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]"
      >
        <BannerButton onClick={modal.openCreate}>Add Section</BannerButton>
      </PageBanner>

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

      <PaginatedFigmaTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyMessage="No sections found."
        itemLabel="sections"
        resetDeps={[search, status, sort]}
        rowClassName="hover:bg-slate-50/90"
        stickyHeader
        stickyLastColumn
        zebraStriping
        tableMinWidth={980}
      />

      <SectionConfigFormModal
        open={modal.isOpen}
        onClose={modal.close}
        item={modal.selectedItem}
        existingRows={rows}
        onSubmit={handleSave}
      />

      <SectionViewModal open={Boolean(viewRow)} onClose={() => setViewRow(null)} row={viewRow} />

      <ConfirmDeleteDialog
        open={deleteOpen}
        title="Delete section?"
        message="Are you sure you want to delete this section?"
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
