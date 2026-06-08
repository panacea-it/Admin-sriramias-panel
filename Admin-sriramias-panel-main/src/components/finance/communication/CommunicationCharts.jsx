import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { cn } from '../../../utils/cn'

const COLORS = ['#246392', '#55ace7', '#69df66', '#efb36d', '#df8284', '#6366f1']

function ChartShell({ title, children, className }) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-4 shadow-sm', className)}>
      <h3 className="mb-3 text-sm font-bold text-[#1a3a5c]">{title}</h3>
      <div className="h-[220px]">{children}</div>
    </div>
  )
}

export function CommunicationActivityChart({ data = [], className }) {
  const chartData = data.length ? data : [{ date: '—', count: 0 }]
  return (
    <ChartShell title="Daily communication activity" className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="count" fill="#55ace7" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

export function CommunicationChannelChart({ data = [], className }) {
  const chartData = data.length ? data : [{ channel: 'None', count: 0 }]
  return (
    <ChartShell title="Channel usage" className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chartData} dataKey="count" nameKey="channel" cx="50%" cy="50%" outerRadius={70} label={({ channel, percent }) => `${channel} ${(percent * 100).toFixed(0)}%`}>
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}

export function CommunicationDeliveryTrendChart({ data = [], className }) {
  const chartData = data.length ? data : [{ date: '—', delivered: 0, failed: 0 }]
  return (
    <ChartShell title="Delivery success trends" className={className}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
          <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
          <Tooltip />
          <Bar dataKey="delivered" stackId="a" fill="#69df66" radius={[0, 0, 0, 0]} />
          <Bar dataKey="failed" stackId="a" fill="#df8284" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  )
}
