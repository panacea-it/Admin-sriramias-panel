import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export function RewardDistributionLineChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="rewardDist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#55ace7" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#55ace7" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => [`${v} 1S`, 'Coins']} />
        <Area type="monotone" dataKey="coins" stroke="#246392" fill="url(#rewardDist)" strokeWidth={2} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function RedemptionBarChart({ data = [] }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e8e8e8" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} />
        <Tooltip formatter={(v) => [`${v} 1S`, 'Redeemed']} />
        <Bar dataKey="coins" fill="#1a3a5c" radius={[6, 6, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
