import type { UpdateDynamicFormInput } from '@hms/validation/legal-catalog'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { getDynamicFormForAdministrationQueryKey } from './use-dynamic-form-for-administration-query'
import { DYNAMIC_FORMS_ADMINISTRATION_QUERY_KEY } from './use-dynamic-forms-administration-query'

export function useUpdateDynamicFormAction() {
  const { legalCatalogService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async ({
      dynamicFormId,
      input,
    }: {
      dynamicFormId: string
      input: UpdateDynamicFormInput
    }) => {
      const response = await legalCatalogService.updateDynamicForm(dynamicFormId, input)
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
    onSuccess: async (_form, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: DYNAMIC_FORMS_ADMINISTRATION_QUERY_KEY,
        }),
        queryClient.invalidateQueries({
          queryKey: getDynamicFormForAdministrationQueryKey(variables.dynamicFormId),
        }),
      ])
    },
  })

  return {
    updateDynamicForm: (dynamicFormId: string, input: UpdateDynamicFormInput) =>
      mutation.mutateAsync({ dynamicFormId, input }),
    error: mutation.error,
    isPending: mutation.isPending,
  }
}
