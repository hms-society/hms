import type { ChangeDynamicFormAvailabilityInput } from '@hms/validation/legal-catalog'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { useRestContext } from '@/ui/shared/hooks/use-rest-context'
import { DYNAMIC_FORMS_ADMINISTRATION_QUERY_KEY } from './use-dynamic-forms-administration-query'

export const useChangeDynamicFormAvailabilityAction = () => {
  const { legalCatalogService } = useRestContext()
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: ({
      dynamicFormId,
      input,
    }: {
      dynamicFormId: string
      input: ChangeDynamicFormAvailabilityInput
    }) =>
      legalCatalogService
        .changeDynamicFormAvailability(dynamicFormId, input)
        .then((response) => {
          if (response.isFailure) response.throwError()
          return response.body
        }),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({
        queryKey: DYNAMIC_FORMS_ADMINISTRATION_QUERY_KEY,
      })
      return response
    },
  })

  async function changeDynamicFormAvailability(
    dynamicFormId: string,
    input: ChangeDynamicFormAvailabilityInput,
  ) {
    return mutation.mutateAsync({ dynamicFormId, input })
  }

  return {
    changeDynamicFormAvailability,
    error: mutation.error,
    isPending: mutation.isPending,
  }
}
