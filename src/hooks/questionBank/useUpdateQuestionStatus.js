import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateQuestionStatus } from '../../services/questionBankService'
import { mapApiQuestionToLocal, statusUiToApi } from '../../utils/questionBankApiHelpers'
import { handleApiError } from '../../utils/errorHandler'
import { invalidateQuestionBankCaches } from './invalidateQuestionBank'

export function useUpdateQuestionStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ id, status }) => {
      const data = await updateQuestionStatus(id, statusUiToApi(status))
      return mapApiQuestionToLocal(data?.data ?? data)
    },
    onSuccess: (_data, variables) => invalidateQuestionBankCaches(queryClient, variables.id),
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

export default useUpdateQuestionStatus
