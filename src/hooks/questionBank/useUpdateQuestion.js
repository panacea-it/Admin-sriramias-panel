import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateQuestion } from '../../services/questionBankService'
import {
  buildPartialUpdateFormData,
  mapApiQuestionToLocal,
} from '../../utils/questionBankApiHelpers'
import { handleApiError } from '../../utils/errorHandler'
import { invalidateQuestionBankCaches } from './invalidateQuestionBank'

export function useUpdateQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, original, current }) => {
      const formData = buildPartialUpdateFormData(original, current)
      if (!formData) {
        throw Object.assign(new Error('No changes to save'), { code: 'NO_CHANGES' })
      }
      const data = await updateQuestion(id, formData)
      return mapApiQuestionToLocal(data?.data ?? data)
    },
    onSuccess: (_data, variables) => invalidateQuestionBankCaches(queryClient, variables.id),
    onError: (error) => {
      if (error?.code === 'NO_CHANGES') return
      if (error?.response?.status !== 400) handleApiError(error)
    },
    retry: false,
  })
}

export default useUpdateQuestion
