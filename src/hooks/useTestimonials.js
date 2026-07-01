import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changeTestimonialStatus,
  createTestimonial,
  deleteTestimonial,
  fetchTestimonials,
  updateTestimonial,
} from '../api/testimonialsAPI'

export const testimonialKeys = {
  all: ['testimonials'],
  list: () => [...testimonialKeys.all, 'list'],
}

export function useTestimonials(options = {}) {
  return useQuery({
    queryKey: testimonialKeys.list(),
    queryFn: async () => {
      const result = await fetchTestimonials()
      return result.testimonials ?? []
    },
    staleTime: 30 * 1000,
    retry: 1,
    ...options,
  })
}

export function useCreateTestimonial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: createTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testimonialKeys.all })
    },
  })
}

export function useUpdateTestimonial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, formData }) => updateTestimonial(id, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testimonialKeys.all })
    },
  })
}

export function useChangeTestimonialStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, status }) => changeTestimonialStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testimonialKeys.all })
    },
  })
}

export function useDeleteTestimonial() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: deleteTestimonial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: testimonialKeys.all })
    },
  })
}
