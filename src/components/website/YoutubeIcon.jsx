/** YouTube-style mark for website banners (Figma: red play in white circle) */
export default function YoutubeIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#FF0000"
        d="M23.5 6.2s-.2-1.6-.8-2.3c-.8-.9-1.7-.9-2.1-1C17.6 2.5 12 2.5 12 2.5h-.1s-5.6 0-8.6.4c-.4 0-1.3.1-2.1 1-.6.7-.8 2.3-.8 2.3S0 8.1 0 10v1.9c0 1.9.2 3.8.2 3.8s.2 1.6.8 2.3c.8.9 1.9.9 2.4 1 1.7.2 7.3.4 8.6.4 1.3 0 6.9-.2 8.6-.4.5-.1 1.6-.1 2.4-1 .6-.7.8-2.3.8-2.3s.2-1.9.2-3.8V10c0-1.9-.2-3.8-.2-3.8z"
      />
      <path fill="#FFF" d="M9.6 15.5V8.5l6.2 3.5-6.2 3.5z" />
    </svg>
  )
}
