export default function ProgressBar({ value, color = '#005b9a' }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
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
