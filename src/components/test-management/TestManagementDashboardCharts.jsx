import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const COLORS = ['#55ace7', '#1a3a5c', '#10b981', '#f59e0b', '#8b5cf6']

export function ParticipationAreaChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="tmPart" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#55ace7" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#55ace7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
        <XAxis dataKey="month" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Area type="monotone" dataKey="attempts" stroke="#55ace7" fill="url(#tmPart)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function TestTypePieChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
        <Legend />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function FacultyBarChart({ data }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
        <XAxis dataKey="faculty" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip />
        <Bar dataKey="avgScore" fill="#1a3a5c" radius={[6, 6, 0, 0]} name="Avg Score %" />
      </BarChart>
    </ResponsiveContainer>
  )
}
