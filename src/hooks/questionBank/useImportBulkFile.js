import { useMutation, useQueryClient } from '@tanstack/react-query'
import { importBulkFile } from '../../services/questionBankService'
import { handleApiError } from '../../utils/errorHandler'
import { invalidateQuestionBankCaches } from './invalidateQuestionBank'

export function useImportBulkFile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ file, duplicateMode = 'SKIP' }) => {
      const data = await importBulkFile(file, duplicateMode)
      return data?.data ?? data
    },
    onSuccess: () => invalidateQuestionBankCaches(queryClient),
    onError: (error) => {
      if (error?.response?.status !== 400) handleApiError(error)
    },
    retry: false,
  })
}

export default useImportBulkFile
