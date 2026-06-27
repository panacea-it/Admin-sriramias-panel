import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { freeResourceService } from '../services/freeResourceService'
import {
  normalizeFreeResourcesListResponse,
  normalizeMockTestsListResponse,
  normalizeNcertBooksListResponse,
  normalizePreviousYearPapersListResponse,
  normalizeStudyMaterialsListResponse,
} from '../utils/freeResourceApiHelpers'
import { freeResourceKeys } from './queryKeys'

/**
 * @param {Record<string, unknown>} [params]
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useFreeResources(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: freeResourceKeys.list(params),
    queryFn: async () => {
      const data = await freeResourceService.getFreeResourcesList(params)
      return normalizeFreeResourcesListResponse(data, { page, limit })
    },
    ...options,
  })
}

/**
 * @param {string|null|undefined} id
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useFreeResource(id, options = {}) {
  return useQuery({
    queryKey: freeResourceKeys.detail(id),
    queryFn: () => freeResourceService.getFreeResourceById(id),
    enabled: Boolean(id),
    ...options,
  })
}

export function useNCERTBooks(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: freeResourceKeys.ncertBooks(params),
    queryFn: async () => {
      const data = await freeResourceService.getNcertBooks(params)
      return normalizeNcertBooksListResponse(data, { page, limit })
    },
    ...options,
  })
}

export function usePreviousYearQuestions(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: freeResourceKeys.previousYearPapers(params),
    queryFn: async () => {
      const data = await freeResourceService.getPreviousYearPapers(params)
      return normalizePreviousYearPapersListResponse(data, { page, limit })
    },
    ...options,
  })
}

export function useFreeMockTests(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: freeResourceKeys.mockTests(params),
    queryFn: async () => {
      const data = await freeResourceService.getMockTests(params)
      return normalizeMockTestsListResponse(data, { page, limit })
    },
    ...options,
  })
}

/** Study material (PDF/DOC/PPT) resources */
export function usePdfResources(params, options = {}) {
  const page = params?.page ?? 1
  const limit = params?.limit ?? 10

  return useQuery({
    queryKey: freeResourceKeys.studyMaterials(params),
    queryFn: async () => {
      const data = await freeResourceService.getStudyMaterials(params)
      return normalizeStudyMaterialsListResponse(data, { page, limit })
    },
    ...options,
  })
}

export function useFreeResourceDropdown(name, options = {}) {
  const fetchers = {
    'resource-categories': freeResourceService.getResourceCategoriesDropdown,
    'ncert-subjects': freeResourceService.getNcertSubjectsDropdown,
    'ncert-classes': freeResourceService.getNcertClassesDropdown,
    'exam-categories': freeResourceService.getExamCategoriesDropdown,
    'paper-types': freeResourceService.getPaperTypesDropdown,
    years: freeResourceService.getYearsDropdown,
    'study-material-categories': freeResourceService.getStudyMaterialCategoriesDropdown,
  }

  return useQuery({
    queryKey: freeResourceKeys.dropdown(name),
    queryFn: () => {
      const fetcher = fetchers[name]
      if (!fetcher) throw new Error(`Unknown dropdown: ${name}`)
      return fetcher()
    },
    staleTime: 5 * 60_000,
    ...options,
  })
}

export function useMockTestQuestions(mockTestId, options = {}) {
  return useQuery({
    queryKey: freeResourceKeys.mockTestQuestions(mockTestId),
    queryFn: () => freeResourceService.getMockTestQuestions(mockTestId),
    enabled: Boolean(mockTestId),
    ...options,
  })
}

function invalidateAllFreeResources(queryClient) {
  queryClient.invalidateQueries({ queryKey: freeResourceKeys.all })
}

export function useCreateFreeResource(category) {
  const queryClient = useQueryClient()

  const createFns = {
    NCERT_BOOKS: freeResourceService.createNcertBook,
    PREVIOUS_YEAR_QUESTIONS: freeResourceService.createPreviousYearPaper,
    FREE_MOCK_TEST: freeResourceService.createMockTest,
    STUDY_MATERIAL: freeResourceService.createStudyMaterial,
  }

  return useMutation({
    mutationFn: (payload) => {
      const fn = createFns[category]
      if (!fn) throw new Error(`Unsupported create category: ${category}`)
      return fn(payload)
    },
    onSuccess: () => invalidateAllFreeResources(queryClient),
  })
}

export function useUpdateFreeResource(category) {
  const queryClient = useQueryClient()

  const updateFns = {
    NCERT_BOOKS: (id, payload) => freeResourceService.updateNcertBook(id, payload),
    PREVIOUS_YEAR_QUESTIONS: (id, payload) =>
      freeResourceService.updatePreviousYearPaper(id, payload),
    FREE_MOCK_TEST: (id, payload) => freeResourceService.updateMockTest(id, payload),
    STUDY_MATERIAL: (id, payload) => freeResourceService.updateStudyMaterial(id, payload),
  }

  return useMutation({
    mutationFn: ({ id, payload }) => {
      const fn = updateFns[category]
      if (!fn) throw new Error(`Unsupported update category: ${category}`)
      return fn(id, payload)
    },
    onSuccess: (_data, variables) => {
      invalidateAllFreeResources(queryClient)
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: freeResourceKeys.detail(variables.id) })
      }
    },
  })
}

export function useDeleteFreeResource() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ category, id }) =>
      freeResourceService.deleteFreeResourceByCategory(category, id),
    onSuccess: () => invalidateAllFreeResources(queryClient),
  })
}

export function useUpdateFreeResourceStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => freeResourceService.updateFreeResourceStatus(id, status),
    onSuccess: (_data, variables) => {
      invalidateAllFreeResources(queryClient)
      if (variables?.id) {
        queryClient.invalidateQueries({ queryKey: freeResourceKeys.detail(variables.id) })
      }
    },
  })
}

export function useUploadMockTestQuestions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mockTestId, file, replace }) =>
      freeResourceService.uploadMockTestQuestions(mockTestId, file, { replace }),
    onSuccess: (_data, variables) => {
      invalidateAllFreeResources(queryClient)
      if (variables?.mockTestId) {
        queryClient.invalidateQueries({
          queryKey: freeResourceKeys.mockTestQuestions(variables.mockTestId),
        })
      }
    },
  })
}

export function useCreateMockTestQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mockTestId, payload }) =>
      freeResourceService.createMockTestQuestion(mockTestId, payload),
    onSuccess: (_data, variables) => {
      invalidateAllFreeResources(queryClient)
      if (variables?.mockTestId) {
        queryClient.invalidateQueries({
          queryKey: freeResourceKeys.mockTestQuestions(variables.mockTestId),
        })
      }
    },
  })
}

export function useUpdateMockTestQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mockTestId, questionId, payload }) =>
      freeResourceService.updateMockTestQuestion(mockTestId, questionId, payload),
    onSuccess: (_data, variables) => {
      if (variables?.mockTestId) {
        queryClient.invalidateQueries({
          queryKey: freeResourceKeys.mockTestQuestions(variables.mockTestId),
        })
      }
    },
  })
}

export function useDeleteMockTestQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mockTestId, questionId }) =>
      freeResourceService.deleteMockTestQuestion(mockTestId, questionId),
    onSuccess: (_data, variables) => {
      invalidateAllFreeResources(queryClient)
      if (variables?.mockTestId) {
        queryClient.invalidateQueries({
          queryKey: freeResourceKeys.mockTestQuestions(variables.mockTestId),
        })
      }
    },
  })
}

export function useDuplicateMockTestQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ mockTestId, questionId }) =>
      freeResourceService.duplicateMockTestQuestion(mockTestId, questionId),
    onSuccess: (_data, variables) => {
      if (variables?.mockTestId) {
        queryClient.invalidateQueries({
          queryKey: freeResourceKeys.mockTestQuestions(variables.mockTestId),
        })
      }
    },
  })
}
