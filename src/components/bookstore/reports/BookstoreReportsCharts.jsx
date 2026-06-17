import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BookOpen, IndianRupee, ShoppingCart, Star } from 'lucide-react'
import { formatINR } from '../../../utils/financeFilters'
import { cn } from '../../../utils/cn'
import {
  REPORTS_CATEGORY_REVENUE,
  REPORTS_DAILY_SALES,
  REPORTS_SUMMARY,
} from '../../../constants/bookstoreReportsAnalytics'

const PURPLE = '#7c5cbf'
const BLUE = '#55ace7'

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e8eaed',
  boxShadow: '0 8px 24px rgba(15,23,42,0.1)',
  fontSize: 12,
}

function ChartShell({ title, subtitle, children, className }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200/70 bg-white p-4 shadow-[0_18px_48px_rgba(15,23,42,0.06)] sm:p-5',
        className,
      )}
    >
      <div className="mb-4">
        <h3 className="text-sm font-bold text-[#111] sm:text-base">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-[#686868]">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

function SummaryCard({ icon: Icon, label, value, accent }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/70 bg-white shadow-[0_18px_48px_rgba(15,23,42,0.06)]">
      <div className={cn('flex items-center gap-2 bg-gradient-to-r px-4 py-3 text-white', accent)}>
        <Icon className="h-5 w-5 shrink-0 opacity-90" strokeWidth={2.2} />
        <p className="text-sm font-semibold">{label}</p>
      </div>
      <div className="px-4 py-4">
        <p className="text-xl font-bold text-[#1a3a5c] sm:text-2xl">{value}</p>
      </div>
    </div>
  )
}

export function ReportsSummaryCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        icon={BookOpen}
        label="Total Books Sold"
        value={REPORTS_SUMMARY.totalBooksSold.toLocaleString()}
        accent="from-[#7c5cbf] to-[#6a4fb0]"
      />
      <SummaryCard
        icon={IndianRupee}
        label="Total Revenue"
        value={formatINR(REPORTS_SUMMARY.totalRevenue)}
        accent="from-[#55ace7] to-[#246392]"
      />
      <SummaryCard
        icon={ShoppingCart}
        label="Total Orders"
        value={REPORTS_SUMMARY.totalOrders.toLocaleString()}
        accent="from-[#2d9d78] to-[#1a6b52]"
      />
      <SummaryCard
        icon={Star}
        label="Best Selling Book"
        value={REPORTS_SUMMARY.bestSellingBook}
        accent="from-[#e67e22] to-[#c0392b]"
      />
    </div>
  )
}

export function ReportsDailySalesList() {
  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
      {REPORTS_DAILY_SALES.map((row) => (
        <li
          key={row.label}
          className="flex items-center justify-between rounded-lg border border-[#eef0f4] bg-[#fafbfc] px-3 py-2.5 text-sm"
        >
          <span className="font-medium text-[#111]">{row.day}</span>
          <span className="font-semibold tabular-nums text-[#246392]">{formatINR(row.amount)}</span>
        </li>
      ))}
    </ul>
  )
}

export function ReportsDailySalesLineChart() {
  return (
    <div className="h-[min(280px,40vh)] w-full min-h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={REPORTS_DAILY_SALES} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="reportsLineGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={PURPLE} />
              <stop offset="100%" stopColor={BLUE} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#686868', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: '#686868', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [formatINR(v), 'Sales']}
            labelFormatter={(label) => {
              const row = REPORTS_DAILY_SALES.find((d) => d.label === label)
              return row?.day ?? label
            }}
          />
          <Line
            type="monotone"
            dataKey="amount"
            stroke="url(#reportsLineGrad)"
            strokeWidth={3}
            dot={{ fill: PURPLE, stroke: '#fff', strokeWidth: 2, r: 5 }}
            activeDot={{ r: 7, fill: BLUE }}
            animationDuration={900}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ReportsDailySalesBarChart() {
  return (
    <div className="h-[min(280px,40vh)] w-full min-h-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={REPORTS_DAILY_SALES} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: '#686868', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: '#686868', fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [formatINR(v), 'Sales']}
          />
          <Bar dataKey="amount" radius={[8, 8, 0, 0]} animationDuration={800} maxBarSize={44}>
            {REPORTS_DAILY_SALES.map((_, i) => (
              <Cell key={i} fill={i % 2 === 0 ? PURPLE : BLUE} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ReportsCategoryPieChart() {
  return (
    <div className="h-[min(300px,42vh)] w-full min-h-[240px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={REPORTS_CATEGORY_REVENUE}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={58}
            outerRadius={92}
            paddingAngle={3}
            label={({ label, value }) => `${label} ${value}%`}
            labelLine={{ stroke: '#9ca0a8', strokeWidth: 1 }}
            animationDuration={800}
          >
            {REPORTS_CATEGORY_REVENUE.map((entry) => (
              <Cell key={entry.label} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(v) => [`${v}%`, 'Share']}
          />
          <Legend
            layout="horizontal"
            verticalAlign="bottom"
            wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

export function ReportsDateWiseSalesSection() {
  return (
    <ChartShell title="Date-wise sales" subtitle="Daily bookstore revenue for the current week">
      <div className="grid gap-5 xl:grid-cols-12">
        <div className="xl:col-span-3">
          <ReportsDailySalesList />
        </div>
        <div className="space-y-5 xl:col-span-9">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#686868]">Sales trend</p>
            <ReportsDailySalesLineChart />
          </div>
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-[#686868]">Daily comparison</p>
            <ReportsDailySalesBarChart />
          </div>
        </div>
      </div>
    </ChartShell>
  )
}

export function ReportsCategoryRevenueSection() {
  return (
    <ChartShell
      title="Book category revenue"
      subtitle="Revenue distribution by book category"
    >
      <ReportsCategoryPieChart />
    </ChartShell>
  )
}
