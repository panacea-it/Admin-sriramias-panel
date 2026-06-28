import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notifyTestConfigurationUpdated } from '../api/testConfigurationAPI'
import { testConfigSectionKeys } from './queryKeys'
import {
  createSection,
  deleteSection,
  getSectionById,
  getSections,
  getSectionsDropdown,
  updateSection,
  updateSectionStatus,
} from '../services/testConfigSectionService'
import { handleApiError } from '../utils/errorHandler'
import { getApiErrorMessage } from '../utils/apiError'
import {
  mapApiTestConfigSectionToLocal,
  normalizeTestConfigSectionsDropdownResponse,
  normalizeTestConfigSectionsListResponse,
} from '../utils/testConfigSectionApiHelpers'

function testConfigSectionQueryRetry(failureCount, error) {
  const status = error?.response?.status
  if ([400, 401, 403, 404, 409].includes(status)) return false
  return failureCount < 2
}

function isDuplicateSectionNameError(error) {
  const message = getApiErrorMessage(error, '')
  return /already exists/i.test(message)
}

function handleSectionMutationError(error) {
  if (isDuplicateSectionNameError(error)) return
  handleApiError(error)
}

function invalidateTestConfigSectionCaches(queryClient, id) {
  queryClient.invalidateQueries({ queryKey: testConfigSectionKeys.lists() })
  queryClient.invalidateQueries({ queryKey: testConfigSectionKeys.dropdown() })
  notifyTestConfigurationUpdated({ entity: 'sectionConfigs' })
  if (id) {
    queryClient.invalidateQueries({ queryKey: testConfigSectionKeys.detail(id) })
  }
}

/**
 * GET /api/test-configuration/sections
 * @param {import('../types/testConfigSection.types').TestConfigSectionListParams} [params]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useTestConfigSections(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: testConfigSectionKeys.list(params),
    queryFn: async () => {
      const data = await getSections(params)
      return normalizeTestConfigSectionsListResponse(data, { page, limit })
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    retry: testConfigSectionQueryRetry,
    ...options,
  })
}

/**
 * GET /api/test-configuration/sections/:id
 * @param {string | undefined | null} id
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useTestConfigSection(id, options = {}) {
  return useQuery({
    queryKey: testConfigSectionKeys.detail(id ?? ''),
    queryFn: async () => {
      const data = await getSectionById(id)
      return mapApiTestConfigSectionToLocal(data)
    },
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: testConfigSectionQueryRetry,
    ...options,
  })
}

/**
 * GET /api/test-configuration/sections/dropdown
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useTestConfigSectionsDropdown(options = {}) {
  return useQuery({
    queryKey: testConfigSectionKeys.dropdown(),
    queryFn: async () => {
      const data = await getSectionsDropdown()
      return normalizeTestConfigSectionsDropdownResponse(data)
    },
    staleTime: 5 * 60 * 1000,
    retry: testConfigSectionQueryRetry,
    ...options,
  })
}

/** POST /api/test-configuration/sections */
export function useCreateTestConfigSection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => createSection(payload),
    onSuccess: () => invalidateTestConfigSectionCaches(queryClient),
    onError: handleSectionMutationError,
    retry: false,
  })
}

/** PUT /api/test-configuration/sections/:id */
export function useUpdateTestConfigSection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => updateSection(id, payload),
    onSuccess: (_data, variables) => invalidateTestConfigSectionCaches(queryClient, variables.id),
    onError: handleSectionMutationError,
    retry: false,
  })
}

/** PATCH /api/test-configuration/sections/status/:id */
export function useUpdateTestConfigSectionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => updateSectionStatus(id, status),
    onSuccess: (_data, variables) => invalidateTestConfigSectionCaches(queryClient, variables.id),
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

/** DELETE /api/test-configuration/sections/:id */
export function useDeleteTestConfigSection() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteSection(id),
    onSuccess: (_data, id) => {
      invalidateTestConfigSectionCaches(queryClient)
      queryClient.removeQueries({ queryKey: testConfigSectionKeys.detail(id) })
    },
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

export default useTestConfigSections
