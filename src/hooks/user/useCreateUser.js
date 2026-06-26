import { useMutation, useQueryClient } from '@tanstack/react-query'
import userService from '../../services/userService'
import { userKeys } from './userKeys'

export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload) => userService.createUser(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
    },
  })
}
