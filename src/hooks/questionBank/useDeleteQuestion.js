import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteQuestion } from '../../services/questionBankService'
import { handleApiError } from '../../utils/errorHandler'
import { invalidateQuestionBankCaches } from './invalidateQuestionBank'
import { questionBankKeys } from './queryKeys'

export function useDeleteQuestion() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id) => deleteQuestion(id),
    onSuccess: (_data, id) => {
      invalidateQuestionBankCaches(queryClient)
      queryClient.removeQueries({ queryKey: questionBankKeys.detail(id) })
    },
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

export default useDeleteQuestion
