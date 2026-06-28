import { useQuery } from '@tanstack/react-query'
import { getEditableFields } from '../../services/questionBankService'
import { typeUiToApi } from '../../utils/questionBankApiHelpers'
import { questionBankKeys } from './queryKeys'
import { questionBankQueryRetry } from './invalidateQuestionBank'

/**
 * @param {string | undefined} type
 * @param {import('@tanstack/react-query').UseQueryOptions} [options]
 */
export function useEditableFields(type, options = {}) {
  const apiType = type ? typeUiToApi(type) : undefined

  return useQuery({
    queryKey: questionBankKeys.editableFields(apiType),
    queryFn: async () => {
      const data = await getEditableFields(apiType)
      return data?.data ?? data
    },
    enabled: Boolean(apiType),
    staleTime: 60 * 60 * 1000,
    retry: questionBankQueryRetry,
    ...options,
  })
}

export default useEditableFields
