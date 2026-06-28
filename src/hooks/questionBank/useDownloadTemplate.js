import { useMutation } from '@tanstack/react-query'
import { downloadTemplate } from '../../services/questionBankService'
import { bulkTemplateSlugForType, triggerBlobDownload } from '../../utils/questionBankApiHelpers'
import { handleApiError } from '../../utils/errorHandler'

export function useDownloadTemplate() {
  return useMutation({
    mutationFn: async (typeUi) => {
      const slug = bulkTemplateSlugForType(typeUi)
      const { blob, fileName } = await downloadTemplate(slug)
      triggerBlobDownload(blob, fileName)
      return fileName
    },
    onError: (error) => handleApiError(error),
    retry: false,
  })
}

export default useDownloadTemplate
