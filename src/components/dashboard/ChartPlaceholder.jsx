import { Card, CardBody, CardHeader, CardTitle } from '../ui/Card'

export default function ChartPlaceholder({ title, height = 'h-48 sm:h-56' }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardBody>
        <div
          className={`${height} flex items-center justify-center rounded-xl border border-dashed border-[var(--color-border)] bg-gradient-to-br from-slate-50 to-white`}
        >
          <div className="flex w-full max-w-md items-end justify-center gap-2 px-4">
            {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t-md bg-gradient-to-t from-[#49c5ff]/40 to-[#655ed3]/60"
                style={{ height: `${h}%`, maxHeight: '120px' }}
              />
            ))}
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-[var(--color-text-muted)]">
          Chart placeholder — connect Recharts or your API
        </p>
      </CardBody>
    </Card>
  )
}
