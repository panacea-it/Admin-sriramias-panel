import { motion } from 'framer-motion'
import {
  Area,
  AreaChart,
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
import { formatINR } from '../../../utils/financeFilters'
import { cn } from '../../../utils/cn'

const PURPLE = '#7c5cbf'
const BLUE = '#55ace7'
const PIE_COLORS = ['#7c5cbf', '#55ace7', '#2d9d78', '#e67e22']

function ChartCard({ title, subtitle, badge, children, className, tall }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'rounded-2xl border border-[#eef0f4] bg-white p-4 shadow-[0_8px_30px_rgba(15,23,42,0.06)] sm:p-5',
        tall && 'min-h-[380px]',
        className,
      )}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-[#111] sm:text-base">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-[#686868]">{subtitle}</p>}
        </div>
        {badge && (
          <span className="rounded-full bg-[#7c5cbf]/10 px-2.5 py-1 text-xs font-semibold text-[#7c5cbf]">
            {badge}
          </span>
        )}
      </div>
      {children}
    </motion.div>
  )
}

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e8eaed',
  boxShadow: '0 8px 24px rgba(15,23,42,0.1)',
  fontSize: 12,
}

export function RevenueAreaChart({ data = [], weekTotal }) {
  return (
    <ChartCard
      title="Revenue Analytics"
      subtitle="Daily revenue performance"
      badge={weekTotal ? `Week ${formatINR(weekTotal)}` : undefined}
      tall
      className="lg:col-span-2"
    >
      <div className="h-[min(350px,50vh)] w-full min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PURPLE} stopOpacity={0.35} />
                <stop offset="100%" stopColor={BLUE} stopOpacity={0.02} />
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
              formatter={(v) => [formatINR(v), 'Revenue']}
              labelStyle={{ fontWeight: 600, color: '#111' }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke={PURPLE}
              strokeWidth={2.5}
              fill="url(#revenueFill)"
              animationDuration={900}
              dot={{ fill: PURPLE, r: 4, strokeWidth: 0 }}
              activeDot={{ r: 6, fill: BLUE }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

export function ProductSalesBarChart({ data = [] }) {
  return (
    <ChartCard title="Top Selling Categories" subtitle="Units sold by category">
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 48 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: '#686868', fontSize: 10 }}
              angle={-28}
              textAnchor="end"
              height={56}
              axisLine={false}
              tickLine={false}
            />
            <YAxis tick={{ fill: '#686868', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="sales" radius={[8, 8, 0, 0]} animationDuration={800} maxBarSize={48}>
              {data.map((_, i) => (
                <Cell key={i} fill={i % 2 === 0 ? PURPLE : BLUE} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

export function OrderTrendsLineChart({ data = [] }) {
  return (
    <ChartCard title="Order Trends" subtitle="Weekly order volume">
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor={PURPLE} />
                <stop offset="100%" stopColor={BLUE} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: '#686868', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#686868', fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="url(#lineGrad)"
              strokeWidth={3}
              dot={{ fill: PURPLE, stroke: '#fff', strokeWidth: 2, r: 5 }}
              activeDot={{ r: 7, fill: BLUE }}
              animationDuration={900}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}

export function ComboPerformancePieChart({ data = [] }) {
  return (
    <ChartCard title="Combo Performance" subtitle="Share of combo sales">
      <div className="h-[280px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              cx="50%"
              cy="50%"
              innerRadius={58}
              outerRadius={88}
              paddingAngle={3}
              animationDuration={800}
            >
              {data.map((_, i) => (
                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              wrapperStyle={{ fontSize: 11, paddingTop: 12 }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  )
}
