import { cn } from '../../utils/cn'

export default function SalesChartPanel({ title, children, className }) {
  return (
    <div className={cn('rounded-2xl bg-white p-5 shadow-[0_4px_16px_rgba(0,0,0,0.06)] sm:p-6', className)}>
      <h3 className="mb-4 bg-gradient-to-r from-[#1fa2ff] to-[#ef8b8b] bg-clip-text text-base font-black uppercase tracking-wide text-transparent sm:text-lg">
        {title}
      </h3>
      {children}
    </div>
  )
}
