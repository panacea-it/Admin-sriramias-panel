import { useMutation, useQueryClient } from '@tanstack/react-query'
import userService from '../../services/userService'
import { userKeys } from './userKeys'

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, payload, type }) => userService.updateUser(id, payload, type),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() })
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id, variables.type),
      })
    },
  })
}
