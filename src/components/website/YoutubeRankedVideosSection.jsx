import { useCallback, useEffect, useMemo, useState } from 'react'
import { Loader2, Search } from 'lucide-react'
import PaginatedFigmaTable from '../figma/PaginatedFigmaTable'
import CategoryEmptyState from '../categories/CategoryEmptyState'
import YoutubePriorityBadge from './YoutubePriorityBadge'
import {
  DateTimeInline,
  WebsiteStatusBadge,
  YoutubeUrlLink,
} from './websiteUi'
import {
  useRankedYoutubeVideos,
  useSearchRankedYoutubeVideos,
} from '../../hooks/useYoutubeVideos'
import { buildRankedYoutubeSearchParams } from '../../utils/youtubeApiHelpers'
import { getApiErrorMessage } from '../../utils/apiError'
import { cn } from '../../utils/cn'

const LIST_PARAMS = { minRank: 1 }

function RankedThumbnailCell({ thumbnailUrl, title }) {
  const src = thumbnailUrl || '/assets/youtube_video_image.png'

  return (
    <div className="h-12 w-20 overflow-hidden rounded-md bg-[#eef2fc]">
      <img
        src={src}
        alt={title ? `${title} thumbnail` : 'Video thumbnail'}
        className="h-full w-full object-cover"
        loading="lazy"
        onError={(event) => {
          event.currentTarget.onerror = null
          event.currentTarget.src = '/assets/youtube_video_image.png'
        }}
      />
    </div>
  )
}

export default function YoutubeRankedVideosSection() {
  const [searchInput, setSearchInput] = useState('')
  const [appliedSearchParams, setAppliedSearchParams] = useState(null)
  const isSearchMode = appliedSearchParams != null

  const listQuery = useRankedYoutubeVideos(LIST_PARAMS, { enabled: !isSearchMode })
  const searchQuery = useSearchRankedYoutubeVideos(appliedSearchParams, {
    enabled: isSearchMode,
  })

  const activeQuery = isSearchMode ? searchQuery : listQuery
  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
  } = activeQuery

  const [tableItems, setTableItems] = useState([])

  useEffect(() => {
    if (isError || !data?.items) return
    setTableItems(data.items)
  }, [data?.items, isError])

  const rankedVideos = isError ? tableItems : (data?.items ?? [])
  const isInitialLoading = isLoading && rankedVideos.length === 0
  const isEmpty = !isInitialLoading && !isFetching && !isError && (data?.items ?? []).length === 0

  const errorMessage = isError
    ? getApiErrorMessage(
        error,
        isSearchMode
          ? 'Unable to search ranked YouTube videos. Please try again.'
          : 'Unable to fetch ranked YouTube videos. Please try again.',
      )
    : ''

  useEffect(() => {
    if (searchInput.trim() !== '') return
    setAppliedSearchParams(null)
  }, [searchInput])

  const runSearch = useCallback(() => {
    const trimmed = searchInput.trim()
    if (!trimmed) {
      setAppliedSearchParams(null)
      return
    }

    setAppliedSearchParams(buildRankedYoutubeSearchParams(trimmed))
  }, [searchInput])

  const columns = useMemo(
    () => [
      {
        key: 'rank',
        label: 'Rank',
        headerClassName: 'min-w-[80px] whitespace-nowrap pl-4 sm:pl-6',
        cellClassName: 'min-w-[80px] align-middle whitespace-nowrap pl-4 sm:pl-6',
        render: (row) =>
          row.rank ? (
            <YoutubePriorityBadge priorityOrder={row.rank} stacked />
          ) : (
            <span className="text-sm text-[#9ca0a8]">—</span>
          ),
      },
      {
        key: 'thumbnail',
        label: 'Thumbnail',
        headerClassName: 'min-w-[96px]',
        cellClassName: 'min-w-[96px] align-middle',
        render: (row) => (
          <RankedThumbnailCell thumbnailUrl={row.thumbnailUrl} title={row.name} />
        ),
      },
      {
        key: 'name',
        label: 'Video Title',
        headerClassName: 'min-w-[180px]',
        cellClassName: 'min-w-[180px] align-middle',
        render: (row) => (
          <span className="block max-w-[220px] truncate font-semibold text-[#111]">{row.name}</span>
        ),
      },
      {
        key: 'description',
        label: 'Description',
        headerClassName: 'min-w-[200px]',
        cellClassName: 'min-w-[200px] align-middle',
        render: (row) => (
          <span className="block max-w-[260px] truncate text-sm text-[#333]">
            {row.description || '—'}
          </span>
        ),
      },
      {
        key: 'url',
        label: 'YouTube URL',
        headerClassName: 'min-w-[200px]',
        cellClassName: 'min-w-[200px] align-middle',
        render: (row) => <YoutubeUrlLink url={row.url} />,
      },
      {
        key: 'status',
        label: 'Status',
        headerClassName: 'min-w-[110px] whitespace-nowrap',
        cellClassName: 'min-w-[110px] align-middle whitespace-nowrap',
        render: (row) => <WebsiteStatusBadge status={row.status} />,
      },
      {
        key: 'priority',
        label: 'Priority',
        headerClassName: 'min-w-[90px] whitespace-nowrap',
        cellClassName: 'min-w-[90px] align-middle whitespace-nowrap',
        render: (row) =>
          row.priority > 0 ? (
            <span className="text-sm font-semibold text-[#111]">{row.priority}</span>
          ) : (
            <span className="text-sm text-[#9ca0a8]">—</span>
          ),
      },
      {
        key: 'createdBy',
        label: 'Created By',
        headerClassName: 'min-w-[140px]',
        cellClassName: 'min-w-[140px] align-middle text-sm text-[#333]',
        render: (row) => (
          <span className="block max-w-[160px] truncate">{row.createdByName || '—'}</span>
        ),
      },
      {
        key: 'updatedBy',
        label: 'Updated By',
        headerClassName: 'min-w-[140px]',
        cellClassName: 'min-w-[140px] align-middle text-sm text-[#333]',
        render: (row) => (
          <span className="block max-w-[160px] truncate">{row.updatedByName || '—'}</span>
        ),
      },
      {
        key: 'created',
        label: 'Created Date',
        headerClassName: 'min-w-[150px] whitespace-nowrap',
        cellClassName: 'min-w-[150px] align-middle whitespace-nowrap',
        render: (row) => <DateTimeInline time={row.time} date={row.date} />,
      },
      {
        key: 'updated',
        label: 'Updated Date',
        headerClassName: 'min-w-[150px] whitespace-nowrap pr-4 sm:pr-6',
        cellClassName: 'min-w-[150px] align-middle whitespace-nowrap pr-4 sm:pr-6',
        render: (row) => <DateTimeInline time={row.updatedTime} date={row.updatedDate} />,
      },
    ],
    [],
  )

  const showListEmptyState = isEmpty && !isError && !isSearchMode
  const showSearchEmptyState = isEmpty && !isError && isSearchMode
  const showTable = !showListEmptyState && !showSearchEmptyState

  return (
    <div className="space-y-4">
      <div className="flex min-h-[56px] flex-wrap items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.07)] sm:gap-4">
        <div className="relative w-full min-w-0 flex-1 lg:max-w-lg">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#687180]" />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                runSearch()
              }
            }}
            placeholder="Search ranked videos by title or rank"
            aria-label="Search ranked YouTube videos"
            className="h-10 min-h-[40px] w-full rounded-lg bg-[#eef2fc] pl-10 pr-3 text-sm text-[#222] outline-none placeholder:text-[#9ca0a8] focus:ring-2 focus:ring-[#55ace7]/45"
          />
        </div>
        <button
          type="button"
          onClick={runSearch}
          disabled={isFetching}
          className="inline-flex h-10 min-h-[40px] min-w-[110px] items-center justify-center gap-2 rounded-lg bg-gradient-to-b from-[#1e4d73] via-[#246392] to-[#0f2d45] px-5 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <Search className="h-4 w-4" aria-hidden />
          )}
          Search
        </button>
      </div>

      {errorMessage ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-[#dc2626]">
          {errorMessage}
        </div>
      ) : null}

      {showListEmptyState ? (
        <CategoryEmptyState
          title="No Ranked YouTube Videos Available"
          description="Assign ranks to YouTube videos from the All Videos tab to display them here."
        />
      ) : null}

      {showSearchEmptyState ? (
        <CategoryEmptyState title="No Ranked YouTube Videos Found" />
      ) : null}

      {showTable ? (
        <PaginatedFigmaTable
          columns={columns}
          data={rankedVideos}
          emptyMessage={
            isSearchMode ? 'No Ranked YouTube Videos Found' : 'No Ranked YouTube Videos Available'
          }
          itemLabel="ranked videos"
          initialPageSize={10}
          loading={isInitialLoading || isFetching}
          skeletonRowCount={6}
          density="comfortable"
          rowClassName="hover:bg-[#eef6fc]/70"
          className="rounded-xl border border-slate-100 bg-white shadow-[0_8px_28px_rgba(15,23,42,0.08)]"
          tableClassName="rounded-none border-0 shadow-none"
          tableMinWidth={1680}
          gradientActivePage
          paginationClassName={cn(isFetching && 'pointer-events-none opacity-60')}
        />
      ) : null}
    </div>
  )
}
