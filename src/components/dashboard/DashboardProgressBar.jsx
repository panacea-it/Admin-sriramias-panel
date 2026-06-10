export default function DashboardProgressBar({ value, color, className = 'h-2' }) {
  return (
    <div className={`w-full overflow-hidden rounded-full bg-gray-200 ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          background: color,
        }}
      />
    </div>
  )
}
