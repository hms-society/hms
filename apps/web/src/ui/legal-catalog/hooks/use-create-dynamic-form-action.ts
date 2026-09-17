import type { CreateDynamicFormInput } from '@hms/validation/legal-catalog'
import { useMutation } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'

export function useCreateDynamicFormAction() {
  const { legalCatalogService } = useRestContext()
  const mutation = useMutation({
    mutationFn: async (input: CreateDynamicFormInput) => {
      const response = await legalCatalogService.createDynamicForm(input)
      if (response.isFailure) {
        const error = new Error(
          response.errorMessage || 'Não foi possível salvar o formulário.',
        ) as Error & { failureBody?: unknown; statusCode?: number }
        error.failureBody = response.failureBody
        error.statusCode = response.statusCode
        throw error
      }
      return response.body
    },
  })

  return {
    createDynamicForm: mutation.mutateAsync,
    error: mutation.error,
    isPending: mutation.isPending,
  }
}
