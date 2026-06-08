import { cn } from '../../utils/cn'

/** Official SRIRAM'S IAS lockup — asset: /public/sriram-logo.png (transparent background) */
const LOGO_SRC = '/sriram-logo.png'

const sizes = {
  header:
    'h-9 w-auto max-w-[min(82vw,300px)] sm:h-10 sm:max-w-[360px] md:h-11 md:max-w-[420px] lg:max-w-[460px]',
  login: 'h-12 w-auto max-w-[min(92vw,340px)] sm:h-14 sm:max-w-[400px]',
  compact: 'h-8 w-auto max-w-[min(70vw,220px)] sm:h-9 sm:max-w-[280px]',
}

export default function SriramLogo({
  variant = 'header',
  className,
  linkClassName,
  asLink = false,
  to = '/dashboard',
}) {
  const img = (
    <img
      src={LOGO_SRC}
      alt="SRIRAM'S IAS — Serving The Nation Since 1985"
      width={480}
      height={96}
      decoding="async"
      className={cn(
        'block shrink-0 object-contain object-left',
        sizes[variant] ?? sizes.header,
        className,
      )}
    />
  )

  if (asLink) {
    return (
      <a
        href={to}
        className={cn(
          'inline-flex min-w-0 max-w-full items-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500',
          linkClassName,
        )}
        aria-label="SRIRAM'S IAS — go to dashboard"
      >
        {img}
      </a>
    )
  }

  return <span className={cn('inline-flex min-w-0 max-w-full items-center', linkClassName)}>{img}</span>
}
