import { useMemo, useState } from 'react'
import { Layers } from 'lucide-react'
import PageBanner from '../../components/figma/PageBanner'
import PaginatedFigmaTable from '../../components/figma/PaginatedFigmaTable'
import LeadFilterToolbar from '../../components/leads/LeadFilterToolbar'
import LeadStatCards from '../../components/leads/LeadStatCards'
import { cn } from '../../utils/cn'
import { INITIAL_LEADS, LEAD_STATS } from '../../data/leadsData'

function LeadStatusBadge({ status }) {
  const opened = status === 'Opened'
  return (
    <span
      className={cn(
        'inline-flex min-w-[88px] items-center justify-center rounded-full px-4 py-1.5 text-sm font-semibold text-white',
        opened ? 'bg-[#69df66]' : 'bg-[#9ca3af]',
      )}
    >
      {status}
    </span>
  )
}

function CourseCell({ course, courseSub }) {
  return (
    <div className="flex flex-col gap-0.5 leading-snug">
      <span>{course}</span>
      {courseSub && <span className="text-[#686868]">{courseSub}</span>}
    </div>
  )
}

function DateCell({ time, date }) {
  return (
    <div className="flex flex-col gap-0.5 leading-snug">
      <span>
        {time}
        <span className="text-[#9ca0a8]"> ,</span>
      </span>
      <span className="text-[#686868]">{date}</span>
    </div>
  )
}

export default function LeadsPage() {
  const [leads] = useState(INITIAL_LEADS)
  const [search, setSearch] = useState('')
  const [centerFilter, setCenterFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('all')
  const [leadsFilter, setLeadsFilter] = useState('all')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads.filter((row) => {
      const courseText = `${row.course} ${row.courseSub || ''}`.toLowerCase()
      const matchSearch = !q || courseText.includes(q)
      const matchCenter = centerFilter === 'all' || row.center === centerFilter
      const matchDate = dateFilter === 'all' || row.dateBucket === dateFilter
      const matchType = leadsFilter === 'all' || row.type === leadsFilter
      return matchSearch && matchCenter && matchDate && matchType
    })
  }, [leads, search, centerFilter, dateFilter, leadsFilter])

  const columns = [
    {
      key: 'userName',
      label: 'User Name',
      headerClassName: 'pl-6 sm:pl-10',
      cellClassName: 'pl-6 sm:pl-10 align-top',
      render: (row) => (
        <span className={cn('font-medium', row.userName === '—' && 'text-[#9ca0a8]')}>
          {row.userName}
        </span>
      ),
    },
    {
      key: 'email',
      label: 'Email ID',
      cellClassName: 'align-top',
      render: (row) => (
        <span className={cn(row.email === '—' && 'text-[#9ca0a8]')}>{row.email}</span>
      ),
    },
    {
      key: 'mobile',
      label: 'Mobile Number',
      cellClassName: 'align-top whitespace-nowrap',
      render: (row) => (
        <span className={cn(row.mobile === '—' && 'text-[#9ca0a8]')}>{row.mobile}</span>
      ),
    },
    {
      key: 'course',
      label: 'Course visited',
      cellClassName: 'align-top min-w-[140px]',
      render: (row) => <CourseCell course={row.course} courseSub={row.courseSub} />,
    },
    {
      key: 'date',
      label: 'Date',
      cellClassName: 'align-top min-w-[120px]',
      render: (row) => <DateCell time={row.time} date={row.date} />,
    },
    {
      key: 'type',
      label: 'Type',
      cellClassName: 'align-top',
      render: (row) => (
        <span
          className={cn(
            'font-semibold',
            row.type === 'Hot' ? 'text-[#dc2626]' : 'text-[#246392]',
          )}
        >
          {row.type}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      cellClassName: 'align-top',
      render: (row) => <LeadStatusBadge status={row.status} />,
    },
  ]

  return (
    <div className="figma-admin-section min-h-screen bg-[#f7f7f7] px-4 pb-8 pt-6 sm:px-5 lg:px-6">
      <section className="mx-auto max-w-screen-2xl space-y-5 sm:space-y-6">
        <PageBanner
          icon={Layers}
          iconClassName="text-[#55ace7]"
          title="Leads"
          className="from-[#55ace7] via-[#7eb3d4] to-[#df8284]"
        />

        <LeadFilterToolbar
          search={search}
          onSearchChange={(e) => setSearch(e.target.value)}
          center={centerFilter}
          onCenterChange={(e) => setCenterFilter(e.target.value)}
          dateRange={dateFilter}
          onDateRangeChange={(e) => setDateFilter(e.target.value)}
          leadsFilter={leadsFilter}
          onLeadsFilterChange={(e) => setLeadsFilter(e.target.value)}
        />

        <LeadStatCards stats={LEAD_STATS} />

        <PaginatedFigmaTable
          columns={columns}
          data={filtered}
          emptyMessage="No leads match your filters."
          itemLabel="leads"
          resetDeps={[search, centerFilter, dateFilter, leadsFilter]}
          rowClassName="hover:bg-slate-50/90"
        />
      </section>
    </div>
  )
}
