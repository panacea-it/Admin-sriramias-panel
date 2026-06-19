import { useEffect, useState } from 'react'
import { Plug, Copy, Pencil, CalendarClock, ToggleLeft, ToggleRight } from 'lucide-react'
import { toast } from '@/utils/toast'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import { BannerButton, StatusBadge } from '../../components/academics/AcademicsUi'
import TableActionMenu from '../../components/common/TableActionMenu'
import { useEditModal } from '../../hooks/useEditModal'
import TestIntegrationFormModal from '../../components/test-management/TestIntegrationFormModal'
import {
  deleteTestIntegration,
  fetchTestIntegrations,
  upsertTestIntegration,
} from '../../api/testManagementAPI'

export default function TestIntegrationPage() {
  const modal = useEditModal()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('all')

  const reload = async () => {
    setLoading(true)
    try {
      const list = await fetchTestIntegrations({ search, status })
      setRows(list || [])
    } catch (err) {
      toast.error(err?.message || 'Failed to load integrations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    reload()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status])

  const handleSave = async (form, { isEdit, id }) => {
    const saved = await upsertTestIntegration(form, { isEdit, id })
    setRows((prev) => {
      const next = [...prev]
      if (isEdit) {
        const idx = next.findIndex((r) => String(r.id) === String(id))
        if (idx >= 0) next[idx] = { ...next[idx], ...saved }
        return next
      }
      return [saved, ...next]
    })
  }

  const handleDelete = async (id) => {
    await deleteTestIntegration(id)
    setRows((prev) => prev.filter((r) => String(r.id) !== String(id)))
    toast.success('Integration deleted')
  }

  const setIntegrationStatus = async (row, nextStatus) => {
    const saved = await upsertTestIntegration({ ...row, status: nextStatus }, { isEdit: true, id: row.id })
    setRows((prev) => prev.map((r) => (String(r.id) === String(row.id) ? { ...r, ...saved } : r)))
    toast.success(`Status set to ${nextStatus}`)
  }

  const columns = [
    { key: 'id', label: 'Integration ID', headerClassName: 'pl-6 sm:pl-10', cellClassName: 'pl-6 sm:pl-10' },
    { key: 'testName', label: 'Test Name', render: (r) => <span className="font-medium">{r.testName}</span> },
    { key: 'course', label: 'Course' },
    { key: 'batch', label: 'Batch' },
    { key: 'faculty', label: 'Faculty' },
    { key: 'subject', label: 'Subject' },
    { key: 'scheduleDate', label: 'Schedule Date' },
    { key: 'durationMins', label: 'Duration' },
    { key: 'status', label: 'Status', render: (r) => <StatusBadge status={r.status} /> },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <TableActionMenu
          triggerLabel="Integration actions"
          items={[
            { label: 'Schedule / Edit', icon: CalendarClock, onClick: () => modal.openEdit(row) },
            {
              label: row.status === 'Published' ? 'Unpublish' : 'Publish',
              icon: row.status === 'Published' ? ToggleLeft : ToggleRight,
              onClick: () => setIntegrationStatus(row, row.status === 'Published' ? 'Unpublished' : 'Published'),
            },
            { label: 'Duplicate', icon: Copy, onClick: () => modal.openDuplicate(row) },
            { label: 'Edit', icon: Pencil, onClick: () => modal.openEdit(row) },
          ]}
        />
      ),
    },
  ]

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageBanner icon={Plug} title="Test Integration" className="from-[#55ace7] via-[#8b98bb] to-[#b8887a]">
        <BannerButton onClick={modal.openCreate}>Create Integration</BannerButton>
      </PageBanner>

      <div className="flex min-h-14 flex-wrap items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 shadow-[0_8px_20px_rgba(15,23,42,0.08)] sm:px-4">
        <div className="relative w-full min-w-0 flex-1 sm:max-w-md">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search integrations"
            className="h-10 w-full min-h-[38px] rounded-lg bg-[#eef2fc] px-4 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7] sm:text-base"
          />
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-10 min-h-[38px] w-full appearance-none rounded-lg border-0 bg-[#55ace7] px-4 text-sm font-semibold text-white outline-none focus:ring-2 focus:ring-[#246392]/50 sm:w-auto sm:min-w-[160px] sm:text-base"
          >
            <option value="all" className="bg-white text-[#222]">
              Status
            </option>
            <option value="Published" className="bg-white text-[#222]">
              Published
            </option>
            <option value="Draft" className="bg-white text-[#222]">
              Draft
            </option>
            <option value="Unpublished" className="bg-white text-[#222]">
              Unpublished
            </option>
          </select>
        </div>
      </div>

      <PaginatedFigmaTable
        columns={columns}
        data={rows}
        loading={loading}
        emptyMessage="No integrations found."
        itemLabel="integrations"
        resetDeps={[search, status]}
        rowClassName="hover:bg-slate-50/90"
        stickyHeader
        stickyLastColumn
      />

      <TestIntegrationFormModal open={modal.isOpen} onClose={modal.close} item={modal.selectedItem} onSubmit={handleSave} />
    </div>
  )
}

