import { useQuery } from '@tanstack/react-query'
import { getBatchDropdown } from '../services/recording.service'
import { getFacultySubjectId } from '../utils/sessionStorage'
import { batchDropdownKeys } from './queryKeys'
import { normalizeBatchesDropdownResponse } from '../utils/liveClassHelpers'
import { resolveCenterOptionId } from '../utils/recordingHelpers'
import { getApiErrorMessage } from '../utils/apiError'
import { withRateLimitRetry } from '../utils/rateLimitRetry'

/**
 * POST /api/batches/dropdown — batches scoped to faculty subject (+ center).
 * label: batchName · value: Mongo _id
 */
export function useFacultySubjectBatchesDropdown({
  facultySubjectId,
  centerId,
  centerOptions = [],
  enabled = true,
  requireCenter = true,
} = {}) {
  const resolvedSubjectId = String(facultySubjectId || getFacultySubjectId() || '').trim()

  const resolvedCenterId =
    resolveCenterOptionId(centerId, centerOptions) ||
    String(centerId || '').trim()

  const hasCenter = Boolean(resolvedCenterId)
  const canFetch = Boolean(
    enabled && resolvedSubjectId && (!requireCenter || hasCenter),
  )

  const query = useQuery({
    queryKey: batchDropdownKeys.scoped(resolvedSubjectId, requireCenter ? resolvedCenterId : ''),
    queryFn: async ({ signal }) => {
      const payload = { facultySubjectId: resolvedSubjectId, signal }
      if (requireCenter) {
        payload.centerId = resolvedCenterId
      } else if (hasCenter) {
        payload.centerId = resolvedCenterId
      }
      const data = await withRateLimitRetry(() => getBatchDropdown(payload))
      return normalizeBatchesDropdownResponse(data)
    },
    enabled: canFetch,
    staleTime: 60_000,
    retry: 1,
  })

  const batches = canFetch ? query.data ?? [] : []
  const loading = canFetch && (query.isLoading || query.isFetching)
  const error = query.error
    ? getApiErrorMessage(query.error, 'Unable to load batches')
    : null

  return {
    batches,
    loading,
    isFetching: query.isFetching,
    error,
    isEmpty: canFetch && !loading && !error && batches.length === 0,
    refetch: query.refetch,
    resolvedSubjectId,
    resolvedCenterId: requireCenter ? resolvedCenterId : hasCenter ? resolvedCenterId : '',
  }
}
