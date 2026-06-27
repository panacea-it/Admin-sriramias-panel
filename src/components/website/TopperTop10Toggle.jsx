import TopperTableToggle from './TopperTableToggle'
import RankTop10Badge from './RankTop10Badge'
import { isActiveTop10Ranker } from './rankManagementDisplay'

export default function TopperTop10Toggle({
  row,
  loading = false,
  disabled = false,
  onChange,
}) {
  const topperName = row?.name || 'topper'
  const showBadge = isActiveTop10Ranker(row)

  return (
    <div className="flex flex-col items-center justify-center gap-1.5">
      <TopperTableToggle
        variant="top10"
        checked={Boolean(row?.isTop10Enabled)}
        loading={loading}
        disabled={disabled}
        ariaLabelOn={`${topperName} is marked as Top 10`}
        ariaLabelOff={`${topperName} is not marked as Top 10`}
        onChange={onChange}
      />
      {showBadge ? <RankTop10Badge size="sm" /> : null}
    </div>
  )
}
