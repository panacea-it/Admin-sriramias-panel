export default function MiniSparkline({ color, className = '' }) {
  return (
    <svg
      width="80"
      height="48"
      viewBox="0 0 80 48"
      fill="none"
      className={`shrink-0 ${className}`}
      aria-hidden
    >
      <path
        d="M0 38 Q12 36 24 22 Q36 6 46 14 Q58 22 80 6"
        stroke={color}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M0 38 Q12 36 24 22 Q36 6 46 14 Q58 22 80 6 L80 48 L0 48 Z"
        fill={`${color}22`}
      />
    </svg>
  )
}
