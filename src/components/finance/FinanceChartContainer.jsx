import { cn } from '../../utils/cn'

export default function FinanceChartContainer({ children, className }) {
  return (
    <div
      className={cn(
        'grid gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-2',
        '[&>*]:min-w-0',
        className,
      )}
    >
      {children}
    </div>
  )
}
