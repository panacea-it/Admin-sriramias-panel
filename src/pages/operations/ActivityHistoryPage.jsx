import { useCallback, useEffect, useMemo, useState } from 'react'
import { History, Loader2, ScrollText } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import { fetchAuditLogFilterOptions, fetchAuditLogs } from '../../services/auditLogService'
import { formatCategoryDateTime } from '../../utils/formatDateTime'
import { toast } from '@/utils/toast'
import { cn } from '../../utils/cn'

const ACTION_LABELS = {
  CREATE: 'Created',
  UPDATE: 'Updated',
  DELETE: 'Deleted',
  STATUS_CHANGE: 'Status Changed',
  RESET_PASSWORD: 'Reset Password',
  UPLOAD_IMAGE: 'Uploaded Image',
  REPLACE_IMAGE: 'Replaced Image',
}

function formatActionLabel(action, actionLabel) {
  if (actionLabel) return actionLabel
  return ACTION_LABELS[action] || action || 'Updated'
}

function ActivityHistoryFilterBar({
  search,
  onSearchChange,
  moduleFilter,
  onModuleChange,
  actionFilter,
  onActionChange,
  userFilter,
  onUserChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  moduleOptions,
  actionOptions,
  userOptions,
}) {
  const selectClass =
    'h-10 min-w-0 rounded-xl border border-[#E7ECF5] bg-white px-3 text-sm font-medium text-[#03045e] outline-none transition focus:border-[#55ace7]/50 focus:ring-2 focus:ring-[#55ace7]/20'

  return (
    <div className="rounded-2xl border border-[#E7ECF5] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <label className="block md:col-span-2 xl:col-span-3">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Search
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by user, module, or record…"
            className="h-10 w-full rounded-xl border border-[#E7ECF5] bg-[#fafcff] px-3 text-sm outline-none transition focus:border-[#55ace7]/50 focus:ring-2 focus:ring-[#55ace7]/20"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Module
          </span>
          <select value={moduleFilter} onChange={(e) => onModuleChange(e.target.value)} className={selectClass}>
            <option value="all">All modules</option>
            {moduleOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Action Type
          </span>
          <select value={actionFilter} onChange={(e) => onActionChange(e.target.value)} className={selectClass}>
            <option value="all">All actions</option>
            {actionOptions.map((item) => (
              <option key={item} value={item}>
                {formatActionLabel(item)}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            User
          </span>
          <select value={userFilter} onChange={(e) => onUserChange(e.target.value)} className={selectClass}>
            <option value="all">All users</option>
            {userOptions.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Date From
          </span>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => onDateFromChange(e.target.value)}
            className={selectClass}
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
            Date To
          </span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => onDateToChange(e.target.value)}
            className={selectClass}
          />
        </label>
      </div>
    </div>
  )
}

function ActionBadge({ action, label }) {
  const styles = {
    CREATE: 'bg-emerald-50 text-emerald-700 ring-emerald-200/70',
    UPDATE: 'bg-sky-50 text-sky-700 ring-sky-200/70',
    DELETE: 'bg-rose-50 text-rose-700 ring-rose-200/70',
    STATUS_CHANGE: 'bg-amber-50 text-amber-700 ring-amber-200/70',
    RESET_PASSWORD: 'bg-violet-50 text-violet-700 ring-violet-200/70',
    UPLOAD_IMAGE: 'bg-indigo-50 text-indigo-700 ring-indigo-200/70',
    REPLACE_IMAGE: 'bg-fuchsia-50 text-fuchsia-700 ring-fuchsia-200/70',
  }

  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset',
        styles[action] || 'bg-slate-50 text-slate-700 ring-slate-200/70',
      )}
    >
      {formatActionLabel(action, label)}
    </span>
  )
}

export default function ActivityHistoryPage({ title = 'Activity History' }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [moduleFilter, setModuleFilter] = useState('all')
  const [actionFilter, setActionFilter] = useState('all')
  const [userFilter, setUserFilter] = useState('all')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 1,
  })
  const [filterOptions, setFilterOptions] = useState({
    modules: [],
    actions: [],
    users: [],
  })

  const loadFilterOptions = useCallback(async (signal) => {
    try {
      const options = await fetchAuditLogFilterOptions(signal)
      setFilterOptions(options)
    } catch (error) {
      if (error?.name !== 'CanceledError') {
        console.error('Failed to load audit log filters:', error)
      }
    }
  }, [])

  const loadLogs = useCallback(
    async (signal) => {
      try {
        setLoading(true)
        const result = await fetchAuditLogs(
          {
            page,
            limit: pageSize,
            search: search.trim(),
            module: moduleFilter,
            action: actionFilter,
            actorName: userFilter,
            dateFrom,
            dateTo,
          },
          signal,
        )
        setRows(result.rows)
        setPagination(result.pagination)
      } catch (error) {
        if (error?.name !== 'CanceledError') {
          console.error('Failed to load audit logs:', error)
          toast.error('Unable to load activity history')
        }
      } finally {
        setLoading(false)
      }
    },
    [page, pageSize, search, moduleFilter, actionFilter, userFilter, dateFrom, dateTo],
  )

  useEffect(() => {
    const controller = new AbortController()
    loadFilterOptions(controller.signal)
    return () => controller.abort()
  }, [loadFilterOptions])

  useEffect(() => {
    const controller = new AbortController()
    loadLogs(controller.signal)
    return () => controller.abort()
  }, [loadLogs])

  useEffect(() => {
    setPage(1)
  }, [search, moduleFilter, actionFilter, userFilter, dateFrom, dateTo, pageSize])

  const columns = useMemo(
    () => [
      {
        key: 'createdAt',
        header: 'Date & Time',
        className: 'min-w-[180px]',
        render: (row) => (
          <div className="text-sm font-medium text-[#03045e]">
            {formatCategoryDateTime(row.createdAt)}
          </div>
        ),
      },
      {
        key: 'actor',
        header: 'User',
        className: 'min-w-[160px]',
        render: (row) => (
          <div>
            <p className="text-sm font-semibold text-[#03045e]">{row.actorName}</p>
            <p className="text-xs text-slate-500">{row.actorRole}</p>
          </div>
        ),
      },
      {
        key: 'module',
        header: 'Module',
        className: 'min-w-[150px]',
        render: (row) => (
          <span className="text-sm font-medium text-slate-700">{row.module}</span>
        ),
      },
      {
        key: 'action',
        header: 'Action',
        className: 'min-w-[130px]',
        render: (row) => <ActionBadge action={row.action} label={row.actionLabel} />,
      },
      {
        key: 'recordName',
        header: 'Record',
        className: 'min-w-[180px]',
        render: (row) => (
          <span className="text-sm font-semibold text-[#005b9a]">
            {row.recordName || '—'}
          </span>
        ),
      },
    ],
    [],
  )

  const controlledPagination = useMemo(() => {
    const totalItems = pagination.total || 0
    const totalPages = pagination.totalPages || 1
    const safePage = Math.min(Math.max(1, page), totalPages)
    const startIndex = totalItems === 0 ? 0 : (safePage - 1) * pageSize
    const endIndex = Math.min(startIndex + pageSize, totalItems)

    return {
      page: safePage,
      pageSize,
      totalItems,
      totalPages,
      startIndex,
      endIndex,
      onPageChange: setPage,
      onPageSizeChange: setPageSize,
    }
  }, [page, pageSize, pagination.total, pagination.totalPages])

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 py-5 sm:px-6 lg:px-7">
      <div className="mx-auto max-w-screen-xl space-y-5">
        <PageBanner
          icon={title === 'Audit Logs' ? ScrollText : History}
          title={title}
          subtitle="Track who performed each action, on which module and record, and when it happened."
        />

        <ActivityHistoryFilterBar
          search={search}
          onSearchChange={setSearch}
          moduleFilter={moduleFilter}
          onModuleChange={setModuleFilter}
          actionFilter={actionFilter}
          onActionChange={setActionFilter}
          userFilter={userFilter}
          onUserChange={setUserFilter}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          moduleOptions={filterOptions.modules}
          actionOptions={filterOptions.actions}
          userOptions={filterOptions.users}
        />

        <div className="rounded-2xl border border-[#E7ECF5] bg-white p-4 shadow-[0_4px_16px_rgba(0,0,0,0.04)] sm:p-5">
          {loading && rows.length === 0 ? (
            <div className="flex min-h-[240px] items-center justify-center gap-2 text-sm font-medium text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-[#03045e]" />
              Loading activity history…
            </div>
          ) : (
            <PaginatedFigmaTable
              columns={columns}
              data={rows}
              loading={loading}
              emptyMessage="No activity logs found for the selected filters."
              itemLabel="logs"
              initialPageSize={pageSize}
              controlledPagination={controlledPagination}
              resetDeps={[
                search,
                moduleFilter,
                actionFilter,
                userFilter,
                dateFrom,
                dateTo,
                page,
                pageSize,
              ]}
              stickyHeader
              zebraStriping
            />
          )}
        </div>
      </div>
    </div>
  )
}
