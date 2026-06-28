import { useMutation } from '@tanstack/react-query'
import { validateBulkFile } from '../../services/questionBankService'
import { handleApiError } from '../../utils/errorHandler'

export function useValidateBulkFile() {
  return useMutation({
    mutationFn: async (file) => {
      const data = await validateBulkFile(file)
      return data?.data ?? data
    },
    onError: (error) => {
      if (error?.response?.status !== 400) handleApiError(error)
    },
    retry: false,
  })
}

export default useValidateBulkFile
