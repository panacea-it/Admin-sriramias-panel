import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createQuestion } from '../../services/questionBankService'
import {
  buildCreateQuestionFormData,
  mapApiQuestionToLocal,
} from '../../utils/questionBankApiHelpers'
import { handleApiError } from '../../utils/errorHandler'
import { invalidateQuestionBankCaches } from './invalidateQuestionBank'

export function useCreateQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (form) => {
      const formData = buildCreateQuestionFormData(form)
      const data = await createQuestion(formData)
      return mapApiQuestionToLocal(data?.data ?? data)
    },
    onSuccess: () => invalidateQuestionBankCaches(queryClient),
    onError: (error) => {
      if (error?.response?.status !== 400) handleApiError(error)
    },
    retry: false,
  })
}

export default useCreateQuestion
