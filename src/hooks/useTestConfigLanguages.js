import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { notifyTestConfigurationUpdated } from '../api/testConfigurationAPI'
import { testConfigLanguageKeys } from './queryKeys'
import {
  createLanguage,
  deleteLanguage,
  getLanguageById,
  getLanguages,
  getLanguagesDropdown,
  updateLanguage,
  updateLanguageStatus,
} from '../services/testConfigLanguageService'
import { handleApiError } from '../utils/errorHandler'
import { getApiErrorMessage } from '../utils/apiError'
import {
  mapApiTestConfigLanguageToLocal,
  normalizeTestConfigLanguagesDropdownResponse,
  normalizeTestConfigLanguagesListResponse,
} from '../utils/testConfigLanguageApiHelpers'

function testConfigLanguageQueryRetry(failureCount, error) {
  const status = error?.response?.status
  if ([400, 401, 403, 404, 409].includes(status)) return false
  return failureCount < 2
}

function isDuplicateLanguageNameError(error) {
  const message = getApiErrorMessage(error, '')
  return /already exists/i.test(message)
}

function handleLanguageMutationError(error) {
  if (isDuplicateLanguageNameError(error)) return
  handleApiError(error)
}

function invalidateTestConfigLanguageCaches(queryClient, id) {
  queryClient.invalidateQueries({ queryKey: testConfigLanguageKeys.lists() })
  queryClient.invalidateQueries({ queryKey: testConfigLanguageKeys.dropdown() })
  notifyTestConfigurationUpdated({ entity: 'languages' })
  if (id) {
    queryClient.invalidateQueries({ queryKey: testConfigLanguageKeys.detail(id) })
  }
}

/**
 * GET /api/test-configuration/languages
 * @param {import('../types/testConfigLanguage.types').TestConfigLanguageListParams} [params]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useTestConfigLanguages(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: testConfigLanguageKeys.list(params),
    queryFn: async () => {
      const data = await getLanguages(params)
      return normalizeTestConfigLanguagesListResponse(data, { page, limit })
    },
    placeholderData: (previousData) => previousData,
    staleTime: 30_000,
    retry: testConfigLanguageQueryRetry,
    ...options,
  })
}

/**
 * GET /api/test-configuration/languages/:id
 * @param {string | undefined | null} id
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useTestConfigLanguage(id, options = {}) {
  return useQuery({
    queryKey: testConfigLanguageKeys.detail(id ?? ''),
    queryFn: async () => {
      const data = await getLanguageById(id)
      return mapApiTestConfigLanguageToLocal(data)
    },
    enabled: Boolean(id),
    staleTime: 60_000,
    retry: testConfigLanguageQueryRetry,
    ...options,
  })
}

/**
 * GET /api/test-configuration/languages/dropdown
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useTestConfigLanguagesDropdown(options = {}) {
  return useQuery({
    queryKey: testConfigLanguageKeys.dropdown(),
    queryFn: async () => {
      const data = await getLanguagesDropdown()
      return normalizeTestConfigLanguagesDropdownResponse(data)
    },
    staleTime: 5 * 60 * 1000,
    retry: testConfigLanguageQueryRetry,
    ...options,
  })
}

/** POST /api/test-configuration/languages */
export function useCreateTestConfigLanguage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => createLanguage(payload),
    onSuccess: () => invalidateTestConfigLanguageCaches(queryClient),
    onError: handleLanguageMutationError,
    retry: false,
  })
}

/** PUT /api/test-configuration/languages/:id */
export function useUpdateTestConfigLanguage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload }) => updateLanguage(id, payload),
    onSuccess: (_data, variables) => invalidateTestConfigLanguageCaches(queryClient, variables.id),
    onError: handleLanguageMutationError,
    retry: false,
  })
}

/** PATCH /api/test-configuration/languages/status/:id */
export function useUpdateTestConfigLanguageStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => updateLanguageStatus(id, status),
    onSuccess: (_data, variables) => invalidateTestConfigLanguageCaches(queryClient, variables.id),
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

/** DELETE /api/test-configuration/languages/:id */
export function useDeleteTestConfigLanguage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteLanguage(id),
    onSuccess: (_data, id) => {
      invalidateTestConfigLanguageCaches(queryClient)
      queryClient.removeQueries({ queryKey: testConfigLanguageKeys.detail(id) })
    },
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

export default useTestConfigLanguages
