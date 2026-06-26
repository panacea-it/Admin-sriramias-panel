import { keepPreviousData, useQuery } from '@tanstack/react-query'
import userService from '../../services/userService'
import { normalizeUserListResponse } from '../../utils/userHelpers'
import { userKeys } from './userKeys'

export function useUsers(params = {}, options = {}) {
  const page = params.page ?? 1
  const limit = params.limit ?? 10

  return useQuery({
    queryKey: userKeys.list(params),
    queryFn: async () => {
      const data = await userService.getUsers(params)
      return normalizeUserListResponse(data, { page, limit })
    },
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    ...options,
  })
}
