import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { DYNAMIC_FORMS_ADMINISTRATION_QUERY_KEY } from './use-dynamic-forms-administration-query'

export const useDeleteDynamicFormAction = () => {
  const { legalCatalogService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: async (dynamicFormId: string) => {
      const response = await legalCatalogService.deleteDynamicForm(dynamicFormId)
      if (response.isFailure) response.throwError()
      return response.body
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: DYNAMIC_FORMS_ADMINISTRATION_QUERY_KEY,
      })
    },
  })

  async function deleteDynamicForm(dynamicFormId: string) {
    return mutation.mutateAsync(dynamicFormId)
  }

  return {
    deleteDynamicForm,
    error: mutation.error,
    isPending: mutation.isPending,
  }
}
