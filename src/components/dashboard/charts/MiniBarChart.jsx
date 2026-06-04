export default function MiniBarChart({ color = '#655ed3', className = '' }) {
  return (
    <svg
      width="56"
      height="48"
      viewBox="0 0 56 48"
      fill="none"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <rect x="6" y="22" width="11" height="26" rx="2" fill={color} opacity="0.45" />
      <rect x="22" y="10" width="11" height="38" rx="2" fill={color} />
      <rect x="38" y="26" width="11" height="22" rx="2" fill={color} opacity="0.72" />
    </svg>
  )
}
