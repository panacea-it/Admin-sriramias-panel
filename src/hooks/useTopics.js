import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { topicService } from '../services/topicService'
import { topicKeys } from './queryKeys'
import { handleApiError } from '../utils/errorHandler'
import { normalizeTopicsListResponse } from '../pages/academics/categories/topic/topicHelpers'

/**
 * GET /api/topics — paginated list
 * @param {import('../types/topic.types').TopicListParams} [params]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useTopics(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: topicKeys.list(params),
    queryFn: async () => {
      const data = await topicService.getTopics(params)
      return normalizeTopicsListResponse(data, { page, limit })
    },
    ...options,
  })
}

/**
 * GET /api/topics/:id
 * @param {string | undefined} id
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useTopic(id, options = {}) {
  return useQuery({
    queryKey: topicKeys.detail(id ?? ''),
    queryFn: () => topicService.getTopicById(id),
    enabled: Boolean(id),
    ...options,
  })
}

/**
 * GET /api/topics/by-subject/:subjectId — ACTIVE dropdown
 * @param {string | undefined} subjectId
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useTopicsBySubject(subjectId, options = {}) {
  return useQuery({
    queryKey: topicKeys.bySubject(subjectId ?? ''),
    queryFn: () => topicService.getTopicsBySubject(subjectId),
    enabled: Boolean(subjectId),
    staleTime: 5 * 60 * 1000,
    ...options,
  })
}

/** POST /api/topics */
export function useCreateTopic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => topicService.createTopic(payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: topicKeys.all })
      const subjectId = response?.data?.subject
      if (subjectId) {
        queryClient.invalidateQueries({ queryKey: topicKeys.bySubject(String(subjectId)) })
      }
    },
    onError: (error) => handleApiError(error),
  })
}

/** PUT /api/topics/:id */
export function useUpdateTopic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => topicService.updateTopic(id, payload),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: topicKeys.all })
      queryClient.invalidateQueries({ queryKey: topicKeys.detail(variables.id) })
      const subjectId = response?.data?.subject
      if (subjectId) {
        queryClient.invalidateQueries({ queryKey: topicKeys.bySubject(String(subjectId)) })
      }
      if (variables.payload?.subjectId) {
        queryClient.invalidateQueries({
          queryKey: topicKeys.bySubject(variables.payload.subjectId),
        })
      }
    },
    onError: (error) => handleApiError(error),
  })
}

/** PATCH /api/topics/status/:id */
export function useToggleTopicStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => topicService.toggleTopicStatus(id, status),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: topicKeys.all })
      queryClient.invalidateQueries({ queryKey: topicKeys.detail(variables.id) })
    },
    onError: (error) => handleApiError(error),
  })
}

/** DELETE /api/topics/:id */
export function useDeleteTopic() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => topicService.deleteTopic(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: topicKeys.all })
      queryClient.removeQueries({ queryKey: topicKeys.detail(id) })
    },
    onError: (error) => handleApiError(error),
  })
}

export default useTopics
