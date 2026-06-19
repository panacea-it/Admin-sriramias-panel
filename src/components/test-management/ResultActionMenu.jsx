import { useMemo } from 'react'
import { Download, BarChart3, Eye, GitCompare, Send } from 'lucide-react'
import TableActionMenu from '../common/TableActionMenu'

export default function ResultActionMenu({
  row,
  onViewResult,
  onViewAnalytics,
  onDownloadReport,
  onPublish,
  onCompare,
}) {
  const items = useMemo(
    () => [
      { label: 'View Result', icon: Eye, onClick: () => onViewResult?.(row) },
      { label: 'View Analytics', icon: BarChart3, onClick: () => onViewAnalytics?.(row) },
      { label: 'Download Report', icon: Download, onClick: () => onDownloadReport?.(row) },
      {
        label: 'Publish Result',
        icon: Send,
        onClick: () => onPublish?.(row),
        disabled: row?.status === 'Published',
      },
      { label: 'Compare Performance', icon: GitCompare, onClick: () => onCompare?.(row) },
    ],
    [onCompare, onDownloadReport, onPublish, onViewAnalytics, onViewResult, row],
  )

  return (
    <TableActionMenu
      items={items}
      triggerLabel={`Actions for ${row?.studentName || 'result'}`}
    />
  )
}
