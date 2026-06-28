import { useMutation } from '@tanstack/react-query'
import { duplicateQuestion } from '../../services/questionBankService'
import { mapDuplicatePrefillToForm } from '../../utils/questionBankApiHelpers'
import { handleApiError } from '../../utils/errorHandler'

export function useDuplicateQuestion() {
  return useMutation({
    mutationFn: async (id) => {
      const data = await duplicateQuestion(id)
      return mapDuplicatePrefillToForm(data?.data ?? data)
    },
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

export default useDuplicateQuestion
